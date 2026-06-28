import uuid

from app.core.exceptions import NotFoundError
from app.domains.product.models import Product
from app.domains.product.repository import ProductRepository
from app.domains.product.schemas import ProductCreate, ProductUpdate


class ProductService:
    def __init__(self, repository: ProductRepository):
        self.repository = repository

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

    def create_product(self, data: ProductCreate, *, created_by: uuid.UUID) -> Product:
        if not self.repository.sbu_exists(data.sbu_id):
            raise NotFoundError(f"SBU {data.sbu_id} not found")
        product = Product(
            name=data.name,
            sbu_id=data.sbu_id,
            oem_name=data.oem_name,
            model_number=data.model_number,
            category_name=data.category_name,
            description=data.description,
            created_by=created_by,
            updated_by=created_by,
        )
        return self.repository.create(product)

    def update_product(self, product_id: uuid.UUID, data: ProductUpdate, *, updated_by: uuid.UUID) -> Product:
        product = self.repository.get_by_id(product_id)
        if not product:
            raise NotFoundError(f"Product {product_id} not found")
        if data.sbu_id is not None and not self.repository.sbu_exists(data.sbu_id):
            raise NotFoundError(f"SBU {data.sbu_id} not found")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(product, field, value)
        product.updated_by = updated_by
        return self.repository.update(product)
