import uuid
from datetime import UTC, datetime
from decimal import Decimal

from app.core.exceptions import AuthorizationError, ConflictError, NotFoundError, ValidationError
from app.domains.account.models import Account
from app.domains.organization.models import UserProfile
from app.domains.planning.models import BrandVendorTarget, TargetPlan
from app.domains.planning.repository import BrandVendorTargetRepository, TargetPlanRepository
from app.domains.planning.schemas import (
    BrandSplitEntry,
    BrandVendorTargetSet,
    PlanAccountEntry,
    PlanWarning,
    PlanWarningKind,
    TargetPlanCreate,
    TargetPlanUpdate,
)
from app.domains.reference.repository import BrandRepository

_OVERLAY_ROLES = ("Admin", "General Manager")

# Who may plan any hospital, not just their own territory. Same role set as
# account/service.py's _ZONE_ASSIGNMENT_EXEMPT_ROLES and master_data.py's
# _ZONE_SEARCH_UNRESTRICTED_ROLES (each module keeps its own copy, per
# existing convention). Everyone else is limited to hospitals under their
# user_zone rows; with none, they can't plan any hospital.
_TERRITORY_UNRESTRICTED_ROLES = {"Admin", "General Manager", "SBU Manager"}

# BR-PL-06: which warning a hospital planned at zero gets, by its Business
# Potential. NOT_CLASSIFIED is absent on purpose -- no warning.
_ZERO_WARNING_BY_POTENTIAL = {
    "HIGH": PlanWarningKind.HIGH_POTENTIAL_ZERO,
    "MEDIUM": PlanWarningKind.RATED_POTENTIAL_ZERO,
    "LOW": PlanWarningKind.RATED_POTENTIAL_ZERO,
}


