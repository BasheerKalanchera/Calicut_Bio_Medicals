"""Target vs Actuals (Plan vs Actuals Tracking plan, steps 1 and 3): the date
helpers, the service's arithmetic and visibility rules (against a stubbed
repository), the SBU target service, and the shape of the repository's SQL
(compiled, never run -- the Dev DB is shared)."""

import uuid
from datetime import date, datetime
from decimal import Decimal
from unittest.mock import MagicMock

import pytest

from app.core.exceptions import AuthorizationError
from app.core.periods import IST, quarter_dates, quarter_of
from app.domains.organization.models import UserProfile
from app.domains.planning import service as service_module
from app.domains.planning.repository import SbuTargetRepository, TargetVsActualRepository
from app.domains.planning.schemas import QuarterState, RosterStatus, SbuTargetSet
from app.domains.planning.service import SbuTargetService, TargetVsActualService

SBU_ID = uuid.uuid4()
PERIOD = "2026-Q3"  # 1 Oct - 31 Dec 2026
WIN_START = datetime(2026, 10, 1, tzinfo=IST)
WIN_END = datetime(2027, 1, 1, tzinfo=IST)
IN_QUARTER = date(2026, 11, 1)


# --- date helpers -----------------------------------------------------------


@pytest.mark.parametrize(
    ("period", "start", "end"),
    [
        ("2026-Q1", date(2026, 4, 1), date(2026, 6, 30)),
        ("2026-Q2", date(2026, 7, 1), date(2026, 9, 30)),
        ("2026-Q3", date(2026, 10, 1), date(2026, 12, 31)),
        ("2026-Q4", date(2027, 1, 1), date(2027, 3, 31)),
    ],
)
def test_quarter_dates(period, start, end):
    assert quarter_dates(period) == (start, end)


@pytest.mark.parametrize(
    ("d", "period"),
    [
        (date(2026, 4, 1), "2026-Q1"),
        (date(2026, 9, 30), "2026-Q2"),
        (date(2026, 10, 3), "2026-Q3"),
        (date(2027, 3, 31), "2026-Q4"),
        (date(2027, 1, 1), "2026-Q4"),
    ],
)
def test_quarter_of(d, period):
    assert quarter_of(d) == period


# --- service ----------------------------------------------------------------


def _user_with_role(role_name: str, sbu_id: uuid.UUID | None = SBU_ID) -> MagicMock:
    user = MagicMock(spec=UserProfile)
    user.id = uuid.uuid4()
    user.sbu_id = sbu_id
    user.zone_id = uuid.uuid4()
    user.manager_id = None
    role = MagicMock()
    role.role_name = role_name
    user.role = role
    return user


def _plan(user_id, name, accounts, brand_splits=(), status="APPROVED", total=None, previous=None):
    plan = MagicMock()
    plan.user_id = user_id
    plan.user.display_name = name
    plan.status = status
    plan.previous_approved_total_lakhs = Decimal(previous) if previous is not None else None
    # The saved total is the sum of the hospitals unless a legacy plan says otherwise.
    plan.target_amount_lakhs = (
        Decimal(total) if total is not None else sum((Decimal(a[2]) for a in accounts), Decimal(0))
    )
    plan.accounts = [
        MagicMock(account_id=aid, planned_amount_lakhs=Decimal(amt), **{"account.name": aname})
        for aid, aname, amt in accounts
    ]
    plan.brand_splits = [
        MagicMock(brand_id=bid, split_amount_lakhs=Decimal(amt), **{"brand.name": bname})
        for bid, bname, amt in brand_splits
    ]
    return plan


def _repo(**overrides) -> MagicMock:
    repo = MagicMock(spec=TargetVsActualRepository)
    repo.roster.return_value = []
    repo.list_plans.return_value = []
    repo.zone_of_accounts.return_value = {}
    repo.won_by_owner_account.return_value = []
    repo.won_by_owner_brand.return_value = []
    repo.po_received_by_owner.return_value = []
    repo.no_po_date_counts.return_value = []
    repo.expected_by_owner.return_value = []
    repo.late_opportunities.return_value = []
    repo.undated_counts.return_value = []
    repo.sbu_target_amounts.return_value = {}
    repo.active_sbu_count.return_value = 2
    repo.company_totals.return_value = (Decimal(0), Decimal(0), Decimal(0))
    for k, v in overrides.items():
        getattr(repo, k).return_value = v
    return repo


