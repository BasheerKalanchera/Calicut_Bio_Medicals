import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import and_, case, delete, func, literal, or_, select, text, union_all
from sqlalchemy.orm import Session, aliased, noload, selectinload

from app.db.base import BaseRepository
from app.domains.account.models import Account
from app.domains.opportunity.models import Opportunity, OpportunityItem, Split
from app.domains.opportunity.validators import DELIVERY_STAGE_ORDER
from app.domains.organization.models import UserProfile
from app.domains.organization.repository import TEAM_SCOPE_BUILDERS, UNRESTRICTED_ROLES
from app.domains.planning.models import (
    BrandAnnualTarget,
    BrandVendorTarget,
    PersonQuarterTarget,
    SbuSeasonalPattern,
    TargetPlan,
    TargetPlanAccount,
    TargetPlanBrandSplit,
)
from app.domains.product.models import Product
from app.domains.reference.models import (
    Brand,
    OpportunityStage,
    OpportunityStatus,
    Role,
    Zone,
    ZoneClosure,
)

# Plans whose figures count in Target vs Actuals (the service also counts a
# rejected revision's last approved total -- BR-PL-05).
SUBMITTED_PLAN_STATUSES = ("PENDING_APPROVAL", "APPROVED")

# The roles that carry a quarterly sales target (Admin/GM's Team targets
# panel). "Sales Staff" is the rep role's name (migration 0008).
TARGET_CARRYING_ROLES = ("SBU Manager", "Area Manager", "Sales Staff")

# Net line value (BR-FIN-03: BUYBACK lines net against PRODUCT lines). Same
# expression as reporting/repository.py's _NET_VALUE.
_NET_VALUE = case(
    (OpportunityItem.line_type == "BUYBACK", -OpportunityItem.extended_value_lakhs),
    else_=OpportunityItem.extended_value_lakhs,
)

# Account has several lazy="select" collections; none are needed for the
# planner's picker or territory checks (same reasoning as
# AccountRepository.list_accounts's noload() list).
_ACCOUNT_NOLOADS = (
    noload(Account.stakeholders),
    noload(Account.projects),
    noload(Account.opportunities),
    noload(Account.activities),
    noload(Account.installed_assets),
    noload(Account.documents),
    noload(Account.child_accounts),
)

# The list endpoints return every plan's hospitals and brand split; load
# them in one query each instead of one per plan (/code-review 2026-09-29).
_PLAN_CHILDREN = (selectinload(TargetPlan.accounts), selectinload(TargetPlan.brand_splits))


