"""Annual Target Planning Part 1: the brand-year quarter split and rounding,
which quarters get saved (D46a, D51), re-saving on a pattern change (D50),
the pattern sum check, and who may set a person's target (D45) -- against
stubbed repositories (the Dev DB is shared)."""

import uuid
from datetime import date
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from pydantic import ValidationError as PydanticValidationError

from app.core.exceptions import AuthorizationError, ConflictError, NotFoundError, ValidationError
from app.domains.organization.models import UserProfile
from app.domains.planning import service as service_module
from app.domains.planning.models import BrandAnnualTarget, BrandVendorTarget, PersonQuarterTarget
from app.domains.planning.repository import AnnualTargetRepository, PersonQuarterTargetRepository
from app.domains.planning.schemas import (
    BrandAnnualTargetSet,
    PersonQuarterTargetSet,
    SbuSeasonalPatternSet,
    SeasonalPattern,
)
from app.domains.planning.service import (
    AnnualTargetService,
    PersonTargetService,
    brand_year_quarters,
    split_brand_year,
    stretched_amount,
)

SBU_ID = uuid.uuid4()
EVEN = {"pct_jan_mar": Decimal(25), "pct_apr_jun": Decimal(25), "pct_jul_sep": Decimal(25), "pct_oct_dec": Decimal(25)}


def _user(role_name: str, sbu_id=SBU_ID) -> MagicMock:
    user = MagicMock(spec=UserProfile)
    user.id = uuid.uuid4()
    user.sbu_id = sbu_id
    user.manager_id = None
    user.role = MagicMock(role_name=role_name)
    return user


# --- quarters, stretch, split -----------------------------------------------


@pytest.mark.parametrize(
    ("start_month", "periods"),
    [
        (1, ["2026-Q4", "2027-Q1", "2027-Q2", "2027-Q3"]),  # Jan 2027 - Dec 2027
        (4, ["2027-Q1", "2027-Q2", "2027-Q3", "2027-Q4"]),  # Apr 2027 - Mar 2028
        (7, ["2027-Q2", "2027-Q3", "2027-Q4", "2028-Q1"]),
        (10, ["2027-Q3", "2027-Q4", "2028-Q1", "2028-Q2"]),
    ],
)
def test_brand_year_quarters(start_month, periods):
    quarters = brand_year_quarters(start_month, 2027)
    assert [p for _, p in quarters] == periods
    assert quarters[0][0] == start_month


def test_stretch_adds_its_percentage():
    assert stretched_amount(Decimal("100"), Decimal("10")) == Decimal("110.00")
    assert stretched_amount(Decimal("33.33"), Decimal("0")) == Decimal("33.33")


def test_split_adds_back_to_the_year_with_the_last_quarter_taking_the_remainder():
    pct = {1: Decimal("33.33"), 4: Decimal("33.33"), 7: Decimal("33.34"), 10: Decimal("0")}
    amounts = split_brand_year(Decimal("10.00"), pct, [1, 4, 7, 10])
    assert sum(amounts) == Decimal("10.00")
    assert amounts == [Decimal("3.33"), Decimal("3.33"), Decimal("3.34"), Decimal("0.00")]


def test_split_follows_calendar_months_not_brand_order():
    # A brand year starting in October: its first quarter is Oct-Dec (D41).
    pct = {1: Decimal("10"), 4: Decimal("20"), 7: Decimal("30"), 10: Decimal("40")}
    assert split_brand_year(Decimal("100"), pct, [10, 1, 4, 7]) == [
        Decimal("40.00"),
        Decimal("10.00"),
        Decimal("20.00"),
        Decimal("30.00"),
    ]


def test_pattern_must_add_up_to_100():
    with pytest.raises(PydanticValidationError):
        SeasonalPattern(**{**EVEN, "pct_oct_dec": Decimal(30)})
    assert SeasonalPattern(**EVEN).by_month()[10] == Decimal(25)


# --- saving a brand year ----------------------------------------------------


