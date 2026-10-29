import uuid
from datetime import date, datetime, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

from app.core.periods import ist_midnight, quarter_of, today_ist
from app.domains.activity.schemas import ReminderResponse
from app.domains.organization.models import UserProfile
from app.domains.organization.repository import TEAM_SCOPE_BUILDERS, UNRESTRICTED_ROLES
from app.domains.reporting.repository import ReportingRepository
from app.domains.reporting.schemas import (
    OpportunitiesOnHoldResponse,
    OpportunityOnHoldRow,
    OverdueActionRow,
    OverdueActionsResponse,
    PipelineGroupBy,
    PipelineSummaryResponse,
    PipelineSummaryRow,
    ProductPerformanceGroupBy,
    ProductPerformanceResponse,
    ProductPerformanceRow,
    RepActivityLevelResponse,
    RepActivityLevelRow,
    SalesGroupBy,
    SalesHeadline,
    SalesSummaryResponse,
    SalesSummaryRow,
    StagnantDealRow,
    StagnantDealsResponse,
    WeeklyFollowupHospitalList,
    WeeklyFollowupHospitalRow,
    WeeklyFollowupNextActionList,
    WeeklyFollowupOpportunityList,
    WeeklyFollowupOpportunityRow,
    WeeklyFollowupResponse,
)

_IST = ZoneInfo("Asia/Kolkata")

# My Work's "High priority or 70 %+" list (D3).
_HIGH_CHANCE = Decimal(70)


def _opportunity_list(rows: list[WeeklyFollowupOpportunityRow]) -> WeeklyFollowupOpportunityList:
    # Each card's own count and rupee total; never a grand total across
    # cards, which would count the same Opportunity more than once (D3).
    return WeeklyFollowupOpportunityList(
        count=len(rows), value_lakhs=sum((r.value_lakhs for r in rows), Decimal(0)), rows=rows
    )


def _has_team_to_roll_up(current_user: UserProfile) -> bool:
    # The one thing that distinguishes an individual contributor (Sales
    # Staff today) from every other tier: no scope_builder, and not an
    # unrestricted overlay role either. Checked generically rather than by
    # role-name string so this doesn't silently break if a new
    # individual-contributor role is ever added.
    role_name = current_user.role.role_name
    return role_name in UNRESTRICTED_ROLES or TEAM_SCOPE_BUILDERS.get(role_name) is not None


_NOT_IN_SUB_ZONE = "{} (not in a sub-zone)"


def _zone_tree_rows(rows, zones, count_field: str, sum_fields: tuple[str, ...]) -> list[dict]:
    """Roll exact-zone report rows up the zone tree.

    The repository groups each deal under its account's own zone -- one zone
    per deal, so child totals can simply be added into every ancestor. Output
    is in tree order (siblings alphabetical), each row carrying its depth.
    Zones with no deals are dropped. Where a zone has deals tagged directly
    to it *and* sub-zones with deals, its direct deals get their own
    "<zone> (not in a sub-zone)" row, so the rows under a parent add up to
    the parent. (No such row when all of a zone's deals are direct -- it
    would just repeat the parent.) docs/Zone-Tree-In-Reports-Implementation-Plan.md
    """
    fields = (count_field, *sum_fields)
    zero = {count_field: 0, **{f: Decimal(0) for f in sum_fields}}
    direct = {r.group_id: {f: getattr(r, f) for f in fields} for r in rows}
    names = {str(z.id): z.name for z in zones}
    children: dict[str | None, list[str]] = {}
    for z in zones:
        parent = str(z.parent_zone_id) if z.parent_zone_id else None
        children.setdefault(parent, []).append(str(z.id))

    totals: dict[str, dict] = {}

    def total(zone_id: str) -> dict:
        t = dict(direct.get(zone_id, zero))
        for child in children.get(zone_id, []):
            ct = total(child)
            for f in fields:
                t[f] += ct[f]
        totals[zone_id] = t
        return t

    for root in children.get(None, []):
        total(root)

    out: list[dict] = []

    def emit(zone_id: str, depth: int) -> None:
        if totals[zone_id][count_field] == 0:
            return
        out.append({"group_id": zone_id, "group_name": names[zone_id], "depth": depth, **totals[zone_id]})
        kids = sorted(
            (c for c in children.get(zone_id, []) if totals[c][count_field] > 0),
            key=lambda c: names[c],
        )
        for child in kids:
            emit(child, depth + 1)
        own = direct.get(zone_id)
        if kids and own and own[count_field] > 0:
            out.append({
                "group_id": zone_id,
                "group_name": _NOT_IN_SUB_ZONE.format(names[zone_id]),
                "depth": depth + 1,
                "zone_exact": True,
                **own,
            })

    for root in sorted(children.get(None, []), key=lambda z: names[z]):
        emit(root, 0)
    return out


