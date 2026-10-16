"""
Unit tests for OpportunityService.

Repository is fully mocked — no DB required.  Tests cover:
  - create_opportunity: stage/status validation, NotFoundError on missing refs
  - update_opportunity: PATCH semantics, stage gate, status transition, terminal lock
  - replace_splits: BR-FIN-01 (100% sum), empty list passthrough
  - split editing authority (BR-FIN-08): can_edit_splits and replace_splits agree
  - replace_items: NotFoundError on missing opportunity
"""

import uuid
from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal
from unittest.mock import MagicMock
from zoneinfo import ZoneInfo

import pytest
from pydantic import ValidationError

from app.core.exceptions import (
    AuthorizationError,
    BusinessRuleViolation,
    ConflictError,
    NotFoundError,
)
from app.domains.activity.service import ActivityService, ReminderService
from app.domains.notification.service import NotificationService
from app.domains.opportunity.models import Opportunity, OpportunityItem, Split
from app.domains.opportunity.repository import OpportunityRepository
from app.domains.opportunity.schemas import (
    FirstActivity,
    ItemsBulkUpdate,
    OpportunityCreate,
    OpportunityItemCreate,
    OpportunityUpdate,
    SplitCreate,
    SplitsBulkUpdate,
    StageChangeNote,
    StakeholderLinkCreate,
    StakeholderLinkUpdate,
)
from app.domains.opportunity.service import OpportunityService
from app.domains.opportunity.validators import _today_ist
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
TOMORROW = _today_ist() + timedelta(days=1)
_IST = ZoneInfo("Asia/Kolkata")


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
        po_date=None,
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
        high_priority_manual=False,
        full_payment_confirmed_at=None,
        full_payment_confirmed_by=None,
        full_payment_note=None,
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
    repo.list_splits.return_value = []
    # By default, assume any newly-referenced participant is in the opportunity's own
    # SBU -- tests exercising the ADR-037 cross-SBU rejection override this explicitly.
    repo.get_user_sbu_ids.side_effect = lambda ids: dict.fromkeys(ids, SBU_ID)
    repo.get_user_display_names.side_effect = lambda ids: {i: f"User {i}" for i in ids}
    # BR-FIN-08: an Area Manager's zones cover no account unless a test says so.
    repo.account_in_user_zones.return_value = False
    # Same default for BR-OP-11 -- any referenced product is assumed to be in the
    # opportunity's own SBU unless a test overrides this to exercise the rejection.
    repo.get_product_sbu_ids.side_effect = lambda ids: dict.fromkeys(ids, SBU_ID)
    for k, v in overrides.items():
        setattr(repo, k, v)
    return repo


def _make_notification_service() -> MagicMock:
    return MagicMock(spec=NotificationService)


def _make_service(repo: MagicMock) -> OpportunityService:
    # BR-OP-22: a stage or status change records its note through these;
    # by default the changer has no open next action of their own.
    reminder_service = MagicMock(spec=ReminderService)
    reminder_service.has_open_own_on_opportunity.return_value = False
    return OpportunityService(
        repository=repo,
        notification_service=_make_notification_service(),
        activity_service=MagicMock(spec=ActivityService),
        reminder_service=reminder_service,
    )


def _note(**overrides) -> StageChangeNote:
    """BR-OP-22: a Note with a next action due tomorrow (no next action to close)."""
    defaults = dict(
        activity_date=datetime.now(_IST),
        notes="Customer asked to move ahead",
        next_action_text="Call to confirm",
        next_action_due_date=datetime.combine(TOMORROW, time(11, 0), tzinfo=_IST),
    )
    defaults.update(overrides)
    return StageChangeNote(**defaults)


def _noted(**fields) -> OpportunityUpdate:
    """A stage or status change, with the note BR-OP-22 requires."""
    return OpportunityUpdate(change_note=_note(), **fields)


def _first_activity(**overrides) -> FirstActivity:
    """BR-OP-21: a Visit with a next action due tomorrow, owner left to default."""
    defaults = dict(
        activity_type="VISIT",
        activity_date=datetime.now(_IST),
        notes="Met the HOD, wants a quote",
        next_action_text="Send the quote",
        next_action_due_date=datetime.combine(TOMORROW, time(11, 0), tzinfo=_IST),
    )
    defaults.update(overrides)
    return FirstActivity(**defaults)


def _make_create_data(**overrides) -> OpportunityCreate:
    defaults = dict(
        name="New Deal",
        owner_id=USER_ID,
        stage_id=STAGE_LEAD_ID,
        status_id=STATUS_ACTIVE_ID,
        win_probability=Decimal("5.00"),
        first_activity=_first_activity(),
    )
    defaults.update(overrides)
    return OpportunityCreate(**defaults)


def _won_create_data(**overrides) -> OpportunityCreate:
    """Create-as-Won at Payment Pending with every stage gate from Lead
    satisfied (BR-OP-00) -- BR-OP-17 still refuses it."""
    defaults = dict(
        status_id=STATUS_WON_ID,
        lead_source_id=LEAD_SOURCE_ID,
        indicative_value=Decimal("5"),
        demo_start_date=date(2026, 9, 1),
        expected_closure_date=date(2026, 10, 1),
        po_number="PO-1001",
        items=[OpportunityItemCreate(product_id=PRODUCT_ID, quantity=1, unit_price_lakhs=Decimal("5"))],
    )
    defaults.update(overrides)
    return _make_create_data(**defaults)


# ===========================================================================
# create_opportunity
# ===========================================================================