def _annual_repo(brand, *, sbu_pattern=None, annual=None) -> MagicMock:
    repo = MagicMock(spec=AnnualTargetRepository)
    repo.db = MagicMock()
    repo.get_brand.return_value = brand
    repo.get_pattern.return_value = sbu_pattern
    repo.get_annual.return_value = annual
    repo.get_vendor_target.return_value = None
    repo.vendor_targets.return_value = {}
    return repo


def _brand(start_month=1):
    return SimpleNamespace(id=uuid.uuid4(), name="SonoScape", sbu_id=SBU_ID, year_start_month=start_month)


def _saved_periods(repo) -> dict[str, Decimal]:
    return {
        c.args[0].planning_period: c.args[0].vendor_target_amount_lakhs
        for c in repo.db.add.call_args_list
        if isinstance(c.args[0], BrandVendorTarget)
    }


def test_save_writes_only_quarters_from_oct_2026_not_yet_ended(monkeypatch):
    # Brand year Apr 2026 - Mar 2027, saved on 15 Nov 2026: Apr-Jun and
    # Jul-Sep are before 2026-Q3 (D46a); Oct-Dec and Jan-Mar are written.
    monkeypatch.setattr(service_module, "today_ist", lambda: date(2026, 11, 15))
    brand = _brand(start_month=4)
    repo = _annual_repo(brand)
    body = BrandAnnualTargetSet(
        brand_id=brand.id,
        start_year=2026,
        vendor_amount_lakhs=Decimal("400"),
        stretch_pct=Decimal("10"),
        pattern=SeasonalPattern(**EVEN),
    )
    row = AnnualTargetService(repo).set_annual(body, current_user=_user("General Manager", None))
    assert _saved_periods(repo) == {"2026-Q3": Decimal("110.00"), "2026-Q4": Decimal("110.00")}
    assert row.stretched_lakhs == Decimal("440.00")
    assert [q.planning_period for q in row.quarters] == ["2026-Q1", "2026-Q2", "2026-Q3", "2026-Q4"]


def test_save_skips_quarters_already_ended(monkeypatch):
    # D51: on 2 Jan 2027, Oct-Dec 2026 has ended and is left alone.
    monkeypatch.setattr(service_module, "today_ist", lambda: date(2027, 1, 2))
    brand = _brand(start_month=10)
    repo = _annual_repo(brand)
    body = BrandAnnualTargetSet(
        brand_id=brand.id, start_year=2026, vendor_amount_lakhs=Decimal("100"), pattern=SeasonalPattern(**EVEN)
    )
    AnnualTargetService(repo).set_annual(body, current_user=_user("Admin", None))
    assert set(_saved_periods(repo)) == {"2026-Q4", "2027-Q1", "2027-Q2"}


def test_save_without_any_pattern_is_refused():
    brand = _brand()
    repo = _annual_repo(brand, sbu_pattern=None)
    body = BrandAnnualTargetSet(brand_id=brand.id, start_year=2027, vendor_amount_lakhs=Decimal("100"))
    with pytest.raises(ValidationError):
        AnnualTargetService(repo).set_annual(body, current_user=_user("General Manager", None))
    repo.db.add.assert_not_called()


def test_brand_without_own_pattern_follows_the_sbus(monkeypatch):
    monkeypatch.setattr(service_module, "today_ist", lambda: date(2026, 11, 1))
    brand = _brand(start_month=1)
    sbu_pattern = SimpleNamespace(
        pct_jan_mar=Decimal(40), pct_apr_jun=Decimal(20), pct_jul_sep=Decimal(20), pct_oct_dec=Decimal(20)
    )
    repo = _annual_repo(brand, sbu_pattern=sbu_pattern)
    body = BrandAnnualTargetSet(brand_id=brand.id, start_year=2027, vendor_amount_lakhs=Decimal("100"))
    row = AnnualTargetService(repo).set_annual(body, current_user=_user("General Manager", None))
    assert _saved_periods(repo)["2026-Q4"] == Decimal("40.00")  # Jan-Mar 2027
    assert row.own_pattern is None and row.effective_pattern.pct_jan_mar == Decimal(40)
    annual = next(c.args[0] for c in repo.db.add.call_args_list if isinstance(c.args[0], BrandAnnualTarget))
    assert annual.pct_jan_mar is None  # stays following the SBU (D50)


