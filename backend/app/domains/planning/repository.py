import uuid
from decimal import Decimal

from sqlalchemy import delete, func, or_, select
from sqlalchemy.orm import Session

from app.db.base import BaseRepository
from app.domains.organization.models import UserProfile
from app.domains.planning.models import BrandVendorTarget, TargetPlan, TargetPlanBrandSplit


class TargetPlanRepository(BaseRepository[TargetPlan]):
    def __init__(self, db: Session):
        super().__init__(TargetPlan, db)

    def list_by_user(self, user_id: uuid.UUID) -> list[TargetPlan]:
        stmt = select(TargetPlan).where(TargetPlan.user_id == user_id).order_by(TargetPlan.planning_period)
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
            .join(UserProfile, UserProfile.id == TargetPlan.user_id)
            .where(or_(*conditions))
            .where(TargetPlan.status == "PENDING_APPROVAL")
            .order_by(TargetPlan.planning_period)
        )
        return list(self.db.scalars(stmt).all())

    def list_by_sbu_and_period(self, sbu_id: uuid.UUID, planning_period: str) -> list[TargetPlan]:
        stmt = (
            select(TargetPlan)
            .where(TargetPlan.sbu_id == sbu_id)
            .where(TargetPlan.planning_period == planning_period)
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
        """SUM + COUNT across every row regardless of status -- pending targets
        count too (resolved 2026-09-16), so the rollup shows the full picture
        including drafts, not just committed numbers."""
        stmt = (
            select(
                func.coalesce(func.sum(TargetPlan.target_amount_lakhs), 0),
                func.count(TargetPlan.id),
            )
            .where(TargetPlan.sbu_id == sbu_id)
            .where(TargetPlan.planning_period == planning_period)
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

    def get_brand_rollup(self, brand_id: uuid.UUID, planning_period: str) -> Decimal:
        """SUM of every TargetPlanBrandSplit row for this brand/period,
        across all target_plan statuses -- same "count drafts too" shape as
        get_sbu_rollup above."""
        stmt = (
            select(func.coalesce(func.sum(TargetPlanBrandSplit.split_amount_lakhs), 0))
            .join(TargetPlan, TargetPlan.id == TargetPlanBrandSplit.target_plan_id)
            .where(TargetPlanBrandSplit.brand_id == brand_id)
            .where(TargetPlan.planning_period == planning_period)
        )
        return Decimal(self.db.scalar(stmt) or 0)


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