class TargetPlanRepository(BaseRepository[TargetPlan]):
    def __init__(self, db: Session):
        super().__init__(TargetPlan, db)

    def get_by_id_for_update(self, target_plan_id: uuid.UUID) -> TargetPlan | None:
        """Row-locked read for approve/reject and revise, so the two can't
        both pass their checks at the same instant (/code-review 2026-09-30).
        `of=TargetPlan` locks only this table's row: the joined `approver`
        is an outer join, which Postgres refuses to lock."""
        stmt = (
            select(TargetPlan)
            .where(TargetPlan.id == target_plan_id)
            .with_for_update(of=TargetPlan)
            .execution_options(populate_existing=True)
        )
        return self.db.scalars(stmt).first()

    def list_by_user(self, user_id: uuid.UUID) -> list[TargetPlan]:
        stmt = (
            select(TargetPlan)
            .options(*_PLAN_CHILDREN)
            .where(TargetPlan.user_id == user_id)
            .order_by(TargetPlan.planning_period)
        )
        return list(self.db.scalars(stmt).all())

    def list_pending_approval_for_approver(
        self, approver_id: uuid.UUID, *, include_orphaned: bool = False
    ) -> list[TargetPlan]:
        """Every PENDING_APPROVAL row whose owner's manager_id is approver_id.

        RLS already narrows what this query can see to what the caller is
        allowed to read -- this just adds the "and it's actually mine to
        approve" filter on top, for the "Needs your approval" screen section.

        `include_orphaned` additionally surfaces rows whose owner has no
        manager at all (manager_id IS NULL -- today, only GM) and isn't the
        caller themselves. Without this, whoever sits at the top of the
        chain has a target that can never appear in *anyone's* approval
        list, including Admin/GM's own overlay-override queue, even though
        approve_or_reject_target_plan already lets that overlay act on it --
        the button to do so just never showed up. Callers pass this only
        when they're actually in the overlay-override tier (see service.py).
        """
        conditions = [UserProfile.manager_id == approver_id]
        if include_orphaned:
            conditions.append(
                (UserProfile.manager_id.is_(None)) & (TargetPlan.user_id != approver_id)
            )
        stmt = (
            select(TargetPlan)
            .options(*_PLAN_CHILDREN)
            .join(UserProfile, UserProfile.id == TargetPlan.user_id)
            .where(or_(*conditions))
            .where(TargetPlan.status == "PENDING_APPROVAL")
            .order_by(TargetPlan.planning_period)
        )
        return list(self.db.scalars(stmt).all())

    def list_by_sbu_and_period(
        self, sbu_id: uuid.UUID, planning_period: str, *, viewer_id: uuid.UUID
    ) -> list[TargetPlan]:
        """Drafts are private to their owner: RLS lets a manager read a
        report's DRAFT row, so it's excluded here except for the viewer's own."""
        stmt = (
            select(TargetPlan)
            .options(*_PLAN_CHILDREN)
            .where(TargetPlan.sbu_id == sbu_id)
            .where(TargetPlan.planning_period == planning_period)
            .where(or_(TargetPlan.status != "DRAFT", TargetPlan.user_id == viewer_id))
            .order_by(TargetPlan.target_amount_lakhs.desc())
        )
        return list(self.db.scalars(stmt).all())

    def get_by_user_sbu_period(
        self, user_id: uuid.UUID, sbu_id: uuid.UUID, planning_period: str
    ) -> TargetPlan | None:
        stmt = (
            select(TargetPlan)
            .where(TargetPlan.user_id == user_id)
            .where(TargetPlan.sbu_id == sbu_id)
            .where(TargetPlan.planning_period == planning_period)
        )
        return self.db.scalars(stmt).first()

    def replace_brand_splits(
        self,
        target_plan: TargetPlan,
        splits: list[tuple[uuid.UUID, Decimal]],
        *,
        user_id: uuid.UUID,
    ) -> None:
        """Diffed against the saved rows (matched by brand): only brands
        that were added, changed or dropped are written, so the audit log
        shows just those and not a fake remove/re-add of every unchanged
        brand (BR-AUD-01, Audit Trail Redesign step 2). Edits and adds
        stamp `user_id` (the audit trigger nulls updated_by otherwise), and
        the plan's `brand_splits` collection is expired afterwards because
        the bulk DELETE bypasses the ORM."""
        existing = {
            row.brand_id: row
            for row in self.db.scalars(
                select(TargetPlanBrandSplit).where(TargetPlanBrandSplit.target_plan_id == target_plan.id)
            ).all()
        }
        wanted = {brand_id: amount for brand_id, amount in splits}

        dropped = [row.id for brand_id, row in existing.items() if brand_id not in wanted]
        if dropped:
            self.db.execute(delete(TargetPlanBrandSplit).where(TargetPlanBrandSplit.id.in_(dropped)))
        for brand_id, amount in wanted.items():
            row = existing.get(brand_id)
            if row is None:
                self.db.add(
                    TargetPlanBrandSplit(
                        target_plan_id=target_plan.id,
                        brand_id=brand_id,
                        split_amount_lakhs=amount,
                        created_by=user_id,
                        updated_by=user_id,
                    )
                )
            elif row.split_amount_lakhs != amount:
                row.split_amount_lakhs = amount
                row.updated_by = user_id
        self.db.flush()
        self.db.expire(target_plan, ["brand_splits"])

    def get_brand_rollups(
        self, brand_ids: list[uuid.UUID], planning_period: str
    ) -> dict[uuid.UUID, Decimal]:
        """SUM of every TargetPlanBrandSplit row per brand for this period,
        across all submitted target_plan statuses (DRAFT excluded: unsubmitted
        and private to their owner), one GROUP BY for every brand at once instead
        of a query per brand (/code-review 2026-09-23). A brand with no
        splits yet is simply absent from the returned dict -- callers treat
        a missing key as zero."""
        stmt = (
            select(TargetPlanBrandSplit.brand_id, func.sum(TargetPlanBrandSplit.split_amount_lakhs))
            .join(TargetPlan, TargetPlan.id == TargetPlanBrandSplit.target_plan_id)
            .where(TargetPlanBrandSplit.brand_id.in_(brand_ids))
            .where(TargetPlan.planning_period == planning_period)
            .where(TargetPlan.status != "DRAFT")
            .group_by(TargetPlanBrandSplit.brand_id)
        )
        return {brand_id: Decimal(total) for brand_id, total in self.db.execute(stmt).all()}


    def replace_accounts(
        self,
        target_plan: TargetPlan,
        entries: list[tuple[uuid.UUID, Decimal, str, str | None]],
        *,
        user_id: uuid.UUID,
    ) -> None:
        """Diffed against the saved rows (matched by hospital), same
        reasoning as replace_brand_splits: only added, changed or dropped
        hospitals are written. The bulk DELETE bypasses the ORM, so the
        plan's `accounts` collection is expired afterwards -- otherwise a
        collection loaded earlier in the session would still show the old
        rows in the response."""
        existing = {
            row.account_id: row
            for row in self.db.scalars(
                select(TargetPlanAccount).where(TargetPlanAccount.target_plan_id == target_plan.id)
            ).all()
        }
        wanted = {entry[0]: entry for entry in entries}

        dropped = [row.id for account_id, row in existing.items() if account_id not in wanted]
        if dropped:
            self.db.execute(delete(TargetPlanAccount).where(TargetPlanAccount.id.in_(dropped)))
        for account_id, (_, amount, visit_frequency, objective) in wanted.items():
            row = existing.get(account_id)
            if row is None:
                self.db.add(
                    TargetPlanAccount(
                        target_plan_id=target_plan.id,
                        account_id=account_id,
                        planned_amount_lakhs=amount,
                        visit_frequency=visit_frequency,
                        strategic_objective=objective,
                        created_by=user_id,
                        updated_by=user_id,
                    )
                )
            elif (
                row.planned_amount_lakhs != amount
                or row.visit_frequency != visit_frequency
                or row.strategic_objective != objective
            ):
                row.planned_amount_lakhs = amount
                row.visit_frequency = visit_frequency
                row.strategic_objective = objective
                row.updated_by = user_id
        self.db.flush()
        self.db.expire(target_plan, ["accounts"])

    def get_accounts_by_ids(self, account_ids: list[uuid.UUID]) -> list[Account]:
        stmt = select(Account).options(*_ACCOUNT_NOLOADS).where(Account.id.in_(account_ids))
        return list(self.db.scalars(stmt).unique().all())

    def account_ids_outside_zones(
        self, account_ids: list[uuid.UUID], zone_ids: list[uuid.UUID]
    ) -> set[uuid.UUID]:
        """Which of account_ids are NOT filed under any of zone_ids (or a
        zone beneath one of them), via zone_closure."""
        in_territory = select(ZoneClosure.descendant_zone_id).where(ZoneClosure.ancestor_zone_id.in_(zone_ids))
        stmt = select(Account.id).where(Account.id.in_(account_ids)).where(Account.zone_id.in_(in_territory))
        inside = set(self.db.scalars(stmt).all())
        return set(account_ids) - inside

    def list_eligible_accounts(
        self, *, search: str | None, zone_ids: list[uuid.UUID] | None, limit: int = 50
    ) -> list[Account]:
        """The plan dialog's hospital picker. zone_ids=None means unrestricted
        (Admin/GM/SBU Manager); an empty list means no territory, so nothing."""
        if zone_ids is not None and not zone_ids:
            return []
        stmt = select(Account).options(*_ACCOUNT_NOLOADS)
        if zone_ids is not None:
            in_territory = select(ZoneClosure.descendant_zone_id).where(ZoneClosure.ancestor_zone_id.in_(zone_ids))
            stmt = stmt.where(Account.zone_id.in_(in_territory))
        if search:
            stmt = stmt.where(Account.name.ilike(f"%{search}%"))
        stmt = stmt.order_by(Account.name).limit(limit)
        return list(self.db.scalars(stmt).unique().all())

    def find_overlaps(
        self, account_ids: list[uuid.UUID], sbu_id: uuid.UUID, planning_period: str
    ) -> list[tuple[uuid.UUID, str]]:
        """Other people's submitted plans in the same SBU/period that include
        any of account_ids. Goes through cabio_app_plan_overlap() (SECURITY
        DEFINER, migration 0055) because target_plan RLS hides colleagues'
        plans from a Sales Staff caller."""
        if not account_ids:
            return []
        rows = self.db.execute(
            text(
                "SELECT account_id, display_name FROM "
                "cabio_app_plan_overlap(CAST(:ids AS uuid[]), CAST(:sbu_id AS uuid), :period)"
            ),
            {"ids": [str(i) for i in account_ids], "sbu_id": str(sbu_id), "period": planning_period},
        ).all()
        return [(row.account_id, row.display_name) for row in rows]