def _territory_zone_ids(current_user: UserProfile) -> list[uuid.UUID] | None:
    """None = unrestricted; otherwise the caller's assigned zones (possibly empty)."""
    if current_user.role.role_name in _TERRITORY_UNRESTRICTED_ROLES:
        return None
    return [uz.zone_id for uz in current_user.zones]


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

    def list_team_targets(
        self, sbu_id: uuid.UUID, planning_period: str, *, current_user: UserProfile
    ) -> list[TargetPlan]:
        """Every submitted target in the SBU for the period -- the per-person
        breakdown behind the rollup banner. RLS on target_plan_read already
        narrows this to what the caller may see (their own SBU, their own
        reports, or unrestricted for Admin/GM); this adds the
        sbu_id/planning_period filter on top, and hides other people's DRAFTs
        (RLS would let a manager read them)."""
        return self.repository.list_by_sbu_and_period(sbu_id, planning_period, viewer_id=current_user.id)

    def list_eligible_accounts(self, search: str | None, *, current_user: UserProfile) -> list[Account]:
        return self.repository.list_eligible_accounts(search=search, zone_ids=_territory_zone_ids(current_user))

    def get_zone_rollup(self, sbu_id: uuid.UUID, planning_period: str):
        return self.repository.get_zone_rollup(sbu_id, planning_period)

    def check_overlaps(
        self, account_ids: list[uuid.UUID], sbu_id: uuid.UUID, planning_period: str
    ) -> list[PlanWarning]:
        """Live same-SBU overlap check for the plan dialog, before saving."""
        accounts_by_id = {a.id: a for a in self.repository.get_accounts_by_ids(account_ids)}
        return self._overlap_warnings(accounts_by_id, sbu_id, planning_period)

    def _validate_accounts(
        self, entries: list[PlanAccountEntry], *, current_user: UserProfile, submit: bool
    ) -> tuple[Decimal, dict[uuid.UUID, Account]]:
        """Hospital-Wise Target Planning rules, checked before anything is
        written: no duplicate hospital, every hospital exists, every hospital
        is in the caller's territory (unless unrestricted), and -- on submit
        only -- the total (= the target) is above zero. A draft may still be
        at zero while its amounts are being filled in (Basheer, 2026-09-28).
        Individual amounts may be zero -- a hospital can be on the plan for
        visits only."""
        account_ids = [e.account_id for e in entries]
        if len(account_ids) != len(set(account_ids)):
            raise ValidationError("Each hospital can only appear once in the plan.")

        accounts_by_id = {a.id: a for a in self.repository.get_accounts_by_ids(account_ids)}
        missing = set(account_ids) - set(accounts_by_id)
        if missing:
            raise ValidationError(f"{len(missing)} hospital(s) in the plan don't exist.")

        zone_ids = _territory_zone_ids(current_user)
        if zone_ids is not None:
            outside = (
                self.repository.account_ids_outside_zones(account_ids, zone_ids) if zone_ids else set(account_ids)
            )
            if outside:
                names = ", ".join(sorted(accounts_by_id[i].name for i in outside))
                raise ValidationError(f"These hospitals are outside your territory: {names}.")

        total = sum((e.planned_amount_lakhs for e in entries), start=Decimal("0"))
        if submit and total <= 0:
            raise ValidationError("The plan's total must be above zero -- enter an amount for at least one hospital.")
        return total, accounts_by_id

    def _overlap_warnings(
        self, accounts_by_id: dict[uuid.UUID, Account], sbu_id: uuid.UUID, planning_period: str
    ) -> list[PlanWarning]:
        overlaps = self.repository.find_overlaps(list(accounts_by_id), sbu_id, planning_period)
        return [
            PlanWarning(
                kind=PlanWarningKind.SAME_SBU_OVERLAP,
                account_id=account_id,
                account_name=accounts_by_id[account_id].name,
                colleague_name=colleague,
            )
            for account_id, colleague in overlaps
            if account_id in accounts_by_id
        ]

    def _build_warnings(
        self,
        entries: list[PlanAccountEntry],
        accounts_by_id: dict[uuid.UUID, Account],
        target_plan: TargetPlan,
    ) -> list[PlanWarning]:
        """Non-blocking: a rated hospital planned at zero (BR-PL-06 -- High is
        the stronger kind, Medium/Low the milder one, Not rated none), and
        any hospital a same-SBU colleague has also planned this period."""
        warnings = [
            PlanWarning(
                kind=_ZERO_WARNING_BY_POTENTIAL[potential],
                account_id=e.account_id,
                account_name=accounts_by_id[e.account_id].name,
            )
            for e in entries
            if e.planned_amount_lakhs == 0
            and (potential := accounts_by_id[e.account_id].business_potential) in _ZERO_WARNING_BY_POTENTIAL
        ]
        warnings += self._overlap_warnings(accounts_by_id, target_plan.sbu_id, target_plan.planning_period)
        return warnings

    def _replace_accounts(
        self, target_plan: TargetPlan, entries: list[PlanAccountEntry], *, current_user: UserProfile
    ) -> None:
        self.repository.replace_accounts(
            target_plan,
            [(e.account_id, e.planned_amount_lakhs, e.visit_frequency.value, e.strategic_objective) for e in entries],
            user_id=current_user.id,
        )

    @staticmethod
    def _check_no_duplicate_brands(splits: list[BrandSplitEntry]) -> None:
        brand_ids = [s.brand_id for s in splits]
        if len(brand_ids) != len(set(brand_ids)):
            raise ValidationError("Each brand can only appear once in the split.")

    def _apply_brand_splits(
        self, target_plan: TargetPlan, splits: list[BrandSplitEntry] | None, *, submit: bool
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
        if not submit:
            # A draft keeps whatever split has been entered so far, balanced
            # or not (even none) -- the full rule below applies on submit, so
            # an approver never sees an unbalanced split (Basheer, 2026-09-28).
            self._check_no_duplicate_brands(splits or [])
            self.repository.replace_brand_splits(
                target_plan.id, [(s.brand_id, s.split_amount_lakhs) for s in splits or []]
            )
            return
        if not splits:
            raise ValidationError(
                "This SBU has active brands -- a brand split is required and must sum to the target amount."
            )
        self._check_no_duplicate_brands(splits)
        total = sum((s.split_amount_lakhs for s in splits), start=Decimal("0"))
        if total != target_plan.target_amount_lakhs:
            raise ValidationError(
                f"Brand splits must sum to exactly the target amount: "
                f"splits total {total}, target is {target_plan.target_amount_lakhs}."
            )
        self.repository.replace_brand_splits(
            target_plan.id, [(s.brand_id, s.split_amount_lakhs) for s in splits]
        )

    def create_target_plan(
        self, data: TargetPlanCreate, *, current_user: UserProfile
    ) -> tuple[TargetPlan, list[PlanWarning]]:
        """The target is the SUM of the hospitals' planned amounts. submit=False
        saves a DRAFT that stays private to its owner until submitted."""
        existing = self.repository.get_by_user_sbu_period(
            current_user.id, data.sbu_id, data.planning_period
        )
        if existing:
            raise ConflictError(
                f"You already have a target set for {data.planning_period} in this SBU."
            )
        total, accounts_by_id = self._validate_accounts(data.accounts, current_user=current_user, submit=data.submit)

        target_plan = TargetPlan(
            user_id=current_user.id,
            sbu_id=data.sbu_id,
            planning_period=data.planning_period,
            target_amount_lakhs=total,
            status="PENDING_APPROVAL" if data.submit else "DRAFT",
            created_by=current_user.id,
            updated_by=current_user.id,
        )
        target_plan = self.repository.create(target_plan)
        self._replace_accounts(target_plan, data.accounts, current_user=current_user)
        self._apply_brand_splits(target_plan, data.brand_splits, submit=data.submit)
        return target_plan, self._build_warnings(data.accounts, accounts_by_id, target_plan)

    def update_target_plan(
        self, target_plan_id: uuid.UUID, data: TargetPlanUpdate, *, current_user: UserProfile
    ) -> tuple[TargetPlan, list[PlanWarning]]:
        """Owner revising their own plan (decision #5). A revision to an
        already-decided (APPROVED or REJECTED) target always needs a fresh
        sign-off -- resets status back to PENDING_APPROVAL and clears the
        prior decision, so a corrected plan reappears in the approver's
        queue instead of staying stuck on the old decision. This reset fires
        on every call to this method regardless of which fields actually
        changed, so a hospital- or brand-split-only revision (same total)
        resets approval exactly the same as a total change -- confirmed
        2026-09-23, since the split is part of what the manager approved.

        Drafts (Hospital-Wise Target Planning): editing a DRAFT needs no
        change note, and submit=False keeps it a DRAFT. Once a plan has been
        submitted, every revision needs a change note, and it can't go back
        to DRAFT."""
        target_plan = self.repository.get_by_id(target_plan_id)
        if not target_plan:
            raise NotFoundError(f"Target plan {target_plan_id} not found")
        if target_plan.user_id != current_user.id:
            raise AuthorizationError("You can only revise your own target.")

        was_draft = target_plan.status == "DRAFT"
        change_note = (data.change_note or "").strip() or None
        if not was_draft and not data.submit:
            raise ValidationError("A submitted plan can't be turned back into a draft.")
        if not was_draft and change_note is None:
            raise ValidationError("Please add a short note saying why the plan changed.")
        total, accounts_by_id = self._validate_accounts(data.accounts, current_user=current_user, submit=data.submit)

        # BR-PL-05: remember what the approver last signed off, before the
        # total is overwritten. Only an APPROVED plan sets it -- re-revising a
        # PENDING/REJECTED plan keeps the benchmark from the last approval.
        if target_plan.status == "APPROVED":
            target_plan.previous_approved_total_lakhs = target_plan.target_amount_lakhs
        target_plan.target_amount_lakhs = total
        if change_note is not None:
            target_plan.change_note = change_note
        if data.submit and target_plan.status in ("APPROVED", "REJECTED", "DRAFT"):
            target_plan.status = "PENDING_APPROVAL"
            target_plan.approved_by = None
            target_plan.approved_at = None
            target_plan.decision_note = None
        target_plan.updated_by = current_user.id
        target_plan = self.repository.update(target_plan)
        self._replace_accounts(target_plan, data.accounts, current_user=current_user)
        self._apply_brand_splits(target_plan, data.brand_splits, submit=data.submit)
        return target_plan, self._build_warnings(data.accounts, accounts_by_id, target_plan)

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
        if target_plan.status == "DRAFT":
            raise ValidationError("This plan is still a draft -- it can't be approved or rejected until submitted.")

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
        if status == "APPROVED":
            # BR-PL-05: the new approval is now the benchmark; a rejection
            # keeps the old one for the next revision.
            target_plan.previous_approved_total_lakhs = None
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
