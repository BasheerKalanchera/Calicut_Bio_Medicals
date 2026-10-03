"""
Unit tests for opportunity/validators.py.

Pure functions — no DB, no mocks.  Every BusinessRuleViolation is tested
for both the blocking case and the matching passing case.
"""

import uuid
from datetime import date, timedelta
from decimal import Decimal

import pytest

from app.core.exceptions import BusinessRuleViolation
from app.domains.opportunity import validators
from app.domains.opportunity.validators import (
    _today_ist,
    validate_stage_transition,
    validate_status_transition,
)

# Stage display_orders (must match Seed-Data.sql)
LEAD = 10
QUALIFIED = 20
DEMO = 30
CLINICAL_EVAL = 40
NEGOTIATION = 50
ORDER = 60
DELIVERY = 70

LEAD_SOURCE_ID = uuid.uuid4()
INDICATIVE_VALUE = Decimal("10.00")
LOSS_REASON_ID = uuid.uuid4()
HOLD_REASON_ID = uuid.uuid4()
DEMO_DATE = date.today()
CLOSURE_DATE = date.today()
PO = "PO-2026-001"
TOMORROW = _today_ist() + timedelta(days=1)
YESTERDAY = _today_ist() - timedelta(days=1)


def _stage_ctx(**overrides):
    """Kwargs that satisfy every stage gate up to DELIVERY."""
    base = dict(
        lead_source_id=LEAD_SOURCE_ID,
        indicative_value=INDICATIVE_VALUE,
        demo_start_date=DEMO_DATE,
        expected_closure_date=CLOSURE_DATE,
        po_number=PO,
        has_items=True,
    )
    base.update(overrides)
    return base


# ===========================================================================
# validate_stage_transition
# ===========================================================================

class TestStageTransitionBackwardAndSame:
    def test_backward_movement_always_passes(self):
        """Regression to an earlier stage never triggers gate checks."""
        validate_stage_transition(
            new_stage_order=LEAD,
            current_stage_order=DELIVERY,
            lead_source_id=None,
            indicative_value=None,
            demo_start_date=None,
            expected_closure_date=None,
            po_number=None,
            has_items=False,
        )

    def test_same_stage_always_passes(self):
        validate_stage_transition(
            new_stage_order=QUALIFIED,
            current_stage_order=QUALIFIED,
            lead_source_id=None,
            indicative_value=None,
            demo_start_date=None,
            expected_closure_date=None,
            po_number=None,
            has_items=False,
        )


class TestLeadToQualifiedGate:
    def test_blocked_without_lead_source(self):
        with pytest.raises(BusinessRuleViolation, match="Lead Source"):
            validate_stage_transition(
                new_stage_order=QUALIFIED,
                current_stage_order=LEAD,
                lead_source_id=None,
                indicative_value=INDICATIVE_VALUE,
                demo_start_date=None,
                expected_closure_date=None,
                po_number=None,
                has_items=True,
            )

    def test_blocked_without_indicative_value(self):
        with pytest.raises(BusinessRuleViolation, match="Indicative Value"):
            validate_stage_transition(
                new_stage_order=QUALIFIED,
                current_stage_order=LEAD,
                lead_source_id=LEAD_SOURCE_ID,
                indicative_value=None,
                demo_start_date=None,
                expected_closure_date=None,
                po_number=None,
                has_items=True,
            )

    def test_blocked_without_items(self):
        with pytest.raises(BusinessRuleViolation, match="product"):
            validate_stage_transition(
                new_stage_order=QUALIFIED,
                current_stage_order=LEAD,
                lead_source_id=LEAD_SOURCE_ID,
                indicative_value=INDICATIVE_VALUE,
                demo_start_date=None,
                expected_closure_date=None,
                po_number=None,
                has_items=False,
            )

    def test_passes_with_all_gates_met(self):
        validate_stage_transition(
            new_stage_order=QUALIFIED,
            current_stage_order=LEAD,
            lead_source_id=LEAD_SOURCE_ID,
            indicative_value=INDICATIVE_VALUE,
            demo_start_date=None,
            expected_closure_date=None,
            po_number=None,
            has_items=True,
        )