class TestCreateOpportunity:
    def test_create_with_future_po_date_refused(self):
        repo = _make_repo()
        service = _make_service(repo)

        with pytest.raises(BusinessRuleViolation, match="future"):
            service.create_opportunity(
                ACCOUNT_ID,
                _make_create_data(po_date=_today_ist() + timedelta(days=1)),
                created_by=USER_ID,
                sbu_id=SBU_ID,
            )
        repo.create.assert_not_called()

    def test_raises_not_found_for_unknown_account(self):
        repo = _make_repo()
        repo.account_exists.return_value = False
        service = _make_service(repo)

        with pytest.raises(NotFoundError, match="Account"):
            service.create_opportunity(
                ACCOUNT_ID, _make_create_data(), created_by=USER_ID, sbu_id=SBU_ID
            )

    def test_raises_not_found_for_unknown_stage(self):
        repo = _make_repo()
        repo.get_stage.return_value = None
        service = _make_service(repo)

        with pytest.raises(NotFoundError, match="Stage"):
            service.create_opportunity(
                ACCOUNT_ID, _make_create_data(), created_by=USER_ID, sbu_id=SBU_ID
            )

    def test_raises_not_found_for_unknown_status(self):
        repo = _make_repo()
        repo.get_status.return_value = None
        service = _make_service(repo)

        with pytest.raises(NotFoundError, match="Status"):
            service.create_opportunity(
                ACCOUNT_ID, _make_create_data(), created_by=USER_ID, sbu_id=SBU_ID
            )

    def test_creates_opportunity_at_lead_stage(self):
        """Lead stage with Active status and no items requires nothing."""
        repo = _make_repo()
        service = _make_service(repo)

        result = service.create_opportunity(
            ACCOUNT_ID, _make_create_data(), created_by=USER_ID, sbu_id=SBU_ID
        )

        repo.create.assert_called_once()
        assert repo.create.call_args[0][0].po_date is None
        assert result.name == "New Deal"
        assert result.created_by == USER_ID

    def test_create_at_qualified_without_lead_source_raises(self):
        repo = _make_repo()
        repo.get_stage.return_value = _make_stage(20, "QUALIFIED")
        service = _make_service(repo)

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
        service = _make_service(repo)

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
        service = _make_service(repo)

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
        service = _make_service(repo)

        # On create, current_status_code="ACTIVE", so transitioning ACTIVE→LOST is validated
        data = _make_create_data(status_id=STATUS_LOST_ID)
        with pytest.raises(BusinessRuleViolation, match="Loss Reason"):
            service.create_opportunity(ACCOUNT_ID, data, created_by=USER_ID, sbu_id=SBU_ID)

    # BR-OP-17 (Basheer, 2026-10-03): no creating directly as Won -- not even at
    # Payment Pending with every gate met. It must be saved at Payment Pending
    # first, then marked Won in a later save.

    def test_create_as_won_refused_even_at_payment_pending(self):
        repo = _make_repo()
        repo.get_status.return_value = _make_status("WON", is_terminal=True)
        repo.get_stage.return_value = _make_stage(80, "PAYMENT_PENDING")
        service = _make_service(repo)

        with pytest.raises(BusinessRuleViolation, match="can't be created as Won"):
            service.create_opportunity(ACCOUNT_ID, _won_create_data(), created_by=USER_ID, sbu_id=SBU_ID)
        repo.create.assert_not_called()

    def test_create_at_active_leaves_payment_confirmation_empty(self):
        repo = _make_repo()
        service = _make_service(repo)

        service.create_opportunity(ACCOUNT_ID, _make_create_data(), created_by=USER_ID, sbu_id=SBU_ID)

        created_obj: Opportunity = repo.create.call_args[0][0]
        assert created_obj.full_payment_confirmed_at is None
        assert created_obj.full_payment_confirmed_by is None

    # No equivalent "create directly at Lost" test -- create_opportunity's
    # validate_status_transition call hardcodes loss_reason_id/competitor_name/
    # hold_reason_id/reactivation_date to None regardless of `data` (a
    # pre-existing, unrelated gap, found while writing this test -- it means
    # creating an Opportunity directly at Lost can never actually succeed
    # today, since the Loss Reason check always sees None). Out of scope
    # here; flagged separately rather than silently fixed alongside this
    # feature.

    def test_create_at_active_does_not_stamp_closed_at(self):
        repo = _make_repo()
        service = _make_service(repo)

        service.create_opportunity(ACCOUNT_ID, _make_create_data(), created_by=USER_ID, sbu_id=SBU_ID)

        created_obj: Opportunity = repo.create.call_args[0][0]
        assert created_obj.closed_at is None

    def test_audit_fields_set_on_create(self):
        repo = _make_repo()
        service = _make_service(repo)

        service.create_opportunity(
            ACCOUNT_ID, _make_create_data(), created_by=USER_ID, sbu_id=SBU_ID
        )

        created_obj: Opportunity = repo.create.call_args[0][0]
        assert created_obj.created_by == USER_ID
        assert created_obj.updated_by == USER_ID
        assert created_obj.sbu_id == SBU_ID

    # --- BR-OP-21: the first activity is saved with the Opportunity ---

    def test_first_activity_logged_under_creator_with_next_action_to_owner(self):
        # Plan D16: the creator had the conversation; the owner follows up.
        repo = _make_repo()
        service = _make_service(repo)
        creator_id = uuid.uuid4()

        opp = service.create_opportunity(
            ACCOUNT_ID, _make_create_data(owner_id=USER_ID), created_by=creator_id, sbu_id=SBU_ID
        )

        kwargs = service.activity_service.log_first_activity.call_args.kwargs
        assert kwargs["opportunity_id"] == opp.id
        assert kwargs["account_id"] == ACCOUNT_ID
        assert kwargs["activity_type"] == "VISIT"
        assert kwargs["notes"] == "Met the HOD, wants a quote"
        assert kwargs["next_action_text"] == "Send the quote"
        assert kwargs["created_by"] == creator_id
        assert kwargs["next_action_owner_id"] == USER_ID

    def test_first_activity_next_action_owner_from_form_is_kept(self):
        repo = _make_repo()
        service = _make_service(repo)
        other_id = uuid.uuid4()

        service.create_opportunity(
            ACCOUNT_ID,
            _make_create_data(first_activity=_first_activity(next_action_owner_id=other_id)),
            created_by=USER_ID,
            sbu_id=SBU_ID,
        )

        assert service.activity_service.log_first_activity.call_args.kwargs["next_action_owner_id"] == other_id

    def test_refused_create_logs_no_first_activity(self):
        repo = _make_repo()
        repo.get_stage.return_value = None
        service = _make_service(repo)

        with pytest.raises(NotFoundError):
            service.create_opportunity(ACCOUNT_ID, _make_create_data(), created_by=USER_ID, sbu_id=SBU_ID)

        service.activity_service.log_first_activity.assert_not_called()

    def test_first_activity_required(self):
        data = _make_create_data().model_dump()
        del data["first_activity"]
        with pytest.raises(ValidationError):
            OpportunityCreate(**data)

    @pytest.mark.parametrize("activity_type", ["MANAGER_NOTE", "RELATIONSHIP_SUPPORT", "CONFERENCE_EXPO"])
    def test_first_activity_limited_to_five_types(self, activity_type):
        # Plan D5: Visit, Call, Email, Meeting or Note only.
        with pytest.raises(ValidationError):
            _first_activity(activity_type=activity_type)

    @pytest.mark.parametrize("field", ["notes", "next_action_text", "next_action_due_date"])
    def test_first_activity_needs_what_happened_and_next_action(self, field):
        fields = dict(
            activity_type="CALL",
            activity_date=datetime.now(_IST),
            notes="Called the purchase head",
            next_action_text="Visit next week",
            next_action_due_date=datetime.combine(TOMORROW, time(11, 0), tzinfo=_IST),
        )
        del fields[field]
        with pytest.raises(ValidationError):
            FirstActivity(**fields)

    def test_notifies_new_owner_when_different_from_creator(self):
        repo = _make_repo()
        notification_service = _make_notification_service()
        service = OpportunityService(
            repository=repo, notification_service=notification_service, activity_service=MagicMock(spec=ActivityService)
        )
        new_owner_id = uuid.uuid4()

        result = service.create_opportunity(
            ACCOUNT_ID, _make_create_data(owner_id=new_owner_id), created_by=USER_ID, sbu_id=SBU_ID
        )

        notification_service.notify_opportunity_assigned.assert_called_once_with(
            recipient_user_id=new_owner_id,
            opportunity_id=result.id,
            actor_id=USER_ID,
        )

    def test_does_not_notify_when_owner_is_creator(self):
        repo = _make_repo()
        notification_service = _make_notification_service()
        service = OpportunityService(
            repository=repo, notification_service=notification_service, activity_service=MagicMock(spec=ActivityService)
        )

        service.create_opportunity(
            ACCOUNT_ID, _make_create_data(owner_id=USER_ID), created_by=USER_ID, sbu_id=SBU_ID
        )

        notification_service.notify_opportunity_assigned.assert_not_called()

    def test_create_defaults_high_priority_manual_to_false(self):
        repo = _make_repo()
        service = _make_service(repo)

        result = service.create_opportunity(
            ACCOUNT_ID, _make_create_data(), created_by=USER_ID, sbu_id=SBU_ID
        )

        assert result.high_priority_manual is False

    def test_create_persists_high_priority_manual_true(self):
        repo = _make_repo()
        service = _make_service(repo)

        result = service.create_opportunity(
            ACCOUNT_ID, _make_create_data(high_priority_manual=True), created_by=USER_ID, sbu_id=SBU_ID
        )

        assert result.high_priority_manual is True


# ===========================================================================
# create_opportunity — BR-FIN-07 referral credit
# ===========================================================================

