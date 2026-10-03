"""Plan vs Actuals Tracking, build step 1: the date helpers, the service's
arithmetic (against a stubbed repository) and the shape of the repository's
SQL (compiled, never run -- the Dev DB is shared)."""

import uuid
from datetime import date, datetime
from decimal import Decimal
from unittest.mock import MagicMock

import pytest

from app.core.periods import IST, quarter_dates, quarter_of
from app.domains.organization.models import UserProfile
from app.domains.planning import service as service_module
from app.domains.planning.repository import PlanVsActualRepository
from app.domains.planning.schemas import QuarterState
from app.domains.planning.service import PlanVsActualService

SBU_ID = uuid.uuid4()
PERIOD = "2026-Q3"  # 1 Oct - 31 Dec 2026
WIN_START = datetime(2026, 10, 1, tzinfo=IST)
WIN_END = datetime(2027, 1, 1, tzinfo=IST)


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


def _user() -> MagicMock:
    return MagicMock(spec=UserProfile)


def _plan(user_id, name, accounts, brand_splits=(), status="APPROVED", total=None):
    plan = MagicMock()
    plan.user_id = user_id
    plan.user.display_name = name
    plan.status = status
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
    repo = MagicMock(spec=PlanVsActualRepository)
    repo.list_plans.return_value = []
    repo.zone_of_accounts.return_value = {}
    repo.won_by_owner_account.return_value = []
    repo.won_by_owner_brand.return_value = []
    repo.expected_by_owner.return_value = []
    repo.late_opportunities.return_value = []
    repo.undated_counts.return_value = []
    for k, v in overrides.items():
        getattr(repo, k).return_value = v
    return repo


def _run(repo, today: date, monkeypatch):
    monkeypatch.setattr(service_module, "today_ist", lambda: today)
    return PlanVsActualService(repo).get_plan_vs_actual(SBU_ID, PERIOD, current_user=_user())


def test_quarter_state_follows_today(monkeypatch):
    assert _run(_repo(), date(2026, 9, 30), monkeypatch).quarter_state == QuarterState.FUTURE
    assert _run(_repo(), date(2026, 10, 1), monkeypatch).quarter_state == QuarterState.CURRENT
    assert _run(_repo(), date(2026, 12, 31), monkeypatch).quarter_state == QuarterState.CURRENT
    assert _run(_repo(), date(2027, 1, 1), monkeypatch).quarter_state == QuarterState.PAST


def test_won_window_is_ist_midnights_of_the_quarter(monkeypatch):
    repo = _repo()
    _run(repo, date(2026, 11, 1), monkeypatch)
    _, _, start, end = repo.won_by_owner_account.call_args.args
    assert start.isoformat() == "2026-10-01T00:00:00+05:30"
    assert end.isoformat() == "2027-01-01T00:00:00+05:30"


def test_owner_credit_unplanned_line_and_percent(monkeypatch):
    rep, h1, h2, other = (uuid.uuid4() for _ in range(4))
    repo = _repo(
        list_plans=[_plan(rep, "Asha", [(h1, "Hospital A", "40"), (h2, "Hospital B", "10")])],
        won_by_owner_account=[
            (rep, "Asha", h1, None, None, Decimal("10.00")),
            (rep, "Asha", other, None, None, Decimal("5.00")),  # not on her plan
        ],
    )
    resp = _run(repo, date(2026, 11, 1), monkeypatch)
    asha = resp.people[0]
    assert (asha.planned_lakhs, asha.won_lakhs) == (Decimal("50"), Decimal("15.00"))
    assert asha.percent_of_plan == Decimal("30.00")
    unplanned = [h for h in asha.hospitals if h.account_id is None]
    assert len(unplanned) == 1
    assert (unplanned[0].planned_lakhs, unplanned[0].won_lakhs) == (0, Decimal("5.00"))


def test_legacy_plan_without_hospitals_counts_in_full(monkeypatch):
    # Saved before hospital-wise planning: a total and a brand split, no hospital lines.
    rep, brand = uuid.uuid4(), uuid.uuid4()
    repo = _repo(list_plans=[_plan(rep, "Rudra", [], brand_splits=[(brand, "SonoScape", "10")], total="10")])
    resp = _run(repo, date(2026, 11, 1), monkeypatch)
    rudra = resp.people[0]
    assert rudra.planned_lakhs == resp.planned_lakhs == Decimal("10")
    assert resp.brands[0].planned_lakhs == Decimal("10")  # tile, person and brand table agree
    lines = [(h.account_name, h.planned_lakhs) for h in rudra.hospitals]
    assert lines == [("Not assigned to a hospital", Decimal("10"))]
    assert [(z.zone_name, z.planned_lakhs) for z in resp.zones] == [(None, Decimal("10"))]


