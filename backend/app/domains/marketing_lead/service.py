import uuid
from datetime import UTC, datetime

import structlog

from app.core.exceptions import AuthorizationError, BusinessRuleViolation, NotFoundError
from app.domains.marketing_lead.models import MarketingLead
from app.domains.marketing_lead.repository import MarketingLeadRepository, MarketingLeadRow
from app.domains.marketing_lead.schemas import MarketingLeadCreate, MarketingLeadDiscard, MarketingLeadMarkConverted

logger = structlog.get_logger()

# Same role-gate shape as reference/service.py's _TERRITORY_ADMIN_ROLES --
# not a new authorization mechanism. Admin/GM can create on the Marketing
# User's behalf (e.g. fixing a mis-entered lead), matching how Admin/GM
# carry an unrestricted overlay tier everywhere else in this app.
_MARKETING_LEAD_CREATE_ROLES = {"Marketing User", "Admin", "General Manager"}
_UNRESTRICTED_ROLES = {"Admin", "General Manager"}


class MarketingLeadService:
    def __init__(self, repository: MarketingLeadRepository, user_id: uuid.UUID):
        self.repository = repository
        self.user_id = user_id

    def create_lead(self, data: MarketingLeadCreate, *, role_name: str) -> MarketingLead:
        if role_name not in _MARKETING_LEAD_CREATE_ROLES:
            raise AuthorizationError("Only Marketing User/Admin/General Manager can create marketing leads")
        if not self.repository.is_valid_marketing_source(data.lead_source_id):
            raise BusinessRuleViolation("Lead source must be flagged is_marketing_source for a marketing lead")

        lead = MarketingLead(**data.model_dump(), created_by=self.user_id)
        self.repository.create(lead)

        logger.info(
            "marketing_lead_created",
            lead_id=str(lead.id),
            account_id=str(lead.account_id),
            assigned_to_user_id=str(lead.assigned_to_user_id),
            user_id=str(self.user_id),
        )
        return lead

    def list_leads(self) -> list[MarketingLeadRow]:
        return self.repository.list_all()

    def _get_reviewable_lead(self, lead_id: uuid.UUID, *, role_name: str) -> MarketingLead:
        # Review workflow (Convert/Discard) is "by the assigned rep" per
        # docs/Lead-Management-Implementation-Plan.md -- Admin/GM can act on
        # any lead (same unrestricted-overlay-tier pattern used everywhere
        # else), but a manager who can merely *see* a lead via the RLS
        # manager-chain visibility policy is not automatically allowed to
        # act on it.
        lead = self.repository.get_by_id(lead_id)
        if lead is None:
            raise NotFoundError(f"Marketing lead {lead_id} not found")
        if lead.status != "NEW":
            raise BusinessRuleViolation(f"Marketing lead {lead_id} has already been reviewed (status={lead.status})")
        if role_name not in _UNRESTRICTED_ROLES and lead.assigned_to_user_id != self.user_id:
            raise AuthorizationError("Only the assigned rep (or Admin/General Manager) can review this lead")
        return lead

    def discard_lead(self, lead_id: uuid.UUID, data: MarketingLeadDiscard, *, role_name: str) -> MarketingLead:
        lead = self._get_reviewable_lead(lead_id, role_name=role_name)
        lead.status = "DISCARDED"
        lead.discard_reason = data.discard_reason
        lead.discard_note = data.discard_note
        lead.reviewed_by = self.user_id
        lead.reviewed_at = datetime.now(UTC)
        self.repository.update(lead)

        logger.info(
            "marketing_lead_discarded",
            lead_id=str(lead_id),
            discard_reason=data.discard_reason,
            user_id=str(self.user_id),
        )
        return lead

    def mark_converted(self, lead_id: uuid.UUID, data: MarketingLeadMarkConverted, *, role_name: str) -> MarketingLead:
        lead = self._get_reviewable_lead(lead_id, role_name=role_name)
        lead.status = "CONVERTED"
        lead.converted_opportunity_id = data.converted_opportunity_id
        lead.reviewed_by = self.user_id
        lead.reviewed_at = datetime.now(UTC)
        self.repository.update(lead)

        logger.info(
            "marketing_lead_converted",
            lead_id=str(lead_id),
            converted_opportunity_id=str(data.converted_opportunity_id),
            user_id=str(self.user_id),
        )
        return lead
