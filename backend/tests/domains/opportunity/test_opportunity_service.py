"""
Unit tests for OpportunityService.

Repository is fully mocked — no DB required.  Tests cover:
  - create_opportunity: stage/status validation, NotFoundError on missing refs
  - update_opportunity: PATCH semantics, stage gate, status transition, terminal lock
  - replace_splits: BR-FIN-01 (100% sum), empty list passthrough
  - replace_items / replace_stakeholders: NotFoundError on missing opportunity
"""

import uuid
from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import MagicMock

import pytest
from pydantic import ValidationError

from app.core.exceptions import (
    AuthorizationError,
    BusinessRuleViolation,
    ConflictError,
    NotFoundError,
)
from app.domains.notification.service import NotificationService
from app.domains.opportunity.models import Opportunity, OpportunityItem, Split
from app.domains.opportunity.repository import OpportunityRepository
from app.domains.opportunity.schemas import (
    ItemsBulkUpdate,
    OpportunityCreate,
    OpportunityItemCreate,
    OpportunityUpdate,
    SplitCreate,
    SplitsBulkUpdate,
    StakeholderLinkCreate,
    StakeholderLinkUpdate,
    StakeholdersBulkUpdate,
)
from app.domains.opportunity.service import OpportunityService
from app.domains.reference.models import LeadSource, LossReason, OpportunityStage, OpportunityStatus

# ---------------------------------------------------------------------------
# Seed-data UUIDs from Seed-Data.sql
# ---------------------------------------------------------------------------
STAGE_LEAD_ID = uuid.UUID("11111111-1111-1111-1111-100000000001")
STAGE_QUALIFIED_ID = uuid.UUID("11111111-1111-1111-1111-100000000002")
STAGE_DEMO_ID = uuid.UUID("11111111-1111-1111-1111-100000000003")
STAGE_NEGOTIATION_ID = uuid.UUID("11111111-1111-1111-1111-100000000005")

STATUS_ACTIVE_ID = uuid.UUID("22222222-2222-2222-2222-200000000001")
STATUS_ON_HOLD_ID = uuid.UUID("22222222-2222-2222-2222-200000000002")
STATUS_WON_ID = uuid.UUID("22222222-2222-2222-2222-200000000004")
STATUS_LOST_ID = uuid.UUID("22222222-2222-2222-2222-200000000005")

LOSS_REASON_COMPETITOR_ID = uuid.UUID("44444444-4444-4444-4444-400000000002")
LOSS_REASON_PRICE_ID = uuid.UUID("44444444-4444-4444-4444-400000000001")
HOLD_REASON_ID = uuid.UUID("33333333-3333-3333-3333-300000000001")

ACCOUNT_ID = uuid.uuid4()
PRODUCT_ID = uuid.uuid4()
USER_ID = uuid.uuid4()
SBU_ID = uuid.uuid4()
OTHER_SBU_ID = uuid.uuid4()
OPP_ID = uuid.uuid4()
LEAD_SOURCE_ID = uuid.uuid4()
TOMORROW = date.today() + timedelta(days=1)


# ---------------------------------------------------------------------------
# Builder helpers
# ---------------------------------------------------------------------------

def _make_stage(order: int, code: str = "LEAD") -> MagicMock:
    s = MagicMock(spec=OpportunityStage)
    s.id = uuid.uuid4()
    s.display_order = order
    s.stage_code = code
    s.default_win_probability = Decimal("5.00")
    return s


def _make_status(code: str, is_terminal: bool = False) -> MagicMock:
    s = MagicMock(spec=OpportunityStatus)
    s.id = uuid.uuid4()
    s.status_code = code
    s.is_terminal = is_terminal
    return s


def _make_loss_reason(code: str = "PRICE") -> MagicMock:
    r = MagicMock(spec=LossReason)
    r.id = uuid.uuid4()
    r.reason_code = code
    return r


def _make_lead_source(name: str = "REFERRAL") -> MagicMock:
    s = MagicMock(spec=LeadSource)
    s.id = uuid.uuid4()
    s.name = name
    return s


def _make_opportunity(**overrides) -> MagicMock:
    """
    Returns a MagicMock with all fields the service reads during validation.
    All optional fields default to None (a Lead-stage Active opportunity with nothing set).
    """
    defaults = dict(
        id=OPP_ID,
        account_id=ACCOUNT_ID,
        sbu_id=SBU_ID,
        name="Test Deal",
        stage_id=STAGE_LEAD_ID,
        status_id=STATUS_ACTIVE_ID,
        owner_id=USER_ID,
        win_probability=Decimal("5.00"),
        lead_source_id=None,
        indicative_value=None,
        demo_start_date=None,
        demo_end_date=None,
        expected_closure_date=None,
        po_number=None,
        loss_reason_id=None,
        loss_notes=None,
        competitor_name=None,
        hold_reason_id=None,
        reactivation_date=None,
        project_id=None,
        gate_override_approver_id=None,
        gate_override_reason_id=None,
        gate_override_note=None,
        gate_override_set_at=None,
        gate_override_set_by=None,
    )
    defaults.update(overrides)
    opp = MagicMock(spec=Opportunity)
    for k, v in defaults.items():
        setattr(opp, k, v)
    return opp


def _make_repo(**overrides) -> MagicMock:
    """
    Returns a repository mock wired for a Lead-stage Active opportunity with no items.
    Override any attribute as needed per test.
    """
    repo = MagicMock(spec=OpportunityRepository)
    repo.account_exists.return_value = True
    repo.sbu_exists.return_value = True
    repo.get_stage.return_value = _make_stage(10, "LEAD")
    repo.get_status.return_value = _make_status("ACTIVE")
    repo.get_loss_reason.return_value = _make_loss_reason("PRICE")
    repo.get_lead_source.return_value = _make_lead_source("REFERRAL")
    repo.get_owner_manager_id.return_value = None
    repo.get_user_role_name.return_value = None
    repo.get_for_update.return_value = None         # tests override as needed
    repo.has_items.return_value = False
    repo.create.side_effect = lambda obj: obj
    repo.update.side_effect = lambda obj: obj
    repo.replace_splits.return_value = []
    repo.replace_items.return_value = []
    repo.replace_stakeholders.return_value = []
    repo.list_splits.return_value = []
    # By default, assume any newly-referenced participant is in the opportunity's own
    # SBU -- tests exercising the ADR-037 cross-SBU rejection override this explicitly.
    repo.get_user_sbu_ids.side_effect = lambda ids: dict.fromkeys(ids, SBU_ID)
    # Same default for BR-OP-11 -- any referenced product is assumed to be in the
    # opportunity's own SBU unless a test overrides this to exercise the rejection.
    repo.get_product_sbu_ids.side_effect = lambda ids: dict.fromkeys(ids, SBU_ID)
    for k, v in overrides.items():
        setattr(repo, k, v)
    return repo


def _make_notification_service() -> MagicMock:
    return MagicMock(spec=NotificationService)


def _make_create_data(**overrides) -> OpportunityCreate:
    defaults = dict(
        name="New Deal",
        owner_id=USER_ID,
        stage_id=STAGE_LEAD_ID,
        status_id=STATUS_ACTIVE_ID,
        win_probability=Decimal("5.00"),
    )
    defaults.update(overrides)
    return OpportunityCreate(**defaults)