def _run(repo, today: date, monkeypatch, user=None):
    monkeypatch.setattr(service_module, "today_ist", lambda: today)
    user = user or _user_with_role("Sales Rep")
    return TargetVsActualService(repo).get_target_vs_actual(SBU_ID, PERIOD, current_user=user)


def test_quarter_state_follows_today(monkeypatch):
    assert _run(_repo(), date(2026, 9, 30), monkeypatch).quarter_state == QuarterState.FUTURE
    assert _run(_repo(), date(2026, 10, 1), monkeypatch).quarter_state == QuarterState.CURRENT
    assert _run(_repo(), date(2026, 12, 31), monkeypatch).quarter_state == QuarterState.CURRENT
    assert _run(_repo(), date(2027, 1, 1), monkeypatch).quarter_state == QuarterState.PAST


def test_won_window_is_ist_midnights_of_the_quarter(monkeypatch):
    repo = _repo()
    _run(repo, IN_QUARTER, monkeypatch)
    _, _, start, end = repo.won_by_owner_account.call_args.args
    assert start.isoformat() == "2026-10-01T00:00:00+05:30"
    assert end.isoformat() == "2027-01-01T00:00:00+05:30"


def test_owner_credit_unplanned_line_and_percent(monkeypatch):
    rep, h1, h2, other = (uuid.uuid4() for _ in range(4))
    repo = _repo(
        roster=[(rep, "Asha")],
        list_plans=[_plan(rep, "Asha", [(h1, "Hospital A", "40"), (h2, "Hospital B", "10")])],
        won_by_owner_account=[
            (rep, "Asha", h1, None, None, Decimal("10.00")),
            (rep, "Asha", other, None, None, Decimal("5.00")),  # not on her plan
        ],
    )
    resp = _run(repo, IN_QUARTER, monkeypatch)
    asha = resp.people[0]
    assert (asha.planned_lakhs, asha.won_lakhs) == (Decimal("50"), Decimal("15.00"))
    assert asha.percent_of_target == Decimal("30.00")
    unplanned = [h for h in asha.hospitals if h.account_id is None]
    assert len(unplanned) == 1
    assert (unplanned[0].planned_lakhs, unplanned[0].won_lakhs) == (0, Decimal("5.00"))


def test_legacy_plan_without_hospitals_counts_in_full(monkeypatch):
    # Saved before hospital-wise planning: a total and a brand split, no hospital lines.
    rep, brand = uuid.uuid4(), uuid.uuid4()
    repo = _repo(
        roster=[(rep, "Rudra")],
        list_plans=[_plan(rep, "Rudra", [], brand_splits=[(brand, "SonoScape", "10")], total="10")],
    )
    resp = _run(repo, IN_QUARTER, monkeypatch)
    rudra = resp.people[0]
    assert rudra.planned_lakhs == resp.planned_lakhs == Decimal("10")
    assert resp.brands[0].planned_lakhs == Decimal("10")  # tile, person and brand table agree
    lines = [(h.account_name, h.planned_lakhs) for h in rudra.hospitals]
    assert lines == [("Not assigned to a hospital", Decimal("10"))]
    assert [(z.zone_name, z.planned_lakhs) for z in resp.zones] == [(None, Decimal("10"))]


def test_partly_assigned_plan_shows_only_the_remainder(monkeypatch):
    rep, h1 = uuid.uuid4(), uuid.uuid4()
    repo = _repo(roster=[(rep, "Asha")], list_plans=[_plan(rep, "Asha", [(h1, "Hospital A", "40")], total="50")])
    asha = _run(repo, IN_QUARTER, monkeypatch).people[0]
    assert asha.planned_lakhs == Decimal("50")
    assert [h.planned_lakhs for h in asha.hospitals] == [Decimal("40"), Decimal("10")]


# --- roster -----------------------------------------------------------------


def test_roster_member_without_a_plan_gets_a_not_started_row(monkeypatch):
    rep = uuid.uuid4()
    resp = _run(_repo(roster=[(rep, "Ravi")]), IN_QUARTER, monkeypatch)
    [ravi] = resp.people
    assert ravi.plan_status == RosterStatus.NOT_STARTED
    assert (ravi.planned_lakhs, ravi.won_lakhs, ravi.percent_of_target) == (Decimal(0), Decimal(0), None)
    assert (resp.roster_count, resp.not_submitted_count) == (1, 1)