class TestCreateOpportunityReferralCredit:
    def test_create_with_referred_by_user_id_persists(self):
        repo = _make_repo()
        service = _make_service(repo)
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
        service = _make_service(repo)

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
        service = _make_service(repo)

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
        service = _make_service(repo)
        data = _make_create_data(sbu_id=OTHER_SBU_ID)

        result = service.create_opportunity(
            ACCOUNT_ID, data, created_by=USER_ID, sbu_id=SBU_ID, role_name="Admin"
        )

        assert result.sbu_id == OTHER_SBU_ID

    def test_general_manager_can_create_in_other_sbu(self):
        repo = _make_repo()
        service = _make_service(repo)
        data = _make_create_data(sbu_id=OTHER_SBU_ID)

        result = service.create_opportunity(
            ACCOUNT_ID, data, created_by=USER_ID, sbu_id=SBU_ID, role_name="General Manager"
        )

        assert result.sbu_id == OTHER_SBU_ID

    def test_admin_omitting_sbu_id_is_rejected(self):
        """Admin/GM have no meaningful 'own' SBU -- must always explicitly choose,
        never silently defaulted to their placeholder sbu_id."""
        repo = _make_repo()
        service = _make_service(repo)
        data = _make_create_data()  # sbu_id left unset (None)

        with pytest.raises(BusinessRuleViolation, match="SBU is required"):
            service.create_opportunity(
                ACCOUNT_ID, data, created_by=USER_ID, sbu_id=SBU_ID, role_name="Admin"
            )
        repo.create.assert_not_called()

    def test_general_manager_omitting_sbu_id_is_rejected(self):
        repo = _make_repo()
        service = _make_service(repo)
        data = _make_create_data()  # sbu_id left unset (None)

        with pytest.raises(BusinessRuleViolation, match="SBU is required"):
            service.create_opportunity(
                ACCOUNT_ID, data, created_by=USER_ID, sbu_id=SBU_ID, role_name="General Manager"
            )

    def test_admin_explicitly_choosing_own_sbu_is_accepted(self):
        """An explicit choice that happens to match the placeholder sbu_id is a real
        choice, not a silent default -- must succeed, not be treated as 'missing'."""
        repo = _make_repo()
        service = _make_service(repo)
        data = _make_create_data(sbu_id=SBU_ID)

        result = service.create_opportunity(
            ACCOUNT_ID, data, created_by=USER_ID, sbu_id=SBU_ID, role_name="Admin"
        )

        assert result.sbu_id == SBU_ID

    def test_same_sbu_as_caller_is_not_treated_as_an_override(self):
        """Setting sbu_id to the caller's own SBU is a no-op, not an override attempt —
        no role check should trip even for a role with no override rights."""
        repo = _make_repo()
        service = _make_service(repo)
        data = _make_create_data(sbu_id=SBU_ID)

        result = service.create_opportunity(
            ACCOUNT_ID, data, created_by=USER_ID, sbu_id=SBU_ID, role_name="Sales Staff"
        )

        assert result.sbu_id == SBU_ID

    def test_non_privileged_role_rejected(self):
        repo = _make_repo()
        service = _make_service(repo)
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
        service = _make_service(repo)
        data = _make_create_data(sbu_id=OTHER_SBU_ID)

        with pytest.raises(AuthorizationError):
            service.create_opportunity(ACCOUNT_ID, data, created_by=USER_ID, sbu_id=SBU_ID)

    def test_nonexistent_sbu_rejected(self):
        repo = _make_repo()
        repo.sbu_exists.return_value = False
        service = _make_service(repo)
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
        service = _make_service(repo)
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
        service = _make_service(repo)

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
        service = OpportunityService(
            repository=repo, notification_service=notification_service, activity_service=MagicMock(spec=ActivityService)
        )

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
        service = OpportunityService(
            repository=repo, notification_service=notification_service, activity_service=MagicMock(spec=ActivityService)
        )

        service.create_opportunity(
            ACCOUNT_ID, _make_create_data(), created_by=USER_ID, sbu_id=SBU_ID
        )

        notification_service.notify_gate_override_named.assert_not_called()

    def test_approver_not_manager_and_not_gm_raises(self):
        repo = _make_repo()
        repo.get_stage.return_value = _make_stage(30, "DEMO")
        repo.get_owner_manager_id.return_value = uuid.uuid4()  # someone else
        repo.get_user_role_name.return_value = "Sales Staff"
        service = _make_service(repo)

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
        service = _make_service(repo)

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
        service = _make_service(repo)

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
        service = _make_service(repo)

        result = service.create_opportunity(
            ACCOUNT_ID,
            self._override_data(gate_override_approver_id=approver_id),
            created_by=USER_ID,
            sbu_id=SBU_ID,
        )

        assert result.gate_override_approver_id == approver_id

    def test_no_override_leaves_audit_fields_unstamped(self):
        repo = _make_repo()
        service = _make_service(repo)

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
        service = _make_service(repo)

        with pytest.raises(NotFoundError, match="Opportunity"):
            service.update_opportunity(OPP_ID, OpportunityUpdate(name="X"), updated_by=USER_ID)

    def test_empty_patch_returns_unchanged_opportunity(self):
        opp = _make_opportunity()
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.return_value = _make_status("ACTIVE")
        service = _make_service(repo)

        result = service.update_opportunity(OPP_ID, OpportunityUpdate(), updated_by=USER_ID)

        repo.update.assert_not_called()
        assert result is opp

    def test_patch_only_updates_provided_fields(self):
        opp = _make_opportunity(name="Old Name", lead_source_id=LEAD_SOURCE_ID)
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.return_value = _make_status("ACTIVE")
        service = _make_service(repo)

        service.update_opportunity(OPP_ID, OpportunityUpdate(name="New Name"), updated_by=USER_ID)

        assert opp.name == "New Name"
        assert opp.lead_source_id == LEAD_SOURCE_ID  # unchanged

    def test_update_sets_referred_by_user_id(self):
        opp = _make_opportunity(referred_by_user_id=None, referred_by_note=None)
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.return_value = _make_status("ACTIVE")
        service = _make_service(repo)
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
        service = _make_service(repo)

        service.update_opportunity(
            OPP_ID,
            OpportunityUpdate(referred_by_note="Dr. Menon, referring physician"),
            updated_by=USER_ID,
        )

        assert opp.referred_by_note == "Dr. Menon, referring physician"

    def test_update_can_flip_high_priority_manual(self):
        opp = _make_opportunity(high_priority_manual=False)
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.return_value = _make_status("ACTIVE")
        service = _make_service(repo)

        service.update_opportunity(
            OPP_ID, OpportunityUpdate(high_priority_manual=True), updated_by=USER_ID
        )

        assert opp.high_priority_manual is True

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
        )

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
        service = _make_service(repo)

        with pytest.raises(BusinessRuleViolation, match="Lead Source"):
            service.update_opportunity(
                OPP_ID,
                _noted(stage_id=STAGE_QUALIFIED_ID),
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
        service = _make_service(repo)

        result = service.update_opportunity(
            OPP_ID,
            _noted(stage_id=STAGE_DEMO_ID),
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
        service = _make_service(repo)

        with pytest.raises(BusinessRuleViolation, match="WON"):
            service.update_opportunity(
                OPP_ID,
                _noted(status_id=STATUS_ACTIVE_ID),
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
        service = _make_service(repo)

        with pytest.raises(BusinessRuleViolation, match="Loss Reason"):
            service.update_opportunity(
                OPP_ID,
                _noted(status_id=STATUS_LOST_ID),
                updated_by=USER_ID,
            )

    def test_transition_to_won_stamps_closed_at(self):
        opp = _make_opportunity(po_number="PO-1001", po_date=date(2026, 9, 15), closed_at=None)
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(80, "PAYMENT_PENDING")
        repo.get_status.side_effect = [
            _make_status("ACTIVE"),
            _make_status("WON", is_terminal=True),
        ]
        repo.has_items.return_value = True
        service = _make_service(repo)

        service.update_opportunity(
            OPP_ID, _noted(status_id=STATUS_WON_ID, confirm_full_payment=True), updated_by=USER_ID
        )

        assert opp.closed_at is not None

    # BR-OP-17 on the update path.

    def _won_update_setup(self, stage_order: int, stage_code: str):
        opp = _make_opportunity(po_number="PO-1001", po_date=date(2026, 9, 15), closed_at=None)
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(stage_order, stage_code)
        repo.get_status.side_effect = [
            _make_status("ACTIVE"),
            _make_status("WON", is_terminal=True),
        ]
        repo.has_items.return_value = True
        service = _make_service(repo)
        return opp, repo, service

    def test_transition_to_won_stamps_who_and_when(self):
        opp, _, service = self._won_update_setup(80, "PAYMENT_PENDING")

        service.update_opportunity(
            OPP_ID,
            _noted(status_id=STATUS_WON_ID, confirm_full_payment=True, full_payment_note="RTGS 88231"),
            updated_by=USER_ID,
        )

        assert opp.full_payment_confirmed_at is not None
        assert opp.full_payment_confirmed_by == USER_ID
        assert opp.full_payment_note == "RTGS 88231"

    def test_transition_to_won_refused_without_payment_tick(self):
        opp, repo, service = self._won_update_setup(80, "PAYMENT_PENDING")

        with pytest.raises(BusinessRuleViolation, match="full payment"):
            service.update_opportunity(OPP_ID, _noted(status_id=STATUS_WON_ID), updated_by=USER_ID)
        repo.update.assert_not_called()
        assert opp.full_payment_confirmed_at is None

    def test_transition_to_won_refused_at_delivery_and_installation(self):
        # The MMC case: Won before the last stage is refused even with the tick.
        _, repo, service = self._won_update_setup(70, "DELIVERY_INSTALLATION")

        with pytest.raises(BusinessRuleViolation, match="Payment Pending"):
            service.update_opportunity(
                OPP_ID, _noted(status_id=STATUS_WON_ID, confirm_full_payment=True), updated_by=USER_ID
            )
        repo.update.assert_not_called()

    def test_repeat_order_not_exempt_from_payment_stage(self):
        # BR-OP-13 waives demo/negotiation gates, never BR-OP-17.
        opp, repo, service = self._won_update_setup(60, "ORDER")
        opp.lead_source_id = LEAD_SOURCE_ID
        repo.get_lead_source.return_value = _make_lead_source("REPEAT_ORDER")

        with pytest.raises(BusinessRuleViolation, match="Payment Pending"):
            service.update_opportunity(
                OPP_ID, _noted(status_id=STATUS_WON_ID, confirm_full_payment=True), updated_by=USER_ID
            )

    def test_payment_pending_and_won_in_one_save_refused(self):
        # Option B (Basheer, 2026-10-03): saved at Payment Pending first, then Won.
        opp = _make_opportunity(po_number="PO-1001", po_date=date(2026, 9, 15), closed_at=None)
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.side_effect = [
            _make_stage(70, "DELIVERY_INSTALLATION"),   # current, before this save
            _make_stage(80, "PAYMENT_PENDING"),         # effective, after it
        ]
        repo.get_status.side_effect = [
            _make_status("ACTIVE"),
            _make_status("WON", is_terminal=True),
        ]
        repo.has_items.return_value = True
        service = _make_service(repo)

        with pytest.raises(BusinessRuleViolation, match="Payment Pending stage first"):
            service.update_opportunity(
                OPP_ID,
                _noted(stage_id=uuid.uuid4(), status_id=STATUS_WON_ID, confirm_full_payment=True),
                updated_by=USER_ID,
            )
        repo.update.assert_not_called()

    # PO Date (Target vs Actuals step 2, Basheer 2026-10-06).

    def test_won_refused_for_older_record_without_po_date(self):
        opp, repo, service = self._won_update_setup(80, "PAYMENT_PENDING")
        opp.po_date = None

        with pytest.raises(BusinessRuleViolation, match="PO Date is required to mark"):
            service.update_opportunity(
                OPP_ID, _noted(status_id=STATUS_WON_ID, confirm_full_payment=True), updated_by=USER_ID
            )
        repo.update.assert_not_called()

    def test_won_allowed_when_po_date_sent_in_same_save(self):
        opp, _, service = self._won_update_setup(80, "PAYMENT_PENDING")
        opp.po_date = None

        service.update_opportunity(
            OPP_ID,
            _noted(status_id=STATUS_WON_ID, confirm_full_payment=True, po_date=date(2026, 9, 15)),
            updated_by=USER_ID,
        )

        assert opp.po_date == date(2026, 9, 15)
        assert opp.closed_at is not None

    def test_move_to_delivery_refused_without_po_date(self):
        opp = _make_opportunity(
            po_number="PO-1001", indicative_value=Decimal("5"), lead_source_id=LEAD_SOURCE_ID,
            demo_start_date=date(2026, 9, 1), expected_closure_date=date(2026, 10, 1),
        )
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.side_effect = [
            _make_stage(60, "ORDER"),                   # current
            _make_stage(70, "DELIVERY_INSTALLATION"),   # effective
        ]
        repo.get_status.return_value = _make_status("ACTIVE")
        repo.has_items.return_value = True
        service = _make_service(repo)

        with pytest.raises(BusinessRuleViolation, match="PO Date is required to advance"):
            service.update_opportunity(OPP_ID, _noted(stage_id=uuid.uuid4()), updated_by=USER_ID)
        repo.update.assert_not_called()

    def test_future_po_date_refused_on_any_save(self):
        opp = _make_opportunity()
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        service = _make_service(repo)

        with pytest.raises(BusinessRuleViolation, match="future"):
            service.update_opportunity(
                OPP_ID, OpportunityUpdate(po_date=_today_ist() + timedelta(days=1)), updated_by=USER_ID
            )
        repo.update.assert_not_called()

    def test_po_date_removal_refused_past_order(self):
        opp = _make_opportunity(po_number="PO-1001", po_date=date(2026, 9, 15))
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(70, "DELIVERY_INSTALLATION")
        service = _make_service(repo)

        with pytest.raises(BusinessRuleViolation, match="can't be removed"):
            service.update_opportunity(OPP_ID, OpportunityUpdate(po_date=None), updated_by=USER_ID)
        repo.update.assert_not_called()

    def test_po_date_correction_allowed_past_order(self):
        opp = _make_opportunity(po_number="PO-1001", po_date=date(2026, 9, 15))
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(70, "DELIVERY_INSTALLATION")
        service = _make_service(repo)

        service.update_opportunity(OPP_ID, OpportunityUpdate(po_date=date(2026, 9, 20)), updated_by=USER_ID)
        assert opp.po_date == date(2026, 9, 20)

    def test_payment_note_ignored_without_the_move_to_won(self):
        # The note is only stored with the Won step, never on its own.
        opp = _make_opportunity()
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        service = _make_service(repo)

        service.update_opportunity(
            OPP_ID, OpportunityUpdate(name="Renamed", full_payment_note="sneaky"), updated_by=USER_ID
        )

        assert opp.full_payment_note is None

    def test_stage_change_on_won_opportunity_refused(self):
        # BR-OP-09: a stage-only save can't move a Won Opportunity back.
        opp = _make_opportunity(stage_id=uuid.uuid4())
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(80, "PAYMENT_PENDING")
        repo.get_status.return_value = _make_status("WON", is_terminal=True)
        service = _make_service(repo)

        with pytest.raises(BusinessRuleViolation, match="Cannot change the stage of a WON"):
            service.update_opportunity(OPP_ID, _noted(stage_id=STAGE_LEAD_ID), updated_by=USER_ID)
        repo.update.assert_not_called()

    def test_resending_same_stage_on_won_opportunity_allowed(self):
        stage_id = uuid.uuid4()
        opp = _make_opportunity(stage_id=stage_id)
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(80, "PAYMENT_PENDING")
        repo.get_status.return_value = _make_status("WON", is_terminal=True)
        service = _make_service(repo)

        service.update_opportunity(
            OPP_ID, OpportunityUpdate(stage_id=stage_id, name="Renamed"), updated_by=USER_ID
        )
        repo.update.assert_called_once()

    def test_payment_tick_is_not_written_onto_the_record(self):
        # confirm_full_payment is a request flag, not a column -- an unrelated
        # save carrying it must not set an attribute or stamp anything.
        opp = _make_opportunity()
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        service = _make_service(repo)

        service.update_opportunity(
            OPP_ID, OpportunityUpdate(name="Renamed", confirm_full_payment=True), updated_by=USER_ID
        )

        assert "confirm_full_payment" not in vars(opp)
        assert opp.full_payment_confirmed_at is None

    def test_transition_to_lost_stamps_closed_at(self):
        opp = _make_opportunity(loss_reason_id=LOSS_REASON_PRICE_ID, closed_at=None)
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.side_effect = [
            _make_status("ACTIVE"),
            _make_status("LOST", is_terminal=True),
        ]
        service = _make_service(repo)

        service.update_opportunity(
            OPP_ID, _noted(status_id=STATUS_LOST_ID), updated_by=USER_ID
        )

        assert opp.closed_at is not None

    def test_non_terminal_transition_does_not_stamp_closed_at(self):
        opp = _make_opportunity(
            hold_reason_id=HOLD_REASON_ID, reactivation_date=TOMORROW, closed_at=None
        )
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.side_effect = [
            _make_status("ACTIVE"),
            _make_status("ON_HOLD"),
        ]
        service = _make_service(repo)

        service.update_opportunity(
            OPP_ID, _noted(status_id=STATUS_ON_HOLD_ID), updated_by=USER_ID
        )

        assert opp.closed_at is None

    def test_transition_to_on_hold_with_past_reactivation_date_raises(self):
        yesterday = _today_ist() - timedelta(days=1)
        opp = _make_opportunity(hold_reason_id=HOLD_REASON_ID, reactivation_date=yesterday)
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.side_effect = [
            _make_status("ACTIVE"),
            _make_status("ON_HOLD"),
        ]
        repo.has_items.return_value = False
        service = _make_service(repo)

        with pytest.raises(BusinessRuleViolation, match="future date"):
            service.update_opportunity(
                OPP_ID,
                _noted(status_id=STATUS_ON_HOLD_ID),
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
        service = _make_service(repo)

        service.update_opportunity(
            OPP_ID,
            _noted(stage_id=STAGE_QUALIFIED_ID),
            updated_by=USER_ID,
        )

        repo.update.assert_called_once_with(opp)

    def test_updated_by_is_set(self):
        opp = _make_opportunity()
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.return_value = _make_status("ACTIVE")
        service = _make_service(repo)

        service.update_opportunity(OPP_ID, OpportunityUpdate(name="X"), updated_by=USER_ID)

        assert opp.updated_by == USER_ID


# ===========================================================================
# BR-OP-19 — a chance of 50 % or more before Negotiation needs a closure date
# ===========================================================================

_HIGH_CHANCE_MSG = "Win Probability is 50% or more but there's no expected closure date - add one."
_DEMO_ITEMS = [OpportunityItemCreate(product_id=PRODUCT_ID, quantity=1, unit_price_lakhs=Decimal("5"))]


class TestHighChanceNeedsClosureDate:
    def _service(self, repo):
        return _make_service(repo)

    def test_create_at_50_without_date_refused_with_exact_message(self):
        repo = _make_repo()

        with pytest.raises(BusinessRuleViolation) as exc:
            self._service(repo).create_opportunity(
                ACCOUNT_ID, _make_create_data(win_probability=Decimal("50")), created_by=USER_ID, sbu_id=SBU_ID
            )
        assert str(exc.value) == _HIGH_CHANCE_MSG
        repo.create.assert_not_called()

    def test_create_at_49_99_without_date_allowed(self):
        repo = _make_repo()
        self._service(repo).create_opportunity(
            ACCOUNT_ID, _make_create_data(win_probability=Decimal("49.99")), created_by=USER_ID, sbu_id=SBU_ID
        )
        repo.create.assert_called_once()

    def test_create_at_80_with_date_allowed(self):
        repo = _make_repo()
        self._service(repo).create_opportunity(
            ACCOUNT_ID,
            _make_create_data(win_probability=Decimal("80"), expected_closure_date=TOMORROW),
            created_by=USER_ID,
            sbu_id=SBU_ID,
        )
        repo.create.assert_called_once()

    def test_create_repeat_order_at_demo_still_held(self):
        # D8: REPEAT_ORDER waives the demo gate, not this rule.
        repo = _make_repo()
        repo.get_stage.return_value = _make_stage(30, "DEMO")
        repo.get_lead_source.return_value = _make_lead_source("REPEAT_ORDER")

        with pytest.raises(BusinessRuleViolation, match="expected closure date"):
            self._service(repo).create_opportunity(
                ACCOUNT_ID,
                _make_create_data(
                    stage_id=STAGE_DEMO_ID,
                    win_probability=Decimal("60"),
                    lead_source_id=LEAD_SOURCE_ID,
                    indicative_value=Decimal("10.00"),
                    items=_DEMO_ITEMS,
                ),
                created_by=USER_ID,
                sbu_id=SBU_ID,
            )

    def test_create_gate_override_at_demo_still_held(self):
        # D8: a manager's gate override waives the demo gate, not this rule.
        approver_id = uuid.uuid4()
        repo = _make_repo()
        repo.get_stage.return_value = _make_stage(30, "DEMO")
        repo.get_owner_manager_id.return_value = approver_id
        repo.get_user_role_name.return_value = "Area Manager"

        with pytest.raises(BusinessRuleViolation, match="expected closure date"):
            self._service(repo).create_opportunity(
                ACCOUNT_ID,
                _make_create_data(
                    stage_id=STAGE_DEMO_ID,
                    win_probability=Decimal("60"),
                    lead_source_id=LEAD_SOURCE_ID,
                    indicative_value=Decimal("10.00"),
                    gate_override_approver_id=approver_id,
                    gate_override_reason_id=uuid.uuid4(),
                    items=_DEMO_ITEMS,
                ),
                created_by=USER_ID,
                sbu_id=SBU_ID,
            )

    def test_update_unrelated_field_on_existing_over_limit_refused(self):
        # D4 / D9: an Opportunity already over the limit is held on its next save.
        opp = _make_opportunity(win_probability=Decimal("70"))
        repo = _make_repo()
        repo.get_for_update.return_value = opp

        with pytest.raises(BusinessRuleViolation, match="expected closure date"):
            self._service(repo).update_opportunity(OPP_ID, OpportunityUpdate(name="Renamed"), updated_by=USER_ID)
        repo.update.assert_not_called()

    def test_update_value_only_from_products_panel_allowed(self):
        # D9: the products panel's follow-up save of the total is never refused.
        opp = _make_opportunity(win_probability=Decimal("75"))
        repo = _make_repo()
        repo.get_for_update.return_value = opp

        self._service(repo).update_opportunity(
            OPP_ID, OpportunityUpdate(indicative_value=Decimal("12.50")), updated_by=USER_ID
        )
        repo.update.assert_called_once_with(opp)

    def test_update_adding_date_clears_it(self):
        opp = _make_opportunity(win_probability=Decimal("70"))
        repo = _make_repo()
        repo.get_for_update.return_value = opp

        self._service(repo).update_opportunity(
            OPP_ID, OpportunityUpdate(expected_closure_date=TOMORROW), updated_by=USER_ID
        )
        repo.update.assert_called_once_with(opp)

    def test_update_lowering_chance_clears_it(self):
        opp = _make_opportunity(win_probability=Decimal("70"))
        repo = _make_repo()
        repo.get_for_update.return_value = opp

        self._service(repo).update_opportunity(
            OPP_ID, OpportunityUpdate(win_probability=Decimal("40")), updated_by=USER_ID
        )
        repo.update.assert_called_once_with(opp)

    def test_update_at_negotiation_not_checked_by_this_rule(self):
        # From Negotiation on, BR-OP-01's gate owns the date.
        opp = _make_opportunity(stage_id=STAGE_NEGOTIATION_ID, win_probability=Decimal("75"))
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(50, "NEGOTIATION")

        self._service(repo).update_opportunity(OPP_ID, OpportunityUpdate(name="X"), updated_by=USER_ID)
        repo.update.assert_called_once_with(opp)

    def test_update_marking_lost_never_refused(self):
        # D16
        opp = _make_opportunity(win_probability=Decimal("70"), loss_reason_id=LOSS_REASON_PRICE_ID)
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_status.side_effect = [_make_status("ACTIVE"), _make_status("LOST", is_terminal=True)]

        self._service(repo).update_opportunity(OPP_ID, _noted(status_id=STATUS_LOST_ID), updated_by=USER_ID)
        repo.update.assert_called_once_with(opp)

    def test_update_putting_on_hold_never_refused(self):
        # D16
        opp = _make_opportunity(
            win_probability=Decimal("70"), hold_reason_id=HOLD_REASON_ID, reactivation_date=TOMORROW
        )
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_status.side_effect = [_make_status("ACTIVE"), _make_status("ON_HOLD")]

        self._service(repo).update_opportunity(
            OPP_ID, _noted(status_id=STATUS_ON_HOLD_ID), updated_by=USER_ID
        )
        repo.update.assert_called_once_with(opp)

    def test_update_on_hold_made_active_again_held(self):
        # D16: held to the rule on the save that makes it Active again.
        opp = _make_opportunity(status_id=STATUS_ON_HOLD_ID, win_probability=Decimal("70"))
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_status.side_effect = [_make_status("ON_HOLD"), _make_status("ACTIVE")]

        with pytest.raises(BusinessRuleViolation, match="expected closure date"):
            self._service(repo).update_opportunity(
                OPP_ID, _noted(status_id=STATUS_ACTIVE_ID), updated_by=USER_ID
            )
        repo.update.assert_not_called()


# ===========================================================================
# update_opportunity — BR-OP-22 a note on every stage or status change
# ===========================================================================

class TestStageChangeNote:
    def _setup(self, *, new_status: str = "ACTIVE", **opp_overrides):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity(**opp_overrides)
        is_terminal = new_status in {"WON", "LOST"}
        repo.get_status.side_effect = [_make_status("ACTIVE"), _make_status(new_status, is_terminal=is_terminal)]
        repo.has_items.return_value = True
        return repo, _make_service(repo)

    def _on_hold(self, reactivation_date: date):
        _, service = self._setup(
            new_status="ON_HOLD", hold_reason_id=HOLD_REASON_ID, reactivation_date=reactivation_date
        )
        return service

    def _to_lost(self, note: StageChangeNote | None) -> OpportunityUpdate:
        return OpportunityUpdate(
            change_note=note, status_id=STATUS_LOST_ID,
            loss_reason_id=LOSS_REASON_PRICE_ID, competitor_name="Acme",
        )

    def _to_on_hold(self, **note_overrides) -> OpportunityUpdate:
        return OpportunityUpdate(change_note=_note(**note_overrides), status_id=STATUS_ON_HOLD_ID)

    def test_status_change_without_note_refused(self):
        repo, service = self._setup(new_status="LOST")
        with pytest.raises(BusinessRuleViolation, match="needs a note"):
            service.update_opportunity(
                OPP_ID, OpportunityUpdate(status_id=STATUS_LOST_ID, loss_reason_id=LOSS_REASON_PRICE_ID),
                updated_by=USER_ID,
            )
        repo.update.assert_not_called()

    def test_stage_change_without_note_refused(self):
        _, service = self._setup()
        with pytest.raises(BusinessRuleViolation, match="needs a note"):
            service.update_opportunity(OPP_ID, OpportunityUpdate(stage_id=STAGE_QUALIFIED_ID), updated_by=USER_ID)

    def test_note_without_a_change_refused(self):
        _, service = self._setup()
        with pytest.raises(BusinessRuleViolation, match="only taken with a stage or status change"):
            service.update_opportunity(
                OPP_ID, _noted(status_id=STATUS_ACTIVE_ID, name="X"),
                updated_by=USER_ID,
            )

    def test_note_path_logs_a_note_with_its_next_action(self):
        _, service = self._setup(new_status="LOST")
        note = _note()
        service.update_opportunity(OPP_ID, self._to_lost(note), updated_by=USER_ID)
        kwargs = service.activity_service.log_stage_change_note.call_args.kwargs
        assert kwargs["opportunity_id"] == OPP_ID
        assert kwargs["account_id"] == ACCOUNT_ID
        assert kwargs["notes"] == note.notes
        assert kwargs["next_action_text"] == "Call to confirm"
        assert kwargs["created_by"] == USER_ID
        service.reminder_service.close_for_stage_change.assert_not_called()

    def test_lost_needs_no_next_action(self):
        # Plan D12.
        _, service = self._setup(new_status="LOST")
        note = _note(next_action_text=None, next_action_due_date=None)
        service.update_opportunity(OPP_ID, self._to_lost(note), updated_by=USER_ID)
        service.activity_service.log_stage_change_note.assert_called_once()

    def test_active_change_needs_a_next_action(self):
        service = self._on_hold(TOMORROW + timedelta(days=30))
        with pytest.raises(BusinessRuleViolation, match="needs a next action"):
            service.update_opportunity(
                OPP_ID, self._to_on_hold(next_action_text=None, next_action_due_date=None), updated_by=USER_ID
            )
        service.activity_service.log_stage_change_note.assert_not_called()

    def test_on_hold_next_action_after_reactivation_date_refused(self):
        reactivation = TOMORROW + timedelta(days=5)
        service = self._on_hold(reactivation)
        # 00:30 IST the day after is still the re-activation date in UTC --
        # the comparison must use the IST day.
        late = datetime.combine(reactivation + timedelta(days=1), time(0, 30), tzinfo=_IST).astimezone(UTC)
        with pytest.raises(BusinessRuleViolation, match="re-activation date"):
            service.update_opportunity(OPP_ID, self._to_on_hold(next_action_due_date=late), updated_by=USER_ID)

    def test_on_hold_next_action_on_reactivation_date_allowed(self):
        reactivation = TOMORROW + timedelta(days=5)
        service = self._on_hold(reactivation)
        on_the_day = datetime.combine(reactivation, time(23, 30), tzinfo=_IST)
        service.update_opportunity(OPP_ID, self._to_on_hold(next_action_due_date=on_the_day), updated_by=USER_ID)
        service.activity_service.log_stage_change_note.assert_called_once()

    def test_open_own_next_action_must_be_closed_not_gone_round(self):
        # BR-ACT-11 / plan D13.
        _, service = self._setup(new_status="LOST")
        service.reminder_service.has_open_own_on_opportunity.return_value = True
        with pytest.raises(BusinessRuleViolation, match="open next action on this Opportunity"):
            service.update_opportunity(OPP_ID, self._to_lost(_note()), updated_by=USER_ID)
        service.activity_service.log_stage_change_note.assert_not_called()

    def test_close_path_closes_the_changers_next_action(self):
        _, service = self._setup(new_status="LOST")
        reminder_id = uuid.uuid4()
        note = _note(
            close_reminder_id=reminder_id, activity_type="CALL", next_action_text=None, next_action_due_date=None
        )
        service.update_opportunity(OPP_ID, self._to_lost(note), updated_by=USER_ID)
        call = service.reminder_service.close_for_stage_change.call_args
        assert call.args == (reminder_id,)
        assert call.kwargs["opportunity_id"] == OPP_ID
        assert call.kwargs["closed_by"] == USER_ID
        assert call.kwargs["data"].is_completed is True
        assert call.kwargs["data"].activity_type == "CALL"
        assert call.kwargs["data"].notes == note.notes
        service.activity_service.log_stage_change_note.assert_not_called()

    def test_note_recorded_after_the_change_is_flushed(self):
        # The closing's Won/Lost follow-up exemption reads the new status.
        repo, service = self._setup(new_status="LOST")
        order = []
        repo.update.side_effect = lambda obj: order.append("flush") or obj
        service.activity_service.log_stage_change_note.side_effect = lambda **_: order.append("note")
        service.update_opportunity(OPP_ID, self._to_lost(_note()), updated_by=USER_ID)
        assert order == ["flush", "note"]

    def test_change_refused_without_the_activity_services(self):
        opp = _make_opportunity()
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_status.side_effect = [_make_status("ACTIVE"), _make_status("LOST", is_terminal=True)]
        service = OpportunityService(repository=repo, notification_service=_make_notification_service())
        with pytest.raises(RuntimeError):
            service.update_opportunity(OPP_ID, self._to_lost(_note()), updated_by=USER_ID)


class TestStageChangeNoteSchema:
    def test_note_without_a_next_action_to_close_must_be_a_note(self):
        with pytest.raises(ValidationError, match="is a Note"):
            _note(activity_type="CALL")

    def test_manager_note_type_refused(self):
        with pytest.raises(ValidationError, match="not a valid type"):
            _note(close_reminder_id=uuid.uuid4(), activity_type="MANAGER_NOTE")

    def test_next_action_text_and_date_together(self):
        with pytest.raises(ValidationError, match="together"):
            _note(next_action_due_date=None)

    def test_blank_note_refused(self):
        with pytest.raises(ValidationError):
            _note(notes="")


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
        service = _make_service(repo)

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
        service = _make_service(repo)

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
        service = _make_service(repo)

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
        service = _make_service(repo)

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
        service = _make_service(repo)

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
        service = _make_service(repo)

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
        service = _make_service(repo)

        with pytest.raises(NotFoundError, match="Opportunity"):
            service.replace_splits(
                OPP_ID, SplitsBulkUpdate(splits=[]), updated_by=USER_ID, role_name="Sales Staff", user_sbu_id=SBU_ID
            )

    def test_empty_splits_list_passes_without_sum_check(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        service = _make_service(repo)

        service.replace_splits(
            OPP_ID, SplitsBulkUpdate(splits=[]), updated_by=USER_ID, role_name="Sales Staff", user_sbu_id=SBU_ID
        )

        repo.replace_splits.assert_called_once_with(OPP_ID, [])

    def test_splits_not_summing_to_100_raises(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        service = _make_service(repo)

        data = SplitsBulkUpdate(splits=[
            SplitCreate(user_id=uuid.uuid4(), split_percentage=Decimal("60")),
            SplitCreate(user_id=uuid.uuid4(), split_percentage=Decimal("30")),
        ])
        with pytest.raises(BusinessRuleViolation, match="100%"):
            service.replace_splits(OPP_ID, data, updated_by=USER_ID, role_name="Sales Staff", user_sbu_id=SBU_ID)

    def test_splits_summing_to_100_calls_repository(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        service = _make_service(repo)

        uid1, uid2 = uuid.uuid4(), uuid.uuid4()
        data = SplitsBulkUpdate(splits=[
            SplitCreate(user_id=uid1, split_percentage=Decimal("70")),
            SplitCreate(user_id=uid2, split_percentage=Decimal("30")),
        ])
        service.replace_splits(OPP_ID, data, updated_by=USER_ID, role_name="Sales Staff", user_sbu_id=SBU_ID)

        repo.replace_splits.assert_called_once()
        created_splits: list[Split] = repo.replace_splits.call_args[0][1]
        assert len(created_splits) == 2
        assert created_splits[0].user_id == uid1
        assert created_splits[0].split_percentage == Decimal("70")

    def test_single_100_percent_split_passes(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        service = _make_service(repo)

        data = SplitsBulkUpdate(splits=[
            SplitCreate(user_id=uuid.uuid4(), split_percentage=Decimal("100")),
        ])
        service.replace_splits(OPP_ID, data, updated_by=USER_ID, role_name="Sales Staff", user_sbu_id=SBU_ID)
        repo.replace_splits.assert_called_once()

    def test_split_audit_fields_set(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        service = _make_service(repo)

        data = SplitsBulkUpdate(splits=[
            SplitCreate(user_id=uuid.uuid4(), split_percentage=Decimal("100")),
        ])
        service.replace_splits(OPP_ID, data, updated_by=USER_ID, role_name="Sales Staff", user_sbu_id=SBU_ID)

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
        repo.get_user_display_names.side_effect = lambda ids: {uid: "Nishad K V"}
        service = _make_service(repo)

        data = SplitsBulkUpdate(splits=[SplitCreate(user_id=uid, split_percentage=Decimal("100"))])
        # Names the person, not their raw user id (found in the 2026-09-23 E2E).
        with pytest.raises(BusinessRuleViolation, match=r"^Nishad K V is not in this Opportunity's SBU"):
            service.replace_splits(OPP_ID, data, updated_by=USER_ID, role_name="Sales Staff", user_sbu_id=SBU_ID)

        repo.replace_splits.assert_not_called()

    def test_new_participant_from_same_sbu_passes(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()  # sbu_id=SBU_ID
        service = _make_service(repo)

        data = SplitsBulkUpdate(
            splits=[SplitCreate(user_id=uuid.uuid4(), split_percentage=Decimal("100"))]
        )
        service.replace_splits(OPP_ID, data, updated_by=USER_ID, role_name="Sales Staff", user_sbu_id=SBU_ID)
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
        service = _make_service(repo)

        data = SplitsBulkUpdate(splits=[
            SplitCreate(user_id=legacy_user_id, split_percentage=Decimal("100")),
        ])
        service.replace_splits(OPP_ID, data, updated_by=USER_ID, role_name="Sales Staff", user_sbu_id=SBU_ID)
        repo.replace_splits.assert_called_once()

    # -- BR-FIN-06 self-carve-out for Admin/GM (2026-09-14) --------------------

    def test_admin_adding_self_bypasses_sbu_check(self):
        """An Admin/GM has no real SBU (BR-OP-12) so never matches the Opportunity's
        SBU -- except when adding themselves, which must be allowed."""
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()  # sbu_id=SBU_ID
        other_sbu = uuid.uuid4()
        repo.get_user_sbu_ids.side_effect = lambda ids: {USER_ID: other_sbu}
        service = _make_service(repo)

        data = SplitsBulkUpdate(splits=[SplitCreate(user_id=USER_ID, split_percentage=Decimal("100"))])
        service.replace_splits(OPP_ID, data, updated_by=USER_ID, role_name="General Manager", user_sbu_id=SBU_ID)

        repo.replace_splits.assert_called_once()

    def test_admin_adding_someone_else_still_enforces_sbu_check(self):
        """The self-carve-out is narrow -- an Admin/GM still can't add a *different*
        cross-SBU participant just because they themselves are exempt."""
        other_sbu = uuid.uuid4()
        other_user_id = uuid.uuid4()
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()  # sbu_id=SBU_ID
        repo.get_user_sbu_ids.side_effect = lambda ids: {other_user_id: other_sbu}
        service = _make_service(repo)

        data = SplitsBulkUpdate(
            splits=[SplitCreate(user_id=other_user_id, split_percentage=Decimal("100"))]
        )
        with pytest.raises(BusinessRuleViolation, match="SBU"):
            service.replace_splits(OPP_ID, data, updated_by=USER_ID, role_name="General Manager", user_sbu_id=SBU_ID)

    def test_non_admin_adding_self_still_enforces_sbu_check(self):
        """The carve-out is Admin/GM-only -- a normal role adding themselves cross-SBU
        (shouldn't normally be reachable via the picker, but the server must not rely
        on that alone) still gets rejected."""
        other_sbu = uuid.uuid4()
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()  # sbu_id=SBU_ID
        repo.get_user_sbu_ids.side_effect = lambda ids: {USER_ID: other_sbu}
        service = _make_service(repo)

        data = SplitsBulkUpdate(splits=[SplitCreate(user_id=USER_ID, split_percentage=Decimal("100"))])
        with pytest.raises(BusinessRuleViolation, match="SBU"):
            service.replace_splits(OPP_ID, data, updated_by=USER_ID, role_name="Sales Staff", user_sbu_id=SBU_ID)

    # -- split-added notification (2026-09-14) ---------------------------------

    def test_new_participant_gets_notified(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()  # sbu_id=SBU_ID
        new_uid = uuid.uuid4()
        notification_service = _make_notification_service()
        service = OpportunityService(repository=repo, notification_service=notification_service)

        data = SplitsBulkUpdate(splits=[SplitCreate(user_id=new_uid, split_percentage=Decimal("100"))])
        service.replace_splits(OPP_ID, data, updated_by=USER_ID, role_name="Sales Staff", user_sbu_id=SBU_ID)

        notification_service.notify_split_added.assert_called_once_with(
            recipient_user_id=new_uid, opportunity_id=OPP_ID, actor_id=USER_ID
        )

    def test_self_add_does_not_notify(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()  # sbu_id=SBU_ID
        notification_service = _make_notification_service()
        service = OpportunityService(repository=repo, notification_service=notification_service)

        data = SplitsBulkUpdate(splits=[SplitCreate(user_id=USER_ID, split_percentage=Decimal("100"))])
        service.replace_splits(OPP_ID, data, updated_by=USER_ID, role_name="General Manager", user_sbu_id=SBU_ID)

        notification_service.notify_split_added.assert_not_called()

    def test_already_existing_participant_does_not_renotify(self):
        """A percentage-only edit to an existing participant must not re-fire the
        notification -- replace_splits re-submits the full list on every save."""
        existing_user_id = uuid.uuid4()
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()  # sbu_id=SBU_ID
        repo.list_splits.return_value = [MagicMock(spec=Split, user_id=existing_user_id)]
        notification_service = _make_notification_service()
        service = OpportunityService(repository=repo, notification_service=notification_service)

        data = SplitsBulkUpdate(
            splits=[SplitCreate(user_id=existing_user_id, split_percentage=Decimal("100"))]
        )
        service.replace_splits(OPP_ID, data, updated_by=USER_ID, role_name="Sales Staff", user_sbu_id=SBU_ID)

        notification_service.notify_split_added.assert_not_called()


# ===========================================================================
# Split editing authority (BR-FIN-08)
# ===========================================================================

OWNER_ID = uuid.uuid4()
ACTOR_ID = uuid.uuid4()


def _split_edit_service(status_code: str = "ACTIVE") -> tuple[OpportunityService, MagicMock]:
    """An opportunity owned by OWNER_ID in SBU_ID; ACTOR_ID is the would-be editor."""
    repo = _make_repo()
    repo.get_for_update.return_value = _make_opportunity(owner_id=OWNER_ID)
    repo.get_status.return_value = _make_status(status_code, is_terminal=status_code in {"WON", "LOST"})
    repo.list_splits.return_value = [MagicMock(spec=Split, user_id=OWNER_ID)]
    service = _make_service(repo)
    return service, repo


def _owner_keeps_100() -> SplitsBulkUpdate:
    return SplitsBulkUpdate(splits=[SplitCreate(user_id=OWNER_ID, split_percentage=Decimal("100"))])


def _assert_allowed(service, repo, *, actor_id, role_name, user_sbu_id=SBU_ID):
    assert service.can_edit_splits(OPP_ID, user_id=actor_id, role_name=role_name, user_sbu_id=user_sbu_id)
    service.replace_splits(
        OPP_ID, _owner_keeps_100(), updated_by=actor_id, role_name=role_name, user_sbu_id=user_sbu_id
    )
    repo.replace_splits.assert_called_once()


def _assert_refused(service, repo, *, actor_id, role_name, user_sbu_id=SBU_ID, match="owner"):
    assert not service.can_edit_splits(OPP_ID, user_id=actor_id, role_name=role_name, user_sbu_id=user_sbu_id)
    with pytest.raises(AuthorizationError, match=match):
        service.replace_splits(
            OPP_ID, _owner_keeps_100(), updated_by=actor_id, role_name=role_name, user_sbu_id=user_sbu_id
        )
    repo.replace_splits.assert_not_called()


class TestSplitEditAuthority:
    """Every case checks can_edit_splits and replace_splits agree -- the screen's
    Edit button and the server's lock come from the same method."""

    # -- Active: who may edit ---------------------------------------------------

    def test_owner_may_edit(self):
        service, repo = _split_edit_service()
        _assert_allowed(service, repo, actor_id=OWNER_ID, role_name="Sales Staff")

    @pytest.mark.parametrize("role_name", ["Admin", "General Manager"])
    def test_admin_and_gm_may_edit_any_deal(self, role_name):
        service, repo = _split_edit_service()
        _assert_allowed(service, repo, actor_id=ACTOR_ID, role_name=role_name, user_sbu_id=OTHER_SBU_ID)

    def test_sbu_manager_same_sbu_may_edit(self):
        service, repo = _split_edit_service()
        _assert_allowed(service, repo, actor_id=ACTOR_ID, role_name="SBU Manager")

    def test_sbu_manager_other_sbu_refused(self):
        service, repo = _split_edit_service()
        _assert_refused(service, repo, actor_id=ACTOR_ID, role_name="SBU Manager", user_sbu_id=OTHER_SBU_ID)

    def test_area_manager_covering_account_zone_may_edit(self):
        service, repo = _split_edit_service()
        repo.account_in_user_zones.return_value = True
        _assert_allowed(service, repo, actor_id=ACTOR_ID, role_name="Area Manager")
        repo.account_in_user_zones.assert_called_with(ACCOUNT_ID, ACTOR_ID)

    def test_area_manager_direct_manager_of_owner_may_edit(self):
        service, repo = _split_edit_service()
        repo.get_owner_manager_id.return_value = ACTOR_ID
        _assert_allowed(service, repo, actor_id=ACTOR_ID, role_name="Area Manager")
        repo.get_owner_manager_id.assert_called_with(OWNER_ID)

    def test_area_manager_neither_zone_nor_manager_refused(self):
        service, repo = _split_edit_service()
        _assert_refused(service, repo, actor_id=ACTOR_ID, role_name="Area Manager")

    def test_area_manager_zone_match_but_other_sbu_refused(self):
        """Same SBU is required too -- mirrors opportunity_tier_visibility."""
        service, repo = _split_edit_service()
        repo.account_in_user_zones.return_value = True
        repo.get_owner_manager_id.return_value = ACTOR_ID
        _assert_refused(service, repo, actor_id=ACTOR_ID, role_name="Area Manager", user_sbu_id=OTHER_SBU_ID)

    def test_split_participant_refused(self):
        """On the split, so they can see it -- but they receive the credit, so
        they don't set it."""
        service, repo = _split_edit_service()
        repo.list_splits.return_value = [
            MagicMock(spec=Split, user_id=OWNER_ID),
            MagicMock(spec=Split, user_id=ACTOR_ID),
        ]
        _assert_refused(service, repo, actor_id=ACTOR_ID, role_name="Sales Staff")

    def test_cross_sbu_next_action_assignee_refused(self):
        """BR-ACT-06 gives a follow-up assignee visibility only -- the E2E step 26
        case (a Critical Care rep on an Imaging deal)."""
        service, repo = _split_edit_service()
        _assert_refused(service, repo, actor_id=ACTOR_ID, role_name="Sales Staff", user_sbu_id=OTHER_SBU_ID)

    def test_on_hold_behaves_like_active(self):
        service, repo = _split_edit_service("ON_HOLD")
        _assert_allowed(service, repo, actor_id=OWNER_ID, role_name="Sales Staff")
        service, repo = _split_edit_service("ON_HOLD")
        _assert_refused(service, repo, actor_id=ACTOR_ID, role_name="Sales Staff")

    # -- Won: General Manager only ------------------------------------------------

    def test_won_gm_may_edit(self):
        service, repo = _split_edit_service("WON")
        _assert_allowed(service, repo, actor_id=ACTOR_ID, role_name="General Manager")

    @pytest.mark.parametrize(
        ("role_name", "is_owner"),
        [("Admin", False), ("Sales Staff", True), ("SBU Manager", False), ("Area Manager", False)],
    )
    def test_won_everyone_else_refused(self, role_name, is_owner):
        """Even people who'd pass on an Active deal (zone + direct-manager match set)."""
        service, repo = _split_edit_service("WON")
        repo.account_in_user_zones.return_value = True
        repo.get_owner_manager_id.return_value = ACTOR_ID
        actor_id = OWNER_ID if is_owner else ACTOR_ID
        _assert_refused(service, repo, actor_id=actor_id, role_name=role_name, match="Won")

    # -- Lost: locked for everyone ------------------------------------------------

    @pytest.mark.parametrize(
        ("role_name", "is_owner"),
        [("General Manager", False), ("Admin", False), ("Sales Staff", True)],
    )
    def test_lost_everyone_refused(self, role_name, is_owner):
        service, repo = _split_edit_service("LOST")
        actor_id = OWNER_ID if is_owner else ACTOR_ID
        _assert_refused(service, repo, actor_id=actor_id, role_name=role_name, match="Lost")

    def test_can_edit_missing_opportunity_raises_not_found(self):
        repo = _make_repo()
        service = _make_service(repo)
        with pytest.raises(NotFoundError, match="Opportunity"):
            service.can_edit_splits(OPP_ID, user_id=USER_ID, role_name="Sales Staff", user_sbu_id=SBU_ID)


# ===========================================================================
# replace_items
# ===========================================================================

class TestReplaceItems:
    def test_raises_not_found_for_missing_opportunity(self):
        repo = _make_repo()
        repo.get_for_update.return_value = None
        service = _make_service(repo)

        with pytest.raises(NotFoundError, match="Opportunity"):
            service.replace_items(
                OPP_ID,
                ItemsBulkUpdate(items=[]),
                updated_by=USER_ID,
            )

    def test_empty_items_clears_all(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        service = _make_service(repo)

        service.replace_items(OPP_ID, ItemsBulkUpdate(items=[]), updated_by=USER_ID)

        repo.replace_items.assert_called_once_with(OPP_ID, [])

    def test_items_are_constructed_correctly(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        service = _make_service(repo)

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
        service = _make_service(repo)

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
        service = _make_service(repo)

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
        service = _make_service(repo)

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
# add_stakeholder
# ===========================================================================

class TestAddStakeholder:
    def test_raises_not_found_for_missing_opportunity(self):
        repo = _make_repo()
        repo.get_for_update.return_value = None
        service = _make_service(repo)

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
        service = _make_service(repo)

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
        service = _make_service(repo)

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
        service = _make_service(repo)

        with pytest.raises(NotFoundError, match="not linked"):
            service.remove_stakeholder(OPP_ID, uuid.uuid4())

    def test_deletes_the_link(self):
        repo = _make_repo()
        link = MagicMock()
        repo.get_stakeholder_link.return_value = link
        service = _make_service(repo)

        service.remove_stakeholder(OPP_ID, uuid.uuid4())

        repo.delete_stakeholder.assert_called_once_with(link)


# ===========================================================================
# update_stakeholder
# ===========================================================================

class TestUpdateStakeholder:
    def test_raises_not_found_when_not_linked(self):
        repo = _make_repo()
        repo.get_stakeholder_link.return_value = None
        service = _make_service(repo)

        with pytest.raises(NotFoundError, match="not linked"):
            service.update_stakeholder(
                OPP_ID, uuid.uuid4(), StakeholderLinkUpdate(), updated_by=USER_ID
            )

    def test_updates_only_provided_fields(self):
        repo = _make_repo()
        link = MagicMock(influence_level="LOW", decision_role="Old Role", notes="Old notes")
        repo.get_stakeholder_link.return_value = link
        service = _make_service(repo)

        service.update_stakeholder(
            OPP_ID, uuid.uuid4(),
            StakeholderLinkUpdate(decision_role="New Role"),
            updated_by=USER_ID,
        )

        assert link.decision_role == "New Role"
        assert link.influence_level == "LOW"  # untouched — not in the update payload
        assert link.updated_by == USER_ID
        repo.update_stakeholder_link.assert_called_once_with(link)