# ===========================================================================
# create_opportunity
# ===========================================================================

class TestCreateOpportunity:
    def test_raises_not_found_for_unknown_account(self):
        repo = _make_repo()
        repo.account_exists.return_value = False
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        with pytest.raises(NotFoundError, match="Account"):
            service.create_opportunity(
                ACCOUNT_ID, _make_create_data(), created_by=USER_ID, sbu_id=SBU_ID
            )

    def test_raises_not_found_for_unknown_stage(self):
        repo = _make_repo()
        repo.get_stage.return_value = None
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        with pytest.raises(NotFoundError, match="Stage"):
            service.create_opportunity(
                ACCOUNT_ID, _make_create_data(), created_by=USER_ID, sbu_id=SBU_ID
            )

    def test_raises_not_found_for_unknown_status(self):
        repo = _make_repo()
        repo.get_status.return_value = None
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        with pytest.raises(NotFoundError, match="Status"):
            service.create_opportunity(
                ACCOUNT_ID, _make_create_data(), created_by=USER_ID, sbu_id=SBU_ID
            )

    def test_creates_opportunity_at_lead_stage(self):
        """Lead stage with Active status and no items requires nothing."""
        repo = _make_repo()
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        result = service.create_opportunity(
            ACCOUNT_ID, _make_create_data(), created_by=USER_ID, sbu_id=SBU_ID
        )

        repo.create.assert_called_once()
        assert result.name == "New Deal"
        assert result.created_by == USER_ID

    def test_create_at_qualified_without_lead_source_raises(self):
        repo = _make_repo()
        repo.get_stage.return_value = _make_stage(20, "QUALIFIED")
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        data = _make_create_data(
            stage_id=STAGE_QUALIFIED_ID,
            indicative_value=Decimal("10.00"),
            items=[OpportunityItemCreate(product_id=PRODUCT_ID, quantity=1, unit_price_lakhs=Decimal("5"))],
        )
        with pytest.raises(BusinessRuleViolation, match="Lead Source"):
            service.create_opportunity(ACCOUNT_ID, data, created_by=USER_ID, sbu_id=SBU_ID)

    def test_create_at_demo_with_reorder_lead_source_skips_demo_date(self):
        """BR-OP-13: creating directly at Demo with lead_source=REPEAT_ORDER doesn't need
        a Demo Start Date -- a repeat order deal never has a fresh demo."""
        repo = _make_repo()
        repo.get_stage.return_value = _make_stage(30, "DEMO")
        repo.get_lead_source.return_value = _make_lead_source("REPEAT_ORDER")
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        data = _make_create_data(
            stage_id=STAGE_DEMO_ID,
            lead_source_id=LEAD_SOURCE_ID,
            indicative_value=Decimal("10.00"),
            demo_start_date=None,
            items=[OpportunityItemCreate(product_id=PRODUCT_ID, quantity=1, unit_price_lakhs=Decimal("5"))],
        )
        result = service.create_opportunity(ACCOUNT_ID, data, created_by=USER_ID, sbu_id=SBU_ID)

        assert result.lead_source_id == LEAD_SOURCE_ID

    def test_create_at_demo_without_reorder_still_requires_demo_date(self):
        repo = _make_repo()
        repo.get_stage.return_value = _make_stage(30, "DEMO")
        repo.get_lead_source.return_value = _make_lead_source("REFERRAL")
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        data = _make_create_data(
            stage_id=STAGE_DEMO_ID,
            lead_source_id=LEAD_SOURCE_ID,
            indicative_value=Decimal("10.00"),
            demo_start_date=None,
            items=[OpportunityItemCreate(product_id=PRODUCT_ID, quantity=1, unit_price_lakhs=Decimal("5"))],
        )
        with pytest.raises(BusinessRuleViolation, match="Demo Start Date"):
            service.create_opportunity(ACCOUNT_ID, data, created_by=USER_ID, sbu_id=SBU_ID)

    def test_create_with_initial_status_lost_without_loss_reason_raises(self):
        repo = _make_repo()
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.return_value = _make_status("LOST", is_terminal=True)
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        # On create, current_status_code="ACTIVE", so transitioning ACTIVE→LOST is validated
        data = _make_create_data(status_id=STATUS_LOST_ID)
        with pytest.raises(BusinessRuleViolation, match="Loss Reason"):
            service.create_opportunity(ACCOUNT_ID, data, created_by=USER_ID, sbu_id=SBU_ID)

    def test_audit_fields_set_on_create(self):
        repo = _make_repo()
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        service.create_opportunity(
            ACCOUNT_ID, _make_create_data(), created_by=USER_ID, sbu_id=SBU_ID
        )

        created_obj: Opportunity = repo.create.call_args[0][0]
        assert created_obj.created_by == USER_ID
        assert created_obj.updated_by == USER_ID
        assert created_obj.sbu_id == SBU_ID

    def test_notifies_new_owner_when_different_from_creator(self):
        repo = _make_repo()
        notification_service = _make_notification_service()
        service = OpportunityService(repository=repo, notification_service=notification_service)
        new_owner_id = uuid.uuid4()

        result = service.create_opportunity(
            ACCOUNT_ID, _make_create_data(owner_id=new_owner_id), created_by=USER_ID, sbu_id=SBU_ID
        )

        notification_service.notify_opportunity_assigned.assert_called_once_with(
            recipient_user_id=new_owner_id,
            opportunity_id=result.id,
            actor_id=USER_ID,
            lead_source_name=None,
        )

    def test_does_not_notify_when_owner_is_creator(self):
        repo = _make_repo()
        notification_service = _make_notification_service()
        service = OpportunityService(repository=repo, notification_service=notification_service)

        service.create_opportunity(
            ACCOUNT_ID, _make_create_data(owner_id=USER_ID), created_by=USER_ID, sbu_id=SBU_ID
        )

        notification_service.notify_opportunity_assigned.assert_not_called()

    def test_notify_passes_resolved_lead_source_name(self):
        repo = _make_repo()
        repo.get_lead_source.return_value = _make_lead_source("IndiaMART")
        notification_service = _make_notification_service()
        service = OpportunityService(repository=repo, notification_service=notification_service)
        new_owner_id = uuid.uuid4()

        service.create_opportunity(
            ACCOUNT_ID,
            _make_create_data(owner_id=new_owner_id, lead_source_id=LEAD_SOURCE_ID),
            created_by=USER_ID,
            sbu_id=SBU_ID,
        )

        _, kwargs = notification_service.notify_opportunity_assigned.call_args
        assert kwargs["lead_source_name"] == "IndiaMART"


# ===========================================================================
# create_opportunity — BR-FIN-07 referral credit
# ===========================================================================

