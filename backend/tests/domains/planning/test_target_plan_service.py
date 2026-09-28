import uuid
from decimal import Decimal
from unittest.mock import MagicMock

import pytest

from app.core.exceptions import AuthorizationError, ConflictError, NotFoundError, ValidationError
from app.domains.organization.models import UserProfile
from app.domains.planning.models import BrandVendorTarget, TargetPlan
from app.domains.planning.repository import BrandVendorTargetRepository, TargetPlanRepository
from app.domains.planning.schemas import (
    BrandSplitEntry,
    BrandVendorTargetSet,
    PlanAccountEntry,
    PlanWarningKind,
    TargetPlanCreate,
    TargetPlanUpdate,
    VisitFrequency,
)
from app.domains.planning.service import BrandVendorTargetService, TargetPlanService

SBU_ID = uuid.uuid4()
ZONE_ID = uuid.uuid4()


def _entries(*amounts: str, account_ids: list[uuid.UUID] | None = None) -> list[PlanAccountEntry]:
    """One plan line per amount, each for a fresh hospital (or the given ids)."""
    ids = account_ids or [uuid.uuid4() for _ in amounts]
    return [
        PlanAccountEntry(account_id=i, planned_amount_lakhs=Decimal(a), visit_frequency=VisitFrequency.MONTHLY)
        for i, a in zip(ids, amounts, strict=True)
    ]


def _make_account(account_id: uuid.UUID, *, potential: str = "MEDIUM", name: str | None = None) -> MagicMock:
    account = MagicMock()
    account.id = account_id
    account.name = name or f"Hospital {str(account_id)[:4]}"
    account.business_potential = potential
    return account


def _make_user(role_name: str, **overrides) -> MagicMock:
    zone = MagicMock()
    zone.zone_id = ZONE_ID
    defaults = {"id": uuid.uuid4(), "manager_id": None, "zones": [zone]}
    defaults.update(overrides)
    user = MagicMock(spec=UserProfile)
    for k, v in defaults.items():
        setattr(user, k, v)
    role = MagicMock()
    role.role_name = role_name
    user.role = role
    return user


def _make_target_plan(**overrides) -> MagicMock:
    defaults = {
        "id": uuid.uuid4(),
        "user_id": uuid.uuid4(),
        "sbu_id": SBU_ID,
        "planning_period": "2026-Q3",
        "target_amount_lakhs": Decimal("50.00"),
        "status": "PENDING_APPROVAL",
        "approved_by": None,
        "approved_at": None,
        "decision_note": None,
    }
    defaults.update(overrides)
    target_plan = MagicMock(spec=TargetPlan)
    for k, v in defaults.items():
        setattr(target_plan, k, v)
    return target_plan


def _make_repo(**overrides) -> MagicMock:
    repo = MagicMock(spec=TargetPlanRepository)
    repo.db = MagicMock()
    repo.get_by_user_sbu_period.return_value = None
    repo.create.side_effect = lambda obj: obj
    repo.update.side_effect = lambda obj: obj
    # Every hospital exists, is MEDIUM, and is inside the caller's territory,
    # unless a test overrides these.
    repo.get_accounts_by_ids.side_effect = lambda ids: [_make_account(i) for i in ids]
    repo.account_ids_outside_zones.return_value = set()
    repo.find_overlaps.return_value = []
    for k, v in overrides.items():
        setattr(repo, k, v)
    return repo


def _make_brand_repo(*, has_brands: bool = False) -> MagicMock:
    brand_repo = MagicMock()
    brand_repo.has_active_brand.return_value = has_brands
    return brand_repo


def _make_service(repo: MagicMock, *, has_brands: bool = False) -> TargetPlanService:
    """Tests that don't care about brand splits default to `has_brands=False`
    -- _apply_brand_splits becomes a no-op, preserving pre-Brand-Level-
    Target-Planning behavior for every unrelated test. Only TestBrandSplits
    below passes has_brands=True."""
    return TargetPlanService(repository=repo, brand_repository=_make_brand_repo(has_brands=has_brands))


class TestCreateTargetPlan:
    def test_creates_pending_approval_row(self):
        repo = _make_repo()
        service = _make_service(repo)
        current_user = _make_user("Sales Staff")
        data = TargetPlanCreate(sbu_id=SBU_ID, planning_period="2026-Q3", accounts=_entries("50"))

        result, _warnings = service.create_target_plan(data, current_user=current_user)

        assert result.status == "PENDING_APPROVAL"
        assert result.user_id == current_user.id

    def test_raises_conflict_when_already_set(self):
        repo = _make_repo(get_by_user_sbu_period=MagicMock(return_value=_make_target_plan()))
        service = _make_service(repo)
        current_user = _make_user("Sales Staff")
        data = TargetPlanCreate(sbu_id=SBU_ID, planning_period="2026-Q3", accounts=_entries("50"))

        with pytest.raises(ConflictError, match="already have a target"):
            service.create_target_plan(data, current_user=current_user)


