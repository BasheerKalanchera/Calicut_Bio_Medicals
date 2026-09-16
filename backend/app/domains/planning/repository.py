import uuid
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.base import BaseRepository
from app.domains.organization.models import UserProfile
from app.domains.planning.models import TargetPlan


class TargetPlanRepository(BaseRepository[TargetPlan]):
    def __init__(self, db: Session):
        super().__init__(TargetPlan, db)

    def list_by_user(self, user_id: uuid.UUID) -> list[TargetPlan]:
        stmt = select(TargetPlan).where(TargetPlan.user_id == user_id).order_by(TargetPlan.planning_period)
        return list(self.db.scalars(stmt).all())

    def list_pending_approval_for_approver(self, approver_id: uuid.UUID) -> list[TargetPlan]:
        """Every PENDING_APPROVAL row whose owner's manager_id is approver_id.

        RLS already narrows what this query can see to what the caller is
        allowed to read -- this just adds the "and it's actually mine to
        approve" filter on top, for the "Needs your approval" screen section.
        """
        stmt = (
            select(TargetPlan)
            .join(UserProfile, UserProfile.id == TargetPlan.user_id)
            .where(UserProfile.manager_id == approver_id)
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
