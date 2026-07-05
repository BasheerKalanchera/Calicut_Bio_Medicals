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
from unittest.mock import MagicMock, call

import pytest

from app.core.exceptions import BusinessRuleViolation, ConflictError, NotFoundError
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
    StakeholdersBulkUpdate,
)
from app.domains.opportunity.service import OpportunityService
from app.domains.reference.models import LossReason, OpportunityStage, OpportunityStatus

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
    repo.get_stage.return_value = _make_stage(10, "LEAD")
    repo.get_status.return_value = _make_status("ACTIVE")
    repo.get_loss_reason.return_value = _make_loss_reason("PRICE")
    repo.get_for_update.return_value = None         # tests override as needed
    repo.has_items.return_value = False
    repo.create.side_effect = lambda obj: obj
    repo.update.side_effect = lambda obj: obj
    repo.replace_splits.return_value = []
    repo.replace_items.return_value = []
    repo.replace_stakeholders.return_value = []
    for k, v in overrides.items():
        setattr(repo, k, v)
    return repo


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
        service = OpportunityService(repository=repo)

        with pytest.raises(NotFoundError, match="Account"):
            service.create_opportunity(
                ACCOUNT_ID, _make_create_data(), created_by=USER_ID, sbu_id=SBU_ID
            )

    def test_raises_not_found_for_unknown_stage(self):
        repo = _make_repo()
        repo.get_stage.return_value = None
        service = OpportunityService(repository=repo)

        with pytest.raises(NotFoundError, match="Stage"):
            service.create_opportunity(
                ACCOUNT_ID, _make_create_data(), created_by=USER_ID, sbu_id=SBU_ID
            )

    def test_raises_not_found_for_unknown_status(self):
        repo = _make_repo()
        repo.get_status.return_value = None
        service = OpportunityService(repository=repo)

        with pytest.raises(NotFoundError, match="Status"):
            service.create_opportunity(
                ACCOUNT_ID, _make_create_data(), created_by=USER_ID, sbu_id=SBU_ID
            )

    def test_creates_opportunity_at_lead_stage(self):
        """Lead stage with Active status and no items requires nothing."""
        repo = _make_repo()
        service = OpportunityService(repository=repo)

        result = service.create_opportunity(
            ACCOUNT_ID, _make_create_data(), created_by=USER_ID, sbu_id=SBU_ID
        )

        repo.create.assert_called_once()
        assert result.name == "New Deal"
        assert result.created_by == USER_ID

    def test_create_at_qualified_without_lead_source_raises(self):
        repo = _make_repo()
        repo.get_stage.return_value = _make_stage(20, "QUALIFIED")
        service = OpportunityService(repository=repo)

        data = _make_create_data(
            stage_id=STAGE_QUALIFIED_ID,
            indicative_value=Decimal("10.00"),
            items=[OpportunityItemCreate(product_id=PRODUCT_ID, quantity=1, unit_price_lakhs=Decimal("5"))],
        )
        with pytest.raises(BusinessRuleViolation, match="Lead Source"):
            service.create_opportunity(ACCOUNT_ID, data, created_by=USER_ID, sbu_id=SBU_ID)

    def test_create_with_initial_status_lost_without_loss_reason_raises(self):
        repo = _make_repo()
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.return_value = _make_status("LOST", is_terminal=True)
        service = OpportunityService(repository=repo)

        # On create, current_status_code="ACTIVE", so transitioning ACTIVE→LOST is validated
        data = _make_create_data(status_id=STATUS_LOST_ID)
        with pytest.raises(BusinessRuleViolation, match="Loss Reason"):
            service.create_opportunity(ACCOUNT_ID, data, created_by=USER_ID, sbu_id=SBU_ID)

    def test_audit_fields_set_on_create(self):
        repo = _make_repo()
        service = OpportunityService(repository=repo)

        service.create_opportunity(
            ACCOUNT_ID, _make_create_data(), created_by=USER_ID, sbu_id=SBU_ID
        )

        created_obj: Opportunity = repo.create.call_args[0][0]
        assert created_obj.created_by == USER_ID
        assert created_obj.updated_by == USER_ID
        assert created_obj.sbu_id == SBU_ID


# ===========================================================================
# update_opportunity (PATCH semantics)
# ===========================================================================

class TestUpdateOpportunity:
    def test_raises_not_found_for_missing_opportunity(self):
        repo = _make_repo()
        repo.get_for_update.return_value = None
        service = OpportunityService(repository=repo)

        with pytest.raises(NotFoundError, match="Opportunity"):
            service.update_opportunity(OPP_ID, OpportunityUpdate(name="X"), updated_by=USER_ID)

    def test_empty_patch_returns_unchanged_opportunity(self):
        opp = _make_opportunity()
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.return_value = _make_status("ACTIVE")
        service = OpportunityService(repository=repo)

        result = service.update_opportunity(OPP_ID, OpportunityUpdate(), updated_by=USER_ID)

        repo.update.assert_not_called()
        assert result is opp

    def test_patch_only_updates_provided_fields(self):
        opp = _make_opportunity(name="Old Name", lead_source_id=LEAD_SOURCE_ID)
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.return_value = _make_status("ACTIVE")
        service = OpportunityService(repository=repo)

        service.update_opportunity(OPP_ID, OpportunityUpdate(name="New Name"), updated_by=USER_ID)

        assert opp.name == "New Name"
        assert opp.lead_source_id == LEAD_SOURCE_ID  # unchanged

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
        service = OpportunityService(repository=repo)

        with pytest.raises(BusinessRuleViolation, match="Lead Source"):
            service.update_opportunity(
                OPP_ID,
                OpportunityUpdate(stage_id=STAGE_QUALIFIED_ID),
                updated_by=USER_ID,
            )

    def test_terminal_status_blocks_update(self):
        """BR-OP-09: cannot change status of a Won opportunity."""
        opp = _make_opportunity(status_id=STATUS_WON_ID)
        repo = _make_repo()
        repo.get_for_update.return_value = opp
        repo.get_stage.return_value = _make_stage(10, "LEAD")
        repo.get_status.return_value = _make_status("WON", is_terminal=True)
        service = OpportunityService(repository=repo)

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
        service = OpportunityService(repository=repo)

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
        service = OpportunityService(repository=repo)

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
        service = OpportunityService(repository=repo)

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
        service = OpportunityService(repository=repo)

        service.update_opportunity(OPP_ID, OpportunityUpdate(name="X"), updated_by=USER_ID)

        assert opp.updated_by == USER_ID


