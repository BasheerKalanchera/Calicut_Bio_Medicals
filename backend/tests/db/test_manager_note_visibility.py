"""Manager Note privacy rule (migration 0067) checked against the real Dev database.

Plan: docs/Manager-Note-Privacy-Implementation-Plan.md (D2-D6, D10, D11).

Why this exists: every other backend test mocks the database, so none of them
would notice if a later migration rewrote `activity_select` and dropped the
Manager Note privacy. Run this test whenever a migration touches
`activity_select` or the tables it reads (reporting line, Area Manager zones,
user business units). The "option A" change for other activity types (Backlog,
"Activity log privacy hole") will do exactly that.

How it runs: SKIPPED unless RUN_DEV_DB_TESTS=1. It connects to Dev as the
app's own database role (so row-level security applies), builds a small cast
out of real Dev people by editing their profile rows INSIDE ONE TRANSACTION
while acting as an Admin, inserts temporary notes, then checks what each
person sees with the user, role and business-unit settings all set and
verified. The transaction is always rolled back: nothing is saved.

    RUN_DEV_DB_TESTS=1 backend/.venv/Scripts/python.exe -m pytest \
        backend/tests/db/test_manager_note_visibility.py -p no:cacheprovider

Refuses to run against UAT (its pooler port is 6543).
"""

import os
from pathlib import Path

import psycopg2
import psycopg2.extras
import pytest
from psycopg2.extensions import parse_dsn

pytestmark = pytest.mark.skipif(
    os.environ.get("RUN_DEV_DB_TESTS") != "1",
    reason="Dev database test; set RUN_DEV_DB_TESTS=1 to run it (see module docstring).",
)

ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


def _load_env() -> dict:
    env = {}
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


class Scenario:
    """The cast, the temporary notes, and a way to ask 'what does X see?'."""

    def __init__(self, conn):
        self.conn = conn
        self.cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        self.who: dict[str, str] = {}
        self.notes: dict[str, str] = {}

    def q(self, sql, args=None):
        self.cur.execute(sql, args)
        return self.cur.fetchall() if self.cur.description else []

    def act_as(self, uid: str, label: str) -> None:
        """Set the user, role and business-unit settings for this user and verify all three."""
        prof = self.q(
            "SELECT up.role_id::text AS role_id, up.sbu_id::text AS sbu_id, r.role_name AS role "
            "FROM user_profile up JOIN role r ON r.id = up.role_id WHERE up.id = %s",
            (uid,),
        )[0]
        self.cur.execute(
            "SELECT set_config('app.current_user_id', %s, true), set_config('app.current_role_id', %s, true), "
            "set_config('app.current_sbu_id', %s, true)",
            (uid, prof["role_id"], prof["sbu_id"] or ""),
        )
        got = self.q(
            "SELECT cabio_app_uid()::text AS uid, cabio_app_role_name() AS role, cabio_app_sbu_id()::text AS sbu"
        )[0]
        assert got["uid"] == uid and got["role"] == prof["role"] and (got["sbu"] or None) == prof["sbu_id"], (
            f"session settings not applied for {label}: {dict(got)}"
        )

    def sees(self, person: str, ids: list[str]) -> set[str]:
        """Which of `ids` (activity ids) the person can read, with row-level security on."""
        self.act_as(self.who[person], person)
        rows = self.q("SELECT id::text AS id FROM activity WHERE id = ANY(%s::uuid[])", (ids,))
        return {r["id"] for r in rows}

    def comments_seen(self, person: str, note_id: str) -> int:
        self.act_as(self.who[person], person)
        return self.q("SELECT count(*) AS n FROM activity_comment WHERE activity_id = %s", (note_id,))[0]["n"]


