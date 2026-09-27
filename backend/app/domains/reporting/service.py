import uuid
from datetime import date, datetime, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

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
)

_IST = ZoneInfo("Asia/Kolkata")


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
        parsed = [OverdueActionRow.model_validate(r) for r in rows]
        return OverdueActionsResponse(rows=parsed, total_overdue=sum(r.overdue_count for r in parsed))

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
