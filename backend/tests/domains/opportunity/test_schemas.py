"""
Unit tests for opportunity schema computed fields.

  - PipelineOpportunity.is_high_priority (BR-OP-15): effective High Priority
    status combines stage.display_order > 30 (automatic) with
    high_priority_manual (manual, only meaningful at/below Demo).
"""

import uuid
from datetime import datetime
from decimal import Decimal

import pytest

from app.domains.opportunity.schemas import (
    AccountNested,
    OwnerNested,
    PipelineOpportunity,
    SBUNested,
    StageNested,
    StatusNested,
)


def test_no_opportunity_response_carries_a_cost():
    # BR-CAT-04: cost is for the General Manager and Admin only, and only in the
    # Margin Report -- the cost saved on a line (Margin Report plan D4) must
    # never reach an Opportunity response.
    from app.domains.opportunity import schemas

    for name in dir(schemas):
        model = getattr(schemas, name)
        if isinstance(model, type) and hasattr(model, "model_fields"):
            leaked = [f for f in model.model_fields if "cost" in f]
            assert not leaked, f"{name} exposes {leaked}"


ACCOUNT = AccountNested(id=uuid.uuid4(), name="Test Hospital")
OWNER = OwnerNested(id=uuid.uuid4(), display_name="Test Owner")
SBU = SBUNested(id=uuid.uuid4(), name="Imaging")
STATUS = StatusNested(id=uuid.uuid4(), status_code="ACTIVE", status_name="Active", is_terminal=False)
NOW = datetime.now()


def _make_stage(order: int, code: str = "LEAD") -> StageNested:
    return StageNested(
        id=uuid.uuid4(),
        stage_code=code,
        stage_name=code.title(),
        display_order=order,
        default_win_probability=Decimal("5.00"),
    )


def _make_pipeline_opportunity(*, stage: StageNested, high_priority_manual: bool) -> PipelineOpportunity:
    return PipelineOpportunity(
        id=uuid.uuid4(),
        name="Test Deal",
        win_probability=Decimal("5.00"),
        indicative_value=None,
        expected_closure_date=None,
        demo_start_date=None,
        demo_end_date=None,
        po_number=None,
        po_date=None,
        loss_reason_id=None,
        competitor_name=None,
        hold_reason_id=None,
        reactivation_date=None,
        referred_by_note=None,
        gate_override_approver_id=None,
        gate_override_reason_id=None,
        gate_override_note=None,
        gate_override_set_at=None,
        gate_override_set_by=None,
        high_priority_manual=high_priority_manual,
        full_payment_confirmed_at=None,
        full_payment_note=None,
        created_at=NOW,
        updated_at=NOW,
        account=ACCOUNT,
        stage=stage,
        status=STATUS,
        owner=OWNER,
        sbu=SBU,
        project=None,
        lead_source=None,
        referred_by=None,
        gate_override_approver=None,
        gate_override_reason=None,
        full_payment_confirmed_by_user=None,
    )


@pytest.mark.parametrize("order,code", [(10, "LEAD"), (20, "QUALIFIED"), (30, "DEMO")])
def test_at_or_below_demo_without_manual_flag_is_not_high_priority(order, code):
    opp = _make_pipeline_opportunity(stage=_make_stage(order, code), high_priority_manual=False)
    assert opp.is_high_priority is False


@pytest.mark.parametrize("order,code", [(10, "LEAD"), (20, "QUALIFIED"), (30, "DEMO")])
def test_at_or_below_demo_with_manual_flag_is_high_priority(order, code):
    opp = _make_pipeline_opportunity(stage=_make_stage(order, code), high_priority_manual=True)
    assert opp.is_high_priority is True


@pytest.mark.parametrize(
    "order,code",
    [(40, "CLINICAL_EVALUATION"), (50, "NEGOTIATION"), (60, "ORDER"), (70, "DELIVERY_INSTALLATION")],
)
def test_past_demo_is_always_high_priority_regardless_of_manual_flag(order, code):
    for manual in (False, True):
        opp = _make_pipeline_opportunity(stage=_make_stage(order, code), high_priority_manual=manual)
        assert opp.is_high_priority is True
