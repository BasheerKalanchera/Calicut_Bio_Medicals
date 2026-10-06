"""
Stage gate (BR-OP-00, BR-OP-01) and status transition (BR-OP-02, BR-OP-03, BR-OP-05, BR-OP-09)
validators.  Pure functions — no DB access.  The service loads reference data and passes it in.
"""

import uuid
from datetime import date, datetime
from decimal import Decimal
from zoneinfo import ZoneInfo

from app.core.exceptions import BusinessRuleViolation


def _today_ist() -> date:
    # "Today" for a user in India -- the server's own date is UTC, so from
    # 00:00 to 05:30 IST it would still be yesterday.
    return datetime.now(ZoneInfo("Asia/Kolkata")).date()


# Loss reason code that mandates competitor_name
_COMPETITOR_WON = "COMPETITOR_WON"

# Stage display_order thresholds (from Seed-Data.sql)
_ORDER_QUALIFIED = 20
_ORDER_DEMO = 30
# _ORDER_CLINICAL_EVAL = 40  gates deferred: demo_outcome / clinical fields not in schema
_ORDER_NEGOTIATION = 50
_ORDER_ORDER = 60
_ORDER_DELIVERY = 70
_ORDER_PAYMENT_PENDING = 80
# Public for Target vs Actuals' "past Order with no PO date" count.
DELIVERY_STAGE_ORDER = _ORDER_DELIVERY


_REPEAT_ORDER_LEAD_SOURCE = "REPEAT_ORDER"


def validate_stage_transition(
    *,
    new_stage_order: int,
    current_stage_order: int,
    lead_source_id: uuid.UUID | None,
    lead_source_name: str | None = None,
    indicative_value: Decimal | None,
    demo_start_date: date | None,
    expected_closure_date: date | None,
    po_number: str | None,
    has_items: bool,
    gate_override_approver_id: uuid.UUID | None = None,
    po_date: date | None = None,
) -> None:
    """
    Enforce exit criteria when advancing to a new stage.

    Pass current_stage_order=0 when creating an opportunity at a non-Lead stage
    so that all gates between Lead and the initial stage are checked (BR-OP-00).

    Backward movement (new_stage_order <= current_stage_order) is always allowed.
    """
    if new_stage_order <= current_stage_order:
        return

    # BR-OP-13: a REPEAT_ORDER deal (customer buying the exact same equipment again,
    # price pre-negotiated off a prior PO) never has a fresh demo or negotiation --
    # those two gates don't apply. Order Value and Product Details (the Negotiation ->
    # Order gate below) still do, unchanged.
    is_repeat_order = lead_source_name == _REPEAT_ORDER_LEAD_SOURCE
    # BR-OP-14: a manager-attested gate override waives the same two gates as
    # REPEAT_ORDER, for a deal-specific reason (e.g. customer declines a demo)
    # rather than a lead-source-driven one -- see that rule for the approver
    # validation this presumes already happened in the service layer.
    is_gate_override = gate_override_approver_id is not None

    # Gate: Lead → Qualified
    if current_stage_order < _ORDER_QUALIFIED <= new_stage_order:
        if not lead_source_id:
            raise BusinessRuleViolation(
                "Lead Source is required to advance to Qualified stage."
            )
        if indicative_value is None:
            raise BusinessRuleViolation(
                "Indicative Value (budget range) is required to advance to Qualified stage."
            )
        if not has_items:
            raise BusinessRuleViolation(
                "At least one product must be added to advance to Qualified stage."
            )

    # Gate: Qualified → Demo
    if current_stage_order < _ORDER_DEMO <= new_stage_order:  # noqa: SIM102 — gate header kept apart from its rule
        if not is_repeat_order and not is_gate_override and not demo_start_date:
            raise BusinessRuleViolation(
                "Demo Start Date is required to advance to Demo stage."
            )

    # Gate: Demo → Clinical Evaluation (order=40)
    # demo_outcome, clinical_contact, and clinical_evaluation_start_date are not
    # in the current schema — gate enforcement deferred to a future sprint.

    # Gate: Clinical Evaluation → Negotiation
    if current_stage_order < _ORDER_NEGOTIATION <= new_stage_order:  # noqa: SIM102 — gate header kept apart from its rule
        if not is_repeat_order and not is_gate_override and not expected_closure_date:
            raise BusinessRuleViolation(
                "Expected Closure Date is required to advance to Negotiation stage."
            )

    # Gate: Negotiation → Order
    if current_stage_order < _ORDER_ORDER <= new_stage_order:
        if indicative_value is None:
            raise BusinessRuleViolation(
                "Order Value (Indicative Value) must be confirmed to advance to Order stage."
            )
        if not has_items:
            raise BusinessRuleViolation(
                "Product details must be confirmed to advance to Order stage."
            )

    # Gate: Order → Delivery & Installation
    if current_stage_order < _ORDER_DELIVERY <= new_stage_order:
        if not po_number:
            raise BusinessRuleViolation(
                "PO Number is required to advance to Delivery & Installation stage."
            )
        if not po_date:
            raise BusinessRuleViolation(
                "PO Date is required to advance to Delivery & Installation stage."
            )
    # delivery_date and installation_site are not in the current schema — gate deferred.


