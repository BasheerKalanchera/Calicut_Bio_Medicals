import uuid
from datetime import datetime

from sqlalchemy import Row, String, case, cast, func, or_, select
from sqlalchemy.orm import Session

from app.domains.account.models import Account
from app.domains.activity.models import Activity, Reminder
from app.domains.audit.models import AuditLog
from app.domains.opportunity.models import Opportunity, OpportunityItem
from app.domains.organization.models import UserProfile, UserZone
from app.domains.organization.repository import TEAM_SCOPE_BUILDERS, UNRESTRICTED_ROLES
from app.domains.product.models import Product
from app.domains.reference.models import SBU, Brand, HoldReason, OpportunityStage, OpportunityStatus, Zone

# Net line value: BR-FIN-03 nets BUYBACK lines against PRODUCT lines --
# extended_value_lakhs itself always stores a plain positive amount, the
# netting is applied wherever a total is computed (mirrors
# utils/opportunityItems.ts's netExtendedValue on the frontend).
_NET_VALUE = case(
    (OpportunityItem.line_type == "BUYBACK", -OpportunityItem.extended_value_lakhs),
    else_=OpportunityItem.extended_value_lakhs,
)

_GROUP_BY_COLUMNS = {
    # Cast to String -- PipelineSummaryRow.group_id is now `str` (widened to
    # fit the "product" breakdown's non-UUID Trade-Ins/Returns bucket below),
    # so every branch must hand back a plain string, not a raw UUID.
    "stage": (cast(OpportunityStage.id, String), OpportunityStage.stage_name),
    "rep": (cast(UserProfile.id, String), UserProfile.display_name),
    "sbu": (cast(SBU.id, String), SBU.name),
    "zone": (cast(Zone.id, String), Zone.name),
}