# ===========================================================================
# replace_splits (BR-FIN-01)
# ===========================================================================

class TestReplaceSplits:
    def test_raises_not_found_for_missing_opportunity(self):
        repo = _make_repo()
        repo.get_for_update.return_value = None
        service = OpportunityService(repository=repo)

        with pytest.raises(NotFoundError, match="Opportunity"):
            service.replace_splits(OPP_ID, SplitsBulkUpdate(splits=[]), updated_by=USER_ID)

    def test_empty_splits_list_passes_without_sum_check(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        service = OpportunityService(repository=repo)

        service.replace_splits(OPP_ID, SplitsBulkUpdate(splits=[]), updated_by=USER_ID)

        repo.replace_splits.assert_called_once_with(OPP_ID, [])

    def test_splits_not_summing_to_100_raises(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        service = OpportunityService(repository=repo)

        data = SplitsBulkUpdate(splits=[
            SplitCreate(user_id=uuid.uuid4(), split_percentage=Decimal("60")),
            SplitCreate(user_id=uuid.uuid4(), split_percentage=Decimal("30")),
        ])
        with pytest.raises(BusinessRuleViolation, match="100%"):
            service.replace_splits(OPP_ID, data, updated_by=USER_ID)

    def test_splits_summing_to_100_calls_repository(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        service = OpportunityService(repository=repo)

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
        service = OpportunityService(repository=repo)

        data = SplitsBulkUpdate(splits=[
            SplitCreate(user_id=uuid.uuid4(), split_percentage=Decimal("100")),
        ])
        service.replace_splits(OPP_ID, data, updated_by=USER_ID)
        repo.replace_splits.assert_called_once()

    def test_split_audit_fields_set(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        service = OpportunityService(repository=repo)

        data = SplitsBulkUpdate(splits=[
            SplitCreate(user_id=uuid.uuid4(), split_percentage=Decimal("100")),
        ])
        service.replace_splits(OPP_ID, data, updated_by=USER_ID)

        split: Split = repo.replace_splits.call_args[0][1][0]
        assert split.created_by == USER_ID
        assert split.updated_by == USER_ID


# ===========================================================================
# replace_items
# ===========================================================================

class TestReplaceItems:
    def test_raises_not_found_for_missing_opportunity(self):
        repo = _make_repo()
        repo.get_for_update.return_value = None
        service = OpportunityService(repository=repo)

        with pytest.raises(NotFoundError, match="Opportunity"):
            service.replace_items(
                OPP_ID,
                ItemsBulkUpdate(items=[]),
                updated_by=USER_ID,
            )

    def test_empty_items_clears_all(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        service = OpportunityService(repository=repo)

        service.replace_items(OPP_ID, ItemsBulkUpdate(items=[]), updated_by=USER_ID)

        repo.replace_items.assert_called_once_with(OPP_ID, [])

    def test_items_are_constructed_correctly(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        service = OpportunityService(repository=repo)

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


# ===========================================================================
# replace_stakeholders
# ===========================================================================

class TestReplaceStakeholders:
    def test_raises_not_found_for_missing_opportunity(self):
        repo = _make_repo()
        repo.get_for_update.return_value = None
        service = OpportunityService(repository=repo)

        with pytest.raises(NotFoundError, match="Opportunity"):
            service.replace_stakeholders(
                OPP_ID,
                StakeholdersBulkUpdate(stakeholders=[]),
                updated_by=USER_ID,
            )

    def test_empty_stakeholders_clears_all(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        service = OpportunityService(repository=repo)

        service.replace_stakeholders(
            OPP_ID, StakeholdersBulkUpdate(stakeholders=[]), updated_by=USER_ID
        )

        repo.replace_stakeholders.assert_called_once_with(OPP_ID, [])

    def test_stakeholders_mapped_with_correct_fields(self):
        repo = _make_repo()
        repo.get_for_update.return_value = _make_opportunity()
        service = OpportunityService(repository=repo)

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
        service = OpportunityService(repository=repo)

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
        service = OpportunityService(repository=repo)

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
        service = OpportunityService(repository=repo)

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
        service = OpportunityService(repository=repo)

        with pytest.raises(NotFoundError, match="not linked"):
            service.remove_stakeholder(OPP_ID, uuid.uuid4())

    def test_deletes_the_link(self):
        repo = _make_repo()
        link = MagicMock()
        repo.get_stakeholder_link.return_value = link
        service = OpportunityService(repository=repo)

        service.remove_stakeholder(OPP_ID, uuid.uuid4())

        repo.delete_stakeholder.assert_called_once_with(link)