class TestUpdateTargetPlan:
    def test_owner_can_revise_own_target(self):
        owner = _make_user("Sales Staff")
        target_plan = _make_target_plan(user_id=owner.id, status="PENDING_APPROVAL")
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        service = _make_service(repo)

        result, _warnings = service.update_target_plan(
            target_plan.id, TargetPlanUpdate(accounts=_entries("75"), change_note="Revised"), current_user=owner
        )

        assert result.target_amount_lakhs == Decimal("75")
        assert result.status == "PENDING_APPROVAL"

    def test_revising_an_approved_target_resets_to_pending(self):
        owner = _make_user("Sales Staff")
        target_plan = _make_target_plan(
            user_id=owner.id, status="APPROVED", approved_by=uuid.uuid4(), approved_at="2026-09-01"
        )
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        service = _make_service(repo)

        result, _warnings = service.update_target_plan(
            target_plan.id, TargetPlanUpdate(accounts=_entries("80"), change_note="Revised"), current_user=owner
        )

        assert result.status == "PENDING_APPROVAL"
        assert result.approved_by is None
        assert result.approved_at is None

    def test_revising_a_rejected_target_resets_to_pending(self):
        owner = _make_user("Sales Staff")
        target_plan = _make_target_plan(
            user_id=owner.id,
            status="REJECTED",
            approved_by=uuid.uuid4(),
            approved_at="2026-09-01",
            decision_note="Too low for this territory",
        )
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        service = _make_service(repo)

        result, _warnings = service.update_target_plan(
            target_plan.id, TargetPlanUpdate(accounts=_entries("80"), change_note="Revised"), current_user=owner
        )

        assert result.status == "PENDING_APPROVAL"
        assert result.approved_by is None
        assert result.approved_at is None
        assert result.decision_note is None

    def test_non_owner_cannot_revise(self):
        owner = _make_user("Sales Staff")
        other = _make_user("Sales Staff")
        target_plan = _make_target_plan(user_id=owner.id)
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        service = _make_service(repo)

        with pytest.raises(AuthorizationError, match="only revise your own"):
            service.update_target_plan(
                target_plan.id, TargetPlanUpdate(accounts=_entries("99"), change_note="Revised"), current_user=other
            )

    def test_raises_not_found(self):
        repo = _make_repo(get_by_id=MagicMock(return_value=None))
        service = _make_service(repo)

        with pytest.raises(NotFoundError, match="not found"):
            service.update_target_plan(
                uuid.uuid4(),
                TargetPlanUpdate(accounts=_entries("1"), change_note="Revised"),
                current_user=_make_user("Sales Staff"),
            )


class TestApproveOrRejectTargetPlan:
    def test_resolved_manager_can_approve(self):
        manager = _make_user("Area Manager")
        subordinate = _make_user("Sales Staff", manager_id=manager.id)
        target_plan = _make_target_plan(user_id=subordinate.id, status="PENDING_APPROVAL")
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        repo.db.get.return_value = subordinate  # get_approver_id looks up subordinate.manager_id
        service = _make_service(repo)

        result = service.approve_or_reject_target_plan(
            target_plan.id, status="APPROVED", current_user=manager
        )

        assert result.status == "APPROVED"
        assert result.approved_by == manager.id

    def test_unrelated_peer_cannot_approve(self):
        subordinate = _make_user("Sales Staff", manager_id=uuid.uuid4())
        peer = _make_user("Area Manager")  # a different manager, not subordinate's own
        target_plan = _make_target_plan(user_id=subordinate.id, status="PENDING_APPROVAL")
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        repo.db.get.return_value = subordinate
        service = _make_service(repo)

        with pytest.raises(AuthorizationError, match="authorized"):
            service.approve_or_reject_target_plan(target_plan.id, status="APPROVED", current_user=peer)

    def test_sales_staff_cannot_approve_a_peer(self):
        subordinate = _make_user("Sales Staff", manager_id=uuid.uuid4())
        another_staff = _make_user("Sales Staff")
        target_plan = _make_target_plan(user_id=subordinate.id, status="PENDING_APPROVAL")
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        repo.db.get.return_value = subordinate
        service = _make_service(repo)

        with pytest.raises(AuthorizationError, match="authorized"):
            service.approve_or_reject_target_plan(
                target_plan.id, status="APPROVED", current_user=another_staff
            )

    def test_admin_can_approve_a_subordinate_target(self):
        subordinate = _make_user("Area Manager", manager_id=uuid.uuid4())
        admin = _make_user("Admin")
        target_plan = _make_target_plan(user_id=subordinate.id, status="PENDING_APPROVAL")
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        repo.db.get.return_value = subordinate
        service = _make_service(repo)

        result = service.approve_or_reject_target_plan(target_plan.id, status="APPROVED", current_user=admin)

        assert result.status == "APPROVED"
        assert result.approved_by == admin.id

    def test_gm_cannot_approve_their_own_target(self):
        """Top-of-chain case: GM has no manager_id, so get_approver_id returns
        None -- and the Admin/GM overlay override must not let GM approve
        themselves either (resolved 2026-09-16: nobody approves their own row)."""
        gm = _make_user("General Manager", manager_id=None)
        target_plan = _make_target_plan(user_id=gm.id, status="PENDING_APPROVAL")
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        repo.db.get.return_value = gm  # get_approver_id(gm.id) -> gm.manager_id -> None
        service = _make_service(repo)

        with pytest.raises(AuthorizationError, match="authorized"):
            service.approve_or_reject_target_plan(target_plan.id, status="APPROVED", current_user=gm)

    def test_admin_can_approve_the_gms_own_target(self):
        """The other half of the top-of-chain case: since GM can't approve
        themselves, the only path left is another Admin/GM user who isn't
        the row's own owner -- in practice, the separate Admin account."""
        gm = _make_user("General Manager", manager_id=None)
        admin = _make_user("Admin")
        target_plan = _make_target_plan(user_id=gm.id, status="PENDING_APPROVAL")
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        repo.db.get.return_value = gm
        service = _make_service(repo)

        result = service.approve_or_reject_target_plan(target_plan.id, status="APPROVED", current_user=admin)

        assert result.status == "APPROVED"
        assert result.approved_by == admin.id

    def test_reject_sets_status_rejected(self):
        manager = _make_user("Area Manager")
        subordinate = _make_user("Sales Staff", manager_id=manager.id)
        target_plan = _make_target_plan(user_id=subordinate.id, status="PENDING_APPROVAL")
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        repo.db.get.return_value = subordinate
        service = _make_service(repo)

        result = service.approve_or_reject_target_plan(
            target_plan.id, status="REJECTED", current_user=manager
        )

        assert result.status == "REJECTED"

    def test_reject_with_note_persists_it_on_the_row(self):
        manager = _make_user("Area Manager")
        subordinate = _make_user("Sales Staff", manager_id=manager.id)
        target_plan = _make_target_plan(user_id=subordinate.id, status="PENDING_APPROVAL")
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        repo.db.get.return_value = subordinate
        service = _make_service(repo)

        result = service.approve_or_reject_target_plan(
            target_plan.id,
            status="REJECTED",
            current_user=manager,
            note="Too low for this territory",
        )

        assert result.decision_note == "Too low for this territory"