class TestQualifiedToDemoGate:
    def test_blocked_without_demo_start_date(self):
        with pytest.raises(BusinessRuleViolation, match="Demo Start Date"):
            validate_stage_transition(
                new_stage_order=DEMO,
                current_stage_order=QUALIFIED,
                lead_source_id=LEAD_SOURCE_ID,
                indicative_value=INDICATIVE_VALUE,
                demo_start_date=None,
                expected_closure_date=None,
                po_number=None,
                has_items=True,
            )

    def test_passes_with_demo_start_date(self):
        validate_stage_transition(
            new_stage_order=DEMO,
            current_stage_order=QUALIFIED,
            lead_source_id=LEAD_SOURCE_ID,
            indicative_value=INDICATIVE_VALUE,
            demo_start_date=DEMO_DATE,
            expected_closure_date=None,
            po_number=None,
            has_items=True,
        )

    def test_reorder_skips_demo_start_date_requirement(self):
        """BR-OP-13: a Reorder deal never has a fresh demo, so this gate doesn't apply."""
        validate_stage_transition(
            new_stage_order=DEMO,
            current_stage_order=QUALIFIED,
            lead_source_id=LEAD_SOURCE_ID,
            lead_source_name="REPEAT_ORDER",
            indicative_value=INDICATIVE_VALUE,
            demo_start_date=None,
            expected_closure_date=None,
            po_number=None,
            has_items=True,
        )

    def test_non_reorder_lead_source_still_requires_demo_start_date(self):
        with pytest.raises(BusinessRuleViolation, match="Demo Start Date"):
            validate_stage_transition(
                new_stage_order=DEMO,
                current_stage_order=QUALIFIED,
                lead_source_id=LEAD_SOURCE_ID,
                lead_source_name="EXISTING_CUSTOMER",
                indicative_value=INDICATIVE_VALUE,
                demo_start_date=None,
                expected_closure_date=None,
                po_number=None,
                has_items=True,
            )


class TestClinicalToNegotiationGate:
    def test_blocked_without_expected_closure_date(self):
        with pytest.raises(BusinessRuleViolation, match="Expected Closure Date"):
            validate_stage_transition(
                new_stage_order=NEGOTIATION,
                current_stage_order=CLINICAL_EVAL,
                lead_source_id=LEAD_SOURCE_ID,
                indicative_value=INDICATIVE_VALUE,
                demo_start_date=DEMO_DATE,
                expected_closure_date=None,
                po_number=None,
                has_items=True,
            )

    def test_passes_with_closure_date(self):
        validate_stage_transition(
            new_stage_order=NEGOTIATION,
            current_stage_order=CLINICAL_EVAL,
            **_stage_ctx(po_number=None),
        )

    def test_reorder_skips_expected_closure_date_requirement(self):
        """BR-OP-13: a Reorder deal never has a fresh negotiation, so this gate doesn't apply."""
        validate_stage_transition(
            new_stage_order=NEGOTIATION,
            current_stage_order=CLINICAL_EVAL,
            lead_source_id=LEAD_SOURCE_ID,
            lead_source_name="REPEAT_ORDER",
            indicative_value=INDICATIVE_VALUE,
            demo_start_date=None,
            expected_closure_date=None,
            po_number=None,
            has_items=True,
        )


