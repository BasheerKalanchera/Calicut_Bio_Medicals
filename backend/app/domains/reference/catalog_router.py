import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.schemas import APIResponse
from app.db.session import get_db
from app.domains.organization.models import UserProfile
from app.domains.reference.repository import BrandRepository, CategoryRepository, ModelRepository
from app.domains.reference.schemas import (
    BrandCreate,
    BrandResponse,
    CategoryCreate,
    CategoryResponse,
    ModelCreate,
    ModelResponse,
)
from app.domains.reference.service import CatalogAdminService

router = APIRouter(prefix="/reference", tags=["Product Catalog Reference"])


def _get_service(
    db: Session = Depends(get_db),  # noqa: B008
) -> CatalogAdminService:
    return CatalogAdminService(
        brands=BrandRepository(db), categories=CategoryRepository(db), models=ModelRepository(db)
    )


@router.get("/brands")
def list_brands(
    sbu_id: uuid.UUID = Query(...),  # noqa: B008
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: CatalogAdminService = Depends(_get_service),  # noqa: B008
) -> APIResponse[list[BrandResponse]]:
    return APIResponse(data=[BrandResponse.model_validate(b) for b in service.list_brands(sbu_id=sbu_id)])


@router.post("/brands", status_code=201)
def create_brand(
    body: BrandCreate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: CatalogAdminService = Depends(_get_service),  # noqa: B008
) -> APIResponse[BrandResponse]:
    brand = service.create_brand(body, role_name=current_user.role.role_name)
    return APIResponse(data=BrandResponse.model_validate(brand))


@router.get("/categories")
def list_categories(
    sbu_id: uuid.UUID = Query(...),  # noqa: B008
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: CatalogAdminService = Depends(_get_service),  # noqa: B008
) -> APIResponse[list[CategoryResponse]]:
    return APIResponse(data=[CategoryResponse.model_validate(c) for c in service.list_categories(sbu_id=sbu_id)])


@router.post("/categories", status_code=201)
def create_category(
    body: CategoryCreate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: CatalogAdminService = Depends(_get_service),  # noqa: B008
) -> APIResponse[CategoryResponse]:
    category = service.create_category(body, role_name=current_user.role.role_name)
    return APIResponse(data=CategoryResponse.model_validate(category))


@router.get("/models")
def list_models(
    brand_id: uuid.UUID = Query(...),  # noqa: B008
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: CatalogAdminService = Depends(_get_service),  # noqa: B008
) -> APIResponse[list[ModelResponse]]:
    return APIResponse(data=[ModelResponse.model_validate(m) for m in service.list_models(brand_id=brand_id)])


@router.post("/models", status_code=201)
def create_model(
    body: ModelCreate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: CatalogAdminService = Depends(_get_service),  # noqa: B008
) -> APIResponse[ModelResponse]:
    model = service.create_model(body, role_name=current_user.role.role_name)
    return APIResponse(data=ModelResponse.model_validate(model))
