import uuid

from app.core.exceptions import NotFoundError
from app.domains.product.models import Product
from app.domains.product.repository import ProductRepository


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
        brand: str | None = None,
    ) -> tuple[list[Product], int]:
        return self.repository.list_products(
            offset=offset,
            limit=limit,
            search=search,
            sbu_id=sbu_id,
            brand=brand,
        )
