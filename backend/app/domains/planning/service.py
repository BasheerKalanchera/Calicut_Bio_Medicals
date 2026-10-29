import uuid
from dataclasses import dataclass
from datetime import UTC, date, datetime
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import func

from app.core.exceptions import AuthorizationError, ConflictError, NotFoundError, ValidationError
from app.core.periods import period_bounds, quarter_dates, quarter_of, today_ist
from app.domains.account.models import Account
from app.domains.notification.service import NotificationService
from app.domains.organization.models import UserProfile
from app.domains.planning.models import (
    BrandAnnualTarget,
    BrandVendorTarget,
    PersonQuarterTarget,
    SbuSeasonalPattern,
    TargetPlan,
)
from app.domains.planning.repository import (
    SUBMITTED_PLAN_STATUSES,
    AnnualTargetRepository,
    BrandVendorTargetRepository,
    PersonQuarterTargetRepository,
    TargetPlanRepository,
    TargetVsActualRepository,
)
from app.domains.planning.schemas import (
    BrandAnnualTargetQuarter,
    BrandAnnualTargetRow,
    BrandAnnualTargetSet,
    BrandSplitEntry,
    BrandVendorTargetSet,
    PersonQuarterTargetSet,
    PlanAccountEntry,
    PlanWarning,
    PlanWarningKind,
    QuarterState,
    RosterStatus,
    SbuSeasonalPatternSet,
    SbuTargetResponse,
    SeasonalPattern,
    TargetPlanCreate,
    TargetPlanResponse,
    TargetPlanUpdate,
    TargetRosterPerson,
    TargetRosterResponse,
    TargetVsActualBrand,
    TargetVsActualHospital,
    TargetVsActualPerson,
    TargetVsActualResponse,
    TargetVsActualSummaryRow,
    TargetVsActualYearPerson,
    TargetVsActualYearResponse,
    TargetVsActualZone,
    TeamTargetPerson,
    TeamTargetsResponse,
)
from app.domains.reference.models import Brand
from app.domains.reference.repository import BrandRepository