# Buyback lines carry no product_id (schema validator requires a description
# instead), so a plain join to Product would drop them from a by-product
# breakdown entirely -- silently understating how much value that view
# nets out, and overstating totals if this breakdown's rows are ever summed
# and compared against another breakdown's total. Bucketed here instead,
# same "no natural id" idea as product_performance's brand grouping (which
# coalesces to "UNSPECIFIED"), so the by-product rows add back up to the
# same total every other breakdown already produces.
_TRADE_IN_GROUP_ID = "trade-in"
_TRADE_IN_GROUP_NAME = "Trade-Ins / Returns"


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
        if group_by == "product":
            group_id_col = func.coalesce(cast(Product.id, String), _TRADE_IN_GROUP_ID)
            group_name_col = func.coalesce(Product.name, _TRADE_IN_GROUP_NAME)
        else:
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
        )
        if group_by == "product":
            # Outer join -- a Buyback line's product_id is NULL, and it must
            # still appear (bucketed under _TRADE_IN_GROUP_NAME above) rather
            # than being dropped, so the by-product rows reconcile to the
            # same total as every other breakdown.
            stmt = stmt.outerjoin(Product, OpportunityItem.product_id == Product.id)
        stmt = stmt.group_by(group_id_col, group_name_col)
        stmt = self._apply_owner_scope(stmt, current_user, user_id)
        if sbu_id is not None:
            stmt = stmt.where(Opportunity.sbu_id == sbu_id)
        if zone_id is not None:
            stmt = stmt.where(Account.zone_id == zone_id)
        stmt = stmt.order_by(group_name_col)
        return list(self.db.execute(stmt).all())

    def sales_headline(
        self,
        current_user: UserProfile,
        *,
        sbu_id: uuid.UUID | None = None,
        zone_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
        period_start: datetime | None = None,
        period_end: datetime | None = None,
    ) -> Row:
        is_won = OpportunityStatus.status_code == "WON"
        is_lost = OpportunityStatus.status_code == "LOST"

        stmt = (
            select(
                func.coalesce(func.sum(case((is_won, _NET_VALUE), else_=0)), 0).label("revenue_lakhs"),
                func.count(func.distinct(case((is_won, Opportunity.id)))).label("won_count"),
                func.count(func.distinct(case((is_lost, Opportunity.id)))).label("lost_count"),
            )
            .select_from(Opportunity)
            .join(OpportunityItem, OpportunityItem.opportunity_id == Opportunity.id)
            .join(OpportunityStatus, Opportunity.status_id == OpportunityStatus.id)
            .join(UserProfile, Opportunity.owner_id == UserProfile.id)
            .join(Account, Opportunity.account_id == Account.id)
            .where(or_(is_won, is_lost))
        )
        # closed_at is only ever set once a deal reaches Won/Lost (see
        # OpportunityService), so filtering on it here is safe and accurate --
        # a deal touched by neither branch never reaches this WHERE at all.
        if period_start is not None:
            stmt = stmt.where(Opportunity.closed_at >= period_start)
        if period_end is not None:
            stmt = stmt.where(Opportunity.closed_at < period_end)
        stmt = self._apply_owner_scope(stmt, current_user, user_id)
        if sbu_id is not None:
            stmt = stmt.where(Opportunity.sbu_id == sbu_id)
        if zone_id is not None:
            stmt = stmt.where(Account.zone_id == zone_id)
        return self.db.execute(stmt).one()

    def sales_summary(
        self,
        current_user: UserProfile,
        group_by: str,
        *,
        sbu_id: uuid.UUID | None = None,
        zone_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
        period_start: datetime | None = None,
        period_end: datetime | None = None,
    ) -> list[Row]:
        if group_by == "product":
            group_id_col = func.coalesce(cast(Product.id, String), _TRADE_IN_GROUP_ID)
            group_name_col = func.coalesce(Product.name, _TRADE_IN_GROUP_NAME)
        else:
            group_id_col, group_name_col = _GROUP_BY_COLUMNS[group_by]
        is_won = OpportunityStatus.status_code == "WON"

        stmt = (
            select(
                group_id_col.label("group_id"),
                group_name_col.label("group_name"),
                func.coalesce(func.sum(case((is_won, _NET_VALUE), else_=0)), 0).label("revenue_lakhs"),
                func.count(func.distinct(case((is_won, Opportunity.id)))).label("won_count"),
            )
            .select_from(Opportunity)
            .join(OpportunityItem, OpportunityItem.opportunity_id == Opportunity.id)
            .join(OpportunityStatus, Opportunity.status_id == OpportunityStatus.id)
            .join(UserProfile, Opportunity.owner_id == UserProfile.id)
            .join(SBU, Opportunity.sbu_id == SBU.id)
            .join(Account, Opportunity.account_id == Account.id)
            .join(Zone, Account.zone_id == Zone.id)
            .where(is_won)
        )
        if group_by == "product":
            # Outer join, same reasoning as pipeline_summary's -- a Buyback
            # line on a Won deal still needs somewhere to go so this
            # breakdown's rows reconcile to sales_headline's total revenue.
            stmt = stmt.outerjoin(Product, OpportunityItem.product_id == Product.id)
        if period_start is not None:
            stmt = stmt.where(Opportunity.closed_at >= period_start)
        if period_end is not None:
            stmt = stmt.where(Opportunity.closed_at < period_end)
        stmt = stmt.group_by(group_id_col, group_name_col)
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

    def product_performance(
        self,
        current_user: UserProfile,
        group_by: str,
        *,
        sbu_id: uuid.UUID | None = None,
        zone_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
    ) -> list[Row]:
        if group_by == "product":
            group_id_col, group_name_col = cast(Product.id, String), Product.name
        elif group_by == "sbu":
            group_id_col, group_name_col = cast(SBU.id, String), SBU.name
        else:
            # "brand" -- now a real controlled table (docs/Product-Catalog-
            # Name-Derivation-Implementation-Plan.md), joined below. Replaces
            # the old normalized-oem_name-text grouping (no stable id, could
            # split "EDAN"/"Edan" into two rows) -- this is what makes the
            # Product Performance brand drill-down clickable.
            group_id_col, group_name_col = cast(Brand.id, String), Brand.name

        is_won = OpportunityStatus.status_code == "WON"
        is_lost = OpportunityStatus.status_code == "LOST"

        stmt = (
            select(
                group_id_col.label("group_id"),
                group_name_col.label("group_name"),
                func.coalesce(func.sum(case((is_won, OpportunityItem.quantity), else_=0)), 0).label(
                    "quantity_sold"
                ),
                func.coalesce(func.sum(case((is_won, OpportunityItem.extended_value_lakhs), else_=0)), 0).label(
                    "revenue_lakhs"
                ),
                func.count(func.distinct(Opportunity.id)).label("opportunity_count"),
                func.count(func.distinct(case((is_won, Opportunity.id)))).label("won_count"),
                func.count(func.distinct(case((is_lost, Opportunity.id)))).label("lost_count"),
            )
            .select_from(OpportunityItem)
            .join(Opportunity, OpportunityItem.opportunity_id == Opportunity.id)
            .join(OpportunityStatus, Opportunity.status_id == OpportunityStatus.id)
            .join(Product, OpportunityItem.product_id == Product.id)
            .join(Brand, Product.brand_id == Brand.id)
            .join(UserProfile, Opportunity.owner_id == UserProfile.id)
            .join(SBU, Opportunity.sbu_id == SBU.id)
            .join(Account, Opportunity.account_id == Account.id)
            # Buyback lines carry no product_id (schema validator requires a
            # description instead) -- already excluded by the inner join to
            # Product above, no extra filter needed.
            .group_by(group_id_col, group_name_col)
        )
        stmt = self._apply_owner_scope(stmt, current_user, user_id)
        if sbu_id is not None:
            stmt = stmt.where(Opportunity.sbu_id == sbu_id)
        if zone_id is not None:
            stmt = stmt.where(Account.zone_id == zone_id)
        stmt = stmt.order_by(group_name_col)
        return list(self.db.execute(stmt).all())

    def opportunities_on_hold(
        self,
        current_user: UserProfile,
        *,
        sbu_id: uuid.UUID | None = None,
        zone_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
    ) -> list[Row]:
        on_hold_status_id = (
            select(OpportunityStatus.id).where(OpportunityStatus.status_code == "ON_HOLD").scalar_subquery()
        )
        # Days On Hold, from the existing Audit Trail (trg_audit_opportunity,
        # migration 0030) -- not a new column. Most recent audit row for this
        # opportunity where the status genuinely transitioned into On-Hold
        # (old != new), not just any edit made while already on hold.
        last_hold_transition = (
            select(func.max(AuditLog.changed_at))
            .where(
                AuditLog.table_name == "opportunity",
                AuditLog.record_id == Opportunity.id,
                AuditLog.new_data["status_id"].astext == cast(on_hold_status_id, String),
                AuditLog.old_data["status_id"].astext != AuditLog.new_data["status_id"].astext,
            )
            .correlate(Opportunity)
            .scalar_subquery()
        )
        # Fallback only if no such audit row exists -- shouldn't happen for
        # anything held after the audit trail went live (2026-09-02), same
        # fallback shape as Stagnant Deals' created_at fallback.
        hold_started_at = func.coalesce(last_hold_transition, Opportunity.updated_at)
        days_on_hold = func.extract("day", func.now() - hold_started_at)

        stmt = (
            select(
                Opportunity.id.label("opportunity_id"),
                Opportunity.name.label("opportunity_name"),
                Account.name.label("account_name"),
                UserProfile.display_name.label("owner_name"),
                OpportunityStage.stage_name.label("stage_name"),
                HoldReason.reason_name.label("hold_reason"),
                Opportunity.reactivation_date.label("reactivation_date"),
                days_on_hold.label("days_on_hold"),
            )
            .select_from(Opportunity)
            .join(OpportunityStatus, Opportunity.status_id == OpportunityStatus.id)
            .join(OpportunityStage, Opportunity.stage_id == OpportunityStage.id)
            .join(UserProfile, Opportunity.owner_id == UserProfile.id)
            .join(Account, Opportunity.account_id == Account.id)
            .outerjoin(HoldReason, Opportunity.hold_reason_id == HoldReason.id)
            .where(OpportunityStatus.status_code == "ON_HOLD")
        )
        stmt = self._apply_owner_scope(stmt, current_user, user_id)
        if sbu_id is not None:
            stmt = stmt.where(Opportunity.sbu_id == sbu_id)
        if zone_id is not None:
            stmt = stmt.where(Account.zone_id == zone_id)
        stmt = stmt.order_by(days_on_hold.desc())
        return list(self.db.execute(stmt).all())