class BrandVendorTargetRepository(BaseRepository[BrandVendorTarget]):
    def __init__(self, db: Session):
        super().__init__(BrandVendorTarget, db)

    def get_by_brand_period(self, brand_id: uuid.UUID, planning_period: str) -> BrandVendorTarget | None:
        stmt = select(BrandVendorTarget).where(
            BrandVendorTarget.brand_id == brand_id,
            BrandVendorTarget.planning_period == planning_period,
        )
        return self.db.scalars(stmt).first()

    def list_by_period(self, planning_period: str) -> list[BrandVendorTarget]:
        stmt = select(BrandVendorTarget).where(BrandVendorTarget.planning_period == planning_period)
        return list(self.db.scalars(stmt).all())


def sbu_targets(db: Session, planning_period: str) -> dict[uuid.UUID, Decimal | None]:
    """Every active SBU -> its brands' total for the quarter (D47, D55), or
    None if no brand has a figure or the caller may not see it. Goes through
    cabio_app_sbu_targets() (SECURITY DEFINER, migration 0062) because brand
    figures are Admin/GM-only under RLS (D23) while an SBU Manager may see
    their own SBU's total (D26)."""
    rows = db.execute(
        text("SELECT sbu_id, target_amount_lakhs FROM cabio_app_sbu_targets(:period)"),
        {"period": planning_period},
    ).all()
    return {row.sbu_id: (None if row.target_amount_lakhs is None else Decimal(row.target_amount_lakhs)) for row in rows}