class TestGateOverride:
    """BR-OP-14: a manager-attested gate override waives the same two gates as
    REPEAT_ORDER, but is triggered by gate_override_approver_id being set
    rather than by lead_source. Approver validity itself is a service-layer
    concern (test_opportunity_service.py) -- this only exercises the skip."""

    GATE_OVERRIDE_APPROVER_ID = uuid.uuid4()

    def test_gate_override_skips_demo_start_date_requirement(self):
        validate_stage_transition(
            new_stage_order=DEMO,
            current_stage_order=QUALIFIED,
            lead_source_id=LEAD_SOURCE_ID,
            indicative_value=INDICATIVE_VALUE,
            demo_start_date=None,
            expected_closure_date=None,
            po_number=None,
            has_items=True,
            gate_override_approver_id=self.GATE_OVERRIDE_APPROVER_ID,
        )

    def test_without_override_still_requires_demo_start_date(self):
        with pytest.raises(BusinessRuleViolation, match="Demo Start Date"):
            validate_stage_transition(
                new_stage_order=DEMO,
                current_stage_order=QUALIFIED,
                lead_source_id=LEAD_SOURCE_ID,
                indicative_value=INDICATIVE_VALUE,
                demo_start_date=None,
                expected_closure_date=None,
                po_number=None,
                has_items=True,
                gate_override_approver_id=None,
            )

    def test_gate_override_skips_expected_closure_date_requirement(self):
        validate_stage_transition(
            new_stage_order=NEGOTIATION,
            current_stage_order=CLINICAL_EVAL,
            lead_source_id=LEAD_SOURCE_ID,
            indicative_value=INDICATIVE_VALUE,
            demo_start_date=None,
            expected_closure_date=None,
            po_number=None,
            has_items=True,
            gate_override_approver_id=self.GATE_OVERRIDE_APPROVER_ID,
        )

    def test_gate_override_still_requires_order_value_at_negotiation_to_order(self):
        """Negotiation -> Order and Order -> Delivery are untouched by BR-OP-14 --
        only the Demo Date / Expected Closure Date gates are waived."""
        with pytest.raises(BusinessRuleViolation, match="Order Value"):
            validate_stage_transition(
                new_stage_order=ORDER,
                current_stage_order=NEGOTIATION,
                lead_source_id=LEAD_SOURCE_ID,
                indicative_value=None,
                demo_start_date=None,
                expected_closure_date=None,
                po_number=None,
                has_items=True,
                gate_override_approver_id=self.GATE_OVERRIDE_APPROVER_ID,
            )

    def test_gate_override_still_requires_po_number_at_order_to_delivery(self):
        with pytest.raises(BusinessRuleViolation, match="PO Number"):
            validate_stage_transition(
                new_stage_order=DELIVERY,
                current_stage_order=ORDER,
                lead_source_id=LEAD_SOURCE_ID,
                indicative_value=INDICATIVE_VALUE,
                demo_start_date=None,
                expected_closure_date=None,
                po_number=None,
                has_items=True,
                gate_override_approver_id=self.GATE_OVERRIDE_APPROVER_ID,
            )


class TestNegotiationToOrderGate:
    def test_blocked_without_indicative_value(self):
        with pytest.raises(BusinessRuleViolation, match="Order Value"):
            validate_stage_transition(
                new_stage_order=ORDER,
                current_stage_order=NEGOTIATION,
                **_stage_ctx(indicative_value=None),
            )

    def test_blocked_without_items(self):
        with pytest.raises(BusinessRuleViolation, match="Product details"):
            validate_stage_transition(
                new_stage_order=ORDER,
                current_stage_order=NEGOTIATION,
                **_stage_ctx(has_items=False),
            )

    def test_passes_with_value_and_items(self):
        validate_stage_transition(
            new_stage_order=ORDER,
            current_stage_order=NEGOTIATION,
            **_stage_ctx(po_number=None),
        )

    def test_reorder_still_requires_order_value(self):
        """BR-OP-13: Reorder only relaxes Demo/Closure -- Order Value stays required."""
        with pytest.raises(BusinessRuleViolation, match="Order Value"):
            validate_stage_transition(
                new_stage_order=ORDER,
                current_stage_order=NEGOTIATION,
                lead_source_id=LEAD_SOURCE_ID,
                lead_source_name="REPEAT_ORDER",
                indicative_value=None,
                demo_start_date=None,
                expected_closure_date=None,
                po_number=None,
                has_items=True,
            )

    def test_reorder_still_requires_items(self):
        """BR-OP-13: Reorder only relaxes Demo/Closure -- Product Details stay required."""
        with pytest.raises(BusinessRuleViolation, match="Product details"):
            validate_stage_transition(
                new_stage_order=ORDER,
                current_stage_order=NEGOTIATION,
                lead_source_id=LEAD_SOURCE_ID,
                lead_source_name="REPEAT_ORDER",
                indicative_value=INDICATIVE_VALUE,
                demo_start_date=None,
                expected_closure_date=None,
                po_number=None,
                has_items=False,
            )


