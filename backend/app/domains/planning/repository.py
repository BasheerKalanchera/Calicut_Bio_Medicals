import uuid
from decimal import Decimal

from sqlalchemy import delete, func, or_, select, text
from sqlalchemy.orm import Session, aliased, noload, selectinload

from app.db.base import BaseRepository
from app.domains.account.models import Account
from app.domains.organization.models import UserProfile
from app.domains.planning.models import BrandVendorTarget, TargetPlan, TargetPlanAccount, TargetPlanBrandSplit
from app.domains.reference.models import Zone, ZoneClosure

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

    def get_sbu_rollup(self, sbu_id: uuid.UUID, planning_period: str) -> tuple[Decimal, int]:
        """SUM + COUNT across every submitted row -- pending targets count too
        (resolved 2026-09-16), so the rollup shows the full picture, not just
        approved numbers. DRAFT rows are excluded: they're unsubmitted and
        private to their owner (Hospital-Wise Target Planning, 2026-09-27)."""
        stmt = (
            select(
                func.coalesce(func.sum(TargetPlan.target_amount_lakhs), 0),
                func.count(TargetPlan.id),
            )
            .where(TargetPlan.sbu_id == sbu_id)
            .where(TargetPlan.planning_period == planning_period)
            .where(TargetPlan.status != "DRAFT")
        )
        total, count = self.db.execute(stmt).one()
        return Decimal(total), count

    def replace_brand_splits(
        self, target_plan_id: uuid.UUID, splits: list[tuple[uuid.UUID, Decimal]]
    ) -> None:
        """Delete-and-recreate, not diffed in place -- target_plan has no
        audit-trail trigger yet (BR-AUD-01), so there's no
        OpportunityRepository.replace_items-style audit-noise reason to do
        an in-place UPDATE-by-id instead."""
        self.db.execute(
            delete(TargetPlanBrandSplit).where(TargetPlanBrandSplit.target_plan_id == target_plan_id)
        )
        for brand_id, amount in splits:
            self.db.add(
                TargetPlanBrandSplit(
                    target_plan_id=target_plan_id, brand_id=brand_id, split_amount_lakhs=amount
                )
            )
        self.db.flush()

    def get_brand_rollups(
        self, brand_ids: list[uuid.UUID], planning_period: str
    ) -> dict[uuid.UUID, Decimal]:
        """SUM of every TargetPlanBrandSplit row per brand for this period,
        across all submitted target_plan statuses (DRAFT excluded, same as
        get_sbu_rollup above), one GROUP BY for every brand at once instead
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
        """Delete-and-recreate, same reasoning as replace_brand_splits. The
        bulk DELETE bypasses the ORM, so the plan's `accounts` collection is
        expired afterwards -- otherwise a collection loaded earlier in the
        session would still show the old rows in the response."""
        self.db.execute(delete(TargetPlanAccount).where(TargetPlanAccount.target_plan_id == target_plan.id))
        for account_id, amount, visit_frequency, objective in entries:
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

    def get_zone_rollup(
        self, sbu_id: uuid.UUID, planning_period: str
    ) -> list[tuple[uuid.UUID | None, str | None, Decimal, int, int]]:
        """Planned amounts per ZONE-level ancestor of each hospital's zone
        (same walk-up as AccountRepository.find_similar_by_name), submitted
        plans only, under the caller's RLS. Returns (zone_id, zone_name,
        amount, hospital_count, person_count)."""
        zone_anc = aliased(Zone)
        zone_ancestor = (
            select(
                ZoneClosure.descendant_zone_id.label("zone_id"),
                zone_anc.id.label("anc_id"),
                zone_anc.name.label("anc_name"),
            )
            .join(zone_anc, zone_anc.id == ZoneClosure.ancestor_zone_id)
            .where(zone_anc.zone_level == "ZONE")
            .subquery()
        )
        stmt = (
            select(
                zone_ancestor.c.anc_id,
                zone_ancestor.c.anc_name,
                func.coalesce(func.sum(TargetPlanAccount.planned_amount_lakhs), 0),
                func.count(func.distinct(TargetPlanAccount.account_id)),
                func.count(func.distinct(TargetPlan.user_id)),
            )
            .select_from(TargetPlanAccount)
            .join(TargetPlan, TargetPlan.id == TargetPlanAccount.target_plan_id)
            .join(Account, Account.id == TargetPlanAccount.account_id)
            .outerjoin(zone_ancestor, zone_ancestor.c.zone_id == Account.zone_id)
            .where(TargetPlan.sbu_id == sbu_id)
            .where(TargetPlan.planning_period == planning_period)
            .where(TargetPlan.status != "DRAFT")
            .group_by(zone_ancestor.c.anc_id, zone_ancestor.c.anc_name)
            .order_by(zone_ancestor.c.anc_name)
        )
        return [
            (zone_id, zone_name, Decimal(amount), hospitals, people)
            for zone_id, zone_name, amount, hospitals, people in self.db.execute(stmt).all()
        ]


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
