from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routers import auth, health, master_data
from app.api.schemas import ErrorResponse
from app.core.config import settings
from app.core.exceptions import (
    AuthenticationError,
    AuthorizationError,
    BusinessRuleViolation,
    ConflictError,
    NotFoundError,
    ValidationError,
)
from app.core.logging import logger, setup_logging
from app.db.session import warm_pool
from app.domains.account import router as account_router
from app.domains.account import stakeholder_router
from app.domains.activity import router as activity_router
from app.domains.asset import router as asset_router
from app.domains.opportunity import router as opportunity_router
from app.domains.product import router as product_router
from app.domains.project import router as project_router
from app.middleware.correlation_id import CorrelationIdMiddleware


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Startup: pre-warm the DB connection pool so the first user request is fast.

    warm_pool() performs a blocking TCP connection to Supabase (~4-6s).
    Running it in a thread executor lets the server start accepting requests
    immediately while the pool warms up concurrently in the background.
    """
    import asyncio

    loop = asyncio.get_event_loop()
    logger.info("warming_db_pool")
    await loop.run_in_executor(None, warm_pool)
    logger.info("db_pool_warmed")
    yield


def create_app() -> FastAPI:
    setup_logging(settings.LOG_LEVEL)

    application = FastAPI(
        title="Cabio Sales OS",
        version=settings.APP_VERSION,
        docs_url="/api/v1/docs",
        redoc_url="/api/v1/redoc",
        openapi_url="/api/v1/openapi.json",
        lifespan=lifespan,
    )

    application.add_middleware(CorrelationIdMiddleware)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE"],
        allow_headers=["*"],
    )

    _register_exception_handlers(application)
    _register_routers(application)

    logger.info(
        "application_started",
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
    )

    return application


def _register_exception_handlers(application: FastAPI) -> None:
    @application.exception_handler(NotFoundError)
    async def not_found_handler(_request: Request, exc: NotFoundError) -> JSONResponse:
        return JSONResponse(
            status_code=404,
            content=ErrorResponse(message=exc.message).model_dump(),
        )

    @application.exception_handler(BusinessRuleViolation)
    async def business_rule_handler(_request: Request, exc: BusinessRuleViolation) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content=ErrorResponse(message=exc.message).model_dump(),
        )

    @application.exception_handler(AuthenticationError)
    async def auth_handler(_request: Request, exc: AuthenticationError) -> JSONResponse:
        return JSONResponse(
            status_code=401,
            content=ErrorResponse(message=exc.message).model_dump(),
        )

    @application.exception_handler(AuthorizationError)
    async def authz_handler(_request: Request, exc: AuthorizationError) -> JSONResponse:
        return JSONResponse(
            status_code=403,
            content=ErrorResponse(message=exc.message).model_dump(),
        )

    @application.exception_handler(ConflictError)
    async def conflict_handler(_request: Request, exc: ConflictError) -> JSONResponse:
        return JSONResponse(
            status_code=409,
            content=ErrorResponse(message=exc.message).model_dump(),
        )

    @application.exception_handler(ValidationError)
    async def validation_handler(_request: Request, exc: ValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=400,
            content=ErrorResponse(message=exc.message).model_dump(),
        )

    @application.exception_handler(Exception)
    async def unhandled_handler(_request: Request, exc: Exception) -> JSONResponse:
        logger.error("unhandled_exception", error=str(exc), exc_info=True)
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(message="Internal server error").model_dump(),
        )


def _register_routers(application: FastAPI) -> None:
    application.include_router(health.router, prefix="/api/v1")
    application.include_router(auth.router, prefix="/api/v1")
    application.include_router(master_data.router, prefix="/api/v1")
    application.include_router(account_router.router, prefix="/api/v1")
    application.include_router(stakeholder_router.router, prefix="/api/v1")
    application.include_router(asset_router.router, prefix="/api/v1")
    application.include_router(project_router.router, prefix="/api/v1")
    application.include_router(opportunity_router.router, prefix="/api/v1")
    application.include_router(activity_router.router, prefix="/api/v1")
    application.include_router(product_router.router, prefix="/api/v1")


app = create_app()