class TestOrderToDeliveryGate:
    def test_blocked_without_po_number(self):
        with pytest.raises(BusinessRuleViolation, match="PO Number"):
            validate_stage_transition(
                new_stage_order=DELIVERY,
                current_stage_order=ORDER,
                **_stage_ctx(po_number=None),
            )

    def test_passes_with_po_number(self):
        validate_stage_transition(
            new_stage_order=DELIVERY,
            current_stage_order=ORDER,
            **_stage_ctx(),
        )


class TestStageSkipAndCreate:
    def test_skipping_multiple_stages_enforces_all_intermediate_gates(self):
        """Lead → Negotiation: QUALIFIED and DEMO and NEGOTIATION gates all apply."""
        with pytest.raises(BusinessRuleViolation, match="Lead Source"):
            validate_stage_transition(
                new_stage_order=NEGOTIATION,
                current_stage_order=LEAD,
                lead_source_id=None,
                indicative_value=INDICATIVE_VALUE,
                demo_start_date=DEMO_DATE,
                expected_closure_date=CLOSURE_DATE,
                po_number=None,
                has_items=True,
            )

    def test_create_at_demo_enforces_qualified_gate(self):
        """current_stage_order=0 simulates creating an opportunity at DEMO stage."""
        with pytest.raises(BusinessRuleViolation, match="Lead Source"):
            validate_stage_transition(
                new_stage_order=DEMO,
                current_stage_order=0,
                lead_source_id=None,
                indicative_value=INDICATIVE_VALUE,
                demo_start_date=DEMO_DATE,
                expected_closure_date=None,
                po_number=None,
                has_items=True,
            )

    def test_already_past_qualified_does_not_recheck_qualified_gate(self):
        """
        Advancing QUALIFIED→DEMO: QUALIFIED gate is NOT rechecked.
        Data that would fail the QUALIFIED gate is intentionally absent.
        """
        validate_stage_transition(
            new_stage_order=DEMO,
            current_stage_order=QUALIFIED,
            lead_source_id=None,       # would fail QUALIFIED gate
            indicative_value=None,     # same
            demo_start_date=DEMO_DATE,
            expected_closure_date=None,
            po_number=None,
            has_items=False,
        )


# ===========================================================================
# validate_status_transition
# ===========================================================================

class TestTerminalStatusLock:
    def test_won_blocks_any_further_change(self):
        with pytest.raises(BusinessRuleViolation, match="WON"):
            validate_status_transition(
                current_status_code="WON",
                current_is_terminal=True,
                new_status_code="ACTIVE",
                loss_reason_id=None,
                loss_reason_code=None,
                competitor_name=None,
                hold_reason_id=None,
                reactivation_date=None,
                po_number=PO,
                has_items=True,
            )

    def test_lost_blocks_any_further_change(self):
        with pytest.raises(BusinessRuleViolation, match="LOST"):
            validate_status_transition(
                current_status_code="LOST",
                current_is_terminal=True,
                new_status_code="ACTIVE",
                loss_reason_id=None,
                loss_reason_code=None,
                competitor_name=None,
                hold_reason_id=None,
                reactivation_date=None,
                po_number=None,
                has_items=False,
            )

    def test_same_status_is_always_noop(self):
        validate_status_transition(
            current_status_code="ACTIVE",
            current_is_terminal=False,
            new_status_code="ACTIVE",
            loss_reason_id=None,
            loss_reason_code=None,
            competitor_name=None,
            hold_reason_id=None,
            reactivation_date=None,
            po_number=None,
            has_items=False,
        )