def test_owner_outside_the_roster_has_no_row_but_still_counts_in_totals(monkeypatch):
    # Someone from another SBU, or since deactivated, who won an Opportunity here.
    outsider = uuid.uuid4()
    repo = _repo(
        won_by_owner_account=[(outsider, "Ravi", uuid.uuid4(), None, None, Decimal("7.00"))],
        po_received_by_owner=[(outsider, "Ravi", Decimal("3.00"))],
    )
    resp = _run(repo, IN_QUARTER, monkeypatch)
    assert resp.people == []
    assert (resp.won_lakhs, resp.po_received_lakhs) == (Decimal("7.00"), Decimal("3.00"))
    assert resp.roster_count == 0


@pytest.mark.parametrize("status", ["DRAFT", "REJECTED"])
def test_draft_and_rejected_plans_show_status_only(monkeypatch, status):
    rep, acc, brand = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
    repo = _repo(
        roster=[(rep, "Asha")],
        list_plans=[_plan(rep, "Asha", [(acc, "Hospital A", "40")], [(brand, "Philips", "40")], status=status)],
    )
    resp = _run(repo, IN_QUARTER, monkeypatch, user=_user_with_role("SBU Manager"))
    [asha] = resp.people
    assert asha.plan_status == RosterStatus(status)
    # The manager can read the draft through RLS; the screen must not show its figures.
    assert asha.planned_lakhs == Decimal(0)
    assert asha.hospitals == [] and asha.brands == []
    assert resp.planned_lakhs == Decimal(0)
    assert resp.brands == [] and resp.zones == []
    assert resp.not_submitted_count == 1


def test_waiting_and_approved_plans_count_and_are_submitted(monkeypatch):
    a, b, c = (uuid.uuid4() for _ in range(3))
    repo = _repo(
        roster=[(a, "Asha"), (b, "Bala"), (c, "Chitra")],
        list_plans=[
            _plan(a, "Asha", [(uuid.uuid4(), "H1", "40")], status="APPROVED"),
            _plan(b, "Bala", [(uuid.uuid4(), "H2", "10")], status="PENDING_APPROVAL"),
        ],
    )
    resp = _run(repo, IN_QUARTER, monkeypatch)
    assert [p.plan_status for p in resp.people] == [
        RosterStatus.APPROVED,
        RosterStatus.PENDING_APPROVAL,
        RosterStatus.NOT_STARTED,
    ]
    assert resp.planned_lakhs == Decimal("50")
    assert (resp.roster_count, resp.not_submitted_count) == (3, 1)


def test_revised_plan_carries_the_previous_approved_total(monkeypatch):
    rep = uuid.uuid4()
    repo = _repo(
        roster=[(rep, "Asha")],
        list_plans=[_plan(rep, "Asha", [(uuid.uuid4(), "H1", "60")], status="PENDING_APPROVAL", previous="45")],
    )
    asha = _run(repo, IN_QUARTER, monkeypatch).people[0]
    assert (asha.planned_lakhs, asha.previous_approved_total_lakhs) == (Decimal("60"), Decimal("45"))


# --- PO received and Won ----------------------------------------------------


def test_po_received_is_separate_from_won_and_percent_uses_won_only(monkeypatch):
    rep, acc = uuid.uuid4(), uuid.uuid4()
    repo = _repo(
        roster=[(rep, "Asha")],
        list_plans=[_plan(rep, "Asha", [(acc, "A", "100")])],
        won_by_owner_account=[(rep, "Asha", acc, None, None, Decimal("20.00"))],
        po_received_by_owner=[(rep, "Asha", Decimal("55.00"))],
        no_po_date_counts=[(rep, "Asha", 2)],
    )
    resp = _run(repo, IN_QUARTER, monkeypatch)
    asha = resp.people[0]
    assert (asha.po_received_lakhs, asha.won_lakhs) == (Decimal("55.00"), Decimal("20.00"))
    assert asha.percent_of_target == Decimal("20.00")
    assert (asha.no_po_date_count, resp.no_po_date_count) == (2, 2)
    assert resp.po_received_lakhs == Decimal("55.00")
    q_start, q_end = repo.po_received_by_owner.call_args.args[2:]
    assert (q_start, q_end) == (date(2026, 10, 1), date(2026, 12, 31))


# --- SBU and company rows ---------------------------------------------------


