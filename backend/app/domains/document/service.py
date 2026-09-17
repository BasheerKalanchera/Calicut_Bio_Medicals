import uuid
from datetime import UTC, datetime, timedelta

from fastapi import UploadFile

from app.core import storage
from app.core.exceptions import AuthorizationError, BusinessRuleViolation, NotFoundError
from app.domains.document.models import Document
from app.domains.document.repository import DocumentRepository
from app.domains.document.schemas import DocumentCreate, DocumentDownloadUrl
from app.domains.organization.models import UserProfile

# BR-ACT-08 -- confirmed file type/size limits for real Opportunity document upload.
ALLOWED_CONTENT_TYPES = {"image/png", "image/jpeg", "application/pdf"}
MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024

_SIGNED_URL_EXPIRY_SECONDS = 300

# Signed Feature 4.1 (Collateral Security) -- Product Catalog collateral links
# are viewable by everyone (reps need them to actually sell), but adding or
# removing one is Admin/General Manager only. Mirrors
# ProductService._CATALOG_WRITE_ROLES. Reused below as the overlay tier for
# deleting an Opportunity-linked document too (resolved 2026-09-17,
# Basheer) -- that used to be deletable by anyone who could merely see the
# deal via RLS; now it's the deal's owner or this same Admin/GM tier.
_CATALOG_COLLATERAL_WRITE_ROLES = {"Admin", "General Manager"}


def _is_external_link(document: Document) -> bool:
    # Product Catalog's collateral links (Milestone 1) store a pasted external
    # URL in storage_path, not a real Storage object -- no bytes to delete or
    # sign. Real uploads always build a bucket-relative "opportunity/..." path.
    return document.storage_path.startswith(("http://", "https://"))


class DocumentService:
    def __init__(self, repository: DocumentRepository):
        self.repository = repository

    def list_by_product(self, product_id: uuid.UUID) -> list[Document]:
        if not self.repository.product_exists(product_id):
            raise NotFoundError(f"Product {product_id} not found")
        return self.repository.list_by_product(product_id)

    def create_document(
        self, product_id: uuid.UUID, data: DocumentCreate, *, uploaded_by: uuid.UUID, role_name: str
    ) -> Document:
        if role_name not in _CATALOG_COLLATERAL_WRITE_ROLES:
            raise AuthorizationError("Only Admin/General Manager can add Product Catalog collateral")
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

    def list_by_opportunity(self, opportunity_id: uuid.UUID) -> list[Document]:
        if not self.repository.opportunity_exists(opportunity_id):
            raise NotFoundError(f"Opportunity {opportunity_id} not found")
        return self.repository.list_by_opportunity(opportunity_id)

    def upload_document(
        self, opportunity_id: uuid.UUID, file: UploadFile, *, uploaded_by: uuid.UUID
    ) -> Document:
        if not self.repository.opportunity_exists(opportunity_id):
            raise NotFoundError(f"Opportunity {opportunity_id} not found")
        if file.content_type not in ALLOWED_CONTENT_TYPES:
            raise BusinessRuleViolation(
                f"Unsupported file type '{file.content_type}'. Allowed: PNG, JPEG, PDF."
            )
        if not file.filename:
            raise BusinessRuleViolation("Uploaded file must have a name.")

        content = file.file.read()
        if len(content) > MAX_FILE_SIZE_BYTES:
            raise BusinessRuleViolation("File exceeds the 4MB size limit.")

        path = f"opportunity/{opportunity_id}/{uuid.uuid4()}-{file.filename}"
        storage.upload(path, content, file.content_type)

        document = Document(
            opportunity_id=opportunity_id,
            file_name=file.filename,
            file_type=file.content_type,
            storage_path=path,
            file_size_bytes=len(content),
            uploaded_by_user_id=uploaded_by,
        )
        return self.repository.create(document)

    def get_download_url(self, document_id: uuid.UUID) -> DocumentDownloadUrl:
        # RLS-scoped session already gates this read correctly -- a document
        # outside the caller's tier visibility comes back as None here, same
        # as any other RLS-protected lookup.
        document = self.repository.get_by_id(document_id)
        if document is None:
            raise NotFoundError(f"Document {document_id} not found")
        if _is_external_link(document):
            raise BusinessRuleViolation(
                "This document is an external link, not a stored file -- open storage_path directly."
            )
        url = storage.create_signed_url(document.storage_path, _SIGNED_URL_EXPIRY_SECONDS)
        expires_at = datetime.now(UTC) + timedelta(seconds=_SIGNED_URL_EXPIRY_SECONDS)
        return DocumentDownloadUrl(url=url, expires_at=expires_at)

    def delete_document(self, document_id: uuid.UUID, *, current_user: UserProfile) -> None:
        document = self.repository.get_by_id(document_id)
        if document is None:
            raise NotFoundError(f"Document {document_id} not found")
        role_name = current_user.role.role_name
        if document.product_id is not None:
            if role_name not in _CATALOG_COLLATERAL_WRITE_ROLES:
                raise AuthorizationError("Only Admin/General Manager can remove Product Catalog collateral")
        elif document.opportunity_id is not None:
            is_owner = document.opportunity.owner_id == current_user.id
            if not (is_owner or role_name in _CATALOG_COLLATERAL_WRITE_ROLES):
                raise AuthorizationError("Only the deal's owner or Admin/General Manager can remove this document")
        # Delete the Storage object before the DB row: if Storage delete fails,
        # the DB row survives and the orphan is visible/retryable. The reverse
        # order could leave an orphaned file with no DB record pointing at it.
        if not _is_external_link(document):
            storage.delete(document.storage_path)
        self.repository.delete(document)
