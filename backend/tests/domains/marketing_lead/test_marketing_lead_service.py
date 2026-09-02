"""
Unit tests for MarketingLeadService.

Repository is fully mocked -- no DB required. Tests cover:
  - create_lead: role gate (Marketing User/Admin/General Manager only),
    lead_source.is_marketing_source gate
  - discard_lead / mark_converted: role gate (assigned rep or Admin/GM),
    already-reviewed rejection, not-found, and the happy path's field
    mutations (status/reviewed_by/reviewed_at plus the action-specific
    fields)
"""

import uuid
from unittest.mock import MagicMock

import pytest

from app.core.exceptions import AuthorizationError, BusinessRuleViolation, NotFoundError
from app.domains.marketing_lead.models import MarketingLead
from app.domains.marketing_lead.repository import MarketingLeadRepository
from app.domains.marketing_lead.schemas import MarketingLeadCreate, MarketingLeadDiscard, MarketingLeadMarkConverted
from app.domains.marketing_lead.service import MarketingLeadService

USER_ID = uuid.uuid4()
OTHER_USER_ID = uuid.uuid4()
ACCOUNT_ID = uuid.uuid4()
SBU_ID = uuid.uuid4()
LEAD_SOURCE_ID = uuid.uuid4()
LEAD_ID = uuid.uuid4()
OPPORTUNITY_ID = uuid.uuid4()


def _make_repo() -> MagicMock:
    repo = MagicMock(spec=MarketingLeadRepository)
    repo.create.side_effect = lambda obj: obj
    repo.update.side_effect = lambda obj: obj
    repo.is_valid_marketing_source.return_value = True
    return repo


def _make_lead(*, status: str = "NEW", assigned_to_user_id: uuid.UUID = USER_ID) -> MarketingLead:
    return MarketingLead(
        id=LEAD_ID,
        account_id=ACCOUNT_ID,
        sbu_id=SBU_ID,
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
        service = MarketingLeadService(repository=repo, user_id=USER_ID)

        lead = service.create_lead(_make_create_data(), role_name="Marketing User")

        assert lead.created_by == USER_ID
        assert lead.assigned_to_user_id == OTHER_USER_ID
        repo.create.assert_called_once()

    @pytest.mark.parametrize("role_name", ["Admin", "General Manager"])
    def test_unrestricted_roles_can_create(self, role_name):
        service = MarketingLeadService(repository=_make_repo(), user_id=USER_ID)

        lead = service.create_lead(_make_create_data(), role_name=role_name)

        assert lead.created_by == USER_ID

    def test_account_id_optional(self):
        # "Not Sure Yet" -- Marketing User has no Account-creation rights,
        # so account_id must be omittable when the hospital isn't in the
        # directory yet (0034_make_marketing_lead_account_nullable.py).
        service = MarketingLeadService(repository=_make_repo(), user_id=USER_ID)

        lead = service.create_lead(_make_create_data(account_id=None), role_name="Marketing User")

        assert lead.account_id is None

    def test_other_roles_cannot_create(self):
        service = MarketingLeadService(repository=_make_repo(), user_id=USER_ID)

        with pytest.raises(AuthorizationError):
            service.create_lead(_make_create_data(), role_name="Area Manager")

    def test_non_marketing_lead_source_rejected(self):
        repo = _make_repo()
        repo.is_valid_marketing_source.return_value = False
        service = MarketingLeadService(repository=repo, user_id=USER_ID)

        with pytest.raises(BusinessRuleViolation):
            service.create_lead(_make_create_data(), role_name="Marketing User")
        repo.create.assert_not_called()


class TestListLeads:
    def test_delegates_to_repository(self):
        repo = _make_repo()
        repo.list_all.return_value = ["row"]
        service = MarketingLeadService(repository=repo, user_id=USER_ID)

        result = service.list_leads()

        repo.list_all.assert_called_once_with()
        assert result == ["row"]


class TestDiscardLead:
    def test_assigned_rep_can_discard(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(assigned_to_user_id=USER_ID)
        service = MarketingLeadService(repository=repo, user_id=USER_ID)

        lead = service.discard_lead(
            LEAD_ID, MarketingLeadDiscard(discard_reason="DUPLICATE", discard_note="dup of X"),
            role_name="Sales Executive",
        )

        assert lead.status == "DISCARDED"
        assert lead.discard_reason == "DUPLICATE"
        assert lead.discard_note == "dup of X"
        assert lead.reviewed_by == USER_ID
        assert lead.reviewed_at is not None

    def test_admin_can_discard_someone_elses_lead(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(assigned_to_user_id=OTHER_USER_ID)
        service = MarketingLeadService(repository=repo, user_id=USER_ID)

        lead = service.discard_lead(LEAD_ID, MarketingLeadDiscard(discard_reason="JUNK"), role_name="Admin")

        assert lead.status == "DISCARDED"

    def test_non_assigned_non_admin_cannot_discard(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(assigned_to_user_id=OTHER_USER_ID)
        service = MarketingLeadService(repository=repo, user_id=USER_ID)

        with pytest.raises(AuthorizationError):
            service.discard_lead(LEAD_ID, MarketingLeadDiscard(discard_reason="JUNK"), role_name="SBU Manager")

    def test_already_reviewed_lead_cannot_be_discarded(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(status="CONVERTED", assigned_to_user_id=USER_ID)
        service = MarketingLeadService(repository=repo, user_id=USER_ID)

        with pytest.raises(BusinessRuleViolation):
            service.discard_lead(LEAD_ID, MarketingLeadDiscard(discard_reason="JUNK"), role_name="Sales Executive")

    def test_missing_lead_raises_not_found(self):
        repo = _make_repo()
        repo.get_by_id.return_value = None
        service = MarketingLeadService(repository=repo, user_id=USER_ID)

        with pytest.raises(NotFoundError):
            service.discard_lead(LEAD_ID, MarketingLeadDiscard(discard_reason="JUNK"), role_name="Admin")


class TestMarkConverted:
    def test_assigned_rep_can_convert(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(assigned_to_user_id=USER_ID)
        service = MarketingLeadService(repository=repo, user_id=USER_ID)

        lead = service.mark_converted(
            LEAD_ID, MarketingLeadMarkConverted(converted_opportunity_id=OPPORTUNITY_ID),
            role_name="Sales Executive",
        )

        assert lead.status == "CONVERTED"
        assert lead.converted_opportunity_id == OPPORTUNITY_ID
        assert lead.reviewed_by == USER_ID
        assert lead.reviewed_at is not None

    def test_non_assigned_non_admin_cannot_convert(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(assigned_to_user_id=OTHER_USER_ID)
        service = MarketingLeadService(repository=repo, user_id=USER_ID)

        with pytest.raises(AuthorizationError):
            service.mark_converted(
                LEAD_ID, MarketingLeadMarkConverted(converted_opportunity_id=OPPORTUNITY_ID),
                role_name="Sales Executive",
            )

    def test_already_reviewed_lead_cannot_be_converted_again(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_lead(status="DISCARDED", assigned_to_user_id=USER_ID)
        service = MarketingLeadService(repository=repo, user_id=USER_ID)

        with pytest.raises(BusinessRuleViolation):
            service.mark_converted(
                LEAD_ID, MarketingLeadMarkConverted(converted_opportunity_id=OPPORTUNITY_ID),
                role_name="Sales Executive",
            )