class TestTransitionToWon:
    def test_blocked_without_po_number(self):
        with pytest.raises(BusinessRuleViolation, match="PO Number"):
            validate_status_transition(
                current_status_code="ACTIVE",
                current_is_terminal=False,
                new_status_code="WON",
                loss_reason_id=None,
                loss_reason_code=None,
                competitor_name=None,
                hold_reason_id=None,
                reactivation_date=None,
                po_number=None,
                has_items=True,
            )

    def test_blocked_without_items(self):
        with pytest.raises(BusinessRuleViolation, match="product"):
            validate_status_transition(
                current_status_code="ACTIVE",
                current_is_terminal=False,
                new_status_code="WON",
                loss_reason_id=None,
                loss_reason_code=None,
                competitor_name=None,
                hold_reason_id=None,
                reactivation_date=None,
                po_number=PO,
                has_items=False,
            )

    # BR-OP-17: Won only from the Payment Pending stage (display_order 80),
    # with the "full payment received" tick.

    @staticmethod
    def _won(**overrides):
        args = dict(
            current_status_code="ACTIVE",
            current_is_terminal=False,
            new_status_code="WON",
            loss_reason_id=None,
            loss_reason_code=None,
            competitor_name=None,
            hold_reason_id=None,
            reactivation_date=None,
            po_number=PO,
            has_items=True,
            new_stage_order=80,
            full_payment_confirmed=True,
        )
        args.update(overrides)
        validate_status_transition(**args)

    def test_passes_at_payment_pending_with_payment_confirmed(self):
        self._won()

    @pytest.mark.parametrize("stage_order", [10, 60, 70])
    def test_blocked_before_payment_pending(self, stage_order):
        with pytest.raises(BusinessRuleViolation, match="Payment Pending"):
            self._won(new_stage_order=stage_order)

    def test_blocked_without_payment_confirmation(self):
        with pytest.raises(BusinessRuleViolation, match="full payment"):
            self._won(full_payment_confirmed=False)

    def test_fails_closed_when_caller_omits_new_arguments(self):
        # A caller that never passes the stage or the tick must not let Won through.
        with pytest.raises(BusinessRuleViolation, match="Payment Pending"):
            validate_status_transition(
                current_status_code="ACTIVE",
                current_is_terminal=False,
                new_status_code="WON",
                loss_reason_id=None,
                loss_reason_code=None,
                competitor_name=None,
                hold_reason_id=None,
                reactivation_date=None,
                po_number=PO,
                has_items=True,
            )

    def test_lost_and_on_hold_unaffected_by_stage(self):
        # Lost needs only its own reason, from any stage (BR-OP-17 is Won-only).
        self._won(new_status_code="LOST", loss_reason_id=uuid.uuid4(), loss_reason_code="PRICE",
                  new_stage_order=10, full_payment_confirmed=False)


class TestTransitionToLost:
    def test_blocked_without_loss_reason(self):
        with pytest.raises(BusinessRuleViolation, match="Loss Reason"):
            validate_status_transition(
                current_status_code="ACTIVE",
                current_is_terminal=False,
                new_status_code="LOST",
                loss_reason_id=None,
                loss_reason_code=None,
                competitor_name=None,
                hold_reason_id=None,
                reactivation_date=None,
                po_number=None,
                has_items=False,
            )

    def test_competitor_won_blocked_without_competitor_name(self):
        with pytest.raises(BusinessRuleViolation, match="Competitor Name"):
            validate_status_transition(
                current_status_code="ACTIVE",
                current_is_terminal=False,
                new_status_code="LOST",
                loss_reason_id=LOSS_REASON_ID,
                loss_reason_code="COMPETITOR_WON",
                competitor_name=None,
                hold_reason_id=None,
                reactivation_date=None,
                po_number=None,
                has_items=False,
            )

    def test_competitor_won_passes_with_competitor_name(self):
        validate_status_transition(
            current_status_code="ACTIVE",
            current_is_terminal=False,
            new_status_code="LOST",
            loss_reason_id=LOSS_REASON_ID,
            loss_reason_code="COMPETITOR_WON",
            competitor_name="Siemens Healthineers",
            hold_reason_id=None,
            reactivation_date=None,
            po_number=None,
            has_items=False,
        )

    def test_non_competitor_reason_does_not_require_competitor_name(self):
        validate_status_transition(
            current_status_code="ACTIVE",
            current_is_terminal=False,
            new_status_code="LOST",
            loss_reason_id=LOSS_REASON_ID,
            loss_reason_code="PRICE",
            competitor_name=None,
            hold_reason_id=None,
            reactivation_date=None,
            po_number=None,
            has_items=False,
        )