class TestCreateOpportunityReferralCredit:
    def test_create_with_referred_by_user_id_persists(self):
        repo = _make_repo()
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())
        referrer_id = uuid.uuid4()

        result = service.create_opportunity(
            ACCOUNT_ID,
            _make_create_data(referred_by_user_id=referrer_id),
            created_by=USER_ID,
            sbu_id=SBU_ID,
        )

        assert result.referred_by_user_id == referrer_id
        assert result.referred_by_note is None

    def test_create_with_referred_by_note_persists(self):
        repo = _make_repo()
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        result = service.create_opportunity(
            ACCOUNT_ID,
            _make_create_data(referred_by_note="Dr. Menon, referring physician"),
            created_by=USER_ID,
            sbu_id=SBU_ID,
        )

        assert result.referred_by_note == "Dr. Menon, referring physician"
        assert result.referred_by_user_id is None

    def test_create_with_neither_referral_field_leaves_both_none(self):
        repo = _make_repo()
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        result = service.create_opportunity(
            ACCOUNT_ID, _make_create_data(), created_by=USER_ID, sbu_id=SBU_ID
        )

        assert result.referred_by_user_id is None
        assert result.referred_by_note is None

    def test_create_with_both_referral_fields_raises_validation_error(self):
        with pytest.raises(ValidationError, match="not both"):
            _make_create_data(
                referred_by_user_id=uuid.uuid4(),
                referred_by_note="Dr. Menon",
            )


# ===========================================================================
# create_opportunity — BR-OP-12 SBU override (Admin/General Manager only)
# ===========================================================================

class TestCreateOpportunitySbuOverride:
    def test_admin_can_create_in_other_sbu(self):
        repo = _make_repo()
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())
        data = _make_create_data(sbu_id=OTHER_SBU_ID)

        result = service.create_opportunity(
            ACCOUNT_ID, data, created_by=USER_ID, sbu_id=SBU_ID, role_name="Admin"
        )

        assert result.sbu_id == OTHER_SBU_ID

    def test_general_manager_can_create_in_other_sbu(self):
        repo = _make_repo()
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())
        data = _make_create_data(sbu_id=OTHER_SBU_ID)

        result = service.create_opportunity(
            ACCOUNT_ID, data, created_by=USER_ID, sbu_id=SBU_ID, role_name="General Manager"
        )

        assert result.sbu_id == OTHER_SBU_ID

    def test_admin_omitting_sbu_id_is_rejected(self):
        """Admin/GM have no meaningful 'own' SBU -- must always explicitly choose,
        never silently defaulted to their placeholder sbu_id."""
        repo = _make_repo()
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())
        data = _make_create_data()  # sbu_id left unset (None)

        with pytest.raises(BusinessRuleViolation, match="SBU is required"):
            service.create_opportunity(
                ACCOUNT_ID, data, created_by=USER_ID, sbu_id=SBU_ID, role_name="Admin"
            )
        repo.create.assert_not_called()

    def test_general_manager_omitting_sbu_id_is_rejected(self):
        repo = _make_repo()
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())
        data = _make_create_data()  # sbu_id left unset (None)

        with pytest.raises(BusinessRuleViolation, match="SBU is required"):
            service.create_opportunity(
                ACCOUNT_ID, data, created_by=USER_ID, sbu_id=SBU_ID, role_name="General Manager"
            )

    def test_admin_explicitly_choosing_own_sbu_is_accepted(self):
        """An explicit choice that happens to match the placeholder sbu_id is a real
        choice, not a silent default -- must succeed, not be treated as 'missing'."""
        repo = _make_repo()
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())
        data = _make_create_data(sbu_id=SBU_ID)

        result = service.create_opportunity(
            ACCOUNT_ID, data, created_by=USER_ID, sbu_id=SBU_ID, role_name="Admin"
        )

        assert result.sbu_id == SBU_ID

    def test_same_sbu_as_caller_is_not_treated_as_an_override(self):
        """Setting sbu_id to the caller's own SBU is a no-op, not an override attempt —
        no role check should trip even for a role with no override rights."""
        repo = _make_repo()
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())
        data = _make_create_data(sbu_id=SBU_ID)

        result = service.create_opportunity(
            ACCOUNT_ID, data, created_by=USER_ID, sbu_id=SBU_ID, role_name="Sales Staff"
        )

        assert result.sbu_id == SBU_ID

    def test_non_privileged_role_rejected(self):
        repo = _make_repo()
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())
        data = _make_create_data(sbu_id=OTHER_SBU_ID)

        with pytest.raises(AuthorizationError, match="Admin and General Manager"):
            service.create_opportunity(
                ACCOUNT_ID, data, created_by=USER_ID, sbu_id=SBU_ID, role_name="Sales Staff"
            )
        repo.create.assert_not_called()

    def test_missing_role_name_rejected(self):
        """role_name defaults to None (router omitting it, or a caller that forgot to
        pass it) — must fail closed, the same as any other non-privileged role."""
        repo = _make_repo()
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())
        data = _make_create_data(sbu_id=OTHER_SBU_ID)

        with pytest.raises(AuthorizationError):
            service.create_opportunity(ACCOUNT_ID, data, created_by=USER_ID, sbu_id=SBU_ID)

    def test_nonexistent_sbu_rejected(self):
        repo = _make_repo()
        repo.sbu_exists.return_value = False
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())
        data = _make_create_data(sbu_id=OTHER_SBU_ID)

        with pytest.raises(NotFoundError, match="SBU"):
            service.create_opportunity(
                ACCOUNT_ID, data, created_by=USER_ID, sbu_id=SBU_ID, role_name="Admin"
            )

    def test_overridden_sbu_used_for_item_validation(self):
        """BR-OP-11 companion: items must match the *overridden* SBU, not the caller's own."""
        repo = _make_repo()
        repo.get_product_sbu_ids.side_effect = lambda ids: dict.fromkeys(ids, OTHER_SBU_ID)
        repo.get_stage.return_value = _make_stage(20, "QUALIFIED")
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())
        data = _make_create_data(
            sbu_id=OTHER_SBU_ID,
            stage_id=STAGE_QUALIFIED_ID,
            lead_source_id=LEAD_SOURCE_ID,
            indicative_value=Decimal("10.00"),
            items=[OpportunityItemCreate(product_id=PRODUCT_ID, quantity=1, unit_price_lakhs=Decimal("5"))],
        )

        # Would raise BusinessRuleViolation if items were still checked against the
        # caller's own SBU_ID instead of the overridden OTHER_SBU_ID.
        result = service.create_opportunity(
            ACCOUNT_ID, data, created_by=USER_ID, sbu_id=SBU_ID, role_name="Admin"
        )

        assert result.sbu_id == OTHER_SBU_ID


# ===========================================================================
# create_opportunity — BR-OP-14 manager-attested gate override
# ===========================================================================