class AnnualTargetRepository(BaseRepository[BrandAnnualTarget]):
    """Brand yearly figures and SBU seasonal patterns (Annual Target
    Planning, D23-D25). Admin/GM only under RLS."""

    def __init__(self, db: Session):
        super().__init__(BrandAnnualTarget, db)

    def get_brand(self, brand_id: uuid.UUID) -> Brand | None:
        return self.db.get(Brand, brand_id)

    def list_active_brands(self, sbu_id: uuid.UUID) -> list[Brand]:
        stmt = select(Brand).where(Brand.sbu_id == sbu_id, Brand.is_active.is_(True)).order_by(Brand.name)
        return list(self.db.scalars(stmt).all())

    def get_annual(self, brand_id: uuid.UUID, start_year: int) -> BrandAnnualTarget | None:
        stmt = select(BrandAnnualTarget).where(
            BrandAnnualTarget.brand_id == brand_id, BrandAnnualTarget.start_year == start_year
        )
        return self.db.scalars(stmt).first()

    def brand_has_annual(self, brand_id: uuid.UUID) -> bool:
        stmt = select(func.count()).where(BrandAnnualTarget.brand_id == brand_id)
        return (self.db.scalar(stmt) or 0) > 0

    def brands_with_annual(self, brand_ids: list[uuid.UUID]) -> set[uuid.UUID]:
        """Of brand_ids, those with a yearly figure in any year (D59)."""
        if not brand_ids:
            return set()
        stmt = select(BrandAnnualTarget.brand_id).where(BrandAnnualTarget.brand_id.in_(brand_ids)).distinct()
        return set(self.db.scalars(stmt).all())

    def list_annual(self, sbu_id: uuid.UUID, start_year: int) -> list[BrandAnnualTarget]:
        stmt = (
            select(BrandAnnualTarget)
            .join(Brand, Brand.id == BrandAnnualTarget.brand_id)
            .where(Brand.sbu_id == sbu_id, BrandAnnualTarget.start_year == start_year)
        )
        return list(self.db.scalars(stmt).all())

    def list_following_sbu_pattern(self, sbu_id: uuid.UUID, start_year: int) -> list[BrandAnnualTarget]:
        """The SBU's brand years starting in start_year with no pattern of
        their own (D50)."""
        return [a for a in self.list_annual(sbu_id, start_year) if a.pct_jan_mar is None]

    def get_pattern(self, sbu_id: uuid.UUID, year: int) -> SbuSeasonalPattern | None:
        stmt = select(SbuSeasonalPattern).where(SbuSeasonalPattern.sbu_id == sbu_id, SbuSeasonalPattern.year == year)
        return self.db.scalars(stmt).first()

    def add(self, obj):
        self.db.add(obj)
        self.db.flush()
        return obj

    def vendor_targets(
        self, brand_ids: list[uuid.UUID], planning_periods: list[str]
    ) -> dict[tuple[uuid.UUID, str], Decimal]:
        if not brand_ids or not planning_periods:
            return {}
        stmt = select(
            BrandVendorTarget.brand_id, BrandVendorTarget.planning_period, BrandVendorTarget.vendor_target_amount_lakhs
        ).where(BrandVendorTarget.brand_id.in_(brand_ids), BrandVendorTarget.planning_period.in_(planning_periods))
        return {(b, p): v for b, p, v in self.db.execute(stmt).all()}

    def get_vendor_target(self, brand_id: uuid.UUID, planning_period: str) -> BrandVendorTarget | None:
        stmt = select(BrandVendorTarget).where(
            BrandVendorTarget.brand_id == brand_id, BrandVendorTarget.planning_period == planning_period
        )
        return self.db.scalars(stmt).first()


class PersonQuarterTargetRepository(BaseRepository[PersonQuarterTarget]):
    """Per-person quarterly targets (D30, D45). RLS narrows reads to the
    caller, those below them, or everyone for Admin/GM."""

    def __init__(self, db: Session):
        super().__init__(PersonQuarterTarget, db)

    def get_user(self, user_id: uuid.UUID) -> UserProfile | None:
        return self.db.get(UserProfile, user_id)

    def get_target(self, user_id: uuid.UUID, sbu_id: uuid.UUID, planning_period: str) -> PersonQuarterTarget | None:
        stmt = select(PersonQuarterTarget).where(
            PersonQuarterTarget.user_id == user_id,
            PersonQuarterTarget.sbu_id == sbu_id,
            PersonQuarterTarget.planning_period == planning_period,
        )
        return self.db.scalars(stmt).first()

    def targets_for(
        self, user_ids: list[uuid.UUID], sbu_id: uuid.UUID, planning_period: str
    ) -> dict[uuid.UUID, Decimal]:
        if not user_ids:
            return {}
        stmt = select(PersonQuarterTarget.user_id, PersonQuarterTarget.target_amount_lakhs).where(
            PersonQuarterTarget.user_id.in_(user_ids),
            PersonQuarterTarget.sbu_id == sbu_id,
            PersonQuarterTarget.planning_period == planning_period,
        )
        return dict(self.db.execute(stmt).all())

    def direct_reports(self, manager_id: uuid.UUID, sbu_id: uuid.UUID) -> list[UserProfile]:
        stmt = (
            select(UserProfile)
            .where(
                UserProfile.manager_id == manager_id,
                UserProfile.sbu_id == sbu_id,
                UserProfile.is_active.is_not(False),
            )
            .order_by(UserProfile.display_name)
        )
        return list(self.db.scalars(stmt).unique().all())

    def sbu_top_people(self, sbu_id: uuid.UUID) -> list[UserProfile]:
        """The SBU's people who report to no one, or straight to an Admin or
        GM -- the first level below the SBU target (D45: today the Area
        Managers, who report to Haroon). Sales roles only, so e.g. a
        Marketing User with an SBU and no manager isn't given a target
        (Basheer, 2026-10-22)."""
        manager = aliased(UserProfile)
        manager_role = aliased(Role)
        own_role = aliased(Role)
        stmt = (
            select(UserProfile)
            .join(own_role, own_role.id == UserProfile.role_id)
            .outerjoin(manager, manager.id == UserProfile.manager_id)
            .outerjoin(manager_role, manager_role.id == manager.role_id)
            .where(
                UserProfile.sbu_id == sbu_id,
                UserProfile.is_active.is_not(False),
                own_role.role_name.in_(TARGET_CARRYING_ROLES),
                or_(UserProfile.manager_id.is_(None), manager_role.role_name.in_(UNRESTRICTED_ROLES)),
            )
            .order_by(UserProfile.display_name)
        )
        return list(self.db.scalars(stmt).unique().all())


