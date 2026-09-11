import uuid
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from app.domains.organization.models import UserProfile
from app.domains.organization.repository import TEAM_SCOPE_BUILDERS, UNRESTRICTED_ROLES
from app.domains.reporting.repository import ReportingRepository
from app.domains.reporting.schemas import (
    OverdueActionRow,
    OverdueActionsResponse,
    PipelineGroupBy,
    PipelineSummaryResponse,
    PipelineSummaryRow,
    RepActivityLevelResponse,
    RepActivityLevelRow,
    StagnantDealRow,
    StagnantDealsResponse,
)

_IST = ZoneInfo("Asia/Kolkata")


def _has_team_to_roll_up(current_user: UserProfile) -> bool:
    # The one thing that distinguishes an individual contributor (Sales
    # Staff today) from every other tier: no scope_builder, and not an
    # unrestricted overlay role either. Checked generically rather than by
    # role-name string so this doesn't silently break if a new
    # individual-contributor role is ever added.
    role_name = current_user.role.role_name
    return role_name in UNRESTRICTED_ROLES or TEAM_SCOPE_BUILDERS.get(role_name) is not None


class ReportingService:
    def __init__(self, repository: ReportingRepository):
        self.repository = repository

    def pipeline_summary(
        self,
        current_user: UserProfile,
        group_by: PipelineGroupBy,
        *,
        sbu_id: uuid.UUID | None = None,
        zone_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
    ) -> PipelineSummaryResponse:
        rows = self.repository.pipeline_summary(
            current_user, group_by, sbu_id=sbu_id, zone_id=zone_id, user_id=user_id
        )
        return PipelineSummaryResponse(
            group_by=group_by,
            rows=[PipelineSummaryRow.model_validate(r) for r in rows],
        )

    def stagnant_deals(
        self,
        current_user: UserProfile,
        *,
        threshold_days: int = 180,
        sbu_id: uuid.UUID | None = None,
        zone_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
    ) -> StagnantDealsResponse:
        rows = self.repository.stagnant_deals(
            current_user, threshold_days=threshold_days, sbu_id=sbu_id, zone_id=zone_id, user_id=user_id
        )
        return StagnantDealsResponse(
            threshold_days=threshold_days,
            rows=[StagnantDealRow.model_validate(r) for r in rows],
        )

    def activity_levels(
        self,
        current_user: UserProfile,
        start_date: date,
        end_date: date,
        *,
        sbu_id: uuid.UUID | None = None,
        zone_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
    ) -> RepActivityLevelResponse:
        start = datetime(start_date.year, start_date.month, start_date.day, tzinfo=_IST)
        end = datetime(end_date.year, end_date.month, end_date.day, tzinfo=_IST) + timedelta(days=1)
        rows = self.repository.activity_levels(
            current_user, start, end, sbu_id=sbu_id, zone_id=zone_id, user_id=user_id
        )
        return RepActivityLevelResponse(
            start_date=start_date,
            end_date=end_date,
            rows=[RepActivityLevelRow.model_validate(r) for r in rows],
        )

    def overdue_actions(
        self,
        current_user: UserProfile,
        *,
        sbu_id: uuid.UUID | None = None,
        zone_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
    ) -> OverdueActionsResponse:
        # Team-rollup only (resolved 2026-08-25, Insights-Dashboard-
        # Implementation-Plan.md Open questions §3) -- an individual
        # contributor already gets this exact count on their own login bell,
        # so this tile would be pure duplication for them. Empty result, not
        # a 403 -- this endpoint has no role gate on visibility, it just has
        # nothing to show a role with no team.
        if not _has_team_to_roll_up(current_user):
            return OverdueActionsResponse(rows=[], total_overdue=0)

        end_of_today = datetime.now(_IST).replace(hour=23, minute=59, second=59, microsecond=999999)
        rows = self.repository.overdue_actions(
            current_user, end_of_today, sbu_id=sbu_id, zone_id=zone_id, user_id=user_id
        )
        parsed = [OverdueActionRow.model_validate(r) for r in rows]
        return OverdueActionsResponse(rows=parsed, total_overdue=sum(r.overdue_count for r in parsed))