class TestListPendingApprovalForApprover:
    def test_non_overlay_caller_does_not_request_orphaned_rows(self):
        manager = _make_user("Area Manager")
        repo = _make_repo(list_pending_approval_for_approver=MagicMock(return_value=[]))
        service = _make_service(repo)

        service.list_pending_approval_for_approver(manager)

        repo.list_pending_approval_for_approver.assert_called_once_with(
            manager.id, include_orphaned=False
        )

    def test_admin_caller_requests_orphaned_rows_too(self):
        admin = _make_user("Admin")
        repo = _make_repo(list_pending_approval_for_approver=MagicMock(return_value=[]))
        service = _make_service(repo)

        service.list_pending_approval_for_approver(admin)

        repo.list_pending_approval_for_approver.assert_called_once_with(
            admin.id, include_orphaned=True
        )

    def test_gm_caller_requests_orphaned_rows_too(self):
        gm = _make_user("General Manager")
        repo = _make_repo(list_pending_approval_for_approver=MagicMock(return_value=[]))
        service = _make_service(repo)

        service.list_pending_approval_for_approver(gm)

        repo.list_pending_approval_for_approver.assert_called_once_with(
            gm.id, include_orphaned=True
        )


class TestGetSbuRollup:
    def test_delegates_to_repository_and_includes_pending(self):
        repo = _make_repo(get_sbu_rollup=MagicMock(return_value=(Decimal("120.00"), 3)))
        service = _make_service(repo)

        total, count = service.get_sbu_rollup(SBU_ID, "2026-Q3")

        assert total == Decimal("120.00")
        assert count == 3
        repo.get_sbu_rollup.assert_called_once_with(SBU_ID, "2026-Q3")


class TestGetBrandRollups:
    """/code-review 2026-09-23: committed_total is already narrowed by the
    caller's own RLS visibility, not the true team total, so this must stay
    Admin/GM only -- matching the Brand Target Tracking screen it feeds."""

    def test_admin_can_fetch_rollups(self):
        brand_id = uuid.uuid4()
        repo = _make_repo(get_brand_rollups=MagicMock(return_value={brand_id: Decimal("50")}))
        service = _make_service(repo)
        admin = _make_user("Admin")

        totals = service.get_brand_rollups([brand_id], "2026-Q3", current_user=admin)

        assert totals == {brand_id: Decimal("50")}
        repo.get_brand_rollups.assert_called_once_with([brand_id], "2026-Q3")

    def test_sales_staff_cannot_fetch_rollups(self):
        repo = _make_repo()
        service = _make_service(repo)
        staff = _make_user("Sales Staff")

        with pytest.raises(AuthorizationError, match="Admin/GM"):
            service.get_brand_rollups([uuid.uuid4()], "2026-Q3", current_user=staff)

        repo.get_brand_rollups.assert_not_called()


class TestListTeamTargets:
    def test_delegates_to_repository(self):
        rows = [_make_target_plan(), _make_target_plan()]
        repo = _make_repo(list_by_sbu_and_period=MagicMock(return_value=rows))
        service = _make_service(repo)

        viewer = _make_user("Area Manager")

        result = service.list_team_targets(SBU_ID, "2026-Q3", current_user=viewer)

        assert result == rows
        repo.list_by_sbu_and_period.assert_called_once_with(SBU_ID, "2026-Q3", viewer_id=viewer.id)


