"""
Unit tests for MarketingLeadService.

Repository is fully mocked -- no DB required. Tests cover:
  - create_lead: role gate (Marketing User/Admin/General Manager only),
    lead_source.is_marketing_source gate
  - discard_lead / mark_converted: role gate (assigned rep, their manager,
    or Admin/GM), already-reviewed rejection, not-found, and the happy
    path's field mutations (status/reviewed_by/reviewed_at plus the
    action-specific fields)
  - reassign_lead: manager-only gate (not the assigned rep), NEW-only,
    first_viewed_at reset, notification handling
"""

import uuid
from unittest.mock import MagicMock

import pytest

from app.core.exceptions import AuthorizationError, BusinessRuleViolation, NotFoundError
from app.domains.marketing_lead.models import MarketingLead
from app.domains.marketing_lead.repository import MarketingLeadRepository
from app.domains.marketing_lead.schemas import (
    MarketingLeadCreate,
    MarketingLeadDiscard,
    MarketingLeadMarkConverted,
    MarketingLeadReassign,
)
from app.domains.marketing_lead.service import MarketingLeadService
from app.domains.notification.service import NotificationService

USER_ID = uuid.uuid4()
OTHER_USER_ID = uuid.uuid4()
THIRD_USER_ID = uuid.uuid4()
ACCOUNT_ID = uuid.uuid4()
SBU_ID = uuid.uuid4()
OTHER_SBU_ID = uuid.uuid4()
LEAD_SOURCE_ID = uuid.uuid4()
LEAD_ID = uuid.uuid4()
OPPORTUNITY_ID = uuid.uuid4()


def _make_repo() -> MagicMock:
    repo = MagicMock(spec=MarketingLeadRepository)
    repo.create.side_effect = lambda obj: obj
    repo.update.side_effect = lambda obj: obj
    repo.is_valid_marketing_source.return_value = True
    repo.get_rep_manager_id.return_value = None
    return repo


def _make_notification_service() -> MagicMock:
    return MagicMock(spec=NotificationService)


def _make_lead(
    *, status: str = "NEW", assigned_to_user_id: uuid.UUID = USER_ID, sbu_id: uuid.UUID = SBU_ID
) -> MarketingLead:
    return MarketingLead(
        id=LEAD_ID,
        account_id=ACCOUNT_ID,
        sbu_id=sbu_id,
        lead_source_id=LEAD_SOURCE_ID,
        assigned_to_user_id=assigned_to_user_id,
        status=status,
        created_by=USER_ID,
    )


def _make_create_data(**overrides) -> MarketingLeadCreate:
    defaults = dict(
        account_id=ACCOUNT_ID,
        sbu_id=SBU_ID,
        lead_source_id=LEAD_SOURCE_ID,
        assigned_to_user_id=OTHER_USER_ID,
    )
    defaults.update(overrides)
    return MarketingLeadCreate(**defaults)


class TestCreateLead:
    def test_marketing_user_can_create(self):
        repo = _make_repo()
        service = MarketingLeadService(
            repository=repo, user_id=USER_ID, notification_service=_make_notification_service()
        )

        lead = service.create_lead(_make_create_data(), role_name="Marketing User")

        assert lead.created_by == USER_ID
        assert lead.assigned_to_user_id == OTHER_USER_ID
        repo.create.assert_called_once()

    def test_create_notifies_assigned_rep(self):
        repo = _make_repo()
        notification_service = _make_notification_service()
        service = MarketingLeadService(repository=repo, user_id=USER_ID, notification_service=notification_service)

        lead = service.create_lead(_make_create_data(), role_name="Marketing User")

        notification_service.notify_marketing_lead_assigned.assert_called_once_with(
            recipient_user_id=OTHER_USER_ID,
            marketing_lead_id=lead.id,
            actor_id=USER_ID,
        )

    def test_create_does_not_notify_on_self_assignment(self):
        # Structurally shouldn't happen (Assign To picker only lists other
        # reps), but the guard exists -- verify it actually fires.
        repo = _make_repo()
        notification_service = _make_notification_service()
        service = MarketingLeadService(repository=repo, user_id=USER_ID, notification_service=notification_service)

        service.create_lead(_make_create_data(assigned_to_user_id=USER_ID), role_name="Marketing User")

        notification_service.notify_marketing_lead_assigned.assert_not_called()

    @pytest.mark.parametrize("role_name", ["Admin", "General Manager"])
    def test_unrestricted_roles_can_create(self, role_name):
        service = MarketingLeadService(
            repository=_make_repo(), user_id=USER_ID, notification_service=_make_notification_service()
        )

        lead = service.create_lead(_make_create_data(), role_name=role_name)

        assert lead.created_by == USER_ID

    def test_account_id_optional(self):
        # "Not Sure Yet" -- Marketing User has no Account-creation rights,
        # so account_id must be omittable when the hospital isn't in the
        # directory yet (0034_make_marketing_lead_account_nullable.py).
        service = MarketingLeadService(
            repository=_make_repo(), user_id=USER_ID, notification_service=_make_notification_service()
        )

        lead = service.create_lead(_make_create_data(account_id=None), role_name="Marketing User")

        assert lead.account_id is None

    def test_other_roles_cannot_create(self):
        service = MarketingLeadService(
            repository=_make_repo(), user_id=USER_ID, notification_service=_make_notification_service()
        )

        with pytest.raises(AuthorizationError):
            service.create_lead(_make_create_data(), role_name="Area Manager")

    def test_non_marketing_lead_source_rejected(self):
        repo = _make_repo()
        repo.is_valid_marketing_source.return_value = False
        service = MarketingLeadService(
            repository=repo, user_id=USER_ID, notification_service=_make_notification_service()
        )

        with pytest.raises(BusinessRuleViolation):
            service.create_lead(_make_create_data(), role_name="Marketing User")
        repo.create.assert_not_called()


