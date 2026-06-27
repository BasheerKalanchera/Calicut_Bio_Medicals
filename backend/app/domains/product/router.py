import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.schemas import APIResponse, PaginatedResponse
from app.db.session import get_db
from app.domains.organization.models import UserProfile
from app.domains.product.repository import ProductRepository
from app.domains.product.schemas import ProductCreate, ProductListResponse, ProductResponse, ProductUpdate
from app.domains.product.service import ProductService

router = APIRouter(prefix="/products", tags=["Products"])


def _get_service(
    db: Session = Depends(get_db),  # noqa: B008
) -> ProductService:
    return ProductService(repository=ProductRepository(db))


@router.get("")
async def list_products(
    search: str | None = Query(None),
    sbu_id: uuid.UUID | None = Query(None),  # noqa: B008
    brand: str | None = Query(None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    include_count: bool = Query(default=True),
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ProductService = Depends(_get_service),  # noqa: B008
) -> APIResponse[PaginatedResponse[ProductListResponse]]:
    offset = (page - 1) * page_size
    products, total = service.list_products(
        offset=offset,
        limit=page_size,
        search=search,
        sbu_id=sbu_id,
        brand=brand,
        include_count=include_count,
    )
    total_pages = (total + page_size - 1) // page_size if include_count else 0

    return APIResponse(
        data=PaginatedResponse(
            items=[ProductListResponse.model_validate(p) for p in products],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    )


@router.get("/count")
async def count_products(
    search: str | None = Query(None),
    sbu_id: uuid.UUID | None = Query(None),  # noqa: B008
    brand: str | None = Query(None),
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ProductService = Depends(_get_service),  # noqa: B008
) -> APIResponse[int]:
    return APIResponse(data=service.count_products(search=search, sbu_id=sbu_id, brand=brand))


@router.post("", status_code=201)
async def create_product(
    body: ProductCreate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ProductService = Depends(_get_service),  # noqa: B008
) -> APIResponse[ProductResponse]:
    product = service.create_product(body, created_by=current_user.id)
    return APIResponse(data=ProductResponse.model_validate(product))


@router.get("/{product_id}")
async def get_product(
    product_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ProductService = Depends(_get_service),  # noqa: B008
) -> APIResponse[ProductResponse]:
    product = service.get_product(product_id)
    return APIResponse(data=ProductResponse.model_validate(product))


@router.put("/{product_id}")
async def update_product(
    product_id: uuid.UUID,
    body: ProductUpdate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ProductService = Depends(_get_service),  # noqa: B008
) -> APIResponse[ProductResponse]:
    product = service.update_product(product_id, body, updated_by=current_user.id)
    return APIResponse(data=ProductResponse.model_validate(product))