_OVERLAY_ROLES = ("Admin", "General Manager")
# Who may read SBU targets (Annual Target Planning D26, D34) -- matches
# cabio_app_sbu_targets() (migration 0062).
_SBU_TARGET_READ_ROLES = ("Admin", "General Manager", "SBU Manager")

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
    def __init__(
        self,
        repository: TargetPlanRepository,
        brand_repository: BrandRepository,
        notification_service: NotificationService,
    ):
        self.repository = repository
        self.brand_repository = brand_repository
        self.notification_service = notification_service

    def _notify_submitted(self, target_plan: TargetPlan, current_user: UserProfile) -> None:
        """D18: the owner's own manager hears a plan was submitted or revised;
        no one does when the owner has no manager (D69)."""
        approver_id = self.get_approver_id(target_plan.user_id)
        if approver_id is not None:
            self.notification_service.notify_plan_submitted(
                recipient_user_id=approver_id,
                target_plan_id=target_plan.id,
                actor_id=current_user.id,
            )

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

    def check_overlaps(
        self, account_ids: list[uuid.UUID], sbu_id: uuid.UUID, planning_period: str, *, current_user: UserProfile
    ) -> list[PlanWarning]:
        """Live same-SBU overlap check for the plan dialog, before saving.
        Only hospitals the caller could actually plan are checked, so this
        can't be used to find out who covers hospitals outside their own
        territory (/code-review 2026-09-29)."""
        zone_ids = _territory_zone_ids(current_user)
        if zone_ids is not None:
            if not zone_ids:
                return []
            outside = self.repository.account_ids_outside_zones(account_ids, zone_ids)
            account_ids = [i for i in account_ids if i not in outside]
            if not account_ids:
                return []
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
        self,
        target_plan: TargetPlan,
        splits: list[BrandSplitEntry] | None,
        *,
        submit: bool,
        current_user: UserProfile,
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
                target_plan,
                [(s.brand_id, s.split_amount_lakhs) for s in splits or []],
                user_id=current_user.id,
            )
            return
        if not splits:
            raise ValidationError(
                "This SBU has active brands -- a brand split is required and must sum to the plan total."
            )
        self._check_no_duplicate_brands(splits)
        total = sum((s.split_amount_lakhs for s in splits), start=Decimal("0"))
        if total != target_plan.target_amount_lakhs:
            raise ValidationError(
                f"Brand splits must sum to exactly the plan total: "
                f"splits total {total}, plan total is {target_plan.target_amount_lakhs}."
            )
        self.repository.replace_brand_splits(
            target_plan,
            [(s.brand_id, s.split_amount_lakhs) for s in splits],
            user_id=current_user.id,
        )

    def create_target_plan(
        self, data: TargetPlanCreate, *, current_user: UserProfile
    ) -> tuple[TargetPlan, list[PlanWarning]]:
        """The target is the SUM of the hospitals' planned amounts. submit=False
        saves a DRAFT that stays private to its owner until submitted."""
        if current_user.role.role_name not in _OVERLAY_ROLES and data.sbu_id != current_user.sbu_id:
            raise AuthorizationError("You can only set a plan for your own SBU.")
        existing = self.repository.get_by_user_sbu_period(
            current_user.id, data.sbu_id, data.planning_period
        )
        if existing:
            raise ConflictError(
                f"You already have a plan for {data.planning_period} in this SBU."
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
        self._apply_brand_splits(
            target_plan, data.brand_splits, submit=data.submit, current_user=current_user
        )
        if data.submit:
            self._notify_submitted(target_plan, current_user)
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
        target_plan = self.repository.get_by_id_for_update(target_plan_id)
        if not target_plan:
            raise NotFoundError("This plan no longer exists — reload the page.")
        if target_plan.user_id != current_user.id:
            raise AuthorizationError("You can only revise your own plan.")

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
        # Set explicitly (AuditMixin has no onupdate): a hospital-only or
        # split-only revision changes no plan column, but the approver's
        # stale-version check below still has to see it as a new version.
        target_plan.updated_at = func.now()
        target_plan = self.repository.update(target_plan)
        self.repository.db.refresh(target_plan, ["updated_at"])
        self._replace_accounts(target_plan, data.accounts, current_user=current_user)
        self._apply_brand_splits(
            target_plan, data.brand_splits, submit=data.submit, current_user=current_user
        )
        # Every submitted save is waiting for approval, a first submit and a
        # revision alike (D18).
        if data.submit:
            self._notify_submitted(target_plan, current_user)
        return target_plan, self._build_warnings(data.accounts, accounts_by_id, target_plan)

    def approve_or_reject_target_plan(
        self,
        target_plan_id: uuid.UUID,
        *,
        status: str,
        current_user: UserProfile,
        expected_updated_at: datetime,
        note: str | None = None,
    ) -> TargetPlan:
        """Nobody approves their own row, full stop -- not just a GM special
        case. The resolved approver is the owner's own manager
        (get_approver_id); Admin/GM may additionally act as the unrestricted
        overlay tier used everywhere else in this app, but never on their own
        target. Since get_approver_id returns None for whoever sits at the
        top of the chain (no manager_id), the only path left to approve that
        person's target is another Admin/GM user who isn't them -- in
        practice, the separate Admin account.

        The approver decides only on the version they were shown, and only
        while it's waiting for approval (BR-PL-08, /code-review 2026-09-29):
        `expected_updated_at` is the plan's updated_at as the approver's
        screen loaded it; if the rep has saved since, this refuses with a
        409 so the screen can reload the latest version."""
        target_plan = self.repository.get_by_id_for_update(target_plan_id)
        if not target_plan:
            raise NotFoundError("This plan no longer exists — reload the page.")
        if target_plan.status == "DRAFT":
            raise ValidationError("This plan is still a draft -- it can't be approved or rejected until submitted.")

        is_self = current_user.id == target_plan.user_id
        is_resolved_approver = current_user.id == self.get_approver_id(target_plan.user_id)
        is_overlay_override = current_user.role.role_name in _OVERLAY_ROLES and not is_self

        if is_self or not (is_resolved_approver or is_overlay_override):
            raise AuthorizationError(
                "You aren't authorized to approve or reject this plan."
            )
        if target_plan.status != "PENDING_APPROVAL":
            raise ConflictError(
                "This plan is no longer waiting for approval — it has already been decided. "
                "Please check the latest version below."
            )
        if target_plan.updated_at != expected_updated_at:
            raise ConflictError(
                "The rep changed this plan while you were reviewing it. "
                "Please check the latest version below and review again."
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
        target_plan = self.repository.update(target_plan)
        # D19: the owner hears the decision; the note stays on the plan screen.
        self.notification_service.notify_plan_decided(
            recipient_user_id=target_plan.user_id,
            target_plan_id=target_plan.id,
            actor_id=current_user.id,
            approved=status == "APPROVED",
        )
        return target_plan

    def delete_target_plan(self, target_plan_id: uuid.UUID, *, current_user: UserProfile) -> None:
        target_plan = self.repository.get_by_id(target_plan_id)
        if not target_plan:
            raise NotFoundError("This plan no longer exists — reload the page.")
        if target_plan.user_id != current_user.id and current_user.role.role_name not in _OVERLAY_ROLES:
            raise AuthorizationError("You can only delete your own plan.")
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
        """One brand quarter typed by hand (D70): upsert, marked so that
        working the brand's year out again leaves it alone (D71). Only from
        the quarter in progress on (D46a, D51)."""
        _require_admin_or_gm(current_user)
        if quarter_locked(data.planning_period):
            raise ValidationError("That quarter has ended, so its target can't be changed.")
        existing = self.repository.get_by_brand_period(data.brand_id, data.planning_period)
        if existing:
            existing.vendor_target_amount_lakhs = data.vendor_target_amount_lakhs
            existing.set_by_hand = True
            existing.updated_by = current_user.id
            return self.repository.update(existing)

        vendor_target = BrandVendorTarget(
            brand_id=data.brand_id,
            planning_period=data.planning_period,
            vendor_target_amount_lakhs=data.vendor_target_amount_lakhs,
            set_by_hand=True,
            created_by=current_user.id,
            updated_by=current_user.id,
        )
        return self.repository.create(vendor_target)

    def list_by_period(self, planning_period: str) -> list[BrandVendorTarget]:
        return self.repository.list_by_period(planning_period)


_ZERO = Decimal("0")
_CENT = Decimal("0.01")


def _percent_of_target(won: Decimal, target: Decimal | None) -> Decimal | None:
    return (won / target * 100).quantize(_CENT) if target else None


@dataclass
class _RosterEntry:
    """One person's plan status for a quarter, and what of it counts."""

    user_id: uuid.UUID
    display_name: str
    # False for a plan owner outside the roster (another SBU's person, someone
    # since deactivated): no row, but their plan still counts in the totals.
    on_roster: bool
    status: RosterStatus = RosterStatus.NOT_STARTED
    plan: TargetPlan | None = None
    counted: Decimal = _ZERO
    # Rejected revision counted at its last approved total (BR-PL-05).
    approved_fallback: bool = False

    @property
    def submitted(self) -> bool:
        return self.status in SUBMITTED_PLAN_STATUSES or self.approved_fallback


def _not_submitted(roster: list[_RosterEntry]) -> int:
    """The N in "N of M haven't submitted" -- one definition for both screens."""
    return sum(1 for e in roster if e.on_roster and not e.submitted)


def _build_roster(
    repo: TargetVsActualRepository, current_user: UserProfile, sbu_id: uuid.UUID, planning_period: str
) -> list[_RosterEntry]:
    """Who is on the quarter's roster and what each plan counts for. Shared by
    Target vs Actuals and the Target Planning roster so the two screens list
    the same people, statuses and totals (Target-Coverage-Roster plan)."""
    entries: dict[uuid.UUID, _RosterEntry] = {}
    for user_id, name in repo.roster(current_user, sbu_id):
        entries[user_id] = _RosterEntry(user_id, name, on_roster=True)
    for plan in repo.list_plans(current_user, sbu_id, planning_period):
        entry = entries.get(plan.user_id)
        if entry is None:
            entry = entries[plan.user_id] = _RosterEntry(plan.user_id, plan.user.display_name, on_roster=False)
        entry.status = RosterStatus(plan.status)
        entry.plan = plan
        if entry.status is RosterStatus.REJECTED and plan.previous_approved_total_lakhs is not None:
            # BR-PL-05: a rejected revision of an approved plan leaves the
            # last approved total as the goal.
            entry.counted = plan.previous_approved_total_lakhs
            entry.approved_fallback = True
        elif entry.status in SUBMITTED_PLAN_STATUSES:
            entry.counted = plan.target_amount_lakhs
    return list(entries.values())


class _PersonAcc:
    """Running figures for one person while the response is assembled."""

    def __init__(self, user_id: uuid.UUID, display_name: str):
        self.user_id = user_id
        self.display_name = display_name
        self.plan_status = RosterStatus.NOT_STARTED
        self.previous_approved_total: Decimal | None = None
        # Rejected revision counted at its last approved total (BR-PL-05).
        self.approved_fallback = False
        self.po_received = _ZERO
        self.no_po_date = 0
        # The plan's saved total. Plans saved before hospital-wise planning
        # carry a total (and brand splits) with no hospital lines, so this
        # can exceed the sum of the hospitals; the difference is `unassigned`.
        self.plan_total = _ZERO
        self.hospitals: dict[uuid.UUID, list] = {}  # account_id -> [name, planned, won]
        self.unplanned_won = _ZERO
        self.brands: dict[uuid.UUID, list] = {}  # brand_id -> [name, planned, won]
        self.expected: Decimal | None = None
        self.undated = 0

    @property
    def hospital_planned(self) -> Decimal:
        return sum((h[1] for h in self.hospitals.values()), _ZERO)

    @property
    def unassigned(self) -> Decimal:
        """Planned amount not tied to any hospital (legacy plans)."""
        return max(self.plan_total - self.hospital_planned, _ZERO)

    @property
    def planned(self) -> Decimal:
        return self.hospital_planned + self.unassigned

    @property
    def won(self) -> Decimal:
        return sum((h[2] for h in self.hospitals.values()), _ZERO) + self.unplanned_won


class SbuTargetService:
    """The SBU's quarterly target: its brands' quarterly total, never typed
    (Annual Target Planning D47, D53, D55). Admin, GM and the SBU's own SBU
    Manager see it (D26); Area Managers no longer do (D34)."""

    def __init__(self, repository: TargetVsActualRepository):
        self.repository = repository

    def list_by_period(self, planning_period: str, *, current_user: UserProfile) -> list[SbuTargetResponse]:
        role_name = current_user.role.role_name
        if role_name not in _SBU_TARGET_READ_ROLES:
            raise AuthorizationError("Only SBU Managers and above may see SBU targets.")
        targets = self.repository.active_sbu_targets(planning_period)
        return [
            SbuTargetResponse(sbu_id=sbu_id, planning_period=planning_period, target_amount_lakhs=amount)
            for sbu_id, amount in targets.items()
            if role_name in _OVERLAY_ROLES or sbu_id == current_user.sbu_id
        ]


# --- Annual Target Planning Part 1 -----------------------------------------

# D46a, D38: brand quarters are worked out and saved from Oct-Dec 2026 on;
# earlier quarters keep the figures typed in by hand.
FIRST_SAVED_PERIOD = "2026-Q3"


def quarter_locked(planning_period: str) -> bool:
    """A brand quarter before 2026-Q3 (D46a) or already ended (D51): never
    worked out again, and can't be typed by hand (D70)."""
    return planning_period < FIRST_SAVED_PERIOD or quarter_dates(planning_period)[1] < today_ist()


def brand_year_quarters(year_start_month: int, start_year: int) -> list[tuple[int, str]]:
    """The four quarters of a brand year, in order, as (calendar quarter's
    first month, Cabio period). Each brand quarter is exactly one Cabio
    quarter, as brand years start in Jan, Apr, Jul or Oct only (D40)."""
    quarters = []
    year, month = start_year, year_start_month
    for _ in range(4):
        quarters.append((month, quarter_of(date(year, month, 1))))
        year, month = (year + 1, month - 9) if month == 10 else (year, month + 3)
    return quarters


def stretched_amount(vendor_amount: Decimal, stretch_pct: Decimal) -> Decimal:
    """The brand's own figure plus Cabio's stretch on it (D24)."""
    return (vendor_amount * (1 + stretch_pct / 100)).quantize(_CENT, rounding=ROUND_HALF_UP)


def split_brand_year(stretched: Decimal, pct_by_month: dict[int, Decimal], months: list[int]) -> list[Decimal]:
    """Spread a stretched brand year over its quarters by the seasonal
    pattern (D25, D41), rounded to paise; the last quarter with a share
    takes the rounding remainder, so the quarters add back to the year."""
    amounts = [(stretched * pct_by_month[m] / 100).quantize(_CENT, rounding=ROUND_HALF_UP) for m in months]
    last = max((i for i, m in enumerate(months) if pct_by_month[m] > 0), default=len(months) - 1)
    amounts[last] = stretched - sum(a for i, a in enumerate(amounts) if i != last)
    return amounts


def _own_pattern(annual: BrandAnnualTarget | None) -> SeasonalPattern | None:
    if annual is None or annual.pct_jan_mar is None:
        return None
    return SeasonalPattern(
        pct_jan_mar=annual.pct_jan_mar,
        pct_apr_jun=annual.pct_apr_jun,
        pct_jul_sep=annual.pct_jul_sep,
        pct_oct_dec=annual.pct_oct_dec,
    )


def _sbu_pattern(pattern: SbuSeasonalPattern | None) -> SeasonalPattern | None:
    return None if pattern is None else SeasonalPattern.model_validate(pattern, from_attributes=True)


class AnnualTargetService:
    """Brand yearly figures, stretch and seasonal split, saved as the brand's
    quarterly targets (D23-D25, D40, D46, D46a, D50, D51). Admin/GM only."""

    def __init__(self, repository: AnnualTargetRepository):
        self.repository = repository

    def set_year_start(self, brand_id: uuid.UUID, year_start_month: int, *, current_user: UserProfile) -> Brand:
        _require_admin_or_gm(current_user)
        brand = self.repository.get_brand(brand_id)
        if brand is None:
            raise NotFoundError("Brand not found.")
        if year_start_month != brand.year_start_month and self.repository.brand_has_annual(brand_id):
            # Its saved quarters were worked out from the old start month.
            raise ConflictError("This brand already has a yearly figure; its year start can't be changed now.")
        brand.year_start_month = year_start_month
        self.repository.db.flush()
        return brand

    def list_annual(
        self, sbu_id: uuid.UUID, calendar_year: int, *, current_user: UserProfile
    ) -> list[BrandAnnualTargetRow]:
        """Each active brand's year starting in calendar_year (D43)."""
        _require_admin_or_gm(current_user)
        brands = self.repository.list_active_brands(sbu_id)
        annual_by_brand = {a.brand_id: a for a in self.repository.list_annual(sbu_id, calendar_year)}
        sbu_pattern = _sbu_pattern(self.repository.get_pattern(sbu_id, calendar_year))
        quarters_by_brand = {b.id: brand_year_quarters(b.year_start_month, calendar_year) for b in brands}
        saved = self.repository.vendor_targets(
            [b.id for b in brands], sorted({p for qs in quarters_by_brand.values() for _, p in qs})
        )
        with_annual = self.repository.brands_with_annual([b.id for b in brands])
        return [
            self._row(
                b,
                calendar_year,
                annual_by_brand.get(b.id),
                sbu_pattern,
                quarters_by_brand[b.id],
                saved,
                has_any_annual=b.id in with_annual,
            )
            for b in brands
        ]

    def set_annual(self, data: BrandAnnualTargetSet, *, current_user: UserProfile) -> BrandAnnualTargetRow:
        _require_admin_or_gm(current_user)
        brand = self.repository.get_brand(data.brand_id)
        if brand is None:
            raise NotFoundError("Brand not found.")
        sbu_pattern = _sbu_pattern(self.repository.get_pattern(brand.sbu_id, data.start_year))
        if data.pattern is None and sbu_pattern is None:
            raise ValidationError(
                f"Set the SBU's seasonal pattern for {data.start_year} first, or give this brand its own."
            )
        own = data.pattern.by_month() if data.pattern else dict.fromkeys((1, 4, 7, 10))
        annual = self.repository.get_annual(data.brand_id, data.start_year)
        if annual is None:
            annual = BrandAnnualTarget(brand_id=data.brand_id, start_year=data.start_year, created_by=current_user.id)
            self.repository.db.add(annual)
        annual.vendor_amount_lakhs = data.vendor_amount_lakhs
        annual.stretch_pct = data.stretch_pct
        annual.pct_jan_mar, annual.pct_apr_jun, annual.pct_jul_sep, annual.pct_oct_dec = (
            own[1], own[4], own[7], own[10]
        )
        annual.updated_by = current_user.id
        self.repository.db.flush()

        quarters = brand_year_quarters(brand.year_start_month, data.start_year)
        self._save_quarters(annual, quarters, data.pattern or sbu_pattern, current_user)
        saved = self.repository.vendor_targets([brand.id], [p for _, p in quarters])
        return self._row(brand, data.start_year, annual, sbu_pattern, quarters, saved, has_any_annual=True)

    def get_pattern(self, sbu_id: uuid.UUID, year: int, *, current_user: UserProfile) -> SbuSeasonalPattern | None:
        _require_admin_or_gm(current_user)
        return self.repository.get_pattern(sbu_id, year)

    def set_pattern(self, data: SbuSeasonalPatternSet, *, current_user: UserProfile) -> SbuSeasonalPattern:
        """Upsert, then save again the quarters of every brand of that SBU and
        year that follows the SBU's pattern (D50); a brand with its own
        pattern is left alone."""
        _require_admin_or_gm(current_user)
        pattern = self.repository.get_pattern(data.sbu_id, data.year)
        if pattern is None:
            pattern = SbuSeasonalPattern(sbu_id=data.sbu_id, year=data.year, created_by=current_user.id)
            self.repository.db.add(pattern)
        pattern.pct_jan_mar, pattern.pct_apr_jun = data.pct_jan_mar, data.pct_apr_jun
        pattern.pct_jul_sep, pattern.pct_oct_dec = data.pct_jul_sep, data.pct_oct_dec
        pattern.updated_by = current_user.id
        self.repository.db.flush()

        for annual in self.repository.list_following_sbu_pattern(data.sbu_id, data.year):
            brand = self.repository.get_brand(annual.brand_id)
            quarters = brand_year_quarters(brand.year_start_month, annual.start_year)
            self._save_quarters(annual, quarters, data, current_user)
        return pattern

    def _save_quarters(
        self,
        annual: BrandAnnualTarget,
        quarters: list[tuple[int, str]],
        pattern: SeasonalPattern,
        current_user: UserProfile,
    ) -> None:
        """Save the brand's quarters into brand_vendor_target -- only from
        2026-Q3 on (D46a), only quarters not yet ended (D51), and not a
        quarter typed by hand (D71). The others keep their pattern share, so
        the four may no longer add up to the year (D72)."""
        stretched = stretched_amount(annual.vendor_amount_lakhs, annual.stretch_pct)
        amounts = split_brand_year(stretched, pattern.by_month(), [m for m, _ in quarters])
        for (_, period), amount in zip(quarters, amounts, strict=True):
            if quarter_locked(period):
                continue
            existing = self.repository.get_vendor_target(annual.brand_id, period)
            if existing and existing.set_by_hand:
                continue
            if existing:
                existing.vendor_target_amount_lakhs = amount
                existing.updated_by = current_user.id
            else:
                self.repository.db.add(
                    BrandVendorTarget(
                        brand_id=annual.brand_id,
                        planning_period=period,
                        vendor_target_amount_lakhs=amount,
                        created_by=current_user.id,
                        updated_by=current_user.id,
                    )
                )
        self.repository.db.flush()

    @staticmethod
    def _row(
        brand: Brand,
        start_year: int,
        annual: BrandAnnualTarget | None,
        sbu_pattern: SeasonalPattern | None,
        quarters: list[tuple[int, str]],
        saved: dict[tuple[uuid.UUID, str], tuple[Decimal, bool]],
        *,
        has_any_annual: bool,
    ) -> BrandAnnualTargetRow:
        own = _own_pattern(annual)
        months = [m for m, _ in quarters]
        # Brands Billing to Cabio: the brand's own figure split evenly (D54, D68).
        billing = (
            split_brand_year(annual.vendor_amount_lakhs, dict.fromkeys(months, Decimal("25")), months)
            if annual
            else [None] * len(quarters)
        )
        return BrandAnnualTargetRow(
            brand_id=brand.id,
            brand_name=brand.name,
            sbu_id=brand.sbu_id,
            year_start_month=brand.year_start_month,
            has_any_annual=has_any_annual,
            start_year=start_year,
            vendor_amount_lakhs=annual.vendor_amount_lakhs if annual else None,
            stretch_pct=annual.stretch_pct if annual else None,
            stretched_lakhs=stretched_amount(annual.vendor_amount_lakhs, annual.stretch_pct) if annual else None,
            own_pattern=own,
            effective_pattern=own or sbu_pattern,
            quarters=[
                BrandAnnualTargetQuarter(
                    planning_period=p,
                    saved_lakhs=saved[(brand.id, p)][0] if (brand.id, p) in saved else None,
                    set_by_hand=saved[(brand.id, p)][1] if (brand.id, p) in saved else False,
                    locked=quarter_locked(p),
                    billing_lakhs=bill,
                )
                for (_, p), bill in zip(quarters, billing, strict=True)
            ],
        )


class PersonTargetService:
    """Per-person quarterly targets (D30, D32, D33, D45, D57): set by the
    person's direct manager (the reporting line plan approvals use), Admin
    or GM; seen by the person, those above them, Admin and GM (RLS)."""

    def __init__(self, repository: PersonQuarterTargetRepository, sbu_target_repository: TargetVsActualRepository):
        self.repository = repository
        self.sbu_target_repository = sbu_target_repository

    def get_team_targets(
        self, sbu_id: uuid.UUID, planning_period: str, *, current_user: UserProfile
    ) -> TeamTargetsResponse:
        is_overlay = current_user.role.role_name in _OVERLAY_ROLES
        own = None
        if not is_overlay:
            own_row = self.repository.get_target(current_user.id, sbu_id, planning_period)
            own = own_row.target_amount_lakhs if own_row else None
        reports = (
            self.repository.sbu_top_people(sbu_id)
            if is_overlay
            else self.repository.direct_reports(current_user.id, sbu_id)
        )
        targets = self.repository.targets_for([r.id for r in reports], sbu_id, planning_period)
        # Admin/GM divide the SBU target itself; everyone else divides their
        # own figure (D33, D57).
        compare_to = (
            self.sbu_target_repository.active_sbu_targets(planning_period).get(sbu_id) if is_overlay else own
        )
        return TeamTargetsResponse(
            planning_period=planning_period,
            sbu_id=sbu_id,
            own_target_lakhs=own,
            reports=[
                TeamTargetPerson(
                    user_id=r.id,
                    display_name=r.display_name,
                    role_name=r.role.role_name if r.role else None,
                    target_lakhs=targets.get(r.id),
                )
                for r in reports
            ],
            reports_total_lakhs=sum(targets.values(), _ZERO),
            compare_to_lakhs=compare_to,
        )

    def _settable_person(self, user_id: uuid.UUID, current_user: UserProfile) -> UserProfile:
        person = self.repository.get_user(user_id)
        if person is None:
            raise NotFoundError("Person not found.")
        if person.id == current_user.id:
            raise AuthorizationError("Your own target is set by the person you report to.")
        # The same reporting line plan approvals use (get_approver_id, D45).
        if person.manager_id != current_user.id and current_user.role.role_name not in _OVERLAY_ROLES:
            raise AuthorizationError("Only the person's manager, Admin or GM may set their target.")
        if person.sbu_id is None:
            raise ValidationError("This person has no SBU, so they can't be given a target.")
        return person

    def set_target(self, data: PersonQuarterTargetSet, *, current_user: UserProfile) -> PersonQuarterTarget:
        """Upsert. The SBU is the person's own."""
        person = self._settable_person(data.user_id, current_user)
        existing = self.repository.get_target(person.id, person.sbu_id, data.planning_period)
        if existing:
            existing.target_amount_lakhs = data.target_amount_lakhs
            existing.set_by = current_user.id
            existing.updated_by = current_user.id
            return self.repository.update(existing)
        return self.repository.create(
            PersonQuarterTarget(
                user_id=person.id,
                sbu_id=person.sbu_id,
                planning_period=data.planning_period,
                target_amount_lakhs=data.target_amount_lakhs,
                set_by=current_user.id,
                created_by=current_user.id,
                updated_by=current_user.id,
            )
        )

    def remove_target(self, user_id: uuid.UUID, planning_period: str, *, current_user: UserProfile) -> None:
        """Back to "Not set" (D74): the same people who may set it. The audit
        trigger keeps the removed figure."""
        person = self._settable_person(user_id, current_user)
        existing = self.repository.get_target(person.id, person.sbu_id, planning_period)
        if existing is None:
            raise NotFoundError("This person has no target for that quarter.")
        self.repository.delete(existing)


class TargetVsActualService:
    """Target vs Actuals for one SBU and quarter (Plan vs Actuals Tracking
    plan). Read-only. Every roster member gets a row; "Won" (paid, BR-OP-17)
    and "PO received" are credited to each split participant by their share,
    or to the owner when there is no split (BR-FIN-09), each in its own
    quarter; "expected" is ACTIVE Opportunities weighted by win probability
    and then by share, by expected closing date; what counts as expected
    depends on where the quarter sits relative to today (IST). The SBU and
    company rows count each Opportunity once, at full value."""

    def __init__(self, repository: TargetVsActualRepository):
        self.repository = repository

    def get_target_vs_actual(
        self, sbu_id: uuid.UUID, planning_period: str, *, current_user: UserProfile, detail: bool = True
    ) -> TargetVsActualResponse:
        """detail=False is the Year view's per-quarter pass: it skips what
        that view doesn't show -- Expected, undated counts, zones and brand
        wins -- so those come back empty."""
        today = today_ist()
        q_start, q_end = quarter_dates(planning_period)
        if today > q_end:
            state = QuarterState.PAST
        elif today < q_start:
            state = QuarterState.FUTURE
        else:
            state = QuarterState.CURRENT
        start_dt, end_dt = period_bounds(q_start, q_end)

        repo = self.repository
        people: dict[uuid.UUID, _PersonAcc] = {}

        def person(user_id: uuid.UUID, name: str) -> _PersonAcc:
            if user_id not in people:
                people[user_id] = _PersonAcc(user_id, name)
            return people[user_id]

        roster = _build_roster(repo, current_user, sbu_id, planning_period)
        roster_ids = {e.user_id for e in roster if e.on_roster}
        brand_names: dict[uuid.UUID, str] = {}
        for entry in roster:
            acc = person(entry.user_id, entry.display_name)
            acc.plan_status = entry.status
            acc.plan_total = entry.counted
            acc.approved_fallback = entry.approved_fallback
            plan = entry.plan
            if plan is None:
                continue
            acc.previous_approved_total = plan.previous_approved_total_lakhs
            if entry.approved_fallback or entry.status not in SUBMITTED_PLAN_STATUSES:
                # Only a rejected revision's last approved total survives --
                # the hospitals and brands on file are the rejected revision's.
                # Draft and rejected plans don't count, and their figures are
                # never shown: a manager sees only "Draft" on someone's draft.
                continue
            for pa in plan.accounts:
                acc.hospitals[pa.account_id] = [pa.account.name, pa.planned_amount_lakhs, _ZERO]
            for split in plan.brand_splits:
                brand_names[split.brand_id] = split.brand.name
                acc.brands[split.brand_id] = [split.brand.name, split.split_amount_lakhs, _ZERO]

        # Zone planned figures: by the hospital's zone, not the planner's.
        planned_account_ids = {a for p in people.values() for a in p.hospitals}
        zone_of = repo.zone_of_accounts(list(planned_account_ids)) if detail else {}
        zones: dict[tuple[uuid.UUID | None, str | None], list[Decimal]] = {}  # key -> [planned, won]
        for p in people.values():
            for account_id, h in p.hospitals.items():
                zones.setdefault(zone_of.get(account_id, (None, None)), [_ZERO, _ZERO])[0] += h[1]
            if p.unassigned:  # no hospital, so no zone
                zones.setdefault((None, None), [_ZERO, _ZERO])[0] += p.unassigned

        # BR-FIN-09: each figure below is the person's share of a shared
        # Opportunity, unrounded until the response so that the zone, brand
        # and headline totals add back to the full values.
        for user_id, name, account_id, zone_id, zone_name, amount in repo.won_by_person_account(
            current_user, sbu_id, start_dt, end_dt
        ):
            acc = person(user_id, name)
            if account_id in acc.hospitals:
                acc.hospitals[account_id][2] += amount
            else:
                acc.unplanned_won += amount
            zones.setdefault((zone_id, zone_name), [_ZERO, _ZERO])[1] += amount

        brand_wins = repo.won_by_person_brand(current_user, sbu_id, start_dt, end_dt) if detail else []
        for user_id, brand_id, brand_name, amount in brand_wins:
            brand_names[brand_id] = brand_name
            acc = people.get(user_id)
            if acc is None:
                continue  # added above if they have wins; guard anyway
            acc.brands.setdefault(brand_id, [brand_name, _ZERO, _ZERO])[2] += amount

        for user_id, name, amount in repo.po_received_by_person(current_user, sbu_id, q_start, q_end):
            person(user_id, name).po_received += amount
        for owner_id, owner_name, count in repo.no_po_date_counts(
            current_user, sbu_id, start_dt, end_dt, include_open=state is QuarterState.CURRENT
        ):
            person(owner_id, owner_name).no_po_date = count

        if detail and state is not QuarterState.PAST:
            closing_from = q_start if state is QuarterState.FUTURE else None
            for user_id, name, amount in repo.expected_by_person(current_user, sbu_id, closing_from, q_end):
                person(user_id, name).expected = amount
            # Owner only: fixing a missing date is the owner's job.
            for owner_id, owner_name, count in repo.undated_counts(current_user, sbu_id):
                person(owner_id, owner_name).undated = count
        ordered = sorted(people.values(), key=lambda p: p.display_name.lower())
        person_targets = repo.person_targets(sbu_id, planning_period)
        managers = repo.managers_of([p.user_id for p in ordered])
        rows = [
            self._person_response(p, state, person_targets.get(p.user_id), managers.get(p.user_id))
            for p in ordered
        ]
        # Totals count every credited person, so real wins by someone outside
        # the roster (another SBU's person, someone since deactivated) stay in
        # the headline and zone/brand tables; only the person rows follow the
        # roster. Summed before rounding, so shares add back to full values.
        shown = [r for p, r in zip(ordered, rows, strict=True) if p.user_id in roster_ids]
        not_submitted = _not_submitted(roster)
        planned = sum((r.planned_lakhs for r in rows), _ZERO)
        po_received = sum((p.po_received for p in people.values()), _ZERO).quantize(_CENT)
        won = sum((p.won for p in people.values()), _ZERO).quantize(_CENT)
        expected = (
            None
            if state is QuarterState.PAST
            else sum((p.expected or _ZERO for p in people.values()), _ZERO).quantize(_CENT)
        )

        sbu_row = company_row = team_row = None
        role_name = current_user.role.role_name
        if role_name == "Area Manager" and current_user.sbu_id == sbu_id:
            # The team's own totals (the headline) against the Area Manager's
            # own target (Annual Target Planning D49) -- they no longer see
            # the SBU target (D34). No SBU-wide figures for this role.
            target = person_targets.get(current_user.id)
            team_row = TargetVsActualSummaryRow(
                target_lakhs=target,
                planned_lakhs=planned,
                po_received_lakhs=po_received,
                won_lakhs=won,
                percent_of_target=_percent_of_target(won, target),
            )
        elif role_name in _OVERLAY_ROLES or (role_name == "SBU Manager" and current_user.sbu_id == sbu_id):
            targets = repo.active_sbu_targets(planning_period)
            target = targets.get(sbu_id)
            # SBU-wide, not the caller's team: the SBU Manager and the GM are
            # measured against one target, so they must see the same figures
            # (code review 2026-10-06 -- the GM's own sales were missing).
            s_planned, s_po_received, s_won = repo.summary_totals(
                planning_period, q_start, q_end, start_dt, end_dt, sbu_id=sbu_id
            )
            sbu_row = TargetVsActualSummaryRow(
                target_lakhs=target,
                planned_lakhs=s_planned,
                po_received_lakhs=s_po_received,
                won_lakhs=s_won,
                percent_of_target=_percent_of_target(s_won, target),
            )
            if role_name in _OVERLAY_ROLES:
                c_planned, c_po_received, c_won = repo.summary_totals(
                    planning_period, q_start, q_end, start_dt, end_dt, sbu_id=None
                )
                # Company target = sum of the active SBUs' targets; a partial
                # sum would read as a real target, so it waits until every
                # active SBU has one.
                set_targets = [v for v in targets.values() if v is not None]
                c_target = sum(set_targets, _ZERO) if targets and len(set_targets) == len(targets) else None
                company_row = TargetVsActualSummaryRow(
                    target_lakhs=c_target,
                    planned_lakhs=c_planned,
                    po_received_lakhs=c_po_received,
                    won_lakhs=c_won,
                    percent_of_target=_percent_of_target(c_won, c_target),
                )
        brand_totals: dict[uuid.UUID, list[Decimal]] = {}
        for p in people.values():
            for brand_id, (_, b_planned, b_won) in p.brands.items():
                totals = brand_totals.setdefault(brand_id, [_ZERO, _ZERO])
                totals[0] += b_planned
                totals[1] += b_won
        return TargetVsActualResponse(
            sbu_id=sbu_id,
            planning_period=planning_period,
            quarter_state=state,
            as_of=today,
            planned_lakhs=planned,
            po_received_lakhs=po_received,
            won_lakhs=won,
            expected_lakhs=expected,
            likely_finish_lakhs=won + (expected or _ZERO),
            percent_of_target=_percent_of_target(won, planned),
            no_po_date_count=sum(p.no_po_date for p in people.values()),
            roster_count=len(roster_ids),
            not_submitted_count=not_submitted,
            sbu_row=sbu_row,
            company_row=company_row,
            team_row=team_row,
            people=shown,
            zones=[
                TargetVsActualZone(zone_id=zid, zone_name=zname, planned_lakhs=v[0], won_lakhs=v[1].quantize(_CENT))
                for (zid, zname), v in sorted(zones.items(), key=lambda kv: (kv[0][1] is None, kv[0][1] or ""))
            ]
            if detail
            else [],
            brands=[
                TargetVsActualBrand(
                    brand_id=bid, brand_name=brand_names[bid], planned_lakhs=v[0], won_lakhs=v[1].quantize(_CENT)
                )
                for bid, v in sorted(brand_totals.items(), key=lambda kv: brand_names[kv[0]].lower())
            ],
        )

    def get_target_vs_actual_year(
        self, sbu_id: uuid.UUID, fiscal_year: int, *, current_user: UserProfile
    ) -> TargetVsActualYearResponse:
        """Target vs Actuals for a fiscal year (Target vs Actuals Redesign D2,
        D6; Annual Target Planning D66, D81): the quarter view run once per
        counted quarter (from Oct-Dec 2026 for FY 2026-27, D66) and added up.
        Everything is "so far": the counted quarters up to the one we are in."""
        today = today_ist()
        periods = [f"{fiscal_year}-Q{n}" for n in range(1, 5)]
        # Periods are "YYYY-Qn", so they sort as text.
        counted = [p for p in periods if p >= FIRST_SAVED_PERIOD]
        starts_on = quarter_dates(periods[0])[0]
        if today < starts_on:
            # D6: nothing to show yet; the screen says when the year starts.
            return TargetVsActualYearResponse(
                sbu_id=sbu_id,
                fiscal_year=fiscal_year,
                as_of=today,
                not_started=True,
                starts_on=starts_on,
                first_counted_period=counted[0] if counted else None,
                won_lakhs=_ZERO,
                sbu_row=None,
                company_row=None,
                team_row=None,
                people=[],
            )
        by_period = {p: self.get_target_vs_actual(sbu_id, p, current_user=current_user, detail=False) for p in counted}
        so_far = [r for r in by_period.values() if r.quarter_state is not QuarterState.FUTURE]

        def total(values) -> Decimal:
            return sum(values, _ZERO)

        def target_total(targets) -> Decimal | None:
            # D81: a quarter so far without a target leaves the total unset;
            # a partial sum would read as a real target.
            targets = list(targets)
            return total(targets) if targets and None not in targets else None

        def summary(pick) -> TargetVsActualSummaryRow | None:
            rows = [pick(r) for r in so_far]
            if not rows or rows[0] is None:
                return None
            target = target_total(r.target_lakhs for r in rows)
            won = total(r.won_lakhs for r in rows)
            return TargetVsActualSummaryRow(
                target_lakhs=target,
                planned_lakhs=total(r.planned_lakhs for r in rows),
                po_received_lakhs=total(r.po_received_lakhs for r in rows),
                won_lakhs=won,
                percent_of_target=_percent_of_target(won, target),
            )

        # D2: a person's row is their year so far -- target and Won for the
        # counted quarters up to the one we are in.
        names: dict[uuid.UUID, tuple[str, uuid.UUID | None]] = {}
        quarter_rows: dict[uuid.UUID, dict[str, TargetVsActualPerson]] = {}
        for p, r in by_period.items():
            for row in r.people:
                names[row.user_id] = (row.display_name, row.manager_id)  # latest quarter's line manager
                quarter_rows.setdefault(row.user_id, {})[p] = row
        people = []
        for user_id, (name, manager_id) in sorted(names.items(), key=lambda kv: kv[1][0].lower()):
            own = quarter_rows[user_id]
            target_run: Decimal | None = None
            target_gap = False
            won_run = _ZERO
            for p in counted:
                row = own.get(p)
                if row is None or by_period[p].quarter_state is QuarterState.FUTURE:
                    continue
                if row.target_lakhs is None:
                    target_gap = True  # D81: a partial sum would read as a real target
                else:
                    target_run = (target_run or _ZERO) + row.target_lakhs
                won_run += row.won_lakhs
            target_so_far = None if target_gap else target_run
            people.append(
                TargetVsActualYearPerson(
                    user_id=user_id,
                    display_name=name,
                    manager_id=manager_id,
                    target_lakhs=target_so_far,
                    won_lakhs=won_run,
                    percent_of_target=_percent_of_target(won_run, target_so_far),
                )
            )

        return TargetVsActualYearResponse(
            sbu_id=sbu_id,
            fiscal_year=fiscal_year,
            as_of=today,
            not_started=False,
            starts_on=starts_on,
            first_counted_period=counted[0] if counted else None,
            won_lakhs=total(r.won_lakhs for r in so_far),
            sbu_row=summary(lambda r: r.sbu_row),
            company_row=summary(lambda r: r.company_row),
            team_row=summary(lambda r: r.team_row),
            people=people,
        )

    def get_roster(self, sbu_id: uuid.UUID, planning_period: str, *, current_user: UserProfile) -> TargetRosterResponse:
        """Target Planning's quarter roster: everyone Target vs Actuals lists,
        with their plan where the caller may see it, and the same total.
        Plan owners no longer on the team (moved SBU, deactivated) follow as
        on_team=False rows, so the rows explain the total and their plans can
        still be opened (code review 2026-10-06, Basheer)."""
        roster = _build_roster(self.repository, current_user, sbu_id, planning_period)
        managers = self.repository.managers_of([e.user_id for e in roster])
        rows = []
        # Team members first, then former members; each group by name.
        for e in sorted(roster, key=lambda e: (not e.on_roster, e.display_name.lower())):
            # Drafts are private to their owner: a manager sees only "Draft".
            visible = e.plan is not None and (e.status is not RosterStatus.DRAFT or e.user_id == current_user.id)
            if not e.on_roster and not visible:
                # A former member's private draft: counts nothing, shows nothing.
                continue
            rows.append(
                TargetRosterPerson(
                    user_id=e.user_id,
                    display_name=e.display_name,
                    manager_id=managers.get(e.user_id),
                    on_team=e.on_roster,
                    plan_status=e.status,
                    counted_lakhs=e.counted,
                    previous_approved_total_lakhs=e.plan.previous_approved_total_lakhs if visible else None,
                    plan=TargetPlanResponse.model_validate(e.plan) if visible else None,
                )
            )
        return TargetRosterResponse(
            sbu_id=sbu_id,
            planning_period=planning_period,
            total_lakhs=sum((e.counted for e in roster), _ZERO),
            roster_count=sum(1 for e in roster if e.on_roster),
            not_submitted_count=_not_submitted(roster),
            people=rows,
        )

    @staticmethod
    def _person_response(
        p: _PersonAcc, state: QuarterState, target: Decimal | None, manager_id: uuid.UUID | None
    ) -> TargetVsActualPerson:
        planned, won = p.planned, p.won.quantize(_CENT)
        expected = None if state is QuarterState.PAST else (p.expected or _ZERO).quantize(_CENT)
        hospitals = [
            TargetVsActualHospital(
                account_id=aid, account_name=h[0], planned_lakhs=h[1], won_lakhs=h[2].quantize(_CENT)
            )
            for aid, h in sorted(p.hospitals.items(), key=lambda kv: kv[1][0].lower())
        ]
        if p.unassigned:
            hospitals.append(
                TargetVsActualHospital(
                    account_id=None,
                    account_name="Last approved plan" if p.approved_fallback else "Not assigned to a hospital",
                    planned_lakhs=p.unassigned,
                    won_lakhs=_ZERO,
                )
            )
        if p.unplanned_won:
            hospitals.append(
                TargetVsActualHospital(
                    account_id=None,
                    account_name="Unplanned",
                    planned_lakhs=_ZERO,
                    won_lakhs=p.unplanned_won.quantize(_CENT),
                )
            )
        return TargetVsActualPerson(
            user_id=p.user_id,
            display_name=p.display_name,
            manager_id=manager_id,
            plan_status=p.plan_status,
            previous_approved_total_lakhs=p.previous_approved_total,
            target_lakhs=target,
            planned_lakhs=planned,
            po_received_lakhs=p.po_received.quantize(_CENT),
            won_lakhs=won,
            expected_lakhs=expected,
            likely_finish_lakhs=won + (expected or _ZERO),
            percent_of_target=_percent_of_target(won, planned),
            undated_opportunity_count=p.undated,
            no_po_date_count=p.no_po_date,
            hospitals=hospitals,
            brands=[
                TargetVsActualBrand(brand_id=bid, brand_name=b[0], planned_lakhs=b[1], won_lakhs=b[2].quantize(_CENT))
                for bid, b in sorted(p.brands.items(), key=lambda kv: kv[1][0].lower())
            ],
        )