@pytest.mark.parametrize("role", ["Sales Rep", "Area Manager"])
def test_staff_and_area_managers_get_no_sbu_or_company_row(monkeypatch, role):
    repo = _repo(sbu_target_amounts={SBU_ID: Decimal("500")})
    resp = _run(repo, IN_QUARTER, monkeypatch, user=_user_with_role(role))
    assert resp.sbu_row is None and resp.company_row is None
    repo.sbu_target_amounts.assert_not_called()


def test_sbu_manager_gets_their_own_sbus_row_only(monkeypatch):
    rep, acc = uuid.uuid4(), uuid.uuid4()
    repo = _repo(
        roster=[(rep, "Asha")],
        list_plans=[_plan(rep, "Asha", [(acc, "A", "100")])],
        won_by_owner_account=[(rep, "Asha", acc, None, None, Decimal("50.00"))],
        sbu_target_amounts={SBU_ID: Decimal("200")},
    )
    resp = _run(repo, IN_QUARTER, monkeypatch, user=_user_with_role("SBU Manager"))
    assert resp.sbu_row.target_lakhs == Decimal("200")
    assert resp.sbu_row.planned_lakhs == Decimal("100")
    assert resp.sbu_row.percent_of_target == Decimal("25.00")  # against the SBU target, not the plans
    assert resp.company_row is None


def test_sbu_manager_of_another_sbu_gets_no_sbu_row(monkeypatch):
    other_sbu_manager = _user_with_role("SBU Manager", sbu_id=uuid.uuid4())
    resp = _run(_repo(), IN_QUARTER, monkeypatch, user=other_sbu_manager)
    assert resp.sbu_row is None


def test_sbu_row_without_a_target_has_no_percent(monkeypatch):
    resp = _run(_repo(), IN_QUARTER, monkeypatch, user=_user_with_role("SBU Manager"))
    assert resp.sbu_row.target_lakhs is None
    assert resp.sbu_row.percent_of_target is None


@pytest.mark.parametrize("role", ["General Manager", "Admin"])
def test_gm_and_admin_get_sbu_and_company_rows(monkeypatch, role):
    repo = _repo(
        sbu_target_amounts={SBU_ID: Decimal("200"), uuid.uuid4(): Decimal("300")},
        company_totals=(Decimal("400"), Decimal("150"), Decimal("100")),
    )
    resp = _run(repo, IN_QUARTER, monkeypatch, user=_user_with_role(role, sbu_id=None))
    assert resp.sbu_row.target_lakhs == Decimal("200")
    row = resp.company_row
    assert (row.target_lakhs, row.planned_lakhs, row.po_received_lakhs, row.won_lakhs) == (
        Decimal("500"),
        Decimal("400"),
        Decimal("150"),
        Decimal("100"),
    )
    assert row.percent_of_target == Decimal("20.00")


def test_company_target_waits_until_every_sbu_has_one(monkeypatch):
    repo = _repo(sbu_target_amounts={SBU_ID: Decimal("200")}, active_sbu_count=2)
    resp = _run(repo, IN_QUARTER, monkeypatch, user=_user_with_role("General Manager", sbu_id=None))
    assert resp.company_row.target_lakhs is None
    assert resp.company_row.percent_of_target is None


# --- expected, zones, brands ------------------------------------------------


def test_current_quarter_expected_includes_late_and_flags_them(monkeypatch):
    rep, acc, opp = (uuid.uuid4() for _ in range(3))
    repo = _repo(
        roster=[(rep, "Asha")],
        list_plans=[_plan(rep, "Asha", [(acc, "A", "100")])],
        won_by_owner_account=[(rep, "Asha", acc, None, None, Decimal("20.00"))],
        expected_by_owner=[(rep, "Asha", Decimal("30.456"))],
        late_opportunities=[(opp, "Ventilators", acc, "A", rep, "Asha", date(2026, 10, 2), Decimal("12.00"))],
        undated_counts=[(rep, "Asha", 2)],
    )
    resp = _run(repo, IN_QUARTER, monkeypatch)
    # No lower bound on the closing date in the current quarter: late ones count.
    assert repo.expected_by_owner.call_args.args[2:] == (None, date(2026, 12, 31))
    asha = resp.people[0]
    assert asha.expected_lakhs == Decimal("30.46")
    assert asha.likely_finish_lakhs == Decimal("50.46")
    assert len(asha.late_opportunities) == 1
    assert asha.undated_opportunity_count == 2
    assert resp.expected_lakhs == Decimal("30.46")