@pytest.mark.parametrize("role", ["SBU Manager", "Area Manager", "Sales Rep"])
def test_only_admin_or_gm_may_set_a_brand_year(role):
    brand = _brand()
    repo = _annual_repo(brand)
    body = BrandAnnualTargetSet(
        brand_id=brand.id, start_year=2027, vendor_amount_lakhs=Decimal("1"), pattern=SeasonalPattern(**EVEN)
    )
    with pytest.raises(AuthorizationError):
        AnnualTargetService(repo).set_annual(body, current_user=_user(role))


def test_year_start_cannot_change_once_a_figure_exists():
    brand = _brand(start_month=1)
    repo = _annual_repo(brand)
    repo.brand_has_annual.return_value = True
    with pytest.raises(ConflictError):
        AnnualTargetService(repo).set_year_start(brand.id, 4, current_user=_user("General Manager", None))
    assert brand.year_start_month == 1


def test_list_marks_a_brand_with_a_figure_in_another_year():
    # Viewing 2027 with a figure saved only for 2026: no 2027 figure, but
    # the year start is already locked (D59), so the screen must know.
    brand, other = _brand(), _brand()
    repo = _annual_repo(brand)
    repo.list_active_brands.return_value = [brand, other]
    repo.list_annual.return_value = []
    repo.brands_with_annual.return_value = {brand.id}
    rows = AnnualTargetService(repo).list_annual(SBU_ID, 2027, current_user=_user("General Manager", None))
    assert [(r.vendor_amount_lakhs, r.has_any_annual) for r in rows] == [(None, True), (None, False)]


def test_pattern_change_resaves_brands_following_it(monkeypatch):
    monkeypatch.setattr(service_module, "today_ist", lambda: date(2026, 11, 1))
    brand = _brand(start_month=1)
    repo = _annual_repo(brand)
    follower = SimpleNamespace(
        brand_id=brand.id, start_year=2027, vendor_amount_lakhs=Decimal("100"), stretch_pct=Decimal("0")
    )
    repo.list_following_sbu_pattern.return_value = [follower]
    body = SbuSeasonalPatternSet(sbu_id=SBU_ID, year=2027, **{**EVEN, "pct_jan_mar": Decimal(10), "pct_oct_dec": 40})
    AnnualTargetService(repo).set_pattern(body, current_user=_user("General Manager", None))
    repo.list_following_sbu_pattern.assert_called_once_with(SBU_ID, 2027)
    assert _saved_periods(repo) == {
        "2026-Q4": Decimal("10.00"),
        "2027-Q1": Decimal("25.00"),
        "2027-Q2": Decimal("25.00"),
        "2027-Q3": Decimal("40.00"),
    }


def test_resave_leaves_a_quarter_typed_by_hand_alone(monkeypatch):
    # D71/D72: Jan-Mar 2027 was typed by hand as 30; the others are re-split
    # from the pattern and are not redistributed to make up the year.
    monkeypatch.setattr(service_module, "today_ist", lambda: date(2026, 11, 1))
    brand = _brand(start_month=1)
    repo = _annual_repo(brand)
    by_hand = SimpleNamespace(set_by_hand=True, vendor_target_amount_lakhs=Decimal("30"))
    from_pattern = SimpleNamespace(set_by_hand=False, vendor_target_amount_lakhs=Decimal("1"))
    repo.get_vendor_target.side_effect = lambda _b, p: by_hand if p == "2026-Q4" else from_pattern
    body = BrandAnnualTargetSet(
        brand_id=brand.id, start_year=2027, vendor_amount_lakhs=Decimal("200"), pattern=SeasonalPattern(**EVEN)
    )
    AnnualTargetService(repo).set_annual(body, current_user=_user("General Manager", None))
    assert by_hand.vendor_target_amount_lakhs == Decimal("30")
    assert from_pattern.vendor_target_amount_lakhs == Decimal("50.00")


