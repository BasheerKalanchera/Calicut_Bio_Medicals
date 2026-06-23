from fastapi import APIRouter

from app.api.schemas import APIResponse

router = APIRouter(tags=["Infrastructure"])


class HealthResponse(APIResponse[dict]):
    pass


class VersionResponse(APIResponse[dict]):
    pass


@router.get("/health")
async def health_check() -> HealthResponse:
    return HealthResponse(data={"status": "healthy"})


@router.get("/version")
async def version() -> VersionResponse:
    from app.core.config import settings

    return VersionResponse(
        data={
            "version": settings.APP_VERSION,
            "environment": settings.APP_ENV,
        }
    )
