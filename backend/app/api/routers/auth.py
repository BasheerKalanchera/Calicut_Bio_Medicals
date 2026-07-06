from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user
from app.api.schemas import APIResponse
from app.domains.organization.models import UserProfile
from app.domains.organization.schemas import UserMeResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/me")
def get_me(
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
) -> APIResponse[UserMeResponse]:
    return APIResponse(
        data=UserMeResponse(
            id=current_user.id,
            display_name=current_user.display_name,
            is_active=current_user.is_active,
            role_name=current_user.role.role_name,
            sbu=current_user.sbu,
            zone=current_user.zone,
        )
    )
