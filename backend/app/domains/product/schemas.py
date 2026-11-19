import uuid
from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from typing import Annotated, Any

from pydantic import BaseModel, ConfigDict, Field, model_serializer

# INR Lakhs, NUMERIC(15,2) -- max_digits/decimal_places give a clean 422
# instead of a database overflow error.
PriceLakhs = Annotated[Decimal, Field(ge=0, max_digits=15, decimal_places=2)]


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
    # Prices and cost (migration 0066). Only General Manager / Admin can reach
    # this endpoint at all (ProductService), so no per-field check is needed.
    full_price_lakhs: PriceLakhs | None = None
    rep_floor_lakhs: PriceLakhs | None = None
    area_manager_floor_lakhs: PriceLakhs | None = None
    ceo_floor_lakhs: PriceLakhs | None = None
    cost_lakhs: PriceLakhs | None = None


class ProductUpdate(BaseModel):
    sbu_id: uuid.UUID | None = None
    model_id: uuid.UUID | None = None
    description: str | None = None
    product_type: ProductType | None = None
    # An explicit null clears a price; leaving the key out keeps it.
    full_price_lakhs: PriceLakhs | None = None
    rep_floor_lakhs: PriceLakhs | None = None
    area_manager_floor_lakhs: PriceLakhs | None = None
    ceo_floor_lakhs: PriceLakhs | None = None
    cost_lakhs: PriceLakhs | None = None


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


# ---------------------------------------------------------------------------
# Who sees which price (BR-CAT-04; plan D3, D4, D8). The ONLY place this is
# decided -- a new price level means one new column, one entry here.
# ---------------------------------------------------------------------------
_FULL = "full_price_lakhs"
_REP = "rep_floor_lakhs"
_AREA_MANAGER = "area_manager_floor_lakhs"
_CEO = "ceo_floor_lakhs"
_COST = "cost_lakhs"

_ALL_PRICE_FIELDS = (_FULL, _REP, _AREA_MANAGER, _CEO, _COST)
_FULL_ACCESS_ROLES = {"Admin", "General Manager"}

# One product's page: each role sees the full price and only its own lowest.
# The SBU Manager sees the Area Manager's lowest for now (D3, 2026-11-18).
# Marketing User sees no prices at all (Basheer, 2026-11-18). Any other role
# is treated as a rep.
_PRODUCT_PAGE_FIELDS: dict[str, tuple[str, ...]] = {
    "Area Manager": (_FULL, _AREA_MANAGER),
    "SBU Manager": (_FULL, _AREA_MANAGER),
    "Marketing User": (),
}
_REP_PAGE_FIELDS = (_FULL, _REP)

# The Product Catalog list: nothing for anyone but General Manager / Admin,
# who see the full price and the cost on each block (D4, D9).
_LIST_FIELDS_FULL_ACCESS = (_FULL, _COST)


def product_page_price_fields(role_name: str) -> tuple[str, ...]:
    if role_name in _FULL_ACCESS_ROLES:
        return _ALL_PRICE_FIELDS
    return _PRODUCT_PAGE_FIELDS.get(role_name, _REP_PAGE_FIELDS)


def product_list_price_fields(role_name: str) -> tuple[str, ...]:
    return _LIST_FIELDS_FULL_ACCESS if role_name in _FULL_ACCESS_ROLES else ()


class ProductPrices(BaseModel):
    """Prices a caller may see. A figure the caller may not see, or that has
    not been entered yet, is left out of the response entirely."""

    full_price_lakhs: Decimal | None = None
    rep_floor_lakhs: Decimal | None = None
    area_manager_floor_lakhs: Decimal | None = None
    ceo_floor_lakhs: Decimal | None = None
    cost_lakhs: Decimal | None = None

    @model_serializer(mode="wrap")
    def _leave_out_empty(self, handler: Any) -> Any:
        return {key: value for key, value in handler(self).items() if value is not None}


def _prices_for(product: Any, fields: tuple[str, ...]) -> ProductPrices | None:
    if not fields:
        return None
    return ProductPrices(**{field: getattr(product, field) for field in fields})


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
    prices: ProductPrices | None = None

    @classmethod
    def for_role(cls, product: Any, role_name: str) -> "ProductListResponse":
        response = cls.model_validate(product)
        return response.model_copy(update={"prices": _prices_for(product, product_list_price_fields(role_name))})


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
    prices: ProductPrices | None = None

    @classmethod
    def for_role(cls, product: Any, role_name: str) -> "ProductResponse":
        response = cls.model_validate(product)
        return response.model_copy(update={"prices": _prices_for(product, product_page_price_fields(role_name))})
