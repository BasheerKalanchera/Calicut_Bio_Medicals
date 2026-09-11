import uuid
from datetime import datetime

from sqlalchemy import Row, case, func, or_, select
from sqlalchemy.orm import Session

from app.domains.account.models import Account
from app.domains.activity.models import Activity, Reminder
from app.domains.opportunity.models import Opportunity, OpportunityItem
from app.domains.organization.models import UserProfile, UserZone
from app.domains.organization.repository import TEAM_SCOPE_BUILDERS, UNRESTRICTED_ROLES
from app.domains.reference.models import SBU, OpportunityStage, OpportunityStatus, Zone

# Net line value: BR-FIN-03 nets BUYBACK lines against PRODUCT lines --
# extended_value_lakhs itself always stores a plain positive amount, the
# netting is applied wherever a total is computed (mirrors
# utils/opportunityItems.ts's netExtendedValue on the frontend).
_NET_VALUE = case(
    (OpportunityItem.line_type == "BUYBACK", -OpportunityItem.extended_value_lakhs),
    else_=OpportunityItem.extended_value_lakhs,
)

_GROUP_BY_COLUMNS = {
    "stage": (OpportunityStage.id, OpportunityStage.stage_name),
    "rep": (UserProfile.id, UserProfile.display_name),
    "sbu": (SBU.id, SBU.name),
    "zone": (Zone.id, Zone.name),
}