class TestDeleteTargetPlan:
    def test_owner_can_delete_own(self):
        owner = _make_user("Sales Staff")
        target_plan = _make_target_plan(user_id=owner.id)
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        service = _make_service(repo)

        service.delete_target_plan(target_plan.id, current_user=owner)

        repo.delete.assert_called_once_with(target_plan)

    def test_non_owner_non_overlay_cannot_delete(self):
        owner = _make_user("Sales Staff")
        other = _make_user("Sales Staff")
        target_plan = _make_target_plan(user_id=owner.id)
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        service = _make_service(repo)

        with pytest.raises(AuthorizationError, match="only delete your own"):
            service.delete_target_plan(target_plan.id, current_user=other)


class TestBrandSplits:
    """docs/Brand-Level-Target-Planning-Implementation-Plan.md decisions #1
    and #3 -- splitting is mandatory whenever the SBU has an active brand
    (enforced server-side, not just the frontend's dialog gate -- /code-
    review 2026-09-23), splits must sum to exactly the total, and a
    split-only revision on an APPROVED plan resets approval the same as a
    total change."""

    def test_create_with_matching_split_sum_succeeds(self):
        repo = _make_repo()
        service = _make_service(repo, has_brands=True)
        current_user = _make_user("Sales Staff")
        brand_a, brand_b = uuid.uuid4(), uuid.uuid4()
        data = TargetPlanCreate(
            sbu_id=SBU_ID,
            planning_period="2026-Q3",
            accounts=_entries("50"),
            brand_splits=[
                BrandSplitEntry(brand_id=brand_a, split_amount_lakhs=Decimal("30")),
                BrandSplitEntry(brand_id=brand_b, split_amount_lakhs=Decimal("20")),
            ],
        )

        service.create_target_plan(data, current_user=current_user)

        repo.replace_brand_splits.assert_called_once()
        _called_target_plan_id, called_splits = repo.replace_brand_splits.call_args[0]
        assert sorted(called_splits) == sorted(
            [(brand_a, Decimal("30")), (brand_b, Decimal("20"))]
        )

    def test_create_with_mismatched_split_sum_raises(self):
        repo = _make_repo()
        service = _make_service(repo, has_brands=True)
        current_user = _make_user("Sales Staff")
        data = TargetPlanCreate(
            sbu_id=SBU_ID,
            planning_period="2026-Q3",
            accounts=_entries("50"),
            brand_splits=[BrandSplitEntry(brand_id=uuid.uuid4(), split_amount_lakhs=Decimal("30"))],
        )

        with pytest.raises(ValidationError, match="must sum to exactly the target amount"):
            service.create_target_plan(data, current_user=current_user)

        repo.replace_brand_splits.assert_not_called()

    def test_create_with_no_splits_raises_when_sbu_has_brands(self):
        """Server-side enforcement of decision #1 -- previously only the
        frontend's dialogBrands.length gate stopped this; a direct API call
        with no brand_splits used to silently skip the rule entirely."""
        repo = _make_repo()
        service = _make_service(repo, has_brands=True)
        current_user = _make_user("Sales Staff")
        data = TargetPlanCreate(sbu_id=SBU_ID, planning_period="2026-Q3", accounts=_entries("50"))

        with pytest.raises(ValidationError, match="brand split is required"):
            service.create_target_plan(data, current_user=current_user)

        repo.replace_brand_splits.assert_not_called()

    def test_create_with_duplicate_brand_id_raises(self):
        """Without this check, a duplicate brand_id would pass the sum
        check and then crash replace_brand_splits with an unhandled
        IntegrityError on the uq_target_plan_brand_split constraint
        (/code-review 2026-09-23)."""
        repo = _make_repo()
        service = _make_service(repo, has_brands=True)
        current_user = _make_user("Sales Staff")
        brand_a = uuid.uuid4()
        data = TargetPlanCreate(
            sbu_id=SBU_ID,
            planning_period="2026-Q3",
            accounts=_entries("50"),
            brand_splits=[
                BrandSplitEntry(brand_id=brand_a, split_amount_lakhs=Decimal("25")),
                BrandSplitEntry(brand_id=brand_a, split_amount_lakhs=Decimal("25")),
            ],
        )

        with pytest.raises(ValidationError, match="can only appear once"):
            service.create_target_plan(data, current_user=current_user)

        repo.replace_brand_splits.assert_not_called()

    def test_create_without_splits_is_a_noop_when_sbu_has_no_active_brand(self):
        repo = _make_repo()
        service = _make_service(repo, has_brands=False)
        current_user = _make_user("Sales Staff")
        data = TargetPlanCreate(sbu_id=SBU_ID, planning_period="2026-Q3", accounts=_entries("50"))

        service.create_target_plan(data, current_user=current_user)

        repo.replace_brand_splits.assert_not_called()

    def test_update_with_mismatched_split_sum_raises_and_does_not_replace(self):
        owner = _make_user("Sales Staff")
        target_plan = _make_target_plan(user_id=owner.id, status="PENDING_APPROVAL")
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        service = _make_service(repo, has_brands=True)
        data = TargetPlanUpdate(
            accounts=_entries("75"),
            change_note="Revised",
            brand_splits=[BrandSplitEntry(brand_id=uuid.uuid4(), split_amount_lakhs=Decimal("74"))],
        )

        with pytest.raises(ValidationError, match="must sum to exactly the target amount"):
            service.update_target_plan(target_plan.id, data, current_user=owner)

        repo.replace_brand_splits.assert_not_called()

    def test_update_that_changes_hospitals_without_resending_splits_raises(self):
        """Closes the "stale splits after an amount-only revision" gap
        (/code-review 2026-09-23) -- since splits are now mandatory on every
        call for a brand-having SBU, an update can no longer change the
        amount while silently leaving the old splits (now mismatched)
        in place."""
        owner = _make_user("Sales Staff")
        target_plan = _make_target_plan(user_id=owner.id, status="PENDING_APPROVAL")
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        service = _make_service(repo, has_brands=True)
        data = TargetPlanUpdate(accounts=_entries("75"), change_note="Revised")

        with pytest.raises(ValidationError, match="brand split is required"):
            service.update_target_plan(target_plan.id, data, current_user=owner)

        repo.replace_brand_splits.assert_not_called()

    def test_split_only_revision_on_approved_plan_resets_to_pending(self):
        """Same total, re-shuffled split -- must still reset approval,
        confirmed 2026-09-23: the split is part of what the manager
        approved."""
        owner = _make_user("Sales Staff")
        target_plan = _make_target_plan(
            user_id=owner.id,
            status="APPROVED",
            approved_by=uuid.uuid4(),
            approved_at="2026-09-01",
            target_amount_lakhs=Decimal("50"),
        )
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        service = _make_service(repo, has_brands=True)
        brand_a, brand_b = uuid.uuid4(), uuid.uuid4()
        data = TargetPlanUpdate(
            accounts=_entries("50"),
            change_note="Revised",
            brand_splits=[
                BrandSplitEntry(brand_id=brand_a, split_amount_lakhs=Decimal("10")),
                BrandSplitEntry(brand_id=brand_b, split_amount_lakhs=Decimal("40")),
            ],
        )

        result, _warnings = service.update_target_plan(target_plan.id, data, current_user=owner)

        assert result.status == "PENDING_APPROVAL"
        assert result.approved_by is None
        assert result.approved_at is None
        repo.replace_brand_splits.assert_called_once()