def test_partly_assigned_plan_shows_only_the_remainder(monkeypatch):
    rep, h1 = uuid.uuid4(), uuid.uuid4()
    repo = _repo(list_plans=[_plan(rep, "Asha", [(h1, "Hospital A", "40")], total="50")])
    asha = _run(repo, date(2026, 11, 1), monkeypatch).people[0]
    assert asha.planned_lakhs == Decimal("50")
    assert [h.planned_lakhs for h in asha.hospitals] == [Decimal("40"), Decimal("10")]


def test_person_without_plan_still_appears(monkeypatch):
    rep = uuid.uuid4()
    repo = _repo(won_by_owner_account=[(rep, "Ravi", uuid.uuid4(), None, None, Decimal("7.00"))])
    ravi = _run(repo, date(2026, 11, 1), monkeypatch).people[0]
    assert ravi.plan_status is None
    assert ravi.planned_lakhs == 0
    assert ravi.won_lakhs == Decimal("7.00")
    assert ravi.percent_of_plan is None


def test_current_quarter_expected_includes_late_and_flags_them(monkeypatch):
    rep, acc, opp = (uuid.uuid4() for _ in range(3))
    repo = _repo(
        list_plans=[_plan(rep, "Asha", [(acc, "A", "100")])],
        won_by_owner_account=[(rep, "Asha", acc, None, None, Decimal("20.00"))],
        expected_by_owner=[(rep, "Asha", Decimal("30.456"))],
        late_opportunities=[(opp, "Ventilators", acc, "A", rep, "Asha", date(2026, 10, 2), Decimal("12.00"))],
        undated_counts=[(rep, "Asha", 2)],
    )
    resp = _run(repo, date(2026, 11, 1), monkeypatch)
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
    zones = _run(repo, date(2026, 11, 1), monkeypatch).zones
    assert [(z.zone_name, z.planned_lakhs, z.won_lakhs) for z in zones] == [
        ("North Kerala", Decimal("40"), Decimal("10.00"))
    ]


def test_brand_planned_vs_won(monkeypatch):
    rep, acc, brand = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
    repo = _repo(
        list_plans=[_plan(rep, "Asha", [(acc, "A", "40")], brand_splits=[(brand, "Philips", "25")])],
        won_by_owner_brand=[(rep, brand, "Philips", Decimal("9.00"))],
    )
    resp = _run(repo, date(2026, 11, 1), monkeypatch)
    assert [(b.brand_name, b.planned_lakhs, b.won_lakhs) for b in resp.brands] == [
        ("Philips", Decimal("25"), Decimal("9.00"))
    ]
    assert resp.people[0].brands[0].won_lakhs == Decimal("9.00")


# --- repository SQL ---------------------------------------------------------


def _user_with_role(role_name: str) -> MagicMock:
    user = MagicMock(spec=UserProfile)
    user.id = uuid.uuid4()
    user.sbu_id = SBU_ID
    user.zone_id = uuid.uuid4()
    user.manager_id = None
    role = MagicMock()
    role.role_name = role_name
    user.role = role
    return user


def _sql_of(method: str, *args) -> str:
    db = MagicMock()
    db.execute.return_value.all.return_value = []
    getattr(PlanVsActualRepository(db), method)(*args)
    stmt = db.execute.call_args.args[0]
    return str(stmt.compile(compile_kwargs={"literal_binds": True}))


def test_expected_counts_only_active_and_weights_by_probability():
    sql = _sql_of("expected_by_owner", _user_with_role("Admin"), SBU_ID, None, date(2026, 12, 31))
    assert "'ACTIVE'" in sql
    assert "win_probability" in sql
    assert "expected_closure_date <=" in sql


def test_late_opportunities_are_active_and_before_today():
    sql = _sql_of("late_opportunities", _user_with_role("Admin"), SBU_ID, date(2026, 11, 1))
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
