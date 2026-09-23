import uuid
from datetime import UTC, datetime
from decimal import Decimal

from app.core.exceptions import AuthorizationError, ConflictError, NotFoundError, ValidationError
from app.domains.organization.models import UserProfile
from app.domains.planning.models import BrandVendorTarget, TargetPlan
from app.domains.planning.repository import BrandVendorTargetRepository, TargetPlanRepository
from app.domains.planning.schemas import (
    BrandSplitEntry,
    BrandVendorTargetSet,
    TargetPlanCreate,
    TargetPlanUpdate,
)
from app.domains.reference.repository import BrandRepository

_OVERLAY_ROLES = ("Admin", "General Manager")


def _require_admin_or_gm(current_user: UserProfile) -> None:
    if current_user.role.role_name not in _OVERLAY_ROLES:
        raise AuthorizationError("Only Admin/GM may do this.")


class TargetPlanService:
    def __init__(self, repository: TargetPlanRepository, brand_repository: BrandRepository):
        self.repository = repository
        self.brand_repository = brand_repository

    def get_approver_id(self, user_id: uuid.UUID) -> uuid.UUID | None:
        """Resolved purely from the real reporting line -- no role-name check.

        Whatever the org chart says today (Area Manager -> GM, 2 hops) or
        says later (Area Manager -> SBU Manager -> GM, 3 hops) falls out of
        this same one-line lookup automatically, since it's reading
        user_profile.manager_id, not reimplementing the hierarchy. Returns
        None for whoever sits at the very top of the chain (today: GM,
        manager_id is NULL) -- that case is handled by the Admin/GM
        self-exclusion in approve_or_reject_target_plan below, not here.
        """
        user = self.repository.db.get(UserProfile, user_id)
        return user.manager_id if user else None

    def list_by_user(self, user_id: uuid.UUID) -> list[TargetPlan]:
        return self.repository.list_by_user(user_id)

    def list_pending_approval_for_approver(self, current_user: UserProfile) -> list[TargetPlan]:
        """Admin/GM additionally see whoever has no manager at all (today,
        only GM) -- the same overlay-override tier that's already allowed
        to act on that row via approve_or_reject_target_plan below, now
        actually able to find it in their own queue."""
        is_overlay = current_user.role.role_name in _OVERLAY_ROLES
        return self.repository.list_pending_approval_for_approver(
            current_user.id, include_orphaned=is_overlay
        )

    def list_team_targets(self, sbu_id: uuid.UUID, planning_period: str) -> list[TargetPlan]:
        """Every target in the SBU for the period, all statuses -- the
        per-person breakdown behind the rollup banner. RLS on target_plan_read
        already narrows this to what the caller may see (their own SBU, their
        own reports, or unrestricted for Admin/GM); this just adds the
        sbu_id/planning_period filter on top, same shape as get_sbu_rollup."""
        return self.repository.list_by_sbu_and_period(sbu_id, planning_period)

    def _apply_brand_splits(
        self, target_plan: TargetPlan, splits: list[BrandSplitEntry] | None
    ) -> None:
        """Brand-Level Target Planning decision #1: splitting is mandatory,
        enforced here (not just the frontend's dialogBrands.length gate, per
        /code-review 2026-09-23 -- a non-UI caller, or a click that beat the
        brand-list fetch, could previously bypass it entirely). If the SBU
        has no active brand at all, this feature doesn't apply yet and any
        `splits` argument is ignored. Otherwise splits are required on every
        create/update call, not optional-once-set -- this also closes the
        "amount changed, stale splits left behind" gap the same review
        found, since a caller can no longer update the amount without
        resending a matching split."""
        if not self.brand_repository.has_active_brand(target_plan.sbu_id):
            return
        if not splits:
            raise ValidationError(
                "This SBU has active brands -- a brand split is required and must sum to the target amount."
            )
        brand_ids = [s.brand_id for s in splits]
        if len(brand_ids) != len(set(brand_ids)):
            raise ValidationError("Each brand can only appear once in the split.")
        total = sum((s.split_amount_lakhs for s in splits), start=Decimal("0"))
        if total != target_plan.target_amount_lakhs:
            raise ValidationError(
                f"Brand splits must sum to exactly the target amount: "
                f"splits total {total}, target is {target_plan.target_amount_lakhs}."
            )
        self.repository.replace_brand_splits(
            target_plan.id, [(s.brand_id, s.split_amount_lakhs) for s in splits]
        )

    def create_target_plan(self, data: TargetPlanCreate, *, current_user: UserProfile) -> TargetPlan:
        existing = self.repository.get_by_user_sbu_period(
            current_user.id, data.sbu_id, data.planning_period
        )
        if existing:
            raise ConflictError(
                f"You already have a target set for {data.planning_period} in this SBU."
            )

        target_plan = TargetPlan(
            user_id=current_user.id,
            sbu_id=data.sbu_id,
            planning_period=data.planning_period,
            target_amount_lakhs=data.target_amount_lakhs,
            status="PENDING_APPROVAL",
            created_by=current_user.id,
            updated_by=current_user.id,
        )
        target_plan = self.repository.create(target_plan)
        self._apply_brand_splits(target_plan, data.brand_splits)
        return target_plan

    def update_target_plan(
        self, target_plan_id: uuid.UUID, data: TargetPlanUpdate, *, current_user: UserProfile
    ) -> TargetPlan:
        """Owner revising their own number (decision #5). A revision to an
        already-decided (APPROVED or REJECTED) target always needs a fresh
        sign-off -- resets status back to PENDING_APPROVAL and clears the
        prior decision, so a corrected number reappears in the approver's
        queue instead of staying stuck on the old decision. This reset fires
        on every call to this method regardless of which fields actually
        changed, so a brand-split-only revision (same total, re-shuffled
        between brands) resets approval exactly the same as a total change --
        confirmed 2026-09-23, since the split is part of what the manager
        approved."""
        target_plan = self.repository.get_by_id(target_plan_id)
        if not target_plan:
            raise NotFoundError(f"Target plan {target_plan_id} not found")
        if target_plan.user_id != current_user.id:
            raise AuthorizationError("You can only revise your own target.")

        target_plan.target_amount_lakhs = data.target_amount_lakhs
        if target_plan.status in ("APPROVED", "REJECTED"):
            target_plan.status = "PENDING_APPROVAL"
            target_plan.approved_by = None
            target_plan.approved_at = None
            target_plan.decision_note = None
        target_plan.updated_by = current_user.id
        target_plan = self.repository.update(target_plan)
        self._apply_brand_splits(target_plan, data.brand_splits)
        return target_plan

    def approve_or_reject_target_plan(
        self,
        target_plan_id: uuid.UUID,
        *,
        status: str,
        current_user: UserProfile,
        note: str | None = None,
    ) -> TargetPlan:
        """Nobody approves their own row, full stop -- not just a GM special
        case. The resolved approver is the owner's own manager
        (get_approver_id); Admin/GM may additionally act as the unrestricted
        overlay tier used everywhere else in this app, but never on their own
        target. Since get_approver_id returns None for whoever sits at the
        top of the chain (no manager_id), the only path left to approve that
        person's target is another Admin/GM user who isn't them -- in
        practice, the separate Admin account."""
        target_plan = self.repository.get_by_id(target_plan_id)
        if not target_plan:
            raise NotFoundError(f"Target plan {target_plan_id} not found")

        is_self = current_user.id == target_plan.user_id
        is_resolved_approver = current_user.id == self.get_approver_id(target_plan.user_id)
        is_overlay_override = current_user.role.role_name in _OVERLAY_ROLES and not is_self

        if is_self or not (is_resolved_approver or is_overlay_override):
            raise AuthorizationError(
                "You aren't authorized to approve or reject this target."
            )

        target_plan.status = status
        target_plan.approved_by = current_user.id
        target_plan.approved_at = datetime.now(UTC)
        target_plan.decision_note = note
        target_plan.updated_by = current_user.id
        return self.repository.update(target_plan)

    def get_sbu_rollup(self, sbu_id: uuid.UUID, planning_period: str) -> tuple[Decimal, int]:
        return self.repository.get_sbu_rollup(sbu_id, planning_period)

    def delete_target_plan(self, target_plan_id: uuid.UUID, *, current_user: UserProfile) -> None:
        target_plan = self.repository.get_by_id(target_plan_id)
        if not target_plan:
            raise NotFoundError(f"Target plan {target_plan_id} not found")
        if target_plan.user_id != current_user.id and current_user.role.role_name not in _OVERLAY_ROLES:
            raise AuthorizationError("You can only delete your own target.")
        self.repository.delete(target_plan)

    def get_brand_rollups(
        self, brand_ids: list[uuid.UUID], planning_period: str, *, current_user: UserProfile
    ) -> dict[uuid.UUID, Decimal]:
        """Admin/GM only (/code-review 2026-09-23) -- committed_total is a
        cross-person aggregate that's already narrowed by the caller's own
        RLS visibility, not the true team total, so an unrestricted caller
        would see a confidently-labeled but silently-partial number. The
        Brand Target Tracking screen this feeds is Admin/GM-only for the
        same reason. One GROUP-BY query for every brand at once (same
        /code-review pass) instead of N single-brand round trips."""
        _require_admin_or_gm(current_user)
        return self.repository.get_brand_rollups(brand_ids, planning_period)


class BrandVendorTargetService:
    def __init__(self, repository: BrandVendorTargetRepository):
        self.repository = repository

    def set_vendor_target(
        self, data: BrandVendorTargetSet, *, current_user: UserProfile
    ) -> BrandVendorTarget:
        """Upsert -- a brand's number for a quarter can be corrected, not
        just entered once (decision #2)."""
        _require_admin_or_gm(current_user)
        existing = self.repository.get_by_brand_period(data.brand_id, data.planning_period)
        if existing:
            existing.vendor_target_amount_lakhs = data.vendor_target_amount_lakhs
            existing.updated_by = current_user.id
            return self.repository.update(existing)

        vendor_target = BrandVendorTarget(
            brand_id=data.brand_id,
            planning_period=data.planning_period,
            vendor_target_amount_lakhs=data.vendor_target_amount_lakhs,
            created_by=current_user.id,
            updated_by=current_user.id,
        )
        return self.repository.create(vendor_target)

    def list_by_period(self, planning_period: str) -> list[BrandVendorTarget]:
        return self.repository.list_by_period(planning_period)