def test_future_quarter_expected_is_bounded_both_sides(monkeypatch):
    repo = _repo()
    _run(repo, date(2026, 9, 1), monkeypatch)
    assert repo.expected_by_owner.call_args.args[2:] == (date(2026, 10, 1), date(2026, 12, 31))
    repo.late_opportunities.assert_not_called()


def test_past_quarter_has_no_expected_and_finish_equals_won(monkeypatch):
    rep, acc = uuid.uuid4(), uuid.uuid4()
    repo = _repo(
        roster=[(rep, "Asha")],
        list_plans=[_plan(rep, "Asha", [(acc, "A", "100")])],
        won_by_owner_account=[(rep, "Asha", acc, None, None, Decimal("80.00"))],
    )
    resp = _run(repo, date(2027, 2, 1), monkeypatch)
    repo.expected_by_owner.assert_not_called()
    repo.late_opportunities.assert_not_called()
    assert resp.expected_lakhs is None
    assert resp.people[0].expected_lakhs is None
    assert resp.likely_finish_lakhs == Decimal("80.00")


def test_zone_totals_use_the_hospitals_zone(monkeypatch):
    rep, acc, north = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
    repo = _repo(
        list_plans=[_plan(rep, "Asha", [(acc, "A", "40")])],
        zone_of_accounts={acc: (north, "North Kerala")},
        won_by_owner_account=[(rep, "Asha", acc, north, "North Kerala", Decimal("10.00"))],
    )
    zones = _run(repo, IN_QUARTER, monkeypatch).zones
    assert [(z.zone_name, z.planned_lakhs, z.won_lakhs) for z in zones] == [
        ("North Kerala", Decimal("40"), Decimal("10.00"))
    ]


def test_brand_planned_vs_won(monkeypatch):
    rep, acc, brand = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
    repo = _repo(
        roster=[(rep, "Asha")],
        list_plans=[_plan(rep, "Asha", [(acc, "A", "40")], brand_splits=[(brand, "Philips", "25")])],
        won_by_owner_brand=[(rep, brand, "Philips", Decimal("9.00"))],
    )
    resp = _run(repo, IN_QUARTER, monkeypatch)
    assert [(b.brand_name, b.planned_lakhs, b.won_lakhs) for b in resp.brands] == [
        ("Philips", Decimal("25"), Decimal("9.00"))
    ]
    assert resp.people[0].brands[0].won_lakhs == Decimal("9.00")


# --- SBU target service -----------------------------------------------------


def _target_body() -> SbuTargetSet:
    return SbuTargetSet(sbu_id=SBU_ID, planning_period=PERIOD, target_amount_lakhs=Decimal("250"))


@pytest.mark.parametrize("role", ["SBU Manager", "Area Manager", "Sales Rep"])
def test_only_admin_or_gm_may_set_an_sbu_target(role):
    repo = MagicMock(spec=SbuTargetRepository)
    with pytest.raises(AuthorizationError):
        SbuTargetService(repo).set_target(_target_body(), current_user=_user_with_role(role))
    repo.create.assert_not_called()


def test_setting_an_sbu_target_creates_then_corrects():
    gm = _user_with_role("General Manager", sbu_id=None)
    repo = MagicMock(spec=SbuTargetRepository)
    repo.get_by_sbu_period.return_value = None
    repo.create.side_effect = lambda obj: obj
    created = SbuTargetService(repo).set_target(_target_body(), current_user=gm)
    assert (created.sbu_id, created.target_amount_lakhs, created.created_by) == (SBU_ID, Decimal("250"), gm.id)

    existing = MagicMock(target_amount_lakhs=Decimal("100"))
    repo.get_by_sbu_period.return_value = existing
    repo.update.side_effect = lambda obj: obj
    SbuTargetService(repo).set_target(_target_body(), current_user=gm)
    assert existing.target_amount_lakhs == Decimal("250")
    assert existing.updated_by == gm.id
    repo.create.assert_called_once()  # the correction updated, it didn't add a second row


@pytest.mark.parametrize(
    ("role", "allowed"), [("SBU Manager", True), ("General Manager", True), ("Area Manager", False)]
)
def test_who_may_read_sbu_targets(role, allowed):
    repo = MagicMock(spec=SbuTargetRepository)
    repo.list_by_period.return_value = []
    service = SbuTargetService(repo)
    if allowed:
        assert service.list_by_period(PERIOD, current_user=_user_with_role(role)) == []
    else:
        with pytest.raises(AuthorizationError):
            service.list_by_period(PERIOD, current_user=_user_with_role(role))