def _make_brand_vendor_target(**overrides) -> MagicMock:
    defaults = {
        "id": uuid.uuid4(),
        "brand_id": uuid.uuid4(),
        "planning_period": "2026-Q3",
        "vendor_target_amount_lakhs": Decimal("100.00"),
    }
    defaults.update(overrides)
    vendor_target = MagicMock(spec=BrandVendorTarget)
    for k, v in defaults.items():
        setattr(vendor_target, k, v)
    return vendor_target


class TestBrandVendorTargetService:
    """docs/Brand-Level-Target-Planning-Implementation-Plan.md decision #2
    -- only Admin/GM record the vendor's own brand target."""

    def test_admin_can_set_vendor_target(self):
        repo = MagicMock(spec=BrandVendorTargetRepository)
        repo.get_by_brand_period.return_value = None
        repo.create.side_effect = lambda obj: obj
        service = BrandVendorTargetService(repository=repo)
        admin = _make_user("Admin")
        data = BrandVendorTargetSet(
            brand_id=uuid.uuid4(), planning_period="2026-Q3", vendor_target_amount_lakhs=Decimal("100")
        )

        result = service.set_vendor_target(data, current_user=admin)

        assert result.vendor_target_amount_lakhs == Decimal("100")

    def test_sales_staff_cannot_set_vendor_target(self):
        repo = MagicMock(spec=BrandVendorTargetRepository)
        service = BrandVendorTargetService(repository=repo)
        staff = _make_user("Sales Staff")
        data = BrandVendorTargetSet(
            brand_id=uuid.uuid4(), planning_period="2026-Q3", vendor_target_amount_lakhs=Decimal("100")
        )

        with pytest.raises(AuthorizationError, match="Admin/GM"):
            service.set_vendor_target(data, current_user=staff)

        repo.create.assert_not_called()

    def test_setting_an_existing_period_upserts_instead_of_duplicating(self):
        existing = _make_brand_vendor_target(vendor_target_amount_lakhs=Decimal("80"))
        repo = MagicMock(spec=BrandVendorTargetRepository)
        repo.get_by_brand_period.return_value = existing
        repo.update.side_effect = lambda obj: obj
        service = BrandVendorTargetService(repository=repo)
        gm = _make_user("General Manager")
        data = BrandVendorTargetSet(
            brand_id=existing.brand_id,
            planning_period=existing.planning_period,
            vendor_target_amount_lakhs=Decimal("120"),
        )

        result = service.set_vendor_target(data, current_user=gm)

        assert result.vendor_target_amount_lakhs == Decimal("120")
        repo.create.assert_not_called()
        repo.update.assert_called_once_with(existing)


