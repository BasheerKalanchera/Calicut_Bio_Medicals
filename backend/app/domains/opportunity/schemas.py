import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class SBUNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class ProductNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class OpportunityItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(..., gt=0)
    unit_price_lakhs: Decimal = Field(..., ge=0)
    discount_lakhs: Decimal = Field(Decimal("0"), ge=0)


class OpportunityItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    unit_price_lakhs: Decimal
    discount_lakhs: Decimal
    extended_value_lakhs: Decimal
    product: ProductNested


class OpportunityCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    owner_id: uuid.UUID
    stage_id: uuid.UUID
    status_id: uuid.UUID
    win_probability: Decimal = Field(..., ge=0, le=100)
    project_id: uuid.UUID | None = None
    lead_source_id: uuid.UUID | None = None
    indicative_value: Decimal | None = None
    items: list[OpportunityItemCreate] = []


class OpportunityUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    owner_id: uuid.UUID | None = None
    stage_id: uuid.UUID | None = None
    status_id: uuid.UUID | None = None
    win_probability: Decimal | None = Field(None, ge=0, le=100)
    project_id: uuid.UUID | None = None
    lead_source_id: uuid.UUID | None = None
    indicative_value: Decimal | None = None


class OpportunityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    account_id: uuid.UUID
    sbu_id: uuid.UUID
    name: str
    owner_id: uuid.UUID
    stage_id: uuid.UUID
    status_id: uuid.UUID
    win_probability: Decimal
    project_id: uuid.UUID | None
    lead_source_id: uuid.UUID | None
    indicative_value: Decimal | None
    created_at: datetime
    updated_at: datetime
    sbu: SBUNested