# --- repository SQL ---------------------------------------------------------


def _sql_of(method: str, *args) -> str:
    db = MagicMock()
    db.execute.return_value.all.return_value = []
    getattr(TargetVsActualRepository(db), method)(*args)
    stmt = db.execute.call_args.args[0]
    return str(stmt.compile(compile_kwargs={"literal_binds": True}))


def test_expected_counts_only_active_and_weights_by_probability():
    sql = _sql_of("expected_by_owner", _user_with_role("Admin"), SBU_ID, None, date(2026, 12, 31))
    assert "'ACTIVE'" in sql
    assert "win_probability" in sql
    assert "expected_closure_date <=" in sql


def test_late_opportunities_are_active_and_before_today():
    sql = _sql_of("late_opportunities", _user_with_role("Admin"), SBU_ID, IN_QUARTER)
    assert "'ACTIVE'" in sql
    assert "expected_closure_date < '2026-11-01'" in sql


def test_won_by_owner_is_owner_credited_and_status_won():
    sql = _sql_of("won_by_owner_account", _user_with_role("Admin"), SBU_ID, WIN_START, WIN_END)
    assert "'WON'" in sql
    assert "owner_id" in sql


def test_sales_rep_is_scoped_to_own_opportunities():
    rep = _user_with_role("Sales Rep")
    sql = _sql_of("won_by_owner_account", rep, SBU_ID, WIN_START, WIN_END)
    assert "owner_id" in sql
    assert rep.id.hex in sql.replace("-", "")


def test_brand_won_skips_lines_without_a_product():
    sql = _sql_of("won_by_owner_brand", _user_with_role("Admin"), SBU_ID, WIN_START, WIN_END)
    assert "JOIN product" in sql
    assert "JOIN brand" in sql


def test_po_received_is_by_po_date_and_excludes_lost():
    sql = _sql_of("po_received_by_owner", _user_with_role("Admin"), SBU_ID, date(2026, 10, 1), date(2026, 12, 31))
    assert "po_date >= '2026-10-01'" in sql
    assert "po_date <= '2026-12-31'" in sql
    assert "!= 'LOST'" in sql


def test_no_po_date_counts_open_past_order_and_won_in_quarter():
    sql = _sql_of("no_po_date_counts", _user_with_role("Admin"), SBU_ID, WIN_START, WIN_END)
    assert "po_date IS NULL" in sql
    assert "display_order >= 70" in sql
    assert "'WON'" in sql
    assert "closed_at >=" in sql


def test_roster_is_active_non_admin_members_plus_the_gm():
    sql = _sql_of("roster", _user_with_role("Admin"), SBU_ID)
    assert "is_active IS NOT false" in sql
    assert "role_name != 'Admin'" in sql
    assert "'General Manager'" in sql
    assert SBU_ID.hex in sql.replace("-", "")


def test_roster_for_sales_rep_hides_colleagues():
    # Hide-check: a rep's roster is narrowed to their own row.
    rep = _user_with_role("Sales Rep")
    sql = _sql_of("roster", rep, SBU_ID).replace("-", "")
    assert f"user_profile.id = '{rep.id.hex}'" in sql


def _plans_sql(user) -> str:
    db = MagicMock()
    db.scalars.return_value.all.return_value = []
    TargetVsActualRepository(db).list_plans(user, SBU_ID, PERIOD)
    stmt = db.scalars.call_args.args[0]
    return str(stmt.compile(compile_kwargs={"literal_binds": True})).replace("-", "")


def test_plans_listed_in_every_status_and_joined_to_owner():
    # Draft and rejected plans are fetched for their status; the service hides their figures.
    sql = _plans_sql(_user_with_role("Admin"))
    assert "JOIN user_profile" in sql
    assert "target_plan.status IN" not in sql


def test_plans_for_admin_are_not_narrowed_by_owner():
    admin = _user_with_role("Admin")
    assert admin.id.hex not in _plans_sql(admin)


def test_plans_for_sales_rep_hide_colleagues():
    rep = _user_with_role("Sales Rep")
    assert rep.id.hex in _plans_sql(rep)


def test_plans_for_sbu_manager_are_narrowed_to_their_sbu():
    manager = _user_with_role("SBU Manager")
    sql = _plans_sql(manager)
    assert "user_profile.sbu_id" in sql
    assert manager.id.hex in sql