class TestHospitalLines:
    """Hospital-Wise Target Planning: the target is the sum of the hospitals."""

    def test_target_is_the_sum_of_hospital_amounts(self):
        repo = _make_repo()
        service = _make_service(repo)
        data = TargetPlanCreate(sbu_id=SBU_ID, planning_period="2026-Q3", accounts=_entries("30", "0", "12.50"))

        result, _warnings = service.create_target_plan(data, current_user=_make_user("Sales Staff"))

        assert result.target_amount_lakhs == Decimal("42.50")
        repo.replace_accounts.assert_called_once()
        _plan, lines = repo.replace_accounts.call_args[0]
        assert [amount for _id, amount, _freq, _obj in lines] == [Decimal("30"), Decimal("0"), Decimal("12.50")]
        assert {freq for _id, _amount, freq, _obj in lines} == {"MONTHLY"}

    def test_all_zero_total_is_refused(self):
        repo = _make_repo()
        service = _make_service(repo)
        data = TargetPlanCreate(sbu_id=SBU_ID, planning_period="2026-Q3", accounts=_entries("0", "0"))

        with pytest.raises(ValidationError, match="total must be above zero"):
            service.create_target_plan(data, current_user=_make_user("Sales Staff"))
        repo.create.assert_not_called()

    def test_duplicate_hospital_is_refused(self):
        repo = _make_repo()
        service = _make_service(repo)
        same = uuid.uuid4()
        data = TargetPlanCreate(
            sbu_id=SBU_ID, planning_period="2026-Q3", accounts=_entries("10", "20", account_ids=[same, same])
        )

        with pytest.raises(ValidationError, match="only appear once"):
            service.create_target_plan(data, current_user=_make_user("Sales Staff"))
        repo.create.assert_not_called()

    def test_unknown_hospital_is_refused(self):
        repo = _make_repo(get_accounts_by_ids=MagicMock(return_value=[]))
        service = _make_service(repo)
        data = TargetPlanCreate(sbu_id=SBU_ID, planning_period="2026-Q3", accounts=_entries("10"))

        with pytest.raises(ValidationError, match="don't exist"):
            service.create_target_plan(data, current_user=_make_user("Sales Staff"))

    def test_empty_hospital_list_is_rejected_by_the_schema(self):
        with pytest.raises(ValueError):
            TargetPlanCreate(sbu_id=SBU_ID, planning_period="2026-Q3", accounts=[])

    def test_negative_amount_is_rejected_by_the_schema(self):
        with pytest.raises(ValueError):
            _entries("-1")


class TestTerritory:
    def test_sales_staff_hospital_outside_territory_is_refused(self):
        outside_id = uuid.uuid4()
        repo = _make_repo(account_ids_outside_zones=MagicMock(return_value={outside_id}))
        service = _make_service(repo)
        data = TargetPlanCreate(
            sbu_id=SBU_ID, planning_period="2026-Q3", accounts=_entries("10", account_ids=[outside_id])
        )

        with pytest.raises(ValidationError, match="outside your territory"):
            service.create_target_plan(data, current_user=_make_user("Sales Staff"))
        repo.account_ids_outside_zones.assert_called_once_with([outside_id], [ZONE_ID])
        repo.create.assert_not_called()

    def test_area_manager_is_territory_limited_too(self):
        outside_id = uuid.uuid4()
        repo = _make_repo(account_ids_outside_zones=MagicMock(return_value={outside_id}))
        service = _make_service(repo)
        data = TargetPlanCreate(
            sbu_id=SBU_ID, planning_period="2026-Q3", accounts=_entries("10", account_ids=[outside_id])
        )

        with pytest.raises(ValidationError, match="outside your territory"):
            service.create_target_plan(data, current_user=_make_user("Area Manager"))

    def test_caller_with_no_zones_cannot_plan_any_hospital(self):
        repo = _make_repo()
        service = _make_service(repo)
        data = TargetPlanCreate(sbu_id=SBU_ID, planning_period="2026-Q3", accounts=_entries("10"))

        with pytest.raises(ValidationError, match="outside your territory"):
            service.create_target_plan(data, current_user=_make_user("Sales Staff", zones=[]))
        repo.account_ids_outside_zones.assert_not_called()

    @pytest.mark.parametrize("role_name", ["SBU Manager", "General Manager", "Admin"])
    def test_unrestricted_roles_skip_the_territory_check(self, role_name):
        repo = _make_repo()
        service = _make_service(repo)
        data = TargetPlanCreate(sbu_id=SBU_ID, planning_period="2026-Q3", accounts=_entries("10"))

        service.create_target_plan(data, current_user=_make_user(role_name, zones=[]))

        repo.account_ids_outside_zones.assert_not_called()

    def test_eligible_accounts_pass_the_callers_zones(self):
        repo = _make_repo(list_eligible_accounts=MagicMock(return_value=[]))
        service = _make_service(repo)

        service.list_eligible_accounts("shifa", current_user=_make_user("Sales Staff"))

        repo.list_eligible_accounts.assert_called_once_with(search="shifa", zone_ids=[ZONE_ID])

    def test_eligible_accounts_unrestricted_for_sbu_manager(self):
        repo = _make_repo(list_eligible_accounts=MagicMock(return_value=[]))
        service = _make_service(repo)

        service.list_eligible_accounts(None, current_user=_make_user("SBU Manager"))

        repo.list_eligible_accounts.assert_called_once_with(search=None, zone_ids=None)