def test_list_shows_billing_split_evenly_and_marks(monkeypatch):
    # D54/D68: Brands Billing to Cabio is the brand's own figure (no stretch)
    # in four even parts, the last taking the remainder; D73 marks a quarter
    # typed by hand, and an ended quarter is locked.
    monkeypatch.setattr(service_module, "today_ist", lambda: date(2026, 11, 1))
    brand = _brand(start_month=4)
    repo = _annual_repo(brand)
    repo.list_active_brands.return_value = [brand]
    repo.list_annual.return_value = [
        SimpleNamespace(
            brand_id=brand.id,
            vendor_amount_lakhs=Decimal("100.01"),
            stretch_pct=Decimal("10"),
            pct_jan_mar=None,
            pct_apr_jun=None,
            pct_jul_sep=None,
            pct_oct_dec=None,
        )
    ]
    repo.brands_with_annual.return_value = {brand.id}
    repo.vendor_targets.return_value = {(brand.id, "2026-Q4"): (Decimal("33"), True)}
    [row] = AnnualTargetService(repo).list_annual(SBU_ID, 2026, current_user=_user("General Manager", None))
    assert [q.billing_lakhs for q in row.quarters] == [
        Decimal("25.00"),
        Decimal("25.00"),
        Decimal("25.00"),
        Decimal("25.01"),
    ]
    assert [q.set_by_hand for q in row.quarters] == [False, False, False, True]
    assert [q.locked for q in row.quarters] == [True, True, False, False]
    assert row.quarters[3].saved_lakhs == Decimal("33")


# --- person targets ---------------------------------------------------------


def _person_repo(person) -> MagicMock:
    repo = MagicMock(spec=PersonQuarterTargetRepository)
    repo.get_user.return_value = person
    repo.get_target.return_value = None
    repo.create.side_effect = lambda obj: obj
    repo.update.side_effect = lambda obj: obj
    return repo


def _body(user_id) -> PersonQuarterTargetSet:
    return PersonQuarterTargetSet(user_id=user_id, planning_period="2026-Q3", target_amount_lakhs=Decimal("50"))


def test_manager_sets_a_direct_reports_target_in_their_sbu():
    am = _user("Area Manager")
    rep = SimpleNamespace(id=uuid.uuid4(), manager_id=am.id, sbu_id=SBU_ID)
    created = PersonTargetService(_person_repo(rep), MagicMock()).set_target(_body(rep.id), current_user=am)
    assert isinstance(created, PersonQuarterTarget)
    assert (created.sbu_id, created.set_by, created.target_amount_lakhs) == (SBU_ID, am.id, Decimal("50"))


def test_someone_elses_report_is_refused():
    rep = SimpleNamespace(id=uuid.uuid4(), manager_id=uuid.uuid4(), sbu_id=SBU_ID)
    repo = _person_repo(rep)
    with pytest.raises(AuthorizationError):
        PersonTargetService(repo, MagicMock()).set_target(_body(rep.id), current_user=_user("Area Manager"))
    repo.create.assert_not_called()


def test_no_one_sets_their_own_target():
    gm = _user("General Manager", None)
    me = SimpleNamespace(id=gm.id, manager_id=None, sbu_id=SBU_ID)
    with pytest.raises(AuthorizationError):
        PersonTargetService(_person_repo(me), MagicMock()).set_target(_body(gm.id), current_user=gm)


def test_gm_corrects_an_existing_target():
    gm = _user("General Manager", None)
    am = SimpleNamespace(id=uuid.uuid4(), manager_id=uuid.uuid4(), sbu_id=SBU_ID)
    repo = _person_repo(am)
    existing = MagicMock(target_amount_lakhs=Decimal("10"))
    repo.get_target.return_value = existing
    PersonTargetService(repo, MagicMock()).set_target(_body(am.id), current_user=gm)
    assert (existing.target_amount_lakhs, existing.set_by) == (Decimal("50"), gm.id)
    repo.create.assert_not_called()


