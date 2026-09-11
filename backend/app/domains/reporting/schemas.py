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