class TestDrafts:
    def test_create_with_submit_false_saves_a_draft(self):
        repo = _make_repo()
        service = _make_service(repo)
        data = TargetPlanCreate(sbu_id=SBU_ID, planning_period="2026-Q3", accounts=_entries("10"), submit=False)

        result, _warnings = service.create_target_plan(data, current_user=_make_user("Sales Staff"))

        assert result.status == "DRAFT"

    def test_editing_a_draft_needs_no_change_note_and_stays_draft(self):
        owner = _make_user("Sales Staff")
        target_plan = _make_target_plan(user_id=owner.id, status="DRAFT")
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        service = _make_service(repo)

        result, _warnings = service.update_target_plan(
            target_plan.id, TargetPlanUpdate(accounts=_entries("20"), submit=False), current_user=owner
        )

        assert result.status == "DRAFT"
        assert result.target_amount_lakhs == Decimal("20")

    def test_submitting_a_draft_moves_it_to_pending_without_a_note(self):
        owner = _make_user("Sales Staff")
        target_plan = _make_target_plan(user_id=owner.id, status="DRAFT")
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        service = _make_service(repo)

        result, _warnings = service.update_target_plan(
            target_plan.id, TargetPlanUpdate(accounts=_entries("20")), current_user=owner
        )

        assert result.status == "PENDING_APPROVAL"

    def test_draft_may_have_a_zero_total(self):
        """Basheer, 2026-09-28: a half-finished draft may not have amounts
        yet -- the above-zero rule applies on submit only."""
        repo = _make_repo()
        service = _make_service(repo)
        data = TargetPlanCreate(sbu_id=SBU_ID, planning_period="2026-Q3", accounts=_entries("0", "0"), submit=False)

        result, _warnings = service.create_target_plan(data, current_user=_make_user("Sales Staff"))

        assert result.status == "DRAFT"
        assert result.target_amount_lakhs == Decimal("0")

    def test_draft_keeps_an_unbalanced_brand_split(self):
        repo = _make_repo()
        service = _make_service(repo, has_brands=True)
        brand_a = uuid.uuid4()
        data = TargetPlanCreate(
            sbu_id=SBU_ID,
            planning_period="2026-Q3",
            accounts=_entries("50"),
            brand_splits=[BrandSplitEntry(brand_id=brand_a, split_amount_lakhs=Decimal("30"))],
            submit=False,
        )

        result, _warnings = service.create_target_plan(data, current_user=_make_user("Sales Staff"))

        assert result.status == "DRAFT"
        _plan_id, called_splits = repo.replace_brand_splits.call_args[0]
        assert called_splits == [(brand_a, Decimal("30"))]

    def test_draft_may_have_no_brand_split_yet(self):
        owner = _make_user("Sales Staff")
        target_plan = _make_target_plan(user_id=owner.id, status="DRAFT")
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        service = _make_service(repo, has_brands=True)

        result, _warnings = service.update_target_plan(
            target_plan.id, TargetPlanUpdate(accounts=_entries("20"), submit=False), current_user=owner
        )

        assert result.status == "DRAFT"
        _plan_id, called_splits = repo.replace_brand_splits.call_args[0]
        assert called_splits == []

    def test_draft_still_refuses_a_duplicate_brand(self):
        repo = _make_repo()
        service = _make_service(repo, has_brands=True)
        brand_a = uuid.uuid4()
        data = TargetPlanCreate(
            sbu_id=SBU_ID,
            planning_period="2026-Q3",
            accounts=_entries("50"),
            brand_splits=[
                BrandSplitEntry(brand_id=brand_a, split_amount_lakhs=Decimal("10")),
                BrandSplitEntry(brand_id=brand_a, split_amount_lakhs=Decimal("10")),
            ],
            submit=False,
        )

        with pytest.raises(ValidationError, match="can only appear once"):
            service.create_target_plan(data, current_user=_make_user("Sales Staff"))

    @pytest.mark.parametrize(
        ("amount", "split", "message"),
        [
            ("20", "5", "must sum to exactly the target amount"),
            ("0", "0", "total must be above zero"),
        ],
    )
    def test_submitting_a_draft_enforces_the_brand_split_and_total(self, amount, split, message):
        owner = _make_user("Sales Staff")
        target_plan = _make_target_plan(user_id=owner.id, status="DRAFT")
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        service = _make_service(repo, has_brands=True)
        data = TargetPlanUpdate(
            accounts=_entries(amount),
            brand_splits=[BrandSplitEntry(brand_id=uuid.uuid4(), split_amount_lakhs=Decimal(split))],
        )

        with pytest.raises(ValidationError, match=message):
            service.update_target_plan(target_plan.id, data, current_user=owner)

    def test_submitted_plan_cannot_go_back_to_draft(self):
        owner = _make_user("Sales Staff")
        target_plan = _make_target_plan(user_id=owner.id, status="APPROVED")
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        service = _make_service(repo)

        with pytest.raises(ValidationError, match="back into a draft"):
            service.update_target_plan(
                target_plan.id,
                TargetPlanUpdate(accounts=_entries("20"), change_note="x", submit=False),
                current_user=owner,
            )

    def test_draft_cannot_be_approved(self):
        manager = _make_user("Area Manager")
        subordinate = _make_user("Sales Staff", manager_id=manager.id)
        target_plan = _make_target_plan(user_id=subordinate.id, status="DRAFT")
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        repo.db.get.return_value = subordinate
        service = _make_service(repo)

        with pytest.raises(ValidationError, match="still a draft"):
            service.approve_or_reject_target_plan(target_plan.id, status="APPROVED", current_user=manager)
        repo.update.assert_not_called()