class TestTransitionToOnHold:
    def test_blocked_without_hold_reason(self):
        with pytest.raises(BusinessRuleViolation, match="Hold Reason"):
            validate_status_transition(
                current_status_code="ACTIVE",
                current_is_terminal=False,
                new_status_code="ON_HOLD",
                loss_reason_id=None,
                loss_reason_code=None,
                competitor_name=None,
                hold_reason_id=None,
                reactivation_date=TOMORROW,
                po_number=None,
                has_items=False,
            )

    def test_blocked_without_reactivation_date(self):
        with pytest.raises(BusinessRuleViolation, match="Reactivation Date"):
            validate_status_transition(
                current_status_code="ACTIVE",
                current_is_terminal=False,
                new_status_code="ON_HOLD",
                loss_reason_id=None,
                loss_reason_code=None,
                competitor_name=None,
                hold_reason_id=HOLD_REASON_ID,
                reactivation_date=None,
                po_number=None,
                has_items=False,
            )

    def test_blocked_if_reactivation_date_is_today(self):
        with pytest.raises(BusinessRuleViolation, match="future date"):
            validate_status_transition(
                current_status_code="ACTIVE",
                current_is_terminal=False,
                new_status_code="ON_HOLD",
                loss_reason_id=None,
                loss_reason_code=None,
                competitor_name=None,
                hold_reason_id=HOLD_REASON_ID,
                reactivation_date=_today_ist(),
                po_number=None,
                has_items=False,
            )

    def test_blocked_if_reactivation_date_is_past(self):
        with pytest.raises(BusinessRuleViolation, match="future date"):
            validate_status_transition(
                current_status_code="ACTIVE",
                current_is_terminal=False,
                new_status_code="ON_HOLD",
                loss_reason_id=None,
                loss_reason_code=None,
                competitor_name=None,
                hold_reason_id=HOLD_REASON_ID,
                reactivation_date=YESTERDAY,
                po_number=None,
                has_items=False,
            )

    def test_passes_with_future_date_and_reason(self):
        validate_status_transition(
            current_status_code="ACTIVE",
            current_is_terminal=False,
            new_status_code="ON_HOLD",
            loss_reason_id=None,
            loss_reason_code=None,
            competitor_name=None,
            hold_reason_id=HOLD_REASON_ID,
            reactivation_date=TOMORROW,
            po_number=None,
            has_items=False,
        )


class TestSystemStatusTransitions:
    def test_stalled_to_active_has_no_requirements(self):
        """Stalled → Active is system-triggered; no business requirements apply."""
        validate_status_transition(
            current_status_code="STALLED",
            current_is_terminal=False,
            new_status_code="ACTIVE",
            loss_reason_id=None,
            loss_reason_code=None,
            competitor_name=None,
            hold_reason_id=None,
            reactivation_date=None,
            po_number=None,
            has_items=False,
        )

    def test_on_hold_to_active_has_no_requirements(self):
        """Reactivating from On-Hold requires no extra data."""
        validate_status_transition(
            current_status_code="ON_HOLD",
            current_is_terminal=False,
            new_status_code="ACTIVE",
            loss_reason_id=None,
            loss_reason_code=None,
            competitor_name=None,
            hold_reason_id=None,
            reactivation_date=None,
            po_number=None,
            has_items=False,
        )


class TestTodayIsIndianDate:
    def test_early_morning_ist_is_already_the_new_day(self, monkeypatch):
        # 30 Sep 20:00 UTC = 1 Oct 01:30 IST -- the server's UTC date is
        # still 30 Sep, but for a user in India it is 1 Oct.
        from datetime import UTC
        from datetime import datetime as real_datetime

        class _Clock(real_datetime):
            @classmethod
            def now(cls, tz=None):
                return real_datetime(2026, 9, 30, 20, 0, tzinfo=UTC).astimezone(tz)

        monkeypatch.setattr(validators, "datetime", _Clock)
        assert validators._today_ist() == date(2026, 10, 1)
