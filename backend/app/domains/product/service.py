import uuid
from decimal import Decimal
from itertools import pairwise

from app.core.exceptions import AuthorizationError, ConflictError, NotFoundError, ValidationError
from app.domains.product.models import Product
from app.domains.product.repository import ProductRepository
from app.domains.product.schemas import ProductCreate, ProductUpdate, ProductUsageResponse

_CATALOG_WRITE_ROLES = {"General Manager", "Admin"}


def _may_see_inactive(include_inactive: bool, role_name: str | None) -> bool:
    """Only the GM and Admin may list inactive products (plan D5); for anyone
    else the request is ignored, not refused."""
    return include_inactive and role_name in _CATALOG_WRITE_ROLES

# The price ladder, highest first (plan D15): Full price >= Rep's lowest >=
# Area Manager's lowest >= CEO's lowest >= Cost. Names match the Add/Edit
# pop-up's boxes.
_PRICE_LADDER = (
    ("full_price_lakhs", "Full price"),
    ("rep_floor_lakhs", "Rep's lowest"),
    ("area_manager_floor_lakhs", "Area Manager's lowest"),
    ("ceo_floor_lakhs", "CEO's lowest"),
    ("cost_lakhs", "Cost"),
)
_LOWEST_FIELDS = ("rep_floor_lakhs", "area_manager_floor_lakhs", "ceo_floor_lakhs")


def _check_price_order(prices: dict[str, Decimal | None]) -> None:
    """Refuse a save that breaks the price ladder (plan D15, BR-CAT-04).
    Equal is allowed. The three lowest prices are all-or-none and need the
    Full price; Cost is optional and is compared with the nearest entered
    price above it. `prices` holds all five values as they would be saved."""
    lowest_entered = [prices[f] is not None for f in _LOWEST_FIELDS]
    if any(lowest_entered) and not all(lowest_entered):
        raise ValidationError(
            "Enter all three lowest prices (Rep's, Area Manager's and CEO's), or leave all three blank"
        )
    if any(lowest_entered) and prices["full_price_lakhs"] is None:
        raise ValidationError("Enter the Full price too, the lowest prices need it")
    entered = [(label, prices[field]) for field, label in _PRICE_LADDER if prices[field] is not None]
    for (upper_label, upper), (lower_label, lower) in pairwise(entered):
        if lower > upper:
            raise ValidationError(f"{lower_label} can't be more than {upper_label}")