class TestChangeNote:
    @pytest.mark.parametrize("status", ["PENDING_APPROVAL", "APPROVED", "REJECTED"])
    def test_revising_a_submitted_plan_requires_a_note(self, status):
        owner = _make_user("Sales Staff")
        target_plan = _make_target_plan(user_id=owner.id, status=status)
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        service = _make_service(repo)

        with pytest.raises(ValidationError, match="short note"):
            service.update_target_plan(
                target_plan.id, TargetPlanUpdate(accounts=_entries("20"), change_note="   "), current_user=owner
            )
        repo.update.assert_not_called()

    def test_note_is_stored_on_the_plan(self):
        owner = _make_user("Sales Staff")
        target_plan = _make_target_plan(user_id=owner.id, status="APPROVED", change_note=None)
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        service = _make_service(repo)

        result, _warnings = service.update_target_plan(
            target_plan.id,
            TargetPlanUpdate(accounts=_entries("20"), change_note="  Added Baby Memorial  "),
            current_user=owner,
        )

        assert result.change_note == "Added Baby Memorial"
        assert result.status == "PENDING_APPROVAL"


class TestWarnings:
    def test_high_potential_hospital_at_zero_is_warned(self):
        high_id, medium_id = uuid.uuid4(), uuid.uuid4()
        accounts = {
            high_id: _make_account(high_id, potential="HIGH", name="Aster MIMS"),
            medium_id: _make_account(medium_id, potential="MEDIUM"),
        }
        repo = _make_repo()
        repo.get_accounts_by_ids.side_effect = lambda ids: [accounts[i] for i in ids]
        service = _make_service(repo)
        data = TargetPlanCreate(
            sbu_id=SBU_ID, planning_period="2026-Q3", accounts=_entries("0", "10", account_ids=[high_id, medium_id])
        )

        _plan, warnings = service.create_target_plan(data, current_user=_make_user("Sales Staff"))

        assert len(warnings) == 1
        assert warnings[0].kind == PlanWarningKind.HIGH_POTENTIAL_ZERO
        assert warnings[0].account_name == "Aster MIMS"

    def test_same_sbu_overlap_is_warned_with_colleague_name(self):
        account_id = uuid.uuid4()
        repo = _make_repo(find_overlaps=MagicMock(return_value=[(account_id, "Anil K")]))
        service = _make_service(repo)
        data = TargetPlanCreate(
            sbu_id=SBU_ID, planning_period="2026-Q3", accounts=_entries("10", account_ids=[account_id])
        )

        _plan, warnings = service.create_target_plan(data, current_user=_make_user("Sales Staff"))

        repo.find_overlaps.assert_called_once_with([account_id], SBU_ID, "2026-Q3")
        assert [(w.kind, w.colleague_name) for w in warnings] == [(PlanWarningKind.SAME_SBU_OVERLAP, "Anil K")]

    def test_warnings_never_block_the_save(self):
        high_id = uuid.uuid4()
        repo = _make_repo(find_overlaps=MagicMock(return_value=[(high_id, "Anil K")]))
        repo.get_accounts_by_ids.side_effect = lambda ids: [_make_account(high_id, potential="HIGH")]
        service = _make_service(repo)
        data = TargetPlanCreate(
            sbu_id=SBU_ID,
            planning_period="2026-Q3",
            accounts=_entries("0", "5", account_ids=[high_id, uuid.uuid4()]),
        )
        repo.get_accounts_by_ids.side_effect = lambda ids: [
            _make_account(i, potential="HIGH" if i == high_id else "LOW") for i in ids
        ]

        result, warnings = service.create_target_plan(data, current_user=_make_user("Sales Staff"))

        assert result.status == "PENDING_APPROVAL"
        assert {w.kind for w in warnings} == {PlanWarningKind.HIGH_POTENTIAL_ZERO, PlanWarningKind.SAME_SBU_OVERLAP}

    def test_live_overlap_check(self):
        account_id = uuid.uuid4()
        repo = _make_repo(find_overlaps=MagicMock(return_value=[(account_id, "Anil K")]))
        service = _make_service(repo)

        warnings = service.check_overlaps([account_id], SBU_ID, "2026-Q3")

        assert warnings[0].colleague_name == "Anil K"
