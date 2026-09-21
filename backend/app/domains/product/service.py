import uuid

from app.core.exceptions import AuthorizationError, NotFoundError, ValidationError
from app.domains.product.models import Product
from app.domains.product.repository import ProductRepository
from app.domains.product.schemas import ProductCreate, ProductUpdate

_CATALOG_WRITE_ROLES = {"General Manager", "Admin"}


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
    ) -> tuple[list[Product], int]:
        return self.repository.list_products(
            offset=offset,
            limit=limit,
            search=search,
            sbu_id=sbu_id,
            include_count=include_count,
        )

    def count_products(
        self,
        *,
        search: str | None = None,
        sbu_id: uuid.UUID | None = None,
    ) -> int:
        return self.repository.count_products(search=search, sbu_id=sbu_id)

    def create_product(self, data: ProductCreate, *, created_by: uuid.UUID, role_name: str) -> Product:
        if role_name not in _CATALOG_WRITE_ROLES:
            raise AuthorizationError("Only General Manager and Admin roles can add products")
        if not self.repository.sbu_exists(data.sbu_id):
            raise NotFoundError(f"SBU {data.sbu_id} not found")
        self._validate_model_sbu(data.model_id, data.sbu_id)
        product = Product(
            sbu_id=data.sbu_id,
            model_id=data.model_id,
            description=data.description,
            product_type=data.product_type,
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
        if data.model_id is not None:
            self._validate_model_sbu(data.model_id, data.sbu_id or product.sbu_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(product, field, value)
        product.updated_by = updated_by
        return self.repository.update(product)
