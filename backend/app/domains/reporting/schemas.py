import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from zoneinfo import ZoneInfo

from pydantic import BaseModel, ConfigDict, field_validator

from app.domains.activity.schemas import ReminderResponse

_IST = ZoneInfo("Asia/Kolkata")

PipelineGroupBy = Literal["stage", "rep", "sbu", "zone", "product", "brand"]


class PipelineSummaryRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    # str, not uuid.UUID -- the "product" breakdown's Trade-Ins/Returns
    # bucket (see reporting/repository.py's _TRADE_IN_GROUP_ID) has no real
    # underlying row, same reasoning as ProductPerformanceRow.group_id.
    group_id: str
    group_name: str
    opportunity_count: int
    total_value_lakhs: Decimal
    unweighted_forecast_lakhs: Decimal
    weighted_forecast_lakhs: Decimal
    # Zone breakdown only (docs/Zone-Tree-In-Reports-Implementation-Plan.md):
    # tree indent level, and true on a "<zone> (not in a sub-zone)" row,
    # whose drill must match that zone exactly rather than zone + subtree.
    depth: int | None = None
    zone_exact: bool | None = None


class PipelineSummaryResponse(BaseModel):
    group_by: PipelineGroupBy
    rows: list[PipelineSummaryRow]


class StagnantDealRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    opportunity_id: uuid.UUID
    opportunity_name: str
    account_name: str
    owner_name: str
    stage_name: str
    last_activity_date: date | None
    days_stagnant: int

    # The query hands back a timestamp (last contact, or created_at when there
    # is none); a `date` field refuses one that isn't exactly midnight.
    @field_validator("last_activity_date", mode="before")
    @classmethod
    def _to_ist_day(cls, value):
        if isinstance(value, datetime):
            return value.astimezone(_IST).date()
        return value


class StagnantDealsResponse(BaseModel):
    threshold_days: int
    rows: list[StagnantDealRow]


class RepActivityLevelRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: uuid.UUID
    display_name: str
    activity_count: int


class RepActivityLevelResponse(BaseModel):
    start_date: date
    end_date: date
    rows: list[RepActivityLevelRow]


class OverdueActionRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: uuid.UUID
    display_name: str
    overdue_count: int


class OverdueActionsResponse(BaseModel):
    rows: list[OverdueActionRow]
    total_overdue: int


class WeeklyFollowupOpportunityRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    opportunity_id: uuid.UUID
    opportunity_name: str
    account_id: uuid.UUID
    account_name: str
    owner_id: uuid.UUID
    owner_name: str
    stage_name: str
    win_probability: Decimal
    value_lakhs: Decimal
    is_high_priority: bool
    expected_closure_date: date | None
    # A timestamp (activity_date / created_at), not a date -- pydantic refuses
    # a datetime with a time part into a `date` field.
    last_contact_date: datetime
    days_since_contact: int
    # "Closing date passed" only: whole days since the expected closing date.
    days_past_closing: int | None = None


class WeeklyFollowupOpportunityList(BaseModel):
    count: int
    value_lakhs: Decimal
    rows: list[WeeklyFollowupOpportunityRow]


class WeeklyFollowupNextActionList(BaseModel):
    # Count only, no rupee total -- many next actions sit on a hospital with
    # no Opportunity value (D21). Rows are the Next Actions screen's own
    # shape, so "Done" opens the close form with them directly (D26).
    count: int
    rows: list[ReminderResponse]


class WeeklyFollowupHospitalRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    account_id: uuid.UUID
    account_name: str
    # The viewed person's own latest visit/call/meeting/email at the hospital,
    # or None if never (D27, D28); timestamps, as on the Opportunity rows.
    last_visit_date: datetime | None
    # Earliest open next action assigned to them there, Opportunities' included (D29).
    next_action_due: datetime | None


class WeeklyFollowupHospitalList(BaseModel):
    count: int
    rows: list[WeeklyFollowupHospitalRow]


class WeeklyFollowupResponse(BaseModel):
    """My Work (Weekly Follow-up, signed requirement 11.1) for one person.
    docs/Weekly-Follow-up-Daily-Hub-Implementation-Plan.md"""

    user_id: uuid.UUID
    idle_days: int
    today: date
    week_end: date
    high_priority: WeeklyFollowupOpportunityList
    closing_date_passed: WeeklyFollowupOpportunityList
    not_visited: WeeklyFollowupOpportunityList
    overdue_next_actions: WeeklyFollowupNextActionList
    next_actions_this_week: WeeklyFollowupNextActionList
    # Step 5: the hospitals on their approved plan for the quarter `today` falls in.
    planning_period: str
    planned_hospitals: WeeklyFollowupHospitalList


ProductPerformanceGroupBy = Literal["product", "brand", "sbu"]


class ProductPerformanceRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    # str, not uuid.UUID -- "brand" grouping has no real id, just the
    # normalized oem_name text itself (see repository.py).
    group_id: str
    group_name: str
    quantity_sold: int
    revenue_lakhs: Decimal
    avg_selling_price_lakhs: Decimal
    opportunity_count: int
    won_count: int
    lost_count: int


class ProductPerformanceResponse(BaseModel):
    group_by: ProductPerformanceGroupBy
    rows: list[ProductPerformanceRow]


class OpportunityOnHoldRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    opportunity_id: uuid.UUID
    opportunity_name: str
    account_name: str
    owner_name: str
    stage_name: str
    hold_reason: str | None
    reactivation_date: date | None
    days_on_hold: int


class OpportunitiesOnHoldResponse(BaseModel):
    rows: list[OpportunityOnHoldRow]


SalesGroupBy = Literal["rep", "sbu", "zone", "product", "brand"]


class SalesHeadline(BaseModel):
    revenue_lakhs: Decimal
    won_count: int
    lost_count: int
    win_rate: Decimal
    avg_deal_size_lakhs: Decimal


class SalesSummaryRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    # str, not uuid.UUID -- same reasoning as PipelineSummaryRow.group_id:
    # the "product" breakdown's Trade-Ins/Returns bucket has no real row.
    group_id: str
    group_name: str
    revenue_lakhs: Decimal
    won_count: int
    # Zone breakdown only -- see PipelineSummaryRow.
    depth: int | None = None
    zone_exact: bool | None = None


class SalesSummaryResponse(BaseModel):
    group_by: SalesGroupBy
    rows: list[SalesSummaryRow]