def test_manager_removes_a_direct_reports_target():
    am = _user("Area Manager")
    rep = SimpleNamespace(id=uuid.uuid4(), manager_id=am.id, sbu_id=SBU_ID)
    repo = _person_repo(rep)
    existing = MagicMock()
    repo.get_target.return_value = existing
    PersonTargetService(repo, MagicMock()).remove_target(rep.id, "2026-Q3", current_user=am)
    repo.get_target.assert_called_once_with(rep.id, SBU_ID, "2026-Q3")
    repo.delete.assert_called_once_with(existing)


def test_someone_elses_report_cant_be_removed():
    rep = SimpleNamespace(id=uuid.uuid4(), manager_id=uuid.uuid4(), sbu_id=SBU_ID)
    repo = _person_repo(rep)
    repo.get_target.return_value = MagicMock()
    with pytest.raises(AuthorizationError):
        PersonTargetService(repo, MagicMock()).remove_target(rep.id, "2026-Q3", current_user=_user("Area Manager"))
    repo.delete.assert_not_called()


def test_gm_removes_any_target():
    gm = _user("General Manager", None)
    am = SimpleNamespace(id=uuid.uuid4(), manager_id=uuid.uuid4(), sbu_id=SBU_ID)
    repo = _person_repo(am)
    existing = MagicMock()
    repo.get_target.return_value = existing
    PersonTargetService(repo, MagicMock()).remove_target(am.id, "2026-Q3", current_user=gm)
    repo.delete.assert_called_once_with(existing)


def test_removing_a_target_that_isnt_set_is_not_found():
    gm = _user("General Manager", None)
    am = SimpleNamespace(id=uuid.uuid4(), manager_id=uuid.uuid4(), sbu_id=SBU_ID)
    repo = _person_repo(am)
    with pytest.raises(NotFoundError):
        PersonTargetService(repo, MagicMock()).remove_target(am.id, "2026-Q3", current_user=gm)
    repo.delete.assert_not_called()


def test_sbu_top_people_lists_only_sales_roles():
    # A Marketing User with an SBU and no manager must not get a target box.
    db = MagicMock()
    PersonQuarterTargetRepository(db).sbu_top_people(SBU_ID)
    sql = str(db.scalars.call_args.args[0].compile(compile_kwargs={"literal_binds": True}))
    assert "IN ('SBU Manager', 'Area Manager', 'Sales Staff')" in sql


def test_team_targets_for_gm_compare_to_the_sbu_target():
    gm = _user("General Manager", None)
    a, b = uuid.uuid4(), uuid.uuid4()
    repo = _person_repo(None)
    repo.sbu_top_people.return_value = [
        SimpleNamespace(id=a, display_name="Anil", role=SimpleNamespace(role_name="Area Manager")),
        SimpleNamespace(id=b, display_name="Bina", role=SimpleNamespace(role_name="Area Manager")),
    ]
    repo.targets_for.return_value = {a: Decimal("60")}
    sbu_repo = MagicMock()
    sbu_repo.active_sbu_targets.return_value = {SBU_ID: Decimal("200")}
    resp = PersonTargetService(repo, sbu_repo).get_team_targets(SBU_ID, "2026-Q3", current_user=gm)
    assert resp.own_target_lakhs is None
    assert [r.target_lakhs for r in resp.reports] == [Decimal("60"), None]
    assert (resp.reports_total_lakhs, resp.compare_to_lakhs) == (Decimal("60"), Decimal("200"))


def test_team_targets_for_area_manager_compare_to_their_own():
    am = _user("Area Manager")
    rep = uuid.uuid4()
    repo = _person_repo(None)
    repo.get_target.return_value = SimpleNamespace(target_amount_lakhs=Decimal("150"))
    repo.direct_reports.return_value = [SimpleNamespace(id=rep, display_name="Asha", role=None)]
    repo.targets_for.return_value = {rep: Decimal("90")}
    sbu_repo = MagicMock()
    resp = PersonTargetService(repo, sbu_repo).get_team_targets(SBU_ID, "2026-Q3", current_user=am)
    assert (resp.own_target_lakhs, resp.compare_to_lakhs, resp.reports_total_lakhs) == (
        Decimal("150"),
        Decimal("150"),
        Decimal("90"),
    )
    sbu_repo.active_sbu_targets.assert_not_called()