class ProductService:
    def __init__(self, repository: ProductRepository):
        self.repository = repository

    def _validate_model_sbu(self, model_id: uuid.UUID, sbu_id: uuid.UUID) -> None:
        """Friendly-error belt-and-suspenders check ahead of the DB trigger/
        FK, which is the real guarantee (docs/Product-Catalog-Name-
        Derivation-Implementation-Plan.md) -- catches a mismatched
        model_id/sbu_id pairing with a clear message instead of a raw
        constraint-violation error."""
        model_sbu_id = self.repository.get_model_sbu_id(model_id)
        if model_sbu_id is None:
            raise NotFoundError(f"Model {model_id} not found")
        if model_sbu_id != sbu_id:
            raise ValidationError(f"Model {model_id} does not belong to SBU {sbu_id}")

    def get_product(self, product_id: uuid.UUID) -> Product:
        product = self.repository.get_by_id(product_id)
        if not product:
            raise NotFoundError(f"Product {product_id} not found")
        return product

    def list_products(
        self,
        *,
        offset: int = 0,
        limit: int = 50,
        search: str | None = None,
        sbu_id: uuid.UUID | None = None,
        include_count: bool = True,
        include_inactive: bool = False,
        role_name: str | None = None,
    ) -> tuple[list[Product], int]:
        return self.repository.list_products(
            offset=offset,
            limit=limit,
            search=search,
            sbu_id=sbu_id,
            active_only=not _may_see_inactive(include_inactive, role_name),
            include_count=include_count,
        )

    def count_products(
        self,
        *,
        search: str | None = None,
        sbu_id: uuid.UUID | None = None,
        include_inactive: bool = False,
        role_name: str | None = None,
    ) -> int:
        return self.repository.count_products(
            search=search,
            sbu_id=sbu_id,
            active_only=not _may_see_inactive(include_inactive, role_name),
        )

    def get_usage(self, product_id: uuid.UUID, *, role_name: str) -> ProductUsageResponse:
        if role_name not in _CATALOG_WRITE_ROLES:
            raise AuthorizationError("Only General Manager and Admin roles can see where a product is used")
        self.get_product(product_id)
        open_opportunities, waiting_leads = self.repository.usage_counts(product_id)
        return ProductUsageResponse(open_opportunity_count=open_opportunities, waiting_lead_count=waiting_leads)

    def deactivate_product(self, product_id: uuid.UUID, *, updated_by: uuid.UUID, role_name: str) -> Product:
        if role_name not in _CATALOG_WRITE_ROLES:
            raise AuthorizationError("Only General Manager and Admin roles can deactivate products")
        product = self.get_product(product_id)
        # The column allows NULL (server default true); NULL counts as active.
        if product.is_active is False:
            raise ConflictError("This product is already inactive")
        product.is_active = False
        product.updated_by = updated_by
        return self.repository.update(product)

    def reactivate_product(self, product_id: uuid.UUID, *, updated_by: uuid.UUID, role_name: str) -> Product:
        if role_name not in _CATALOG_WRITE_ROLES:
            raise AuthorizationError("Only General Manager and Admin roles can reactivate products")
        product = self.get_product(product_id)
        if product.is_active is not False:
            raise ConflictError("This product is already active")
        if self.repository.active_product_exists_for_model(product.model_id, exclude_id=product.id):
            raise ConflictError(
                "Can't reactivate: another active product already exists for this Model. "
                "Deactivate that one first, or leave this one inactive."
            )
        product.is_active = True
        product.updated_by = updated_by
        return self.repository.update(product)

    def create_product(self, data: ProductCreate, *, created_by: uuid.UUID, role_name: str) -> Product:
        if role_name not in _CATALOG_WRITE_ROLES:
            raise AuthorizationError("Only General Manager and Admin roles can add products")
        if not self.repository.sbu_exists(data.sbu_id):
            raise NotFoundError(f"SBU {data.sbu_id} not found")
        self._validate_model_sbu(data.model_id, data.sbu_id)
        _check_price_order({field: getattr(data, field) for field, _ in _PRICE_LADDER})
        if self.repository.active_product_exists_for_model(data.model_id):
            raise ConflictError("A product for this Model already exists in the catalog")
        product = Product(
            sbu_id=data.sbu_id,
            model_id=data.model_id,
            description=data.description,
            product_type=data.product_type,
            full_price_lakhs=data.full_price_lakhs,
            rep_floor_lakhs=data.rep_floor_lakhs,
            area_manager_floor_lakhs=data.area_manager_floor_lakhs,
            ceo_floor_lakhs=data.ceo_floor_lakhs,
            cost_lakhs=data.cost_lakhs,
            created_by=created_by,
            updated_by=created_by,
        )
        return self.repository.create(product)

    def update_product(
        self, product_id: uuid.UUID, data: ProductUpdate, *, updated_by: uuid.UUID, role_name: str
    ) -> Product:
        if role_name not in _CATALOG_WRITE_ROLES:
            raise AuthorizationError("Only General Manager and Admin roles can edit products")
        product = self.repository.get_by_id(product_id)
        if not product:
            raise NotFoundError(f"Product {product_id} not found")
        if data.sbu_id is not None and not self.repository.sbu_exists(data.sbu_id):
            raise NotFoundError(f"SBU {data.sbu_id} not found")
        # Re-validate on EITHER field changing, not just model_id -- an
        # sbu_id-only update must still be checked against the product's
        # existing model, otherwise it silently leaves brand/model/category
        # pointed at the old SBU (found by /code-review, 2026-09-22).
        if data.model_id is not None or data.sbu_id is not None:
            self._validate_model_sbu(data.model_id or product.model_id, data.sbu_id or product.sbu_id)
        model_changed = data.model_id is not None and data.model_id != product.model_id
        if model_changed and self.repository.active_product_exists_for_model(data.model_id, exclude_id=product.id):
            raise ConflictError("A product for this Model already exists in the catalog")
        changes = data.model_dump(exclude_unset=True)
        # The saved values with this edit laid over them -- an edit that sends
        # only one level is still checked against the levels already saved.
        _check_price_order(
            {field: changes[field] if field in changes else getattr(product, field) for field, _ in _PRICE_LADDER}
        )
        for field, value in changes.items():
            setattr(product, field, value)
        product.updated_by = updated_by
        return self.repository.update(product)