class TestCreateOpportunityGateOverride:
    def _override_data(self, **overrides) -> OpportunityCreate:
        defaults = dict(
            stage_id=STAGE_DEMO_ID,
            lead_source_id=LEAD_SOURCE_ID,
            indicative_value=Decimal("10.00"),
            demo_start_date=None,
            gate_override_approver_id=uuid.uuid4(),
            gate_override_reason_id=uuid.uuid4(),
            items=[OpportunityItemCreate(product_id=PRODUCT_ID, quantity=1, unit_price_lakhs=Decimal("5"))],
        )
        defaults.update(overrides)
        return _make_create_data(**defaults)

    def test_valid_area_manager_approver_succeeds_and_stamps_audit_fields(self):
        approver_id = uuid.uuid4()
        repo = _make_repo()
        repo.get_stage.return_value = _make_stage(30, "DEMO")
        repo.get_owner_manager_id.return_value = approver_id
        repo.get_user_role_name.return_value = "Area Manager"
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        data = self._override_data(gate_override_approver_id=approver_id)
        result = service.create_opportunity(ACCOUNT_ID, data, created_by=USER_ID, sbu_id=SBU_ID)

        assert result.gate_override_approver_id == approver_id
        assert result.gate_override_set_by == USER_ID
        assert result.gate_override_set_at is not None

    def test_notifies_named_approver(self):
        approver_id = uuid.uuid4()
        repo = _make_repo()
        repo.get_stage.return_value = _make_stage(30, "DEMO")
        repo.get_owner_manager_id.return_value = approver_id
        repo.get_user_role_name.return_value = "Area Manager"
        notification_service = _make_notification_service()
        service = OpportunityService(repository=repo, notification_service=notification_service)

        data = self._override_data(gate_override_approver_id=approver_id)
        result = service.create_opportunity(ACCOUNT_ID, data, created_by=USER_ID, sbu_id=SBU_ID)

        notification_service.notify_gate_override_named.assert_called_once_with(
            recipient_user_id=approver_id,
            opportunity_id=result.id,
            actor_id=USER_ID,
        )

    def test_no_override_does_not_notify(self):
        repo = _make_repo()
        notification_service = _make_notification_service()
        service = OpportunityService(repository=repo, notification_service=notification_service)

        service.create_opportunity(
            ACCOUNT_ID, _make_create_data(), created_by=USER_ID, sbu_id=SBU_ID
        )

        notification_service.notify_gate_override_named.assert_not_called()

    def test_approver_not_manager_and_not_gm_raises(self):
        repo = _make_repo()
        repo.get_stage.return_value = _make_stage(30, "DEMO")
        repo.get_owner_manager_id.return_value = uuid.uuid4()  # someone else
        repo.get_user_role_name.return_value = "Sales Staff"
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        with pytest.raises(AuthorizationError, match="immediate manager"):
            service.create_opportunity(
                ACCOUNT_ID, self._override_data(), created_by=USER_ID, sbu_id=SBU_ID
            )

    def test_approver_is_manager_but_not_area_manager_role_raises(self):
        approver_id = uuid.uuid4()
        repo = _make_repo()
        repo.get_stage.return_value = _make_stage(30, "DEMO")
        repo.get_owner_manager_id.return_value = approver_id
        repo.get_user_role_name.return_value = "Sales Staff"
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        with pytest.raises(AuthorizationError, match="Area Manager role"):
            service.create_opportunity(
                ACCOUNT_ID,
                self._override_data(gate_override_approver_id=approver_id),
                created_by=USER_ID,
                sbu_id=SBU_ID,
            )

    def test_gm_escalation_not_owners_manager_succeeds(self):
        """A General Manager qualifies with no reporting-line check, even when they
        are not this owner's manager -- the escalation path (5.1/5.2)."""
        repo = _make_repo()
        repo.get_stage.return_value = _make_stage(30, "DEMO")
        repo.get_owner_manager_id.return_value = uuid.uuid4()  # unrelated manager
        repo.get_user_role_name.return_value = "General Manager"
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        result = service.create_opportunity(
            ACCOUNT_ID, self._override_data(), created_by=USER_ID, sbu_id=SBU_ID
        )

        assert result.gate_override_approver_id is not None

    def test_gm_who_is_also_owners_manager_succeeds(self):
        """The GM-and-manager overlap case: the OR shouldn't accidentally exclude it."""
        approver_id = uuid.uuid4()
        repo = _make_repo()
        repo.get_stage.return_value = _make_stage(30, "DEMO")
        repo.get_owner_manager_id.return_value = approver_id
        repo.get_user_role_name.return_value = "General Manager"
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        result = service.create_opportunity(
            ACCOUNT_ID,
            self._override_data(gate_override_approver_id=approver_id),
            created_by=USER_ID,
            sbu_id=SBU_ID,
        )

        assert result.gate_override_approver_id == approver_id

    def test_no_override_leaves_audit_fields_unstamped(self):
        repo = _make_repo()
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        result = service.create_opportunity(
            ACCOUNT_ID, _make_create_data(), created_by=USER_ID, sbu_id=SBU_ID
        )

        assert result.gate_override_approver_id is None
        assert result.gate_override_set_at is None
        assert result.gate_override_set_by is None

    def test_reason_omitted_raises_schema_validation_error(self):
        """Schema-level 422, not a 500 -- gate_override_reason_id is required
        whenever gate_override_approver_id is set."""
        with pytest.raises(ValidationError, match="reason is required"):
            _make_create_data(gate_override_approver_id=uuid.uuid4())


# ===========================================================================
# update_opportunity (PATCH semantics)
# ===========================================================================

