import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import BaseRepository
from app.domains.document.models import Document
from app.domains.product.models import Product


class DocumentRepository(BaseRepository[Document]):
    def __init__(self, db: Session):
        super().__init__(Document, db)

    def product_exists(self, product_id: uuid.UUID) -> bool:
        return self.db.get(Product, product_id) is not None

    def list_by_product(self, product_id: uuid.UUID) -> list[Document]:
        stmt = (
            select(Document)
            .where(Document.product_id == product_id)
            .order_by(Document.uploaded_at.desc())
        )
        return list(self.db.scalars(stmt).all())
