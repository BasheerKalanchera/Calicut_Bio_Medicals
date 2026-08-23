from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.schemas import APIResponse
from app.db.session import get_db
from app.domains.activity.repository import ReminderRepository
from app.domains.organization.models import UserProfile
from app.domains.organization.schemas import UserMeResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

_IST = ZoneInfo("Asia/Kolkata")


@router.get("/me")
def get_me(
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> APIResponse[UserMeResponse]:
    # Same request-scoped db session get_current_user already set the RLS
    # context on -- this reuses that, no extra connection/handshake.
    end_of_today = datetime.now(_IST).replace(hour=23, minute=59, second=59, microsecond=999999)
    due_or_overdue_count = ReminderRepository(db).count_for_user(
        current_user.id, include_completed=False, due_before=end_of_today
    )
    return APIResponse(
        data=UserMeResponse(
            id=current_user.id,
            display_name=current_user.display_name,
            is_active=current_user.is_active,
            role_name=current_user.role.role_name,
            sbu=current_user.sbu,
            zone=current_user.zone,
            due_or_overdue_reminder_count=due_or_overdue_count,
        )
    )