@pytest.fixture(scope="module")
def sc():
    env = _load_env()
    app_dsn = parse_dsn(env["DATABASE_URL"])
    if str(app_dsn.get("port")) == "6543":
        pytest.fail("Refusing to run: DATABASE_URL looks like UAT (pooler port 6543).")
    conn = psycopg2.connect(env["DATABASE_URL"])  # the app's own role: row-level security applies
    conn.autocommit = False
    s = Scenario(conn)
    try:
        _build_scenario(s)
        yield s
    finally:
        conn.rollback()  # always: nothing from this test is ever saved
        conn.close()


def _build_scenario(s: Scenario) -> None:
    roles = {r["role_name"]: r["id"] for r in s.q("SELECT id::text AS id, role_name FROM role")}
    users = {}
    for name in ("Admin", "SBU Manager", "Area Manager"):
        users[name] = [
            r["id"]
            for r in s.q(
                "SELECT up.id::text AS id FROM user_profile up WHERE up.role_id = %s AND up.is_active "
                "ORDER BY up.display_name",
                (roles[name],),
            )
        ]
    if not (users["Admin"] and users["SBU Manager"] and len(users["Area Manager"]) >= 4):
        pytest.fail("Dev needs at least 1 active Admin, 1 SBU Manager and 4 Area Managers to build the cast.")

    admin, sbu_mgr = users["Admin"][0], users["SBU Manager"][0]
    am1, am2, am3, am4 = users["Area Manager"][:4]
    taken = [admin, sbu_mgr, am1, am2, am3, am4]
    # Any four other active people; their role is set inside the transaction below.
    spare = [
        r["id"]
        for r in s.q(
            "SELECT id::text AS id FROM user_profile "
            "WHERE is_active AND NOT (id = ANY(%s::uuid[])) ORDER BY display_name",
            (taken,),
        )
    ]
    if len(spare) < 5:
        pytest.fail("Dev needs at least 5 more active people besides the Admin, SBU Manager and 4 Area Managers.")
    rep, rep2, rep3, rep4, rep5 = spare[:5]
    sbu_x = s.q("SELECT sbu_id::text AS s FROM user_profile WHERE id = %s", (sbu_mgr,))[0]["s"]
    sbu_y = s.q("SELECT id::text AS s FROM sbu WHERE id <> %s ORDER BY id LIMIT 1", (sbu_x,))[0]["s"]

    # Build the cast and the temporary rows as the Admin (audit triggers read the session user).
    s.act_as(admin, "admin")

    acc = s.q(
        "SELECT a.id::text AS id, a.zone_id::text AS zone_id FROM account a "
        "WHERE a.zone_id IS NOT NULL "
        "AND EXISTS (SELECT 1 FROM zone_closure zc WHERE zc.descendant_zone_id = a.zone_id) "
        "ORDER BY a.id LIMIT 1"
    )[0]
    other_zone = s.q(
        "SELECT z.id::text AS id FROM zone z WHERE z.id NOT IN "
        "(SELECT ancestor_zone_id FROM zone_closure WHERE descendant_zone_id = %s) ORDER BY z.id LIMIT 1",
        (acc["zone_id"],),
    )[0]["id"]
    opp = s.q("SELECT id::text AS id FROM opportunity ORDER BY id LIMIT 1")[0]["id"]

    # The cast, built by editing profile rows (rolled back at the end).
    def profile(uid, role=None, sbu=None, manager=None):
        s.cur.execute(
            "UPDATE user_profile SET role_id = COALESCE(%s::uuid, role_id), sbu_id = %s::uuid, "
            "manager_id = %s::uuid WHERE id = %s",
            (role, sbu, manager, uid),
        )

    profile(sbu_mgr, sbu=sbu_x, manager=None)
    profile(am1, sbu=sbu_x, manager=sbu_mgr)  # above the rep (reporting line)
    profile(am2, sbu=sbu_x, manager=sbu_mgr)  # zone only, same business unit
    profile(am3, sbu=sbu_x, manager=sbu_mgr)  # other zone, not above the rep; also the writer of one note
    profile(am4, sbu=sbu_y, manager=sbu_mgr)  # covers the zone, but the other business unit (D10)
    profile(rep, role=roles["Sales Staff"], sbu=sbu_x, manager=am1)  # the rep the notes are about
    profile(
        rep2, role=roles["Sales Staff"], sbu=sbu_x, manager=am3
    )  # another rep; holds a split on the linked note (D5)
    profile(
        rep5, role=roles["Sales Staff"], sbu=sbu_x, manager=am3
    )  # another rep; holds an assigned reminder on the linked Opportunity (D5)
    profile(rep3, role=roles["SBU Manager"], sbu=sbu_y, manager=None)  # the other business unit's SBU Manager
    profile(rep4, role=roles["General Manager"], sbu=None, manager=None)
    s.cur.execute("DELETE FROM user_zone WHERE user_id = ANY(%s::uuid[])", ([am1, am2, am3, am4],))
    for uid, zone in ((am2, acc["zone_id"]), (am3, other_zone), (am4, acc["zone_id"])):
        s.cur.execute("INSERT INTO user_zone (user_id, zone_id) VALUES (%s, %s)", (uid, zone))

    s.who = {
        "admin": admin,
        "gm": rep4,
        "sbu_mgr": sbu_mgr,
        "other_sbu_mgr": rep3,
        "rep": rep,
        "rep2_split": rep2,
        "rep5_reminder": rep5,
        "am_above": am1,
        "am_zone": am2,
        "am_other_zone": am3,
        "am_other_sbu": am4,
    }

    # Precondition: the zone-only Area Manager really is not above the rep.
    chain = s.q(
        "WITH RECURSIVE c(id) AS (SELECT manager_id FROM user_profile WHERE id = %s AND manager_id IS NOT NULL "
        "UNION SELECT up.manager_id FROM user_profile up JOIN c ON up.id = c.id WHERE up.manager_id IS NOT NULL) "
        "SELECT id::text AS id FROM c",
        (rep,),
    )
    chain_ids = {r["id"] for r in chain}
    assert am2 not in chain_ids and am3 not in chain_ids and am4 not in chain_ids, (
        "cast is wrong: a zone-only Area Manager is above the rep"
    )

    s.cur.execute(
        "INSERT INTO split (opportunity_id, user_id, split_percentage, created_by) VALUES (%s, %s, 0, %s)",
        (opp, rep2, admin),
    )

    def insert(kind, user_id, created_by, atype, opp_id=None, account=acc["id"]):
        s.cur.execute(
            "INSERT INTO activity "
            "(account_id, opportunity_id, user_id, activity_type, activity_date, notes, created_by) "
            "VALUES (%s, %s, %s, %s, now(), 'temporary test row', %s) RETURNING id::text AS id",
            (account, opp_id, user_id, atype, created_by),
        )
        s.notes[kind] = s.cur.fetchone()["id"]

    insert("unlinked", rep, admin, "MANAGER_NOTE")
    insert("linked", rep, admin, "MANAGER_NOTE", opp_id=opp)
    insert("by_am3", rep, am3, "MANAGER_NOTE")  # written by the other-zone Area Manager
    insert("about_sbu_mgr", sbu_mgr, admin, "MANAGER_NOTE")
    insert("about_admin", admin, admin, "MANAGER_NOTE")
    insert("about_peer_am", am3, admin, "MANAGER_NOTE")  # about an Area Manager, seen by other Area Managers
    insert("visit", rep, admin, "VISIT")
    insert("linked_visit", rep, admin, "VISIT", opp_id=opp)
    # The reminder holder: an assigned reminder on an activity of the Opportunity (the "looped in" carve-out).
    s.cur.execute(
        "INSERT INTO reminder (activity_id, assigned_to_user_id, due_date, reminder_text, created_by) "
        "VALUES (%s, %s, now() + interval '1 day', 'temporary test reminder', %s)",
        (s.notes["linked_visit"], rep5, admin),
    )
    s.cur.execute(
        "INSERT INTO activity_comment (activity_id, body, created_by) VALUES (%s, 'temporary test comment', %s)",
        (s.notes["unlinked"], admin),
    )


