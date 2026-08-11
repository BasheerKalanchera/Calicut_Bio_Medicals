import uuid

from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.schemas import APIResponse
from app.db.session import get_db
from app.domains.document.repository import DocumentRepository
from app.domains.document.schemas import DocumentCreate, DocumentDownloadUrl, DocumentResponse
from app.domains.document.service import DocumentService
from app.domains.organization.models import UserProfile

router = APIRouter(tags=["Documents"])


def _get_service(
    db: Session = Depends(get_db),  # noqa: B008
) -> DocumentService:
    return DocumentService(repository=DocumentRepository(db))


# ------------------------------------------------------------------
# Product collateral links (Milestone 1 — URL-only, no real upload yet)
# ------------------------------------------------------------------

@router.get("/products/{product_id}/documents")
def list_product_documents(
    product_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: DocumentService = Depends(_get_service),  # noqa: B008
) -> APIResponse[list[DocumentResponse]]:
    documents = service.list_by_product(product_id)
    return APIResponse(data=[DocumentResponse.model_validate(d) for d in documents])


@router.post("/products/{product_id}/documents", status_code=201)
def create_product_document(
    product_id: uuid.UUID,
    body: DocumentCreate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: DocumentService = Depends(_get_service),  # noqa: B008
) -> APIResponse[DocumentResponse]:
    document = service.create_document(product_id, body, uploaded_by=current_user.id)
    return APIResponse(data=DocumentResponse.model_validate(document))


@router.delete("/documents/{document_id}", status_code=204)
def delete_document(
    document_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: DocumentService = Depends(_get_service),  # noqa: B008
) -> None:
    service.delete_document(document_id)


@router.get("/documents/{document_id}/download-url")
def get_document_download_url(
    document_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: DocumentService = Depends(_get_service),  # noqa: B008
) -> APIResponse[DocumentDownloadUrl]:
    return APIResponse(data=service.get_download_url(document_id))


# ------------------------------------------------------------------
# Opportunity documents (real upload -- Supabase Storage, private bucket)
# ------------------------------------------------------------------

@router.get("/opportunities/{opportunity_id}/documents")
def list_opportunity_documents(
    opportunity_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: DocumentService = Depends(_get_service),  # noqa: B008
) -> APIResponse[list[DocumentResponse]]:
    documents = service.list_by_opportunity(opportunity_id)
    return APIResponse(data=[DocumentResponse.model_validate(d) for d in documents])


@router.post("/opportunities/{opportunity_id}/documents", status_code=201)
def create_opportunity_document(
    opportunity_id: uuid.UUID,
    file: UploadFile,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: DocumentService = Depends(_get_service),  # noqa: B008
) -> APIResponse[DocumentResponse]:
    document = service.upload_document(opportunity_id, file, uploaded_by=current_user.id)
    return APIResponse(data=DocumentResponse.model_validate(document))
