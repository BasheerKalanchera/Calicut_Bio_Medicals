import uuid

from app.core.exceptions import NotFoundError
from app.domains.document.models import Document
from app.domains.document.repository import DocumentRepository
from app.domains.document.schemas import DocumentCreate


class DocumentService:
    def __init__(self, repository: DocumentRepository):
        self.repository = repository

    def list_by_product(self, product_id: uuid.UUID) -> list[Document]:
        if not self.repository.product_exists(product_id):
            raise NotFoundError(f"Product {product_id} not found")
        return self.repository.list_by_product(product_id)

    def create_document(
        self, product_id: uuid.UUID, data: DocumentCreate, *, uploaded_by: uuid.UUID
    ) -> Document:
        if not self.repository.product_exists(product_id):
            raise NotFoundError(f"Product {product_id} not found")
        document = Document(
            product_id=product_id,
            file_name=data.file_name,
            file_type=data.file_type,
            storage_path=data.storage_path,
            file_size_bytes=None,
            uploaded_by_user_id=uploaded_by,
        )
        return self.repository.create(document)

    def delete_document(self, document_id: uuid.UUID) -> None:
        document = self.repository.get_by_id(document_id)
        if document is None:
            raise NotFoundError(f"Document {document_id} not found")
        self.repository.delete(document)