class TestUpdateOpportunity:
    def test_raises_not_found_for_missing_opportunity(self):
        repo = _make_repo()
        repo.get_for_update.return_value = None
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        with pytest.raises(NotFoundError, match="Opportunity"):
            service.update_opportunity(OPP_ID, OpportunityUpdate(name="X"), updated_by=USER_ID)

    def test_empty_patch_returns_unchanged_opportunity(self):
        opp = _make_opportunity()
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.return_value = _make_status("ACTIVE")
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        result = service.update_opportunity(OPP_ID, OpportunityUpdate(), updated_by=USER_ID)

        repo.update.assert_not_called()
        assert result is opp

    def test_patch_only_updates_provided_fields(self):
        opp = _make_opportunity(name="Old Name", lead_source_id=LEAD_SOURCE_ID)
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.return_value = _make_status("ACTIVE")
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        service.update_opportunity(OPP_ID, OpportunityUpdate(name="New Name"), updated_by=USER_ID)

        assert opp.name == "New Name"
        assert opp.lead_source_id == LEAD_SOURCE_ID  # unchanged

    def test_update_sets_referred_by_user_id(self):
        opp = _make_opportunity(referred_by_user_id=None, referred_by_note=None)
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.return_value = _make_status("ACTIVE")
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())
        referrer_id = uuid.uuid4()

        service.update_opportunity(
            OPP_ID, OpportunityUpdate(referred_by_user_id=referrer_id), updated_by=USER_ID
        )

        assert opp.referred_by_user_id == referrer_id

    def test_update_sets_referred_by_note(self):
        opp = _make_opportunity(referred_by_user_id=None, referred_by_note=None)
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.return_value = _make_status("ACTIVE")
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        service.update_opportunity(
            OPP_ID,
            OpportunityUpdate(referred_by_note="Dr. Menon, referring physician"),
            updated_by=USER_ID,
        )

        assert opp.referred_by_note == "Dr. Menon, referring physician"

    def test_update_with_both_referral_fields_raises_validation_error(self):
        with pytest.raises(ValidationError, match="not both"):
            OpportunityUpdate(referred_by_user_id=uuid.uuid4(), referred_by_note="Dr. Menon")

    def test_notifies_new_owner_on_reassignment(self):
        opp = _make_opportunity(owner_id=USER_ID)
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.return_value = _make_status("ACTIVE")
        notification_service = _make_notification_service()
        service = OpportunityService(repository=repo, notification_service=notification_service)
        new_owner_id = uuid.uuid4()
        actor_id = uuid.uuid4()

        service.update_opportunity(OPP_ID, OpportunityUpdate(owner_id=new_owner_id), updated_by=actor_id)

        notification_service.notify_opportunity_assigned.assert_called_once_with(
            recipient_user_id=new_owner_id,
            opportunity_id=opp.id,
            actor_id=actor_id,
            lead_source_name=None,  # opp.lead_source_id defaults to None
        )

    def test_notify_on_reassignment_resolves_lead_source_name(self):
        opp = _make_opportunity(owner_id=USER_ID, lead_source_id=LEAD_SOURCE_ID)
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.return_value = _make_status("ACTIVE")
        repo.get_lead_source.return_value = _make_lead_source("IndiaMART")
        notification_service = _make_notification_service()
        service = OpportunityService(repository=repo, notification_service=notification_service)

        service.update_opportunity(
            OPP_ID, OpportunityUpdate(owner_id=uuid.uuid4()), updated_by=uuid.uuid4()
        )

        _, kwargs = notification_service.notify_opportunity_assigned.call_args
        assert kwargs["lead_source_name"] == "IndiaMART"

    def test_does_not_notify_when_owner_id_unchanged(self):
        opp = _make_opportunity(owner_id=USER_ID)
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.return_value = _make_status("ACTIVE")
        notification_service = _make_notification_service()
        service = OpportunityService(repository=repo, notification_service=notification_service)

        service.update_opportunity(OPP_ID, OpportunityUpdate(owner_id=USER_ID), updated_by=uuid.uuid4())

        notification_service.notify_opportunity_assigned.assert_not_called()

    def test_does_not_notify_when_owner_id_omitted(self):
        opp = _make_opportunity(owner_id=USER_ID)
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.return_value = _make_status("ACTIVE")
        notification_service = _make_notification_service()
        service = OpportunityService(repository=repo, notification_service=notification_service)

        service.update_opportunity(OPP_ID, OpportunityUpdate(name="New Name"), updated_by=uuid.uuid4())

        notification_service.notify_opportunity_assigned.assert_not_called()

    def test_does_not_notify_on_self_assignment(self):
        opp = _make_opportunity(owner_id=USER_ID)
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.return_value = _make_status("ACTIVE")
        notification_service = _make_notification_service()
        service = OpportunityService(repository=repo, notification_service=notification_service)
        actor_id = uuid.uuid4()

        service.update_opportunity(OPP_ID, OpportunityUpdate(owner_id=actor_id), updated_by=actor_id)

        notification_service.notify_opportunity_assigned.assert_not_called()

    def test_stage_advance_blocked_by_gate(self):
        opp = _make_opportunity(lead_source_id=None, indicative_value=None)
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.side_effect = [
            _make_stage(10, "LEAD"),       # current stage lookup
            _make_stage(20, "QUALIFIED"),  # new stage lookup
        ]
        repo.get_status.return_value = _make_status("ACTIVE")
        repo.has_items.return_value = False
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        with pytest.raises(BusinessRuleViolation, match="Lead Source"):
            service.update_opportunity(
                OPP_ID,
                OpportunityUpdate(stage_id=STAGE_QUALIFIED_ID),
                updated_by=USER_ID,
            )

    def test_reorder_skips_demo_date_gate_on_update(self):
        """BR-OP-13: advancing to Demo with lead_source=REPEAT_ORDER doesn't need a
        Demo Start Date on the opportunity."""
        opp = _make_opportunity(lead_source_id=LEAD_SOURCE_ID, indicative_value=Decimal("10.00"))
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.side_effect = [
            _make_stage(20, "QUALIFIED"),  # current stage lookup
            _make_stage(30, "DEMO"),       # new stage lookup
        ]
        repo.get_status.return_value = _make_status("ACTIVE")
        repo.get_lead_source.return_value = _make_lead_source("REPEAT_ORDER")
        repo.has_items.return_value = True
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        result = service.update_opportunity(
            OPP_ID,
            OpportunityUpdate(stage_id=STAGE_DEMO_ID),
            updated_by=USER_ID,
        )

        assert result.stage_id == STAGE_DEMO_ID

    def test_terminal_status_blocks_update(self):
        """BR-OP-09: cannot change status of a Won opportunity."""
        opp = _make_opportunity(status_id=STATUS_WON_ID)
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.return_value = _make_status("WON", is_terminal=True)
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        with pytest.raises(BusinessRuleViolation, match="WON"):
            service.update_opportunity(
                OPP_ID,
                OpportunityUpdate(status_id=STATUS_ACTIVE_ID),
                updated_by=USER_ID,
            )

    def test_transition_to_lost_without_loss_reason_raises(self):
        opp = _make_opportunity(loss_reason_id=None)
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.side_effect = [
            _make_status("ACTIVE"),           # current status
            _make_status("LOST", is_terminal=True),  # new status
        ]
        repo.has_items.return_value = True
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        with pytest.raises(BusinessRuleViolation, match="Loss Reason"):
            service.update_opportunity(
                OPP_ID,
                OpportunityUpdate(status_id=STATUS_LOST_ID),
                updated_by=USER_ID,
            )

    def test_transition_to_on_hold_with_past_reactivation_date_raises(self):
        yesterday = date.today() - timedelta(days=1)
        opp = _make_opportunity(hold_reason_id=HOLD_REASON_ID, reactivation_date=yesterday)
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.side_effect = [
            _make_status("ACTIVE"),
            _make_status("ON_HOLD"),
        ]
        repo.has_items.return_value = False
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        with pytest.raises(BusinessRuleViolation, match="future date"):
            service.update_opportunity(
                OPP_ID,
                OpportunityUpdate(status_id=STATUS_ON_HOLD_ID),
                updated_by=USER_ID,
            )

    def test_valid_stage_advance_calls_repository_update(self):
        """Lead → Qualified with all gates met: calls repository.update."""
        opp = _make_opportunity(
            lead_source_id=LEAD_SOURCE_ID,
            indicative_value=Decimal("10.00"),
        )
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.side_effect = [
            _make_stage(10, "LEAD"),
            _make_stage(20, "QUALIFIED"),
        ]
        repo.get_status.return_value = _make_status("ACTIVE")
        repo.has_items.return_value = True
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        service.update_opportunity(
            OPP_ID,
            OpportunityUpdate(stage_id=STAGE_QUALIFIED_ID),
            updated_by=USER_ID,
        )

        repo.update.assert_called_once_with(opp)

    def test_updated_by_is_set(self):
        opp = _make_opportunity()
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.return_value = _make_status("ACTIVE")
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        service.update_opportunity(OPP_ID, OpportunityUpdate(name="X"), updated_by=USER_ID)

        assert opp.updated_by == USER_ID


# ===========================================================================
# update_opportunity — BR-OP-14 manager-attested gate override
# ===========================================================================