def validate_status_transition(
    *,
    current_status_code: str,
    current_is_terminal: bool,
    new_status_code: str,
    loss_reason_id: uuid.UUID | None,
    loss_reason_code: str | None,
    competitor_name: str | None,
    hold_reason_id: uuid.UUID | None,
    reactivation_date: date | None,
    po_number: str | None,
    has_items: bool,
    current_stage_order: int | None = None,
    new_stage_order: int | None = None,
    full_payment_confirmed: bool = False,
    po_date: date | None = None,
) -> None:
    """
    Enforce status transition rules (BR-OP-02, BR-OP-03, BR-OP-05, BR-OP-09, BR-OP-17).

    Pass current_status_code="ACTIVE" and current_is_terminal=False when creating
    an opportunity so that non-Active initial statuses are validated.

    BR-OP-17: current_stage_order is the stage already saved before this save,
    new_stage_order the stage after it, and full_payment_confirmed the "full
    payment received" tick sent with it. Won needs the Opportunity to be saved
    at Payment Pending first (a separate, earlier save -- Basheer, 2026-10-03)
    and to stay there. All three default to refusing Won, so a caller that
    forgets them (including create) fails closed.
    """
    # BR-OP-09: cannot leave a terminal status
    if current_is_terminal:
        raise BusinessRuleViolation(
            f"Cannot change the status of a {current_status_code} opportunity."
        )

    # No-op: same status
    if new_status_code == current_status_code:
        return

    if new_status_code == "WON":
        if not po_number:
            raise BusinessRuleViolation(
                "PO Number is required to mark an opportunity as Won."
            )
        # Also catches an older Opportunity that reached Payment Pending
        # before the PO Date gate existed (Basheer, 2026-10-06).
        if not po_date:
            raise BusinessRuleViolation(
                "PO Date is required to mark an opportunity as Won."
            )
        if not has_items:
            raise BusinessRuleViolation(
                "At least one product must be confirmed to mark an opportunity as Won."
            )
        # BR-OP-17: Won only from the last stage, after full payment -- no
        # REPEAT_ORDER (BR-OP-13) or gate-override (BR-OP-14) exemption.
        if (
            current_stage_order is None
            or current_stage_order < _ORDER_PAYMENT_PENDING
            or new_stage_order is None
            or new_stage_order < _ORDER_PAYMENT_PENDING
        ):
            raise BusinessRuleViolation(
                "Save the Opportunity at the Payment Pending stage first, then mark it as Won."
            )
        if not full_payment_confirmed:
            raise BusinessRuleViolation(
                "Confirm that full payment has been received to mark this Opportunity as Won."
            )

    elif new_status_code == "LOST":
        if not loss_reason_id:
            raise BusinessRuleViolation(
                "Loss Reason is required to mark an opportunity as Lost."
            )
        if loss_reason_code == _COMPETITOR_WON and not competitor_name:
            raise BusinessRuleViolation(
                "Competitor Name is required when Loss Reason is 'Competitor Won'."
            )

    elif new_status_code == "ON_HOLD":
        if not hold_reason_id:
            raise BusinessRuleViolation(
                "Hold Reason is required to put an opportunity On-Hold."
            )
        if not reactivation_date:
            raise BusinessRuleViolation(
                "Reactivation Date is required to put an opportunity On-Hold."
            )
        if reactivation_date <= _today_ist():
            raise BusinessRuleViolation(
                "Reactivation Date must be a future date."
            )


def validate_po_date(po_date: date | None) -> None:
    """A PO already received can't be dated after today (IST) -- checked on
    every save that sends a PO Date, not only at the stage gates."""
    if po_date is not None and po_date > _today_ist():
        raise BusinessRuleViolation("PO Date can't be in the future.")


def validate_po_date_kept(
    *, previous_po_date: date | None, po_date: date | None, stage_order: int, status_code: str
) -> None:
    """Once an Opportunity is at Delivery or later, or Won, a PO Date it has
    can be corrected but not removed -- removing it would silently drop the
    Opportunity from Target vs Actuals' "PO received" (code review
    2026-10-06). Older records that never had one save as before."""
    if (
        previous_po_date is not None
        and po_date is None
        and (stage_order >= _ORDER_DELIVERY or status_code == "WON")
    ):
        raise BusinessRuleViolation(
            "PO Date can't be removed once the Opportunity is past the Order stage."
        )
