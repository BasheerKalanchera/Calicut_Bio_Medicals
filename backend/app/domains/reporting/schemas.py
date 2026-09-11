import uuid
from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict

PipelineGroupBy = Literal["stage", "rep", "sbu", "zone"]


class PipelineSummaryRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    group_id: uuid.UUID
    group_name: str
    opportunity_count: int
    total_value_lakhs: Decimal
    unweighted_forecast_lakhs: Decimal
    weighted_forecast_lakhs: Decimal


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
