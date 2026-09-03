import uuid
from datetime import UTC, datetime

import structlog

from app.core.exceptions import AuthorizationError, BusinessRuleViolation, NotFoundError
from app.domains.marketing_lead.models import MarketingLead
from app.domains.marketing_lead.repository import MarketingLeadRepository, MarketingLeadRow
from app.domains.marketing_lead.schemas import (
    MarketingLeadCreate,
    MarketingLeadDiscard,
    MarketingLeadMarkConverted,
    MarketingLeadReassign,
)
from app.domains.notification.service import NotificationService

logger = structlog.get_logger()

# Same role-gate shape as reference/service.py's _TERRITORY_ADMIN_ROLES --
# not a new authorization mechanism. Admin/GM can create on the Marketing
# User's behalf (e.g. fixing a mis-entered lead), matching how Admin/GM
# carry an unrestricted overlay tier everywhere else in this app.
_MARKETING_LEAD_CREATE_ROLES = {"Marketing User", "Admin", "General Manager"}
_UNRESTRICTED_ROLES = {"Admin", "General Manager"}
# Any manager-tier role -- used only for reassign_lead's self-delegation
# carve-out (a manager handing off a lead assigned to THEMSELVES, e.g. an
# Area Manager who is also personally assigned leads delegating one down to
# their own team). _actor_manages alone can't cover this: it asks "does the
# caller manage the CURRENT assignee," which is always false when the
# caller IS the current assignee.
_MANAGER_ROLES = _UNRESTRICTED_ROLES | {"SBU Manager", "Area Manager"}


