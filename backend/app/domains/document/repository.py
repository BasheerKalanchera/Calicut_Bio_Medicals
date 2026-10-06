import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, noload

from app.db.base import BaseRepository
from app.domains.document.models import Document
from app.domains.opportunity.models import Opportunity
from app.domains.product.models import Product

# DocumentResponse shows only the document's own columns, so none of its
# lazy="joined" relationships (each one chaining further: opportunity ->
# account/owner -> zone/role ...) is loaded for the lists.
_NO_RELATED = (
    noload(Document.account),
    noload(Document.project),
    noload(Document.opportunity),
    noload(Document.product),
    noload(Document.uploaded_by_user),
)


class DocumentRepository(BaseRepository[Document]):
    def __init__(self, db: Session):
        super().__init__(Document, db)

    def product_exists(self, product_id: uuid.UUID) -> bool:
        # Plain id check -- db.get would load the product's joined chain.
        return self.db.scalar(select(1).where(Product.id == product_id)) is not None

    def list_by_product(self, product_id: uuid.UUID) -> list[Document]:
        stmt = (
            select(Document)
            .where(Document.product_id == product_id)
            .options(*_NO_RELATED)
            .order_by(Document.uploaded_at.desc())
        )
        return list(self.db.scalars(stmt).all())

    def opportunity_exists(self, opportunity_id: uuid.UUID) -> bool:
        # Plain id check -- db.get would load the Opportunity's joined chain.
        return self.db.scalar(select(1).where(Opportunity.id == opportunity_id)) is not None

    def list_by_opportunity(self, opportunity_id: uuid.UUID) -> list[Document]:
        stmt = (
            select(Document)
            .where(Document.opportunity_id == opportunity_id)
            .options(*_NO_RELATED)
            .order_by(Document.uploaded_at.desc())
        )
        return list(self.db.scalars(stmt).all())
