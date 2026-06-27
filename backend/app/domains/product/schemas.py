import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ProductCreate(BaseModel):
    name: str
    sbu_id: uuid.UUID
    oem_name: str | None = None
    model_number: str | None = None
    category_name: str | None = None
    description: str | None = None


class ProductUpdate(BaseModel):
    name: str | None = None
    sbu_id: uuid.UUID | None = None
    oem_name: str | None = None
    model_number: str | None = None
    category_name: str | None = None
    description: str | None = None


class SBUNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class ProductListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    sbu_id: uuid.UUID
    oem_name: str | None
    model_number: str | None
    category_name: str | None
    is_active: bool | None
    sbu: SBUNested


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    sbu_id: uuid.UUID
    oem_name: str | None
    model_number: str | None
    category_name: str | None
    description: str | None
    is_active: bool | None
    created_at: datetime
    updated_at: datetime
    sbu: SBUNested