class ReportingRepository:
    def __init__(self, db: Session):
        self.db = db

    def _apply_owner_scope(self, stmt, current_user: UserProfile, user_id: uuid.UUID | None):
        # Same shape as ActivityRepository._apply_daily_report_scope, applied
        # to whoever owns the opportunity / logged the activity / is assigned
        # the reminder -- every query in this repository joins UserProfile in
        # for exactly this reason before calling this helper.
        role_name = current_user.role.role_name
        if role_name not in UNRESTRICTED_ROLES:
            scope_builder = TEAM_SCOPE_BUILDERS.get(role_name)
            self_row = UserProfile.id == current_user.id
            visible = or_(scope_builder(current_user), self_row) if scope_builder else self_row
            stmt = stmt.where(visible)
        if user_id is not None:
            stmt = stmt.where(UserProfile.id == user_id)
        return stmt

    def pipeline_summary(
        self,
        current_user: UserProfile,
        group_by: str,
        *,
        sbu_id: uuid.UUID | None = None,
        zone_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
    ) -> list[Row]:
        group_id_col, group_name_col = _GROUP_BY_COLUMNS[group_by]
        is_open = OpportunityStatus.is_terminal == False  # noqa: E712
        is_active = OpportunityStatus.status_code == "ACTIVE"

        stmt = (
            select(
                group_id_col.label("group_id"),
                group_name_col.label("group_name"),
                func.count(func.distinct(case((is_open, Opportunity.id)))).label("opportunity_count"),
                func.coalesce(func.sum(case((is_open, _NET_VALUE), else_=0)), 0).label("total_value_lakhs"),
                func.coalesce(func.sum(case((is_active, _NET_VALUE), else_=0)), 0).label(
                    "unweighted_forecast_lakhs"
                ),
                func.coalesce(
                    func.sum(case((is_active, _NET_VALUE * Opportunity.win_probability / 100), else_=0)), 0
                ).label("weighted_forecast_lakhs"),
            )
            .select_from(Opportunity)
            .join(OpportunityItem, OpportunityItem.opportunity_id == Opportunity.id)
            .join(OpportunityStatus, Opportunity.status_id == OpportunityStatus.id)
            .join(OpportunityStage, Opportunity.stage_id == OpportunityStage.id)
            .join(UserProfile, Opportunity.owner_id == UserProfile.id)
            .join(SBU, Opportunity.sbu_id == SBU.id)
            .join(Account, Opportunity.account_id == Account.id)
            .join(Zone, Account.zone_id == Zone.id)
            .group_by(group_id_col, group_name_col)
        )
        stmt = self._apply_owner_scope(stmt, current_user, user_id)
        if sbu_id is not None:
            stmt = stmt.where(Opportunity.sbu_id == sbu_id)
        if zone_id is not None:
            stmt = stmt.where(Account.zone_id == zone_id)
        stmt = stmt.order_by(group_name_col)
        return list(self.db.execute(stmt).all())

    def stagnant_deals(
        self,
        current_user: UserProfile,
        *,
        threshold_days: int = 180,
        sbu_id: uuid.UUID | None = None,
        zone_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
    ) -> list[Row]:
        last_activity_subq = (
            select(Activity.opportunity_id, func.max(Activity.activity_date).label("last_activity_date"))
            .where(Activity.opportunity_id.is_not(None))
            .group_by(Activity.opportunity_id)
            .subquery()
        )
        # No activity logged yet -- created_at is the only signal of "since when
        # has nobody touched this," same fallback the plan doc specifies.
        last_activity_date = func.coalesce(last_activity_subq.c.last_activity_date, Opportunity.created_at)
        days_stagnant = func.extract("day", func.now() - last_activity_date)

        stmt = (
            select(
                Opportunity.id.label("opportunity_id"),
                Opportunity.name.label("opportunity_name"),
                Account.name.label("account_name"),
                UserProfile.display_name.label("owner_name"),
                OpportunityStage.stage_name.label("stage_name"),
                last_activity_date.label("last_activity_date"),
                days_stagnant.label("days_stagnant"),
            )
            .select_from(Opportunity)
            .join(OpportunityStatus, Opportunity.status_id == OpportunityStatus.id)
            .join(OpportunityStage, Opportunity.stage_id == OpportunityStage.id)
            .join(UserProfile, Opportunity.owner_id == UserProfile.id)
            .join(Account, Opportunity.account_id == Account.id)
            .outerjoin(last_activity_subq, last_activity_subq.c.opportunity_id == Opportunity.id)
            .where(OpportunityStatus.is_terminal == False)  # noqa: E712
            .where(days_stagnant >= threshold_days)
        )
        stmt = self._apply_owner_scope(stmt, current_user, user_id)
        if sbu_id is not None:
            stmt = stmt.where(Opportunity.sbu_id == sbu_id)
        if zone_id is not None:
            stmt = stmt.where(Account.zone_id == zone_id)
        stmt = stmt.order_by(days_stagnant.desc())
        return list(self.db.execute(stmt).all())

    def activity_levels(
        self,
        current_user: UserProfile,
        start: datetime,
        end: datetime,
        *,
        sbu_id: uuid.UUID | None = None,
        zone_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
    ) -> list[Row]:
        # Deliberately no activity_type filter -- Sales Development Activities
        # (training/conference/etc.) are ordinary rows in this same table and
        # should count same as any other logged activity, per the plan.
        stmt = (
            select(
                UserProfile.id.label("user_id"),
                UserProfile.display_name.label("display_name"),
                func.count(Activity.id).label("activity_count"),
            )
            .select_from(Activity)
            .join(UserProfile, Activity.user_id == UserProfile.id)
            .where(Activity.activity_date >= start, Activity.activity_date < end)
            .group_by(UserProfile.id, UserProfile.display_name)
        )
        stmt = self._apply_owner_scope(stmt, current_user, user_id)
        if sbu_id is not None:
            stmt = stmt.where(UserProfile.sbu_id == sbu_id)
        if zone_id is not None:
            # Person-based, not deal-based -- a rep's real zone membership is
            # multi-valued via user_zone (post-Zone-Hierarchy), not the
            # single legacy zone_id column, so filter the same way
            # TEAM_SCOPE_BUILDERS itself determines zone membership.
            stmt = stmt.where(UserProfile.id.in_(select(UserZone.user_id).where(UserZone.zone_id == zone_id)))
        stmt = stmt.order_by(func.count(Activity.id).desc())
        return list(self.db.execute(stmt).all())

    def overdue_actions(
        self,
        current_user: UserProfile,
        end_of_today: datetime,
        *,
        sbu_id: uuid.UUID | None = None,
        zone_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
    ) -> list[Row]:
        stmt = (
            select(
                UserProfile.id.label("user_id"),
                UserProfile.display_name.label("display_name"),
                func.count(Reminder.id).label("overdue_count"),
            )
            .select_from(Reminder)
            .join(UserProfile, Reminder.assigned_to_user_id == UserProfile.id)
            .where(Reminder.is_completed == False, Reminder.due_date <= end_of_today)  # noqa: E712
            .group_by(UserProfile.id, UserProfile.display_name)
        )
        stmt = self._apply_owner_scope(stmt, current_user, user_id)
        if sbu_id is not None:
            stmt = stmt.where(UserProfile.sbu_id == sbu_id)
        if zone_id is not None:
            stmt = stmt.where(UserProfile.id.in_(select(UserZone.user_id).where(UserZone.zone_id == zone_id)))
        stmt = stmt.order_by(func.count(Reminder.id).desc())
        return list(self.db.execute(stmt).all())