class MarketingLeadService:
    def __init__(
        self,
        repository: MarketingLeadRepository,
        user_id: uuid.UUID,
        notification_service: NotificationService,
    ):
        self.repository = repository
        self.user_id = user_id
        self.notification_service = notification_service

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

        # Guard mirrors notify_opportunity_assigned's self-assignment check --
        # the Assign To picker only lists other reps (never the Marketing
        # User themselves), so this can't structurally happen today, but it
        # keeps the two notify call sites symmetric.
        if lead.assigned_to_user_id != self.user_id:
            self.notification_service.notify_marketing_lead_assigned(
                recipient_user_id=lead.assigned_to_user_id,
                marketing_lead_id=lead.id,
                actor_id=self.user_id,
            )
        return lead

    def list_leads(self) -> list[MarketingLeadRow]:
        return self.repository.list_all()

    def mark_first_viewed(self) -> None:
        self.repository.mark_first_viewed(self.user_id)

    def _actor_manages(
        self, *, target_user_id: uuid.UUID, target_sbu_id: uuid.UUID, role_name: str, actor_sbu_id: uuid.UUID | None
    ) -> bool:
        # Takes an explicit (target_user_id, target_sbu_id) pair rather than
        # a MarketingLead -- reused for two different questions in
        # reassign_lead: "can I act on the lead's CURRENT assignee" and
        # "can I hand it to this NEW assignee" (see reassign_lead's target
        # check for why the second one is required too).
        #
        # Admin/GM: unrestricted, matches everywhere else in this app.
        # SBU Manager: any lead in their own SBU, mirrors marketing_lead_
        # select's own SBU Manager clause exactly.
        # Area Manager: only leads assigned to reps who are actually THEIR
        # OWN reports (manager_id match) -- mirrors BR-OP-14's "gate override
        # approver must be the owner's immediate manager" precedent
        # (opportunity/service.py's get_owner_manager_id). marketing_lead_
        # select's Area Manager clause was originally SBU-wide (like SBU
        # Manager's) until 0037_marketing_lead_area_manager_select_own_
        # reports.py narrowed it to match this exactly -- an Area Manager
        # could otherwise see, and get an action button for, a lead they had
        # no rights to touch (found live 2026-09-03: Fazal could see
        # Shruthi's leads despite her not reporting to him). Visibility and
        # action rights are now the same boundary for Area Manager, same as
        # they already were for SBU Manager and Admin/GM. RLS enforces the
        # same boundary at the DB level -- this is the same belt-and-
        # suspenders check every other authorization gate in this domain
        # already does.
        if role_name in _UNRESTRICTED_ROLES:
            return True
        if role_name == "SBU Manager":
            return actor_sbu_id is not None and target_sbu_id == actor_sbu_id
        if role_name == "Area Manager":
            return self.repository.get_rep_manager_id(target_user_id) == self.user_id
        return False

    def _get_reviewable_lead(
        self, lead_id: uuid.UUID, *, role_name: str, actor_sbu_id: uuid.UUID | None
    ) -> MarketingLead:
        # Review workflow (Convert/Discard) is "by the assigned rep, their
        # manager, or Admin/GM" per docs/Lead-Management-Implementation-
        # Plan.md. Still passes through _actor_manages (not just trusting
        # RLS-scoped visibility) even though visibility and action rights
        # are now the same boundary for every role (0037) -- SBU Manager's
        # own-SBU select clause still doesn't imply update rights on its own
        # without this check re-confirming role + sbu_id match here too.
        lead = self.repository.get_by_id(lead_id)
        if lead is None:
            raise NotFoundError(f"Marketing lead {lead_id} not found")
        if lead.status != "NEW":
            raise BusinessRuleViolation(f"Marketing lead {lead_id} has already been reviewed (status={lead.status})")
        if lead.assigned_to_user_id != self.user_id and not self._actor_manages(
            target_user_id=lead.assigned_to_user_id,
            target_sbu_id=lead.sbu_id,
            role_name=role_name,
            actor_sbu_id=actor_sbu_id,
        ):
            raise AuthorizationError(
                "Only the assigned rep, their manager (SBU Manager or Area Manager), "
                "or Admin/General Manager can review this lead"
            )
        return lead

    def discard_lead(
        self, lead_id: uuid.UUID, data: MarketingLeadDiscard, *, role_name: str, actor_sbu_id: uuid.UUID | None
    ) -> MarketingLead:
        lead = self._get_reviewable_lead(lead_id, role_name=role_name, actor_sbu_id=actor_sbu_id)
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

    def mark_converted(
        self, lead_id: uuid.UUID, data: MarketingLeadMarkConverted, *, role_name: str, actor_sbu_id: uuid.UUID | None
    ) -> MarketingLead:
        lead = self._get_reviewable_lead(lead_id, role_name=role_name, actor_sbu_id=actor_sbu_id)
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

    def reassign_lead(
        self, lead_id: uuid.UUID, data: MarketingLeadReassign, *, role_name: str, actor_sbu_id: uuid.UUID | None
    ) -> MarketingLead:
        # Deliberately NOT open to a plain rep reassigning their own lead
        # (Basheer, 2026-09-03) -- only a manager decides to move a lead off
        # someone, e.g. because they're on leave. Same NEW-only gate as
        # Convert/Discard (nothing to reassign once it's already resolved).
        #
        # Self-delegation carve-out (Basheer, 2026-09-03): a manager CAN be
        # the assigned rep themselves (Area Manager isn't excluded from the
        # Assign To picker at creation -- a working manager can personally
        # own leads too), and should be able to hand one of their own off to
        # their team, same as they could act on a report's lead directly.
        # _actor_manages alone doesn't cover this (it checks whether the
        # caller manages the CURRENT assignee, which is always false when
        # that's the caller themselves).
        lead = self.repository.get_by_id(lead_id)
        if lead is None:
            raise NotFoundError(f"Marketing lead {lead_id} not found")
        if lead.status != "NEW":
            raise BusinessRuleViolation(f"Marketing lead {lead_id} has already been reviewed (status={lead.status})")
        is_self_delegation = lead.assigned_to_user_id == self.user_id and role_name in _MANAGER_ROLES
        if not is_self_delegation and not self._actor_manages(
            target_user_id=lead.assigned_to_user_id,
            target_sbu_id=lead.sbu_id,
            role_name=role_name,
            actor_sbu_id=actor_sbu_id,
        ):
            raise AuthorizationError(
                "Only a manager (SBU Manager or the rep's Area Manager) or Admin/General Manager can reassign this lead"
            )

        # The new assignee must be someone this actor could equally act on --
        # not just "any eligible rep in the SBU." Two reasons: (1) product
        # intent -- an Area Manager delegating work should stay within their
        # own reporting line, not scatter it to reps they have no standing
        # over; (2) a hard Postgres constraint -- marketing_lead_select's
        # Area Manager clause only shows leads assigned to the actor's own
        # reports (0037), and Postgres refuses an UPDATE that would leave
        # the resulting row invisible to the actor under the table's SELECT
        # policy, regardless of what marketing_lead_update's WITH CHECK
        # says (found live 2026-09-03: Fazal reassigning to Shruthi, who
        # isn't his report, 500'd with "new row violates row-level security
        # policy" even after WITH CHECK was relaxed to true in 0038 --
        # confirmed via direct DB testing that reassigning to a report
        # succeeds while reassigning to a non-report fails, isolating this
        # as a SELECT-visibility issue, not a WITH CHECK one). Checking here
        # gives a clean 403 instead of a confusing 500, and this Python
        # check is what actually prevents the situation RLS would otherwise
        # reject blindly.
        if not self._actor_manages(
            target_user_id=data.new_assigned_to_user_id,
            target_sbu_id=lead.sbu_id,
            role_name=role_name,
            actor_sbu_id=actor_sbu_id,
        ):
            raise AuthorizationError(
                "Can only reassign to a rep you have standing over yourself (your own SBU, or your own reports)"
            )

        previous_assignee = lead.assigned_to_user_id
        lead.assigned_to_user_id = data.new_assigned_to_user_id
        # Reset -- the new assignee genuinely hasn't seen it yet, even if
        # the previous one had (mark_first_viewed only ever sets this once).
        lead.first_viewed_at = None
        self.repository.update(lead)

        # The old notification is no longer this rep's to act on; a fresh
        # one tells the new assignee, same as at creation.
        self.notification_service.mark_read_for_entity(previous_assignee, "marketing_lead", lead.id)
        if data.new_assigned_to_user_id != self.user_id:
            self.notification_service.notify_marketing_lead_assigned(
                recipient_user_id=data.new_assigned_to_user_id,
                marketing_lead_id=lead.id,
                actor_id=self.user_id,
            )

        logger.info(
            "marketing_lead_reassigned",
            lead_id=str(lead_id),
            previous_assignee=str(previous_assignee),
            new_assignee=str(data.new_assigned_to_user_id),
            user_id=str(self.user_id),
        )
        return lead