class ReportingService:
    def __init__(self, repository: ReportingRepository):
        self.repository = repository

    def pipeline_summary(
        self,
        current_user: UserProfile,
        group_by: PipelineGroupBy,
        *,
        sbu_id: uuid.UUID | None = None,
        zone_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
    ) -> PipelineSummaryResponse:
        rows = self.repository.pipeline_summary(
            current_user, group_by, sbu_id=sbu_id, zone_id=zone_id, user_id=user_id
        )
        if group_by == "zone":
            rows = _zone_tree_rows(
                rows,
                self.repository.zone_tree(),
                "opportunity_count",
                ("total_value_lakhs", "unweighted_forecast_lakhs", "weighted_forecast_lakhs"),
            )
        return PipelineSummaryResponse(
            group_by=group_by,
            rows=[PipelineSummaryRow.model_validate(r) for r in rows],
        )

    def sales_headline(
        self,
        current_user: UserProfile,
        *,
        sbu_id: uuid.UUID | None = None,
        zone_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
        period_start: datetime | None = None,
        period_end: datetime | None = None,
    ) -> SalesHeadline:
        row = self.repository.sales_headline(
            current_user,
            sbu_id=sbu_id,
            zone_id=zone_id,
            user_id=user_id,
            period_start=period_start,
            period_end=period_end,
        )
        total_closed = row.won_count + row.lost_count
        win_rate = Decimal(row.won_count) / total_closed if total_closed else Decimal(0)
        avg_deal_size = row.revenue_lakhs / row.won_count if row.won_count else Decimal(0)
        return SalesHeadline(
            revenue_lakhs=row.revenue_lakhs,
            won_count=row.won_count,
            lost_count=row.lost_count,
            win_rate=win_rate,
            avg_deal_size_lakhs=avg_deal_size,
        )

    def sales_summary(
        self,
        current_user: UserProfile,
        group_by: SalesGroupBy,
        *,
        sbu_id: uuid.UUID | None = None,
        zone_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
        period_start: datetime | None = None,
        period_end: datetime | None = None,
    ) -> SalesSummaryResponse:
        rows = self.repository.sales_summary(
            current_user,
            group_by,
            sbu_id=sbu_id,
            zone_id=zone_id,
            user_id=user_id,
            period_start=period_start,
            period_end=period_end,
        )
        if group_by == "zone":
            rows = _zone_tree_rows(rows, self.repository.zone_tree(), "won_count", ("revenue_lakhs",))
        return SalesSummaryResponse(
            group_by=group_by,
            rows=[SalesSummaryRow.model_validate(r) for r in rows],
        )

    def stagnant_deals(
        self,
        current_user: UserProfile,
        *,
        threshold_days: int = 180,
        sbu_id: uuid.UUID | None = None,
        zone_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
    ) -> StagnantDealsResponse:
        rows = self.repository.stagnant_deals(
            current_user, threshold_days=threshold_days, sbu_id=sbu_id, zone_id=zone_id, user_id=user_id
        )
        return StagnantDealsResponse(
            threshold_days=threshold_days,
            rows=[StagnantDealRow.model_validate(r) for r in rows],
        )

    def activity_levels(
        self,
        current_user: UserProfile,
        start_date: date,
        end_date: date,
        *,
        sbu_id: uuid.UUID | None = None,
        zone_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
    ) -> RepActivityLevelResponse:
        start = datetime(start_date.year, start_date.month, start_date.day, tzinfo=_IST)
        end = datetime(end_date.year, end_date.month, end_date.day, tzinfo=_IST) + timedelta(days=1)
        rows = self.repository.activity_levels(
            current_user, start, end, sbu_id=sbu_id, zone_id=zone_id, user_id=user_id
        )
        return RepActivityLevelResponse(
            start_date=start_date,
            end_date=end_date,
            rows=[RepActivityLevelRow.model_validate(r) for r in rows],
        )

    def overdue_actions(
        self,
        current_user: UserProfile,
        *,
        sbu_id: uuid.UUID | None = None,
        zone_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
    ) -> OverdueActionsResponse:
        # Team-rollup only (resolved 2026-08-25, Insights-Dashboard-
        # Implementation-Plan.md Open questions §3) -- an individual
        # contributor already gets this exact count on their own login bell,
        # so this tile would be pure duplication for them. Empty result, not
        # a 403 -- this endpoint has no role gate on visibility, it just has
        # nothing to show a role with no team.
        if not _has_team_to_roll_up(current_user):
            return OverdueActionsResponse(rows=[], total_overdue=0)

        end_of_today = datetime.now(_IST).replace(hour=23, minute=59, second=59, microsecond=999999)
        rows = self.repository.overdue_actions(
            current_user, end_of_today, sbu_id=sbu_id, zone_id=zone_id, user_id=user_id
        )
        by_person = {r.user_id: OverdueActionRow.model_validate(r) for r in rows}
        for r in self.repository.past_closing_by_owner(
            current_user, today_ist(), sbu_id=sbu_id, zone_id=zone_id, user_id=user_id
        ):
            row = by_person.get(r.user_id) or OverdueActionRow(user_id=r.user_id, display_name=r.display_name)
            by_person[r.user_id] = row.model_copy(
                update={
                    "past_closing_count": r.past_closing_count,
                    "past_closing_value_lakhs": Decimal(r.past_closing_value_lakhs),
                }
            )
        # D11: someone with nothing overdue and nothing late isn't listed.
        parsed = sorted(
            (r for r in by_person.values() if r.overdue_count or r.past_closing_count),
            key=lambda r: (-r.overdue_count, -r.past_closing_count, r.display_name),
        )
        return OverdueActionsResponse(rows=parsed, total_overdue=sum(r.overdue_count for r in parsed))

    def weekly_followup(
        self,
        current_user: UserProfile,
        *,
        user_id: uuid.UUID | None = None,
        idle_days: int = 30,
        today: date | None = None,
    ) -> WeeklyFollowupResponse:
        """My Work for one person -- the viewer, or (for a manager) one rep
        picked by name; there is no team-wide view (D1, Basheer 2026-10-28).
        A rep outside the viewer's team gets empty lists, not a 403, same as
        the other reports' user filter."""
        target_id = user_id or current_user.id
        today = today or today_ist()
        # D7: the week is Monday-Sunday, India time. D17: overdue means due by
        # the end of today, so "this week" holds only what is due after today.
        week_end = today + timedelta(days=6 - today.weekday())
        end_of_today = ist_midnight(today + timedelta(days=1)) - timedelta(microseconds=1)
        end_of_week = ist_midnight(week_end + timedelta(days=1)) - timedelta(microseconds=1)

        opportunities = [
            WeeklyFollowupOpportunityRow.model_validate(r)
            for r in self.repository.weekly_followup_opportunities(current_user, target_id)
        ]
        # D3: high priority (BR-OP-15) or 70 %+ chance; the screen's
        # "70 %+ only" tick box filters on win_probability.
        high_priority = sorted(
            (o for o in opportunities if o.is_high_priority or o.win_probability >= _HIGH_CHANCE),
            key=lambda o: (-o.win_probability, -o.value_lakhs),
        )
        closing_date_passed = sorted(
            (
                o.model_copy(update={"days_past_closing": (today - o.expected_closure_date).days})
                for o in opportunities
                if o.expected_closure_date is not None and o.expected_closure_date < today
            ),
            key=lambda o: o.expected_closure_date,
        )
        # BR-OP-20: N days or more (D20).
        not_visited = sorted(
            (o for o in opportunities if o.days_since_contact >= idle_days),
            key=lambda o: -o.days_since_contact,
        )

        actions = [
            ReminderResponse.model_validate(r)
            for r in self.repository.weekly_followup_next_actions(current_user, target_id, end_of_week)
        ]
        overdue = [a for a in actions if a.due_date <= end_of_today]
        this_week = [a for a in actions if a.due_date > end_of_today]

        # Step 5. Folded by hospital: a person on two plans this quarter (one
        # per SBU) can have the same hospital on both. Never-visited first,
        # then longest since the last visit -- who to go and see.
        planning_period = quarter_of(today)
        hospitals = {
            r.account_id: WeeklyFollowupHospitalRow.model_validate(r)
            for r in self.repository.weekly_followup_planned_hospitals(current_user, target_id, planning_period)
        }.values()
        hospital_rows = sorted(
            hospitals,
            key=lambda h: (h.last_visit_date is not None, h.last_visit_date or datetime.min, h.account_name),
        )

        return WeeklyFollowupResponse(
            user_id=target_id,
            idle_days=idle_days,
            today=today,
            week_end=week_end,
            high_priority=_opportunity_list(high_priority),
            closing_date_passed=_opportunity_list(closing_date_passed),
            not_visited=_opportunity_list(not_visited),
            overdue_next_actions=WeeklyFollowupNextActionList(count=len(overdue), rows=overdue),
            next_actions_this_week=WeeklyFollowupNextActionList(count=len(this_week), rows=this_week),
            planning_period=planning_period,
            planned_hospitals=WeeklyFollowupHospitalList(count=len(hospital_rows), rows=hospital_rows),
        )

    def product_performance(
        self,
        current_user: UserProfile,
        group_by: ProductPerformanceGroupBy,
        *,
        sbu_id: uuid.UUID | None = None,
        zone_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
    ) -> ProductPerformanceResponse:
        rows = self.repository.product_performance(
            current_user, group_by, sbu_id=sbu_id, zone_id=zone_id, user_id=user_id
        )
        parsed = []
        for r in rows:
            # Average Selling Price isn't a SQL-level SUM -- computed here to
            # avoid a division-by-zero case inside the query itself.
            avg_price = (r.revenue_lakhs / r.quantity_sold) if r.quantity_sold else Decimal("0")
            parsed.append(
                ProductPerformanceRow(
                    group_id=r.group_id,
                    group_name=r.group_name,
                    quantity_sold=r.quantity_sold,
                    revenue_lakhs=r.revenue_lakhs,
                    avg_selling_price_lakhs=avg_price,
                    opportunity_count=r.opportunity_count,
                    won_count=r.won_count,
                    lost_count=r.lost_count,
                )
            )
        return ProductPerformanceResponse(group_by=group_by, rows=parsed)

    def opportunities_on_hold(
        self,
        current_user: UserProfile,
        *,
        sbu_id: uuid.UUID | None = None,
        zone_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
    ) -> OpportunitiesOnHoldResponse:
        rows = self.repository.opportunities_on_hold(current_user, sbu_id=sbu_id, zone_id=zone_id, user_id=user_id)
        return OpportunitiesOnHoldResponse(rows=[OpportunityOnHoldRow.model_validate(r) for r in rows])