class TargetVsActualRepository:
    """Read-only queries behind Target vs Actuals (Plan vs Actuals Tracking
    plan). Plans come through target_plan's RLS; people and Opportunities
    are narrowed to the caller's owner scope, the same rule reporting uses.
    Per-person figures credit each split participant by their share
    (BR-FIN-09); the summary totals count each Opportunity once."""

    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def _credit(sbu_id: uuid.UUID, owner_at_zero: bool = False):
        """BR-FIN-09: who is credited with each Opportunity, and at what
        percentage -- its split rows, or its owner at 100 % when it has none.
        Columns: opportunity_id, user_id, pct. Split percentages sum to 100,
        so the shares of one Opportunity add back to its full value.
        owner_at_zero also lists an owner left out of their own split at 0 %,
        so the late list still reaches the person who must update it."""
        has_split = select(Split.id).where(Split.opportunity_id == Opportunity.id).exists()
        parts = [
            select(
                Split.opportunity_id.label("opportunity_id"),
                Split.user_id.label("user_id"),
                Split.split_percentage.label("pct"),
            )
            .join(Opportunity, Opportunity.id == Split.opportunity_id)
            .where(Opportunity.sbu_id == sbu_id),
            select(Opportunity.id, Opportunity.owner_id, literal(Decimal(100)))
            .where(Opportunity.sbu_id == sbu_id)
            .where(~has_split),
        ]
        if owner_at_zero:
            owner_in_split = (
                select(Split.id)
                .where(Split.opportunity_id == Opportunity.id)
                .where(Split.user_id == Opportunity.owner_id)
                .exists()
            )
            parts.append(
                select(Opportunity.id, Opportunity.owner_id, literal(Decimal(0)))
                .where(Opportunity.sbu_id == sbu_id)
                .where(has_split)
                .where(~owner_in_split)
            )
        return union_all(*parts).subquery("credit")

    @staticmethod
    def _apply_owner_scope(stmt, current_user: UserProfile):
        role_name = current_user.role.role_name
        if role_name not in UNRESTRICTED_ROLES:
            scope_builder = TEAM_SCOPE_BUILDERS.get(role_name)
            self_row = UserProfile.id == current_user.id
            stmt = stmt.where(or_(scope_builder(current_user), self_row) if scope_builder else self_row)
        return stmt

    @staticmethod
    def _zone_ancestor():
        zone_anc = aliased(Zone)
        return (
            select(
                ZoneClosure.descendant_zone_id.label("zone_id"),
                zone_anc.id.label("anc_id"),
                zone_anc.name.label("anc_name"),
            )
            .join(zone_anc, zone_anc.id == ZoneClosure.ancestor_zone_id)
            .where(zone_anc.zone_level == "ZONE")
            .subquery()
        )

    def list_plans(self, current_user: UserProfile, sbu_id: uuid.UUID, planning_period: str) -> list[TargetPlan]:
        """Every plan in any status -- the roster shows Draft and Rejected
        too; the service counts only waiting and approved ones. RLS lets any
        role see plans in its zone subtree, so the plan owner is narrowed to
        the caller's owner scope here -- the same rule Won and Expected use --
        else a colleague's plan would show as "Planned X, Won 0"."""
        stmt = (
            select(TargetPlan)
            .join(UserProfile, UserProfile.id == TargetPlan.user_id)
            .where(TargetPlan.sbu_id == sbu_id)
            .where(TargetPlan.planning_period == planning_period)
            .options(*_PLAN_CHILDREN)
        )
        stmt = self._apply_owner_scope(stmt, current_user)
        return list(self.db.scalars(stmt).all())

    def roster(self, current_user: UserProfile, sbu_id: uuid.UUID) -> list[tuple[uuid.UUID, str]]:
        """Who gets a row: every active member of the SBU plus the General
        Manager (on both SBUs' rosters), never Admin, within the caller's
        owner scope: (user_id, display_name)."""
        stmt = (
            select(UserProfile.id, UserProfile.display_name)
            .join(Role, Role.id == UserProfile.role_id)
            .where(UserProfile.is_active.is_not(False))
            .where(Role.role_name != "Admin")
            .where(or_(UserProfile.sbu_id == sbu_id, Role.role_name == "General Manager"))
        )
        stmt = self._apply_owner_scope(stmt, current_user)
        return [(u, n) for u, n in self.db.execute(stmt).all()]

    def zone_of_accounts(self, account_ids: list[uuid.UUID]) -> dict[uuid.UUID, tuple[uuid.UUID | None, str | None]]:
        """ZONE-level ancestor of each hospital's zone: account_id ->
        (zone_id, zone_name). Hospitals filed above zone level map to (None, None)."""
        if not account_ids:
            return {}
        zone_ancestor = self._zone_ancestor()
        stmt = (
            select(Account.id, zone_ancestor.c.anc_id, zone_ancestor.c.anc_name)
            .outerjoin(zone_ancestor, zone_ancestor.c.zone_id == Account.zone_id)
            .where(Account.id.in_(account_ids))
        )
        return {a: (zid, zn) for a, zid, zn in self.db.execute(stmt).all()}

    def won_by_person_account(
        self, current_user: UserProfile, sbu_id: uuid.UUID, start: datetime, end: datetime
    ) -> list[tuple[uuid.UUID, str, uuid.UUID, uuid.UUID | None, str | None, Decimal]]:
        """Net won value per (credited person, hospital) for Opportunities
        closed in [start, end), each person's share only (BR-FIN-09):
        (user_id, display_name, account_id, zone_id, zone_name, amount)."""
        zone_ancestor = self._zone_ancestor()
        credit = self._credit(sbu_id)
        amount = func.coalesce(func.sum(_NET_VALUE * credit.c.pct / 100), 0)
        stmt = (
            select(
                credit.c.user_id,
                UserProfile.display_name,
                Opportunity.account_id,
                zone_ancestor.c.anc_id,
                zone_ancestor.c.anc_name,
                amount,
            )
            .select_from(Opportunity)
            .join(OpportunityItem, OpportunityItem.opportunity_id == Opportunity.id)
            .join(OpportunityStatus, OpportunityStatus.id == Opportunity.status_id)
            .join(credit, credit.c.opportunity_id == Opportunity.id)
            .join(UserProfile, UserProfile.id == credit.c.user_id)
            .join(Account, Account.id == Opportunity.account_id)
            .outerjoin(zone_ancestor, zone_ancestor.c.zone_id == Account.zone_id)
            .where(OpportunityStatus.status_code == "WON")
            .where(Opportunity.sbu_id == sbu_id)
            .where(Opportunity.closed_at >= start)
            .where(Opportunity.closed_at < end)
            .group_by(
                credit.c.user_id,
                UserProfile.display_name,
                Opportunity.account_id,
                zone_ancestor.c.anc_id,
                zone_ancestor.c.anc_name,
            )
        )
        stmt = self._apply_owner_scope(stmt, current_user)
        return [(u, n, a, zid, zn, Decimal(v)) for u, n, a, zid, zn, v in self.db.execute(stmt).all()]

    def won_by_person_brand(
        self, current_user: UserProfile, sbu_id: uuid.UUID, start: datetime, end: datetime
    ) -> list[tuple[uuid.UUID, uuid.UUID, str, Decimal]]:
        """Net won value per (credited person, brand), each person's share
        only (BR-FIN-09): (user_id, brand_id, brand_name, amount). Lines with
        no product (BUYBACK) have no brand and are skipped."""
        credit = self._credit(sbu_id)
        amount = func.coalesce(func.sum(_NET_VALUE * credit.c.pct / 100), 0)
        stmt = (
            select(credit.c.user_id, Brand.id, Brand.name, amount)
            .select_from(Opportunity)
            .join(OpportunityItem, OpportunityItem.opportunity_id == Opportunity.id)
            .join(OpportunityStatus, OpportunityStatus.id == Opportunity.status_id)
            .join(credit, credit.c.opportunity_id == Opportunity.id)
            .join(UserProfile, UserProfile.id == credit.c.user_id)
            .join(Product, Product.id == OpportunityItem.product_id)
            .join(Brand, Brand.id == Product.brand_id)
            .where(OpportunityStatus.status_code == "WON")
            .where(Opportunity.sbu_id == sbu_id)
            .where(Opportunity.closed_at >= start)
            .where(Opportunity.closed_at < end)
            .group_by(credit.c.user_id, Brand.id, Brand.name)
        )
        stmt = self._apply_owner_scope(stmt, current_user)
        return [(u, b, bn, Decimal(v)) for u, b, bn, v in self.db.execute(stmt).all()]

    def expected_by_person(
        self,
        current_user: UserProfile,
        sbu_id: uuid.UUID,
        closing_from: date | None,
        closing_to: date,
    ) -> list[tuple[uuid.UUID, str, Decimal]]:
        """Probability-weighted net value of ACTIVE Opportunities whose
        expected closure date is <= closing_to (and >= closing_from when
        given), each credited person's share only (BR-FIN-09):
        (user_id, display_name, amount)."""
        credit = self._credit(sbu_id)
        amount = func.coalesce(
            func.sum(_NET_VALUE * Opportunity.win_probability / 100 * credit.c.pct / 100), 0
        )
        stmt = (
            select(credit.c.user_id, UserProfile.display_name, amount)
            .select_from(Opportunity)
            .join(OpportunityItem, OpportunityItem.opportunity_id == Opportunity.id)
            .join(OpportunityStatus, OpportunityStatus.id == Opportunity.status_id)
            .join(credit, credit.c.opportunity_id == Opportunity.id)
            .join(UserProfile, UserProfile.id == credit.c.user_id)
            .where(OpportunityStatus.status_code == "ACTIVE")
            .where(Opportunity.sbu_id == sbu_id)
            .where(Opportunity.expected_closure_date <= closing_to)
            .group_by(credit.c.user_id, UserProfile.display_name)
        )
        if closing_from is not None:
            stmt = stmt.where(Opportunity.expected_closure_date >= closing_from)
        stmt = self._apply_owner_scope(stmt, current_user)
        return [(u, n, Decimal(v)) for u, n, v in self.db.execute(stmt).all()]

    def late_opportunities(
        self, current_user: UserProfile, sbu_id: uuid.UUID, today: date
    ) -> list[tuple[uuid.UUID, str, uuid.UUID, str, uuid.UUID, str, uuid.UUID, str, date, Decimal, Decimal]]:
        """BR-OP-16: ACTIVE Opportunities whose expected closure date has
        passed, one row per credited person (BR-FIN-09): (id, name,
        account_id, account_name, user_id, display_name, owner_id,
        owner_name, expected_closure_date, full net value, share %). An owner
        left out of their own split gets a row at 0 %."""
        credit = self._credit(sbu_id, owner_at_zero=True)
        owner = aliased(UserProfile)
        value = func.coalesce(func.sum(_NET_VALUE), 0)
        stmt = (
            select(
                Opportunity.id,
                Opportunity.name,
                Opportunity.account_id,
                Account.name,
                credit.c.user_id,
                UserProfile.display_name,
                Opportunity.owner_id,
                owner.display_name,
                Opportunity.expected_closure_date,
                value,
                credit.c.pct,
            )
            .select_from(Opportunity)
            .outerjoin(OpportunityItem, OpportunityItem.opportunity_id == Opportunity.id)
            .join(OpportunityStatus, OpportunityStatus.id == Opportunity.status_id)
            .join(credit, credit.c.opportunity_id == Opportunity.id)
            .join(UserProfile, UserProfile.id == credit.c.user_id)
            .join(owner, owner.id == Opportunity.owner_id)
            .join(Account, Account.id == Opportunity.account_id)
            .where(OpportunityStatus.status_code == "ACTIVE")
            .where(Opportunity.sbu_id == sbu_id)
            .where(Opportunity.expected_closure_date < today)
            .group_by(
                Opportunity.id,
                Opportunity.name,
                Opportunity.account_id,
                Account.name,
                credit.c.user_id,
                UserProfile.display_name,
                Opportunity.owner_id,
                owner.display_name,
                Opportunity.expected_closure_date,
                credit.c.pct,
            )
            .order_by(Opportunity.expected_closure_date, Opportunity.name)
        )
        stmt = self._apply_owner_scope(stmt, current_user)
        return [
            (i, n, a, an, u, un, o, on, d, Decimal(v), Decimal(p))
            for i, n, a, an, u, un, o, on, d, v, p in self.db.execute(stmt).all()
        ]

    def undated_counts(
        self, current_user: UserProfile, sbu_id: uuid.UUID
    ) -> list[tuple[uuid.UUID, str, int]]:
        """ACTIVE Opportunities with no expected closure date, per owner:
        (owner_id, owner_name, count). They can't be placed in a quarter."""
        stmt = (
            select(Opportunity.owner_id, UserProfile.display_name, func.count(Opportunity.id))
            .select_from(Opportunity)
            .join(OpportunityStatus, OpportunityStatus.id == Opportunity.status_id)
            .join(UserProfile, UserProfile.id == Opportunity.owner_id)
            .where(OpportunityStatus.status_code == "ACTIVE")
            .where(Opportunity.sbu_id == sbu_id)
            .where(Opportunity.expected_closure_date.is_(None))
            .group_by(Opportunity.owner_id, UserProfile.display_name)
        )
        stmt = self._apply_owner_scope(stmt, current_user)
        return [(o, n, int(c)) for o, n, c in self.db.execute(stmt).all()]

    @staticmethod
    def _po_received_filter(q_start: date, q_end: date):
        """PO date in the quarter, whatever the status now, except Lost."""
        return (
            Opportunity.po_date >= q_start,
            Opportunity.po_date <= q_end,
            OpportunityStatus.status_code != "LOST",
        )

    def po_received_by_person(
        self, current_user: UserProfile, sbu_id: uuid.UUID, q_start: date, q_end: date
    ) -> list[tuple[uuid.UUID, str, Decimal]]:
        """Net value of Opportunities whose PO date falls in the quarter,
        each credited person's share only (BR-FIN-09): (user_id,
        display_name, amount). Counted in the PO's quarter, which can differ
        from the quarter it is Won (paid) in."""
        credit = self._credit(sbu_id)
        amount = func.coalesce(func.sum(_NET_VALUE * credit.c.pct / 100), 0)
        stmt = (
            select(credit.c.user_id, UserProfile.display_name, amount)
            .select_from(Opportunity)
            .join(OpportunityItem, OpportunityItem.opportunity_id == Opportunity.id)
            .join(OpportunityStatus, OpportunityStatus.id == Opportunity.status_id)
            .join(credit, credit.c.opportunity_id == Opportunity.id)
            .join(UserProfile, UserProfile.id == credit.c.user_id)
            .where(Opportunity.sbu_id == sbu_id)
            .where(*self._po_received_filter(q_start, q_end))
            .group_by(credit.c.user_id, UserProfile.display_name)
        )
        stmt = self._apply_owner_scope(stmt, current_user)
        return [(u, n, Decimal(v)) for u, n, v in self.db.execute(stmt).all()]

    def no_po_date_counts(
        self,
        current_user: UserProfile,
        sbu_id: uuid.UUID,
        start: datetime,
        end: datetime,
        *,
        include_open: bool,
    ) -> list[tuple[uuid.UUID, str, int]]:
        """Opportunities past Order with no PO date, per owner: (owner_id,
        owner_name, count). Ones Won in [start, end), plus -- when
        include_open, i.e. the current quarter -- open ones at Delivery or
        later, which belong to no particular quarter. Older Opportunities
        reached those points before the PO date was asked for (decision
        2026-10-06: counted, not back-filled)."""
        won_in_quarter = (
            (OpportunityStatus.status_code == "WON")
            & (Opportunity.closed_at >= start)
            & (Opportunity.closed_at < end)
        )
        open_past_order = OpportunityStatus.status_code.not_in(("WON", "LOST")) & (
            OpportunityStage.display_order >= DELIVERY_STAGE_ORDER
        )
        stmt = (
            select(Opportunity.owner_id, UserProfile.display_name, func.count(Opportunity.id))
            .select_from(Opportunity)
            .join(OpportunityStatus, OpportunityStatus.id == Opportunity.status_id)
            .join(OpportunityStage, OpportunityStage.id == Opportunity.stage_id)
            .join(UserProfile, UserProfile.id == Opportunity.owner_id)
            .where(Opportunity.sbu_id == sbu_id)
            .where(Opportunity.po_date.is_(None))
            .where(or_(won_in_quarter, open_past_order) if include_open else won_in_quarter)
            .group_by(Opportunity.owner_id, UserProfile.display_name)
        )
        stmt = self._apply_owner_scope(stmt, current_user)
        return [(o, n, int(c)) for o, n, c in self.db.execute(stmt).all()]

    def active_sbu_targets(self, planning_period: str) -> dict[uuid.UUID, Decimal | None]:
        """Every active SBU -> its brands' total for the quarter, or None
        (see sbu_targets): Admin/GM see every SBU's figure, an SBU Manager
        only their own (others come back None)."""
        return sbu_targets(self.db, planning_period)

    def person_targets(self, sbu_id: uuid.UUID, planning_period: str) -> dict[uuid.UUID, Decimal]:
        """Each person's own quarterly target in the SBU (D49). RLS on
        person_quarter_target narrows to the caller and those below them
        (Admin/GM: everyone)."""
        stmt = select(PersonQuarterTarget.user_id, PersonQuarterTarget.target_amount_lakhs).where(
            PersonQuarterTarget.sbu_id == sbu_id, PersonQuarterTarget.planning_period == planning_period
        )
        return dict(self.db.execute(stmt).all())

    def managers_of(self, user_ids: list[uuid.UUID]) -> dict[uuid.UUID, uuid.UUID | None]:
        """Who each person reports to (user_profile.manager_id), so the
        screen can show a manager's team under them (D76)."""
        if not user_ids:
            return {}
        stmt = select(UserProfile.id, UserProfile.manager_id).where(UserProfile.id.in_(user_ids))
        return dict(self.db.execute(stmt).all())

    def summary_totals(
        self,
        planning_period: str,
        q_start: date,
        q_end: date,
        start: datetime,
        end: datetime,
        *,
        sbu_id: uuid.UUID | None,
    ) -> tuple[Decimal, Decimal, Decimal]:
        """(planned, po_received, won) for one whole SBU, or every SBU when
        sbu_id is None -- not narrowed to the caller's team, so the SBU row
        reads the same for its SBU Manager as for the GM. Planned = waiting
        and approved plans' totals, plus a rejected revision's last approved
        total (BR-PL-05). One round trip."""
        planned = func.coalesce(
            func.sum(
                case(
                    (TargetPlan.status.in_(SUBMITTED_PLAN_STATUSES), TargetPlan.target_amount_lakhs),
                    (TargetPlan.status == "REJECTED", func.coalesce(TargetPlan.previous_approved_total_lakhs, 0)),
                    else_=0,
                )
            ),
            0,
        )
        plans = select(planned).where(TargetPlan.planning_period == planning_period)
        if sbu_id is not None:
            plans = plans.where(TargetPlan.sbu_id == sbu_id)

        po_cond = and_(*self._po_received_filter(q_start, q_end))
        won_cond = (
            (OpportunityStatus.status_code == "WON")
            & (Opportunity.closed_at >= start)
            & (Opportunity.closed_at < end)
        )
        lines = (
            select(
                func.coalesce(func.sum(_NET_VALUE).filter(po_cond), 0).label("po_received"),
                func.coalesce(func.sum(_NET_VALUE).filter(won_cond), 0).label("won"),
            )
            .select_from(Opportunity)
            .join(OpportunityItem, OpportunityItem.opportunity_id == Opportunity.id)
            .join(OpportunityStatus, OpportunityStatus.id == Opportunity.status_id)
            .where(or_(po_cond, won_cond))
        )
        if sbu_id is not None:
            lines = lines.where(Opportunity.sbu_id == sbu_id)
        lines = lines.subquery()

        row = self.db.execute(select(plans.scalar_subquery(), lines.c.po_received, lines.c.won)).one()
        return Decimal(row[0] or 0), Decimal(row[1] or 0), Decimal(row[2] or 0)