SEES = ["rep", "admin", "gm", "sbu_mgr", "am_above", "am_zone"]
HIDDEN = ["rep2_split", "rep5_reminder", "am_other_zone", "am_other_sbu", "other_sbu_mgr"]


@pytest.mark.parametrize("kind", ["unlinked", "linked"])
def test_manager_note_about_a_rep(sc, kind):
    nid = sc.notes[kind]
    for p in SEES:
        assert nid in sc.sees(p, [nid]), f"{p} should see a {kind} Manager Note about the rep"
    for p in HIDDEN:
        assert nid not in sc.sees(p, [nid]), f"{p} must NOT see a {kind} Manager Note about the rep"


def test_zone_only_area_manager_needs_the_same_business_unit(sc):
    nid = sc.notes["unlinked"]
    assert nid in sc.sees("am_zone", [nid])  # covers the zone, same business unit (D4, D10)
    assert nid not in sc.sees("am_other_sbu", [nid])  # covers the zone, other business unit (D10)


def test_split_holder_no_longer_sees_a_linked_manager_note(sc):
    nid = sc.notes["linked"]
    assert nid not in sc.sees("rep2_split", [nid])  # D5


def test_reminder_holder_no_longer_sees_a_linked_manager_note(sc):
    nid = sc.notes["linked"]
    # The carve-out is live: the reminder holder still sees an ordinary activity on the Opportunity ...
    assert sc.notes["linked_visit"] in sc.sees("rep5_reminder", [sc.notes["linked_visit"]])
    # ... but not the Manager Note on it (D5).
    assert nid not in sc.sees("rep5_reminder", [nid])


