import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict


class ProductType(StrEnum):
    NEW_EQUIPMENT = "NEW_EQUIPMENT"
    REFURBISHED = "REFURBISHED"
    ACCESSORY = "ACCESSORY"


class ProductCreate(BaseModel):
    sbu_id: uuid.UUID
    # brand_id/category_id are server-derived from model_id (trg_product_sync_
    # brand_category_name, migration 0049) -- not client-settable, same for
    # `name`, which is computed from all three.
    model_id: uuid.UUID
    description: str | None = None
    product_type: ProductType = ProductType.NEW_EQUIPMENT


class ProductUpdate(BaseModel):
    sbu_id: uuid.UUID | None = None
    model_id: uuid.UUID | None = None
    description: str | None = None
    product_type: ProductType | None = None


class SBUNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class BrandNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class CategoryNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class ModelNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class ProductListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    sbu_id: uuid.UUID
    brand_id: uuid.UUID
    model_id: uuid.UUID
    category_id: uuid.UUID
    product_type: str
    is_active: bool | None
    sbu: SBUNested
    brand: BrandNested
    model: ModelNested
    category: CategoryNested


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    sbu_id: uuid.UUID
    brand_id: uuid.UUID
    model_id: uuid.UUID
    category_id: uuid.UUID
    description: str | None
    product_type: str
    is_active: bool | None
    created_at: datetime
    updated_at: datetime
    sbu: SBUNested
    brand: BrandNested
    model: ModelNested
    category: CategoryNested