class TestUpdateOpportunityGateOverride:
    def test_setting_valid_override_validates_and_stamps(self):
        approver_id = uuid.uuid4()
        opp = _make_opportunity(owner_id=USER_ID)
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.return_value = _make_status("ACTIVE")
        repo.get_owner_manager_id.return_value = approver_id
        repo.get_user_role_name.return_value = "Area Manager"
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        service.update_opportunity(
            OPP_ID,
            OpportunityUpdate(gate_override_approver_id=approver_id, gate_override_reason_id=uuid.uuid4()),
            updated_by=USER_ID,
        )

        assert opp.gate_override_approver_id == approver_id
        assert opp.gate_override_set_by == USER_ID
        assert opp.gate_override_set_at is not None

    def test_setting_from_null_notifies_approver(self):
        approver_id = uuid.uuid4()
        opp = _make_opportunity(owner_id=USER_ID)
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.return_value = _make_status("ACTIVE")
        repo.get_owner_manager_id.return_value = approver_id
        repo.get_user_role_name.return_value = "Area Manager"
        notification_service = _make_notification_service()
        service = OpportunityService(repository=repo, notification_service=notification_service)

        service.update_opportunity(
            OPP_ID,
            OpportunityUpdate(gate_override_approver_id=approver_id, gate_override_reason_id=uuid.uuid4()),
            updated_by=USER_ID,
        )

        notification_service.notify_gate_override_named.assert_called_once_with(
            recipient_user_id=approver_id,
            opportunity_id=OPP_ID,
            actor_id=USER_ID,
        )

    def test_resending_same_approver_does_not_restamp_or_notify(self):
        """2026-08-27 fix: the frontend always resends gate_override_approver_id
        once the checkbox is checked, even on an unrelated edit. Re-sending the
        *same* value that was already set must not re-validate, re-stamp
        set_at/set_by, or re-notify the approver -- only a genuine change
        (null -> set, or set -> a different approver) should."""
        existing_approver_id = uuid.uuid4()
        existing_set_at = "2026-08-01T00:00:00Z"
        existing_set_by = uuid.uuid4()
        opp = _make_opportunity(
            owner_id=USER_ID,
            gate_override_approver_id=existing_approver_id,
            gate_override_set_at=existing_set_at,
            gate_override_set_by=existing_set_by,
        )
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.return_value = _make_status("ACTIVE")
        notification_service = _make_notification_service()
        service = OpportunityService(repository=repo, notification_service=notification_service)

        service.update_opportunity(
            OPP_ID,
            OpportunityUpdate(
                gate_override_approver_id=existing_approver_id, gate_override_reason_id=uuid.uuid4()
            ),
            updated_by=uuid.uuid4(),
        )

        assert opp.gate_override_set_at == existing_set_at
        assert opp.gate_override_set_by == existing_set_by
        repo.get_owner_manager_id.assert_not_called()
        repo.get_user_role_name.assert_not_called()
        notification_service.notify_gate_override_named.assert_not_called()

    def test_changing_to_a_different_approver_restamps_and_notifies(self):
        existing_approver_id = uuid.uuid4()
        new_approver_id = uuid.uuid4()
        opp = _make_opportunity(
            owner_id=USER_ID,
            gate_override_approver_id=existing_approver_id,
            gate_override_set_at="2026-08-01T00:00:00Z",
            gate_override_set_by=uuid.uuid4(),
        )
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.return_value = _make_status("ACTIVE")
        repo.get_owner_manager_id.return_value = new_approver_id
        repo.get_user_role_name.return_value = "Area Manager"
        notification_service = _make_notification_service()
        service = OpportunityService(repository=repo, notification_service=notification_service)

        service.update_opportunity(
            OPP_ID,
            OpportunityUpdate(
                gate_override_approver_id=new_approver_id, gate_override_reason_id=uuid.uuid4()
            ),
            updated_by=USER_ID,
        )

        assert opp.gate_override_approver_id == new_approver_id
        assert opp.gate_override_set_by == USER_ID
        notification_service.notify_gate_override_named.assert_called_once_with(
            recipient_user_id=new_approver_id,
            opportunity_id=OPP_ID,
            actor_id=USER_ID,
        )

    def test_unchecking_at_gated_stage_without_required_date_blocks(self):
        """2026-08-27 fix (TC-6): clearing the override on a deal already
        sitting at Negotiation with no Expected Closure Date must re-enforce
        the gate it was waiving, not silently let the save through just
        because Stage itself isn't changing in this request."""
        opp = _make_opportunity(
            owner_id=USER_ID,
            stage_id=STAGE_LEAD_ID,
            gate_override_approver_id=uuid.uuid4(),
            gate_override_reason_id=uuid.uuid4(),
            expected_closure_date=None,
            demo_start_date=date(2026, 8, 1),
            lead_source_id=LEAD_SOURCE_ID,
            indicative_value=Decimal("10.00"),
        )
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(50, "NEGOTIATION")
        repo.get_status.return_value = _make_status("ACTIVE")
        repo.has_items.return_value = True
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        with pytest.raises(BusinessRuleViolation, match="Expected Closure Date"):
            service.update_opportunity(
                OPP_ID,
                OpportunityUpdate(gate_override_approver_id=None),
                updated_by=USER_ID,
            )

    def test_unchecking_at_gated_stage_with_required_date_present_succeeds(self):
        """Same scenario, but the rep filled in the Closure Date before
        unchecking -- the gate is genuinely satisfied now, so clearing the
        override must succeed."""
        opp = _make_opportunity(
            owner_id=USER_ID,
            stage_id=STAGE_LEAD_ID,
            gate_override_approver_id=uuid.uuid4(),
            gate_override_reason_id=uuid.uuid4(),
            expected_closure_date=date(2026, 9, 1),
            demo_start_date=date(2026, 8, 1),
            lead_source_id=LEAD_SOURCE_ID,
            indicative_value=Decimal("10.00"),
        )
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(50, "NEGOTIATION")
        repo.get_status.return_value = _make_status("ACTIVE")
        repo.has_items.return_value = True
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        result = service.update_opportunity(
            OPP_ID,
            OpportunityUpdate(gate_override_approver_id=None),
            updated_by=USER_ID,
        )

        assert result.gate_override_approver_id is None

    def test_unchecking_at_a_stage_the_gate_never_applied_to_succeeds(self):
        """Unchecking on a deal still at Qualified (never reached Demo/
        Negotiation) has nothing to re-enforce -- must not block."""
        opp = _make_opportunity(
            owner_id=USER_ID,
            stage_id=STAGE_LEAD_ID,
            gate_override_approver_id=uuid.uuid4(),
            gate_override_reason_id=uuid.uuid4(),
            demo_start_date=None,
            expected_closure_date=None,
            lead_source_id=LEAD_SOURCE_ID,
            indicative_value=Decimal("10.00"),
        )
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(20, "QUALIFIED")
        repo.get_status.return_value = _make_status("ACTIVE")
        repo.has_items.return_value = True
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        result = service.update_opportunity(
            OPP_ID,
            OpportunityUpdate(gate_override_approver_id=None),
            updated_by=USER_ID,
        )

        assert result.gate_override_approver_id is None

    def test_setting_invalid_approver_raises(self):
        opp = _make_opportunity(owner_id=USER_ID)
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.return_value = _make_status("ACTIVE")
        repo.get_owner_manager_id.return_value = uuid.uuid4()  # someone else
        repo.get_user_role_name.return_value = "Sales Staff"
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        with pytest.raises(AuthorizationError, match="immediate manager"):
            service.update_opportunity(
                OPP_ID,
                OpportunityUpdate(
                    gate_override_approver_id=uuid.uuid4(), gate_override_reason_id=uuid.uuid4()
                ),
                updated_by=USER_ID,
            )

    def test_unrelated_update_does_not_revalidate_or_restamp(self):
        """An update that leaves gate_override_approver_id untouched must not
        re-run approver validation or re-stamp set_at/set_by."""
        existing_approver_id = uuid.uuid4()
        existing_set_at = "2026-08-01T00:00:00Z"
        existing_set_by = uuid.uuid4()
        opp = _make_opportunity(
            owner_id=USER_ID,
            gate_override_approver_id=existing_approver_id,
            gate_override_set_at=existing_set_at,
            gate_override_set_by=existing_set_by,
        )
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.return_value = _make_status("ACTIVE")
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        service.update_opportunity(OPP_ID, OpportunityUpdate(name="New Name"), updated_by=uuid.uuid4())

        assert opp.gate_override_set_at == existing_set_at
        assert opp.gate_override_set_by == existing_set_by
        repo.get_owner_manager_id.assert_not_called()
        repo.get_user_role_name.assert_not_called()

    def test_reason_omitted_raises_schema_validation_error(self):
        with pytest.raises(ValidationError, match="reason is required"):
            OpportunityUpdate(gate_override_approver_id=uuid.uuid4())