class TestMarkFirstViewed:
    def test_delegates_to_repository(self):
        repo = _make_repo()
        service = MarketingLeadService(
            repository=repo, user_id=USER_ID, notification_service=_make_notification_service()
        )

        service.mark_first_viewed()

        repo.mark_first_viewed.assert_called_once_with(USER_ID)


class TestListLeads:
    def test_delegates_to_repository(self):
        repo = _make_repo()
        repo.list_all.return_value = ["row"]
        service = MarketingLeadService(
            repository=repo, user_id=USER_ID, notification_service=_make_notification_service()
        )

        result = service.list_leads()

        repo.list_all.assert_called_once_with()
        assert result == ["row"]


class TestDiscardLead:
    def test_assigned_rep_can_discard(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(assigned_to_user_id=USER_ID)
        service = MarketingLeadService(
            repository=repo, user_id=USER_ID, notification_service=_make_notification_service()
        )

        lead = service.discard_lead(
            LEAD_ID,
            MarketingLeadDiscard(discard_reason="DUPLICATE", discard_note="dup of X"),
            role_name="Sales Executive",
            actor_sbu_id=None,
        )

        assert lead.status == "DISCARDED"
        assert lead.discard_reason == "DUPLICATE"
        assert lead.discard_note == "dup of X"
        assert lead.reviewed_by == USER_ID
        assert lead.reviewed_at is not None

    def test_admin_can_discard_someone_elses_lead(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(assigned_to_user_id=OTHER_USER_ID)
        service = MarketingLeadService(
            repository=repo, user_id=USER_ID, notification_service=_make_notification_service()
        )

        lead = service.discard_lead(
            LEAD_ID, MarketingLeadDiscard(discard_reason="JUNK"), role_name="Admin", actor_sbu_id=None
        )

        assert lead.status == "DISCARDED"

    def test_sbu_manager_can_discard_lead_in_own_sbu(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(assigned_to_user_id=OTHER_USER_ID, sbu_id=SBU_ID)
        service = MarketingLeadService(
            repository=repo, user_id=USER_ID, notification_service=_make_notification_service()
        )

        lead = service.discard_lead(
            LEAD_ID, MarketingLeadDiscard(discard_reason="JUNK"), role_name="SBU Manager", actor_sbu_id=SBU_ID
        )

        assert lead.status == "DISCARDED"

    def test_sbu_manager_cannot_discard_lead_in_different_sbu(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(assigned_to_user_id=OTHER_USER_ID, sbu_id=SBU_ID)
        service = MarketingLeadService(
            repository=repo, user_id=USER_ID, notification_service=_make_notification_service()
        )

        with pytest.raises(AuthorizationError):
            service.discard_lead(
                LEAD_ID, MarketingLeadDiscard(discard_reason="JUNK"), role_name="SBU Manager", actor_sbu_id=OTHER_SBU_ID
            )

    def test_area_manager_can_discard_own_reports_lead(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(assigned_to_user_id=OTHER_USER_ID)
        repo.get_rep_manager_id.return_value = USER_ID
        service = MarketingLeadService(
            repository=repo, user_id=USER_ID, notification_service=_make_notification_service()
        )

        lead = service.discard_lead(
            LEAD_ID, MarketingLeadDiscard(discard_reason="JUNK"), role_name="Area Manager", actor_sbu_id=None
        )

        assert lead.status == "DISCARDED"
        repo.get_rep_manager_id.assert_called_once_with(OTHER_USER_ID)

    def test_area_manager_cannot_discard_non_reports_lead(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(assigned_to_user_id=OTHER_USER_ID)
        repo.get_rep_manager_id.return_value = THIRD_USER_ID  # someone else's report
        service = MarketingLeadService(
            repository=repo, user_id=USER_ID, notification_service=_make_notification_service()
        )

        with pytest.raises(AuthorizationError):
            service.discard_lead(
                LEAD_ID, MarketingLeadDiscard(discard_reason="JUNK"), role_name="Area Manager", actor_sbu_id=None
            )

    def test_non_assigned_non_manager_cannot_discard(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(assigned_to_user_id=OTHER_USER_ID)
        service = MarketingLeadService(
            repository=repo, user_id=USER_ID, notification_service=_make_notification_service()
        )

        with pytest.raises(AuthorizationError):
            service.discard_lead(
                LEAD_ID, MarketingLeadDiscard(discard_reason="JUNK"), role_name="Sales Executive", actor_sbu_id=None
            )

    def test_already_reviewed_lead_cannot_be_discarded(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(status="CONVERTED", assigned_to_user_id=USER_ID)
        service = MarketingLeadService(
            repository=repo, user_id=USER_ID, notification_service=_make_notification_service()
        )

        with pytest.raises(BusinessRuleViolation):
            service.discard_lead(
                LEAD_ID, MarketingLeadDiscard(discard_reason="JUNK"), role_name="Sales Executive", actor_sbu_id=None
            )

    def test_missing_lead_raises_not_found(self):
        repo = _make_repo()
        repo.get_by_id.return_value = None
        service = MarketingLeadService(
            repository=repo, user_id=USER_ID, notification_service=_make_notification_service()
        )

        with pytest.raises(NotFoundError):
            service.discard_lead(
                LEAD_ID, MarketingLeadDiscard(discard_reason="JUNK"), role_name="Admin", actor_sbu_id=None
            )


class TestMarkConverted:
    def test_assigned_rep_can_convert(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(assigned_to_user_id=USER_ID)
        service = MarketingLeadService(
            repository=repo, user_id=USER_ID, notification_service=_make_notification_service()
        )

        lead = service.mark_converted(
            LEAD_ID,
            MarketingLeadMarkConverted(converted_opportunity_id=OPPORTUNITY_ID),
            role_name="Sales Executive",
            actor_sbu_id=None,
        )

        assert lead.status == "CONVERTED"
        assert lead.converted_opportunity_id == OPPORTUNITY_ID
        assert lead.reviewed_by == USER_ID
        assert lead.reviewed_at is not None

    def test_sbu_manager_can_convert_lead_in_own_sbu(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(assigned_to_user_id=OTHER_USER_ID, sbu_id=SBU_ID)
        service = MarketingLeadService(
            repository=repo, user_id=USER_ID, notification_service=_make_notification_service()
        )

        lead = service.mark_converted(
            LEAD_ID,
            MarketingLeadMarkConverted(converted_opportunity_id=OPPORTUNITY_ID),
            role_name="SBU Manager",
            actor_sbu_id=SBU_ID,
        )

        assert lead.status == "CONVERTED"

    def test_area_manager_can_convert_own_reports_lead(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(assigned_to_user_id=OTHER_USER_ID)
        repo.get_rep_manager_id.return_value = USER_ID
        service = MarketingLeadService(
            repository=repo, user_id=USER_ID, notification_service=_make_notification_service()
        )

        lead = service.mark_converted(
            LEAD_ID,
            MarketingLeadMarkConverted(converted_opportunity_id=OPPORTUNITY_ID),
            role_name="Area Manager",
            actor_sbu_id=None,
        )

        assert lead.status == "CONVERTED"

    def test_non_assigned_non_admin_cannot_convert(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(assigned_to_user_id=OTHER_USER_ID)
        service = MarketingLeadService(
            repository=repo, user_id=USER_ID, notification_service=_make_notification_service()
        )

        with pytest.raises(AuthorizationError):
            service.mark_converted(
                LEAD_ID,
                MarketingLeadMarkConverted(converted_opportunity_id=OPPORTUNITY_ID),
                role_name="Sales Executive",
                actor_sbu_id=None,
            )

    def test_already_reviewed_lead_cannot_be_converted_again(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(status="DISCARDED", assigned_to_user_id=USER_ID)
        service = MarketingLeadService(
            repository=repo, user_id=USER_ID, notification_service=_make_notification_service()
        )

        with pytest.raises(BusinessRuleViolation):
            service.mark_converted(
                LEAD_ID,
                MarketingLeadMarkConverted(converted_opportunity_id=OPPORTUNITY_ID),
                role_name="Sales Executive",
                actor_sbu_id=None,
            )


class TestReassignLead:
    def test_sbu_manager_can_reassign_lead_in_own_sbu(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(assigned_to_user_id=OTHER_USER_ID, sbu_id=SBU_ID)
        service = MarketingLeadService(
            repository=repo, user_id=USER_ID, notification_service=_make_notification_service()
        )

        lead = service.reassign_lead(
            LEAD_ID,
            MarketingLeadReassign(new_assigned_to_user_id=THIRD_USER_ID),
            role_name="SBU Manager",
            actor_sbu_id=SBU_ID,
        )

        assert lead.assigned_to_user_id == THIRD_USER_ID

    def test_area_manager_can_reassign_own_reports_lead(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(assigned_to_user_id=OTHER_USER_ID)
        repo.get_rep_manager_id.return_value = USER_ID
        service = MarketingLeadService(
            repository=repo, user_id=USER_ID, notification_service=_make_notification_service()
        )

        lead = service.reassign_lead(
            LEAD_ID,
            MarketingLeadReassign(new_assigned_to_user_id=THIRD_USER_ID),
            role_name="Area Manager",
            actor_sbu_id=None,
        )

        assert lead.assigned_to_user_id == THIRD_USER_ID

    def test_admin_can_reassign_any_lead(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(assigned_to_user_id=OTHER_USER_ID)
        service = MarketingLeadService(
            repository=repo, user_id=USER_ID, notification_service=_make_notification_service()
        )

        lead = service.reassign_lead(
            LEAD_ID,
            MarketingLeadReassign(new_assigned_to_user_id=THIRD_USER_ID),
            role_name="Admin",
            actor_sbu_id=None,
        )

        assert lead.assigned_to_user_id == THIRD_USER_ID

    def test_assigned_rep_cannot_reassign_own_lead(self):
        # Deliberate: reassignment is a manager's call, not the rep's own
        # (Basheer, 2026-09-03) -- unlike Convert/Discard, self-assignment
        # does NOT grant this action.
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(assigned_to_user_id=USER_ID)
        service = MarketingLeadService(
            repository=repo, user_id=USER_ID, notification_service=_make_notification_service()
        )

        with pytest.raises(AuthorizationError):
            service.reassign_lead(
                LEAD_ID,
                MarketingLeadReassign(new_assigned_to_user_id=THIRD_USER_ID),
                role_name="Sales Executive",
                actor_sbu_id=None,
            )

    def test_area_manager_can_delegate_their_own_assigned_lead_to_a_report(self):
        # Self-delegation: an Area Manager can be personally assigned leads
        # too (Area Manager isn't excluded from the Assign To picker at
        # creation), and should be able to hand one of their own down to
        # their team -- distinct from _actor_manages, which would otherwise
        # ask "does the caller manage themselves" and always say no.
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(assigned_to_user_id=USER_ID)
        repo.get_rep_manager_id.return_value = USER_ID  # THIRD_USER_ID is the actor's own report
        service = MarketingLeadService(
            repository=repo, user_id=USER_ID, notification_service=_make_notification_service()
        )

        lead = service.reassign_lead(
            LEAD_ID,
            MarketingLeadReassign(new_assigned_to_user_id=THIRD_USER_ID),
            role_name="Area Manager",
            actor_sbu_id=None,
        )

        assert lead.assigned_to_user_id == THIRD_USER_ID

    def test_area_manager_cannot_reassign_to_a_non_report(self):
        # Restricted per Basheer's decision, 2026-09-03: an Area Manager may
        # only reassign to their OWN reports, not "anyone in the SBU" --
        # both a product decision (delegation should stay within your own
        # reporting line) and a hard Postgres constraint (marketing_lead_
        # select's Area Manager clause -- 0037 -- only shows leads assigned
        # to the actor's own reports; a write that made the row belong to
        # someone outside that set would leave it invisible to the actor,
        # which Postgres's RLS refuses regardless of WITH CHECK).
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(assigned_to_user_id=OTHER_USER_ID)
        repo.get_rep_manager_id.return_value = USER_ID  # OTHER_USER_ID (current) IS a report...
        service = MarketingLeadService(
            repository=repo, user_id=USER_ID, notification_service=_make_notification_service()
        )

        def get_rep_manager_id_side_effect(rep_id):
            # ...but THIRD_USER_ID (the reassignment target) is NOT.
            return USER_ID if rep_id == OTHER_USER_ID else None

        repo.get_rep_manager_id.side_effect = get_rep_manager_id_side_effect

        with pytest.raises(AuthorizationError):
            service.reassign_lead(
                LEAD_ID,
                MarketingLeadReassign(new_assigned_to_user_id=THIRD_USER_ID),
                role_name="Area Manager",
                actor_sbu_id=None,
            )

    def test_sbu_manager_can_delegate_their_own_assigned_lead(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(assigned_to_user_id=USER_ID, sbu_id=SBU_ID)
        service = MarketingLeadService(
            repository=repo, user_id=USER_ID, notification_service=_make_notification_service()
        )

        lead = service.reassign_lead(
            LEAD_ID,
            MarketingLeadReassign(new_assigned_to_user_id=THIRD_USER_ID),
            role_name="SBU Manager",
            actor_sbu_id=SBU_ID,
        )

        assert lead.assigned_to_user_id == THIRD_USER_ID

    def test_already_reviewed_lead_cannot_be_reassigned(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(status="CONVERTED", assigned_to_user_id=OTHER_USER_ID, sbu_id=SBU_ID)
        service = MarketingLeadService(
            repository=repo, user_id=USER_ID, notification_service=_make_notification_service()
        )

        with pytest.raises(BusinessRuleViolation):
            service.reassign_lead(
                LEAD_ID,
                MarketingLeadReassign(new_assigned_to_user_id=THIRD_USER_ID),
                role_name="SBU Manager",
                actor_sbu_id=SBU_ID,
            )

    def test_missing_lead_raises_not_found(self):
        repo = _make_repo()
        repo.get_by_id.return_value = None
        service = MarketingLeadService(
            repository=repo, user_id=USER_ID, notification_service=_make_notification_service()
        )

        with pytest.raises(NotFoundError):
            service.reassign_lead(
                LEAD_ID,
                MarketingLeadReassign(new_assigned_to_user_id=THIRD_USER_ID),
                role_name="Admin",
                actor_sbu_id=None,
            )

    def test_reassignment_resets_first_viewed_at(self):
        repo = _make_repo()
        lead = _make_lead(assigned_to_user_id=OTHER_USER_ID, sbu_id=SBU_ID)
        lead.first_viewed_at = "2026-09-03T00:00:00Z"  # anything truthy
        repo.get_by_id.return_value = lead
        service = MarketingLeadService(
            repository=repo, user_id=USER_ID, notification_service=_make_notification_service()
        )

        result = service.reassign_lead(
            LEAD_ID,
            MarketingLeadReassign(new_assigned_to_user_id=THIRD_USER_ID),
            role_name="SBU Manager",
            actor_sbu_id=SBU_ID,
        )

        assert result.first_viewed_at is None

    def test_reassignment_notifies_new_assignee_and_clears_old_notification(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(assigned_to_user_id=OTHER_USER_ID, sbu_id=SBU_ID)
        notification_service = _make_notification_service()
        service = MarketingLeadService(repository=repo, user_id=USER_ID, notification_service=notification_service)

        lead = service.reassign_lead(
            LEAD_ID,
            MarketingLeadReassign(new_assigned_to_user_id=THIRD_USER_ID),
            role_name="SBU Manager",
            actor_sbu_id=SBU_ID,
        )

        notification_service.mark_read_for_entity.assert_called_once_with(OTHER_USER_ID, "marketing_lead", lead.id)
        notification_service.notify_marketing_lead_assigned.assert_called_once_with(
            recipient_user_id=THIRD_USER_ID,
            marketing_lead_id=lead.id,
            actor_id=USER_ID,
        )

    def test_reassignment_to_self_does_not_notify(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(assigned_to_user_id=OTHER_USER_ID, sbu_id=SBU_ID)
        notification_service = _make_notification_service()
        service = MarketingLeadService(repository=repo, user_id=USER_ID, notification_service=notification_service)

        service.reassign_lead(
            LEAD_ID,
            MarketingLeadReassign(new_assigned_to_user_id=USER_ID),
            role_name="SBU Manager",
            actor_sbu_id=SBU_ID,
        )

        notification_service.notify_marketing_lead_assigned.assert_not_called()
