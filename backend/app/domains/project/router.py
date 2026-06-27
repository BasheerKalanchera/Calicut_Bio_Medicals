import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.schemas import APIResponse, PaginatedResponse
from app.db.session import get_db
from app.domains.account.workspace_schemas import WorkspaceProject, WorkspaceProjectWithAccount
from app.domains.organization.models import UserProfile
from app.domains.project.repository import ProjectRepository
from app.domains.project.schemas import (
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)
from app.domains.project.service import ProjectService

router = APIRouter(tags=["Projects"])


def _get_service(
    db: Session = Depends(get_db),  # noqa: B008
) -> ProjectService:
    return ProjectService(repository=ProjectRepository(db))


@router.get("/projects")
async def list_all_projects(
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ProjectService = Depends(_get_service),  # noqa: B008
) -> APIResponse[PaginatedResponse[WorkspaceProjectWithAccount]]:
    offset = (page - 1) * page_size
    projects, total = service.list_all(search=search, offset=offset, limit=page_size)
    total_pages = max(1, (total + page_size - 1) // page_size)
    return APIResponse(
        data=PaginatedResponse(
            items=[WorkspaceProjectWithAccount.model_validate(p) for p in projects],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    )


@router.get("/accounts/{account_id}/projects")
async def list_projects(
    account_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ProjectService = Depends(_get_service),  # noqa: B008
) -> APIResponse[list[WorkspaceProject]]:
    projects = service.list_by_account(account_id)
    return APIResponse(data=[WorkspaceProject.model_validate(p) for p in projects])


@router.post("/accounts/{account_id}/projects", status_code=201)
async def create_project(
    account_id: uuid.UUID,
    body: ProjectCreate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ProjectService = Depends(_get_service),  # noqa: B008
) -> APIResponse[ProjectResponse]:
    project = service.create_project(
        account_id, body, created_by=current_user.id
    )
    return APIResponse(data=ProjectResponse.model_validate(project))


@router.put("/projects/{project_id}")
async def update_project(
    project_id: uuid.UUID,
    body: ProjectUpdate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: ProjectService = Depends(_get_service),  # noqa: B008
) -> APIResponse[ProjectResponse]:
    project = service.update_project(
        project_id, body, updated_by=current_user.id
    )
    return APIResponse(data=ProjectResponse.model_validate(project))
