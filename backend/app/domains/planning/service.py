import uuid
from datetime import UTC, datetime
from decimal import Decimal

from app.core.exceptions import AuthorizationError, ConflictError, NotFoundError
from app.domains.organization.models import UserProfile
from app.domains.planning.models import TargetPlan
from app.domains.planning.repository import TargetPlanRepository
from app.domains.planning.schemas import TargetPlanCreate, TargetPlanUpdate

_OVERLAY_ROLES = ("Admin", "General Manager")


class TargetPlanService:
    def __init__(self, repository: TargetPlanRepository):
        self.repository = repository

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

    def list_pending_approval_for_approver(self, approver_id: uuid.UUID) -> list[TargetPlan]:
        return self.repository.list_pending_approval_for_approver(approver_id)

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
        return self.repository.create(target_plan)

    def update_target_plan(
        self, target_plan_id: uuid.UUID, data: TargetPlanUpdate, *, current_user: UserProfile
    ) -> TargetPlan:
        """Owner revising their own number (decision #5). A revision to an
        already-APPROVED target always needs a fresh sign-off -- resets
        status back to PENDING_APPROVAL and clears the prior approval."""
        target_plan = self.repository.get_by_id(target_plan_id)
        if not target_plan:
            raise NotFoundError(f"Target plan {target_plan_id} not found")
        if target_plan.user_id != current_user.id:
            raise AuthorizationError("You can only revise your own target.")

        target_plan.target_amount_lakhs = data.target_amount_lakhs
        if target_plan.status == "APPROVED":
            target_plan.status = "PENDING_APPROVAL"
            target_plan.approved_by = None
            target_plan.approved_at = None
        target_plan.updated_by = current_user.id
        return self.repository.update(target_plan)

    def approve_or_reject_target_plan(
        self, target_plan_id: uuid.UUID, *, status: str, current_user: UserProfile
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
