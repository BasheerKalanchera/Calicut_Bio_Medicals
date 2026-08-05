"""
Stage gate (BR-OP-00, BR-OP-01) and status transition (BR-OP-02, BR-OP-03, BR-OP-05, BR-OP-09)
validators.  Pure functions — no DB access.  The service loads reference data and passes it in.
"""

import uuid
from datetime import date
from decimal import Decimal

from app.core.exceptions import BusinessRuleViolation

# Loss reason code that mandates competitor_name
_COMPETITOR_WON = "COMPETITOR_WON"

# Stage display_order thresholds (from Seed-Data.sql)
_ORDER_QUALIFIED = 20
_ORDER_DEMO = 30
# _ORDER_CLINICAL_EVAL = 40  gates deferred: demo_outcome / clinical fields not in schema
_ORDER_NEGOTIATION = 50
_ORDER_ORDER = 60
_ORDER_DELIVERY = 70


_REORDER_LEAD_SOURCE = "REORDER"


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
) -> None:
    """
    Enforce exit criteria when advancing to a new stage.

    Pass current_stage_order=0 when creating an opportunity at a non-Lead stage
    so that all gates between Lead and the initial stage are checked (BR-OP-00).

    Backward movement (new_stage_order <= current_stage_order) is always allowed.
    """
    if new_stage_order <= current_stage_order:
        return

    # BR-OP-13: a Reorder deal (customer buying the exact same equipment again,
    # price pre-negotiated off a prior PO) never has a fresh demo or negotiation --
    # those two gates don't apply. Order Value and Product Details (the Negotiation ->
    # Order gate below) still do, unchanged.
    is_reorder = lead_source_name == _REORDER_LEAD_SOURCE

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
    if current_stage_order < _ORDER_DEMO <= new_stage_order:
        if not is_reorder and not demo_start_date:
            raise BusinessRuleViolation(
                "Demo Start Date is required to advance to Demo stage."
            )

    # Gate: Demo → Clinical Evaluation (order=40)
    # demo_outcome, clinical_contact, and clinical_evaluation_start_date are not
    # in the current schema — gate enforcement deferred to a future sprint.

    # Gate: Clinical Evaluation → Negotiation
    if current_stage_order < _ORDER_NEGOTIATION <= new_stage_order:
        if not is_reorder and not expected_closure_date:
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
) -> None:
    """
    Enforce status transition rules (BR-OP-02, BR-OP-03, BR-OP-05, BR-OP-09).

    Pass current_status_code="ACTIVE" and current_is_terminal=False when creating
    an opportunity so that non-Active initial statuses are validated.
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
        if not has_items:
            raise BusinessRuleViolation(
                "At least one product must be confirmed to mark an opportunity as Won."
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
        if reactivation_date <= date.today():
            raise BusinessRuleViolation(
                "Reactivation Date must be a future date."
            )
