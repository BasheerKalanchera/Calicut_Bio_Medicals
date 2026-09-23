import uuid
from decimal import Decimal
from unittest.mock import MagicMock

import pytest

from app.core.exceptions import AuthorizationError, ConflictError, NotFoundError, ValidationError
from app.domains.organization.models import UserProfile
from app.domains.planning.models import BrandVendorTarget, TargetPlan
from app.domains.planning.repository import BrandVendorTargetRepository, TargetPlanRepository
from app.domains.planning.schemas import BrandSplitEntry, BrandVendorTargetSet, TargetPlanCreate, TargetPlanUpdate
from app.domains.planning.service import BrandVendorTargetService, TargetPlanService

SBU_ID = uuid.uuid4()


def _make_user(role_name: str, **overrides) -> MagicMock:
    defaults = {"id": uuid.uuid4(), "manager_id": None}
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
        data = TargetPlanCreate(sbu_id=SBU_ID, planning_period="2026-Q3", target_amount_lakhs=Decimal("50"))

        result = service.create_target_plan(data, current_user=current_user)

        assert result.status == "PENDING_APPROVAL"
        assert result.user_id == current_user.id

    def test_raises_conflict_when_already_set(self):
        repo = _make_repo(get_by_user_sbu_period=MagicMock(return_value=_make_target_plan()))
        service = _make_service(repo)
        current_user = _make_user("Sales Staff")
        data = TargetPlanCreate(sbu_id=SBU_ID, planning_period="2026-Q3", target_amount_lakhs=Decimal("50"))

        with pytest.raises(ConflictError, match="already have a target"):
            service.create_target_plan(data, current_user=current_user)


class TestUpdateTargetPlan:
    def test_owner_can_revise_own_target(self):
        owner = _make_user("Sales Staff")
        target_plan = _make_target_plan(user_id=owner.id, status="PENDING_APPROVAL")
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        service = _make_service(repo)

        result = service.update_target_plan(
            target_plan.id, TargetPlanUpdate(target_amount_lakhs=Decimal("75")), current_user=owner
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

        result = service.update_target_plan(
            target_plan.id, TargetPlanUpdate(target_amount_lakhs=Decimal("80")), current_user=owner
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

        result = service.update_target_plan(
            target_plan.id, TargetPlanUpdate(target_amount_lakhs=Decimal("80")), current_user=owner
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
                target_plan.id, TargetPlanUpdate(target_amount_lakhs=Decimal("99")), current_user=other
            )

    def test_raises_not_found(self):
        repo = _make_repo(get_by_id=MagicMock(return_value=None))
        service = _make_service(repo)

        with pytest.raises(NotFoundError, match="not found"):
            service.update_target_plan(
                uuid.uuid4(), TargetPlanUpdate(target_amount_lakhs=Decimal("1")), current_user=_make_user("Sales Staff")
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

        result = service.list_team_targets(SBU_ID, "2026-Q3")

        assert result == rows
        repo.list_by_sbu_and_period.assert_called_once_with(SBU_ID, "2026-Q3")


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
            target_amount_lakhs=Decimal("50"),
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
            target_amount_lakhs=Decimal("50"),
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
        data = TargetPlanCreate(sbu_id=SBU_ID, planning_period="2026-Q3", target_amount_lakhs=Decimal("50"))

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
            target_amount_lakhs=Decimal("50"),
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
        data = TargetPlanCreate(sbu_id=SBU_ID, planning_period="2026-Q3", target_amount_lakhs=Decimal("50"))

        service.create_target_plan(data, current_user=current_user)

        repo.replace_brand_splits.assert_not_called()

    def test_update_with_mismatched_split_sum_raises_and_does_not_replace(self):
        owner = _make_user("Sales Staff")
        target_plan = _make_target_plan(user_id=owner.id, status="PENDING_APPROVAL")
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        service = _make_service(repo, has_brands=True)
        data = TargetPlanUpdate(
            target_amount_lakhs=Decimal("75"),
            brand_splits=[BrandSplitEntry(brand_id=uuid.uuid4(), split_amount_lakhs=Decimal("74"))],
        )

        with pytest.raises(ValidationError, match="must sum to exactly the target amount"):
            service.update_target_plan(target_plan.id, data, current_user=owner)

        repo.replace_brand_splits.assert_not_called()

    def test_update_that_changes_amount_without_resending_splits_raises(self):
        """Closes the "stale splits after an amount-only revision" gap
        (/code-review 2026-09-23) -- since splits are now mandatory on every
        call for a brand-having SBU, an update can no longer change the
        amount while silently leaving the old splits (now mismatched)
        in place."""
        owner = _make_user("Sales Staff")
        target_plan = _make_target_plan(user_id=owner.id, status="PENDING_APPROVAL")
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        service = _make_service(repo, has_brands=True)
        data = TargetPlanUpdate(target_amount_lakhs=Decimal("75"))

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
            target_amount_lakhs=Decimal("50"),
            brand_splits=[
                BrandSplitEntry(brand_id=brand_a, split_amount_lakhs=Decimal("10")),
                BrandSplitEntry(brand_id=brand_b, split_amount_lakhs=Decimal("40")),
            ],
        )

        result = service.update_target_plan(target_plan.id, data, current_user=owner)

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