# ===========================================================================
# replace_splits (BR-FIN-01)
# ===========================================================================

class TestReplaceSplits:
    def test_raises_not_found_for_missing_opportunity(self):
        repo = _make_repo()
        repo.get_for_update.return_value = None
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        with pytest.raises(NotFoundError, match="Opportunity"):
            service.replace_splits(OPP_ID, SplitsBulkUpdate(splits=[]), updated_by=USER_ID)

    def test_empty_splits_list_passes_without_sum_check(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        service.replace_splits(OPP_ID, SplitsBulkUpdate(splits=[]), updated_by=USER_ID)

        repo.replace_splits.assert_called_once_with(OPP_ID, [])

    def test_splits_not_summing_to_100_raises(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        data = SplitsBulkUpdate(splits=[
            SplitCreate(user_id=uuid.uuid4(), split_percentage=Decimal("60")),
            SplitCreate(user_id=uuid.uuid4(), split_percentage=Decimal("30")),
        ])
        with pytest.raises(BusinessRuleViolation, match="100%"):
            service.replace_splits(OPP_ID, data, updated_by=USER_ID)

    def test_splits_summing_to_100_calls_repository(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        uid1, uid2 = uuid.uuid4(), uuid.uuid4()
        data = SplitsBulkUpdate(splits=[
            SplitCreate(user_id=uid1, split_percentage=Decimal("70")),
            SplitCreate(user_id=uid2, split_percentage=Decimal("30")),
        ])
        service.replace_splits(OPP_ID, data, updated_by=USER_ID)

        repo.replace_splits.assert_called_once()
        created_splits: list[Split] = repo.replace_splits.call_args[0][1]
        assert len(created_splits) == 2
        assert created_splits[0].user_id == uid1
        assert created_splits[0].split_percentage == Decimal("70")

    def test_single_100_percent_split_passes(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        data = SplitsBulkUpdate(splits=[
            SplitCreate(user_id=uuid.uuid4(), split_percentage=Decimal("100")),
        ])
        service.replace_splits(OPP_ID, data, updated_by=USER_ID)
        repo.replace_splits.assert_called_once()

    def test_split_audit_fields_set(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        data = SplitsBulkUpdate(splits=[
            SplitCreate(user_id=uuid.uuid4(), split_percentage=Decimal("100")),
        ])
        service.replace_splits(OPP_ID, data, updated_by=USER_ID)

        split: Split = repo.replace_splits.call_args[0][1][0]
        assert split.created_by == USER_ID
        assert split.updated_by == USER_ID

    def test_new_participant_from_different_sbu_raises(self):
        """ADR-037: cross-SBU splits on a single Opportunity are no longer supported."""
        other_sbu = uuid.uuid4()
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()  # sbu_id=SBU_ID
        uid = uuid.uuid4()
        repo.get_user_sbu_ids.side_effect = lambda ids: {uid: other_sbu}
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        data = SplitsBulkUpdate(splits=[SplitCreate(user_id=uid, split_percentage=Decimal("100"))])
        with pytest.raises(BusinessRuleViolation, match="SBU"):
            service.replace_splits(OPP_ID, data, updated_by=USER_ID)

        repo.replace_splits.assert_not_called()

    def test_new_participant_from_same_sbu_passes(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()  # sbu_id=SBU_ID
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        data = SplitsBulkUpdate(
            splits=[SplitCreate(user_id=uuid.uuid4(), split_percentage=Decimal("100"))]
        )
        service.replace_splits(OPP_ID, data, updated_by=USER_ID)
        repo.replace_splits.assert_called_once()

    def test_existing_cross_sbu_participant_is_grandfathered(self):
        """A pre-existing cross-SBU split (e.g. legacy ADR-003 data) must not block
        future edits to the same opportunity, since replace_splits re-submits the
        full list on every save -- only newly-added participants are checked."""
        legacy_user_id = uuid.uuid4()
        other_sbu = uuid.uuid4()
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()  # sbu_id=SBU_ID
        repo.list_splits.return_value = [
            MagicMock(spec=Split, user_id=legacy_user_id)
        ]
        # get_user_sbu_ids should never even be consulted for the legacy participant --
        # if it were, this would resolve to other_sbu and fail the check.
        repo.get_user_sbu_ids.side_effect = lambda ids: {legacy_user_id: other_sbu, **{i: SBU_ID for i in ids}}
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        data = SplitsBulkUpdate(splits=[
            SplitCreate(user_id=legacy_user_id, split_percentage=Decimal("100")),
        ])
        service.replace_splits(OPP_ID, data, updated_by=USER_ID)
        repo.replace_splits.assert_called_once()


# ===========================================================================
# replace_items
# ===========================================================================

class TestReplaceItems:
    def test_raises_not_found_for_missing_opportunity(self):
        repo = _make_repo()
        repo.get_for_update.return_value = None
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        with pytest.raises(NotFoundError, match="Opportunity"):
            service.replace_items(
                OPP_ID,
                ItemsBulkUpdate(items=[]),
                updated_by=USER_ID,
            )

    def test_empty_items_clears_all(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        service.replace_items(OPP_ID, ItemsBulkUpdate(items=[]), updated_by=USER_ID)

        repo.replace_items.assert_called_once_with(OPP_ID, [])

    def test_items_are_constructed_correctly(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        data = ItemsBulkUpdate(items=[
            OpportunityItemCreate(
                product_id=PRODUCT_ID,
                quantity=2,
                unit_price_lakhs=Decimal("5.00"),
                discount_lakhs=Decimal("0.50"),
            )
        ])
        service.replace_items(OPP_ID, data, updated_by=USER_ID)

        new_items: list[OpportunityItem] = repo.replace_items.call_args[0][1]
        assert len(new_items) == 1
        assert new_items[0].product_id == PRODUCT_ID
        assert new_items[0].quantity == 2
        assert new_items[0].created_by == USER_ID

    def test_line_type_defaults_to_product(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        data = ItemsBulkUpdate(items=[
            OpportunityItemCreate(product_id=PRODUCT_ID, quantity=1, unit_price_lakhs=Decimal("5.00")),
        ])
        service.replace_items(OPP_ID, data, updated_by=USER_ID)

        new_items: list[OpportunityItem] = repo.replace_items.call_args[0][1]
        assert new_items[0].line_type == "PRODUCT"

    def test_buyback_line_constructed_with_description(self):
        # BR-CAT-03: a Buyback line carries a free-text description instead of a
        # catalog product_id.
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        data = ItemsBulkUpdate(items=[
            OpportunityItemCreate(
                description="GE LOGIQ P9 ultrasound, 2018, working condition",
                quantity=1,
                unit_price_lakhs=Decimal("5.00"),
                line_type="BUYBACK",
            ),
        ])
        service.replace_items(OPP_ID, data, updated_by=USER_ID)

        new_items: list[OpportunityItem] = repo.replace_items.call_args[0][1]
        assert new_items[0].line_type == "BUYBACK"
        assert new_items[0].product_id is None
        assert new_items[0].description == "GE LOGIQ P9 ultrasound, 2018, working condition"


# ===========================================================================
# add_item
# ===========================================================================

class TestAddItem:
    def test_buyback_line_constructed_with_description(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        repo.add_item.side_effect = lambda item: item
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        data = OpportunityItemCreate(
            description="GE LOGIQ P9 ultrasound, 2018, working condition",
            quantity=1,
            unit_price_lakhs=Decimal("5.00"),
            line_type="BUYBACK",
        )
        result = service.add_item(OPP_ID, data, created_by=USER_ID)

        assert result.line_type == "BUYBACK"
        assert result.product_id is None
        assert result.description == "GE LOGIQ P9 ultrasound, 2018, working condition"


# ===========================================================================
# OpportunityItemCreate schema validation (BR-CAT-03)
# ===========================================================================

class TestOpportunityItemCreateValidation:
    def test_buyback_without_description_rejected(self):
        with pytest.raises(ValidationError, match="description is required"):
            OpportunityItemCreate(
                quantity=1, unit_price_lakhs=Decimal("5.00"), line_type="BUYBACK"
            )

    def test_product_without_product_id_rejected(self):
        with pytest.raises(ValidationError, match="product_id is required"):
            OpportunityItemCreate(
                quantity=1, unit_price_lakhs=Decimal("5.00"), line_type="PRODUCT"
            )


# ===========================================================================
# replace_stakeholders
# ===========================================================================

class TestReplaceStakeholders:
    def test_raises_not_found_for_missing_opportunity(self):
        repo = _make_repo()
        repo.get_for_update.return_value = None
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        with pytest.raises(NotFoundError, match="Opportunity"):
            service.replace_stakeholders(
                OPP_ID,
                StakeholdersBulkUpdate(stakeholders=[]),
                updated_by=USER_ID,
            )

    def test_empty_stakeholders_clears_all(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        service.replace_stakeholders(
            OPP_ID, StakeholdersBulkUpdate(stakeholders=[]), updated_by=USER_ID
        )

        repo.replace_stakeholders.assert_called_once_with(OPP_ID, [])

    def test_stakeholders_mapped_with_correct_fields(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        stakeholder_id = uuid.uuid4()
        data = StakeholdersBulkUpdate(stakeholders=[
            StakeholderLinkCreate(
                stakeholder_id=stakeholder_id,
                influence_level="HIGH",
                decision_role="Procurement Head",
                notes="Key decision maker",
            )
        ])
        service.replace_stakeholders(OPP_ID, data, updated_by=USER_ID)

        links = repo.replace_stakeholders.call_args[0][1]
        assert len(links) == 1
        assert links[0].stakeholder_id == stakeholder_id
        assert links[0].influence_level == "HIGH"
        assert links[0].decision_role == "Procurement Head"


# ===========================================================================
# add_stakeholder
# ===========================================================================

class TestAddStakeholder:
    def test_raises_not_found_for_missing_opportunity(self):
        repo = _make_repo()
        repo.get_for_update.return_value = None
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        with pytest.raises(NotFoundError, match="Opportunity"):
            service.add_stakeholder(
                OPP_ID,
                StakeholderLinkCreate(stakeholder_id=uuid.uuid4()),
                created_by=USER_ID,
            )

    def test_raises_conflict_when_already_linked(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        stakeholder_id = uuid.uuid4()
        repo.get_stakeholder_link.return_value = MagicMock()
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        with pytest.raises(ConflictError, match="already linked"):
            service.add_stakeholder(
                OPP_ID,
                StakeholderLinkCreate(stakeholder_id=stakeholder_id),
                created_by=USER_ID,
            )

    def test_adds_stakeholder_with_correct_fields(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        repo.get_stakeholder_link.return_value = None
        stakeholder_id = uuid.uuid4()
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        service.add_stakeholder(
            OPP_ID,
            StakeholderLinkCreate(
                stakeholder_id=stakeholder_id,
                influence_level="MEDIUM",
                decision_role="Champion",
                notes="Supportive",
            ),
            created_by=USER_ID,
        )

        link = repo.add_stakeholder.call_args[0][0]
        assert link.opportunity_id == OPP_ID
        assert link.stakeholder_id == stakeholder_id
        assert link.influence_level == "MEDIUM"
        assert link.decision_role == "Champion"
        assert link.created_by == USER_ID


# ===========================================================================
# remove_stakeholder
# ===========================================================================

class TestRemoveStakeholder:
    def test_raises_not_found_when_not_linked(self):
        repo = _make_repo()
        repo.get_stakeholder_link.return_value = None
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        with pytest.raises(NotFoundError, match="not linked"):
            service.remove_stakeholder(OPP_ID, uuid.uuid4())

    def test_deletes_the_link(self):
        repo = _make_repo()
        link = MagicMock()
        repo.get_stakeholder_link.return_value = link
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        service.remove_stakeholder(OPP_ID, uuid.uuid4())

        repo.delete_stakeholder.assert_called_once_with(link)


# ===========================================================================
# update_stakeholder
# ===========================================================================

class TestUpdateStakeholder:
    def test_raises_not_found_when_not_linked(self):
        repo = _make_repo()
        repo.get_stakeholder_link.return_value = None
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        with pytest.raises(NotFoundError, match="not linked"):
            service.update_stakeholder(
                OPP_ID, uuid.uuid4(), StakeholderLinkUpdate(), updated_by=USER_ID
            )

    def test_updates_only_provided_fields(self):
        repo = _make_repo()
        link = MagicMock(influence_level="LOW", decision_role="Old Role", notes="Old notes")
        repo.get_stakeholder_link.return_value = link
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())

        service.update_stakeholder(
            OPP_ID, uuid.uuid4(),
            StakeholderLinkUpdate(decision_role="New Role"),
            updated_by=USER_ID,
        )

        assert link.decision_role == "New Role"
        assert link.influence_level == "LOW"  # untouched — not in the update payload
        assert link.updated_by == USER_ID
        repo.update_stakeholder_link.assert_called_once_with(link)