def test_note_about_a_peer_area_manager(sc):
    nid = sc.notes["about_peer_am"]
    assert nid in sc.sees("am_other_zone", [nid])  # the Area Manager it is about
    assert nid in sc.sees("am_zone", [nid])  # covers the zone, same business unit (D6 doesn't hide a peer)
    assert nid in sc.sees("sbu_mgr", [nid])
    assert nid not in sc.sees("am_above", [nid])  # an Area Manager neither above nor covering the zone
    assert nid not in sc.sees("am_other_sbu", [nid])  # covers the zone, other business unit (D10)
    assert nid not in sc.sees("rep2_split", [nid])


def test_the_writer_sees_their_own_note(sc):
    nid = sc.notes["by_am3"]
    assert nid in sc.sees("am_other_zone", [nid])  # created_by, though not above the rep and in another zone
    assert nid not in sc.sees("rep2_split", [nid])


def test_notes_about_senior_people_stay_hidden_from_lower_tiers(sc):
    about_sbu = sc.notes["about_sbu_mgr"]
    about_admin = sc.notes["about_admin"]
    assert about_sbu in sc.sees("sbu_mgr", [about_sbu])
    assert about_sbu in sc.sees("admin", [about_sbu])
    assert about_sbu not in sc.sees("am_zone", [about_sbu])  # D6: Area Manager, note about an SBU Manager
    assert about_sbu not in sc.sees("am_above", [about_sbu])
    assert about_admin in sc.sees("admin", [about_admin])
    assert about_admin not in sc.sees("sbu_mgr", [about_admin])  # D6: SBU Manager, note about an Admin
    assert about_admin not in sc.sees("am_zone", [about_admin])


def test_other_activity_types_stay_visible_to_everyone(sc):
    vid = sc.notes["visit"]
    for p in SEES + HIDDEN:
        assert vid in sc.sees(p, [vid]), f"{p} should still see an unlinked visit (today's rule)"


def test_comments_follow_the_note(sc):
    nid = sc.notes["unlinked"]
    assert sc.comments_seen("admin", nid) == 1
    for p in HIDDEN:
        assert sc.comments_seen(p, nid) == 0, f"{p} must not see a comment on a note they cannot see"
