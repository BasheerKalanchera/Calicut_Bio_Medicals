import uuid
from decimal import Decimal

from sqlalchemy import func

from app.core.exceptions import (
    AuthorizationError,
    BusinessRuleViolation,
    ConflictError,
    NotFoundError,
)
from app.domains.notification.service import NotificationService
from app.domains.opportunity.models import Opportunity, OpportunityItem, OpportunityStakeholder, Split
from app.domains.opportunity.repository import OpportunityRepository
from app.domains.opportunity.schemas import (
    ItemsBulkUpdate,
    OpportunityCreate,
    OpportunityItemCreate,
    OpportunityUpdate,
    SplitsBulkUpdate,
    StakeholderLinkCreate,
    StakeholderLinkUpdate,
    StakeholdersBulkUpdate,
)
from app.domains.opportunity.validators import validate_stage_transition, validate_status_transition

# BR-OP-12: only these roles may create an Opportunity outside their own SBU.
_SBU_OVERRIDE_ROLES = {"Admin", "General Manager"}

# BR-OP-14: gate override approver must be the owner's own manager (holding
# this role) or, as an escalation path, any user holding the GM role.
_GATE_OVERRIDE_MANAGER_ROLE = "Area Manager"
_GATE_OVERRIDE_ESCALATION_ROLE = "General Manager"


class OpportunityService:
    def __init__(self, repository: OpportunityRepository, notification_service: NotificationService):
        self.repository = repository
        self.notification_service = notification_service

    # ------------------------------------------------------------------
    # Pipeline / list
    # ------------------------------------------------------------------

    def list_pipeline(
        self,
        *,
        account_id: uuid.UUID | None = None,
        stage_id: uuid.UUID | None = None,
        status_id: uuid.UUID | None = None,
        owner_id: uuid.UUID | None = None,
        zone_id: uuid.UUID | None = None,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[Opportunity], int]:
        offset = (page - 1) * page_size
        items = self.repository.list_pipeline(
            account_id=account_id,
            stage_id=stage_id,
            status_id=status_id,
            owner_id=owner_id,
            zone_id=zone_id,
            offset=offset,
            limit=page_size,
        )
        total = self.repository.count_pipeline(
            account_id=account_id,
            stage_id=stage_id,
            status_id=status_id,
            owner_id=owner_id,
            zone_id=zone_id,
        )
        return items, total

    def list_by_account(self, account_id: uuid.UUID) -> list[Opportunity]:
        self._require_account(account_id)
        return self.repository.list_by_account(account_id)

    def get_opportunity(self, opportunity_id: uuid.UUID) -> Opportunity:
        opportunity = self.repository.get_for_detail(opportunity_id)
        if opportunity is None:
            raise NotFoundError(f"Opportunity {opportunity_id} not found")
        return opportunity

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    def create_opportunity(
        self,
        account_id: uuid.UUID,
        data: OpportunityCreate,
        *,
        created_by: uuid.UUID,
        sbu_id: uuid.UUID,
        role_name: str | None = None,
    ) -> Opportunity:
        self._require_account(account_id)

        # BR-OP-12: caller's own SBU by default. Admin/General Manager have no
        # meaningful "own" SBU (their profile's sbu_id is a placeholder), so they must
        # always explicitly choose one -- never silently defaulted, even to a value that
        # happens to match their own placeholder.
        target_sbu_id = sbu_id
        if role_name in _SBU_OVERRIDE_ROLES:
            if data.sbu_id is None:
                raise BusinessRuleViolation(
                    "SBU is required to create an Opportunity as Admin or General Manager"
                )
            if not self.repository.sbu_exists(data.sbu_id):
                raise NotFoundError(f"SBU {data.sbu_id} not found")
            target_sbu_id = data.sbu_id
        elif data.sbu_id is not None and data.sbu_id != sbu_id:
            raise AuthorizationError(
                "Only Admin and General Manager roles can create an Opportunity outside their own SBU"
            )

        self._validate_item_sbus(
            target_sbu_id, {item.product_id for item in data.items if item.product_id is not None}
        )

        new_stage = self.repository.get_stage(data.stage_id)
        if not new_stage:
            raise NotFoundError(f"Stage {data.stage_id} not found")

        new_status = self.repository.get_status(data.status_id)
        if not new_status:
            raise NotFoundError(f"Status {data.status_id} not found")

        lead_source_name: str | None = None
        if data.lead_source_id:
            lead_source = self.repository.get_lead_source(data.lead_source_id)
            if lead_source:
                lead_source_name = lead_source.name

        if data.gate_override_approver_id is not None:
            self._validate_gate_override(data.owner_id, data.gate_override_approver_id)

        # BR-OP-00: gates apply even on creation at a non-Lead stage
        validate_stage_transition(
            new_stage_order=new_stage.display_order,
            current_stage_order=0,
            lead_source_id=data.lead_source_id,
            lead_source_name=lead_source_name,
            indicative_value=data.indicative_value,
            demo_start_date=data.demo_start_date,
            expected_closure_date=data.expected_closure_date,
            po_number=data.po_number,
            has_items=bool(data.items),
            gate_override_approver_id=data.gate_override_approver_id,
        )

        validate_status_transition(
            current_status_code="ACTIVE",
            current_is_terminal=False,
            new_status_code=new_status.status_code,
            loss_reason_id=None,
            loss_reason_code=None,
            competitor_name=None,
            hold_reason_id=None,
            reactivation_date=None,
            po_number=data.po_number,
            has_items=bool(data.items),
        )

        opportunity = Opportunity(
            account_id=account_id,
            sbu_id=target_sbu_id,
            name=data.name,
            owner_id=data.owner_id,
            stage_id=data.stage_id,
            status_id=data.status_id,
            win_probability=data.win_probability,
            project_id=data.project_id,
            lead_source_id=data.lead_source_id,
            indicative_value=data.indicative_value,
            expected_closure_date=data.expected_closure_date,
            demo_start_date=data.demo_start_date,
            demo_end_date=data.demo_end_date,
            po_number=data.po_number,
            referred_by_user_id=data.referred_by_user_id,
            referred_by_note=data.referred_by_note,
            gate_override_approver_id=data.gate_override_approver_id,
            gate_override_reason_id=data.gate_override_reason_id,
            gate_override_note=data.gate_override_note,
            gate_override_set_at=func.now() if data.gate_override_approver_id is not None else None,
            gate_override_set_by=created_by if data.gate_override_approver_id is not None else None,
            created_by=created_by,
            updated_by=created_by,
        )
        opp = self.repository.create(opportunity)

        for item_data in data.items:
            self._create_item(opp.id, item_data, created_by=created_by)

        if data.owner_id != created_by:
            self.notification_service.notify_opportunity_assigned(
                recipient_user_id=data.owner_id,
                opportunity_id=opp.id,
                actor_id=created_by,
                lead_source_name=lead_source_name,
            )

        if data.gate_override_approver_id is not None:
            self.notification_service.notify_gate_override_named(
                recipient_user_id=data.gate_override_approver_id,
                opportunity_id=opp.id,
                actor_id=created_by,
            )

        return opp

    # ------------------------------------------------------------------
    # Update (PATCH semantics — only provided fields are changed)
    # ------------------------------------------------------------------

    def update_opportunity(
        self,
        opportunity_id: uuid.UUID,
        data: OpportunityUpdate,
        *,
        updated_by: uuid.UUID,
    ) -> Opportunity:
        opportunity = self.repository.get_for_update(opportunity_id)
        if not opportunity:
            raise NotFoundError(f"Opportunity {opportunity_id} not found")

        updates = data.model_dump(exclude_unset=True)
        if not updates:
            return opportunity

        # Capture current state before applying updates
        current_stage = self.repository.get_stage(opportunity.stage_id)
        current_status = self.repository.get_status(opportunity.status_id)
        if not current_stage or not current_status:
            raise NotFoundError("Current stage or status not found")

        current_stage_order = current_stage.display_order
        current_status_code = current_status.status_code
        current_is_terminal = current_status.is_terminal

        # Captured before the setattr loop below overwrites it.
        previous_owner_id = opportunity.owner_id
        previous_gate_override_approver_id = opportunity.gate_override_approver_id

        # Apply field updates
        for field, value in updates.items():
            setattr(opportunity, field, value)
        opportunity.updated_by = updated_by

        # BR-OP-14: validate + stamp + notify only when this request actually
        # sets a *new* gate override approver (previously null, or changed to
        # a different approver) -- the frontend always resends
        # gate_override_approver_id once the checkbox is checked, so keying
        # off "field present in updates" alone (the original bug, fixed
        # 2026-08-27) re-stamped set_at/set_by -- and would have re-notified
        # the approver -- on every unrelated edit, not just the one that
        # actually set it.
        if (
            "gate_override_approver_id" in updates
            and opportunity.gate_override_approver_id is not None
            and opportunity.gate_override_approver_id != previous_gate_override_approver_id
        ):
            self._validate_gate_override(opportunity.owner_id, opportunity.gate_override_approver_id)
            opportunity.gate_override_set_at = func.now()
            opportunity.gate_override_set_by = updated_by
            self.notification_service.notify_gate_override_named(
                recipient_user_id=opportunity.gate_override_approver_id,
                opportunity_id=opportunity.id,
                actor_id=updated_by,
            )

        # Opportunity-assignment notification: fires only on an actual
        # reassignment to someone else -- not a no-op re-save of the same
        # owner, not an explicit-null owner_id (schema allows it but the
        # column is NOT NULL; the update itself will fail below), and not
        # the actor assigning it to themselves.
        new_owner_id = updates.get("owner_id")
        if (
            new_owner_id is not None
            and new_owner_id != previous_owner_id
            and new_owner_id != updated_by
        ):
            lead_source_name: str | None = None
            if opportunity.lead_source_id:
                lead_source = self.repository.get_lead_source(opportunity.lead_source_id)
                if lead_source:
                    lead_source_name = lead_source.name
            self.notification_service.notify_opportunity_assigned(
                recipient_user_id=new_owner_id,
                opportunity_id=opportunity.id,
                actor_id=updated_by,
                lead_source_name=lead_source_name,
            )

        # Resolve effective stage and status after updates
        effective_stage = (
            self.repository.get_stage(opportunity.stage_id) if "stage_id" in updates
            else current_stage
        )
        effective_status = (
            self.repository.get_status(opportunity.status_id) if "status_id" in updates
            else current_status
        )
        if not effective_stage:
            raise NotFoundError(f"Stage {opportunity.stage_id} not found")
        if not effective_status:
            raise NotFoundError(f"Status {opportunity.status_id} not found")

        has_items = self.repository.has_items(opportunity_id)

        lead_source_name: str | None = None
        if opportunity.lead_source_id:
            lead_source = self.repository.get_lead_source(opportunity.lead_source_id)
            if lead_source:
                lead_source_name = lead_source.name

        # BR-OP-00 / BR-OP-01: stage gate validation on advance
        if "stage_id" in updates:
            validate_stage_transition(
                new_stage_order=effective_stage.display_order,
                current_stage_order=current_stage_order,
                lead_source_id=opportunity.lead_source_id,
                lead_source_name=lead_source_name,
                indicative_value=opportunity.indicative_value,
                demo_start_date=opportunity.demo_start_date,
                expected_closure_date=opportunity.expected_closure_date,
                po_number=opportunity.po_number,
                has_items=has_items,
                gate_override_approver_id=opportunity.gate_override_approver_id,
            )

        # BR-OP-14 (2026-08-27 fix): a save that *clears* the override must
        # not let the deal silently keep sitting at a stage whose gates it
        # never actually satisfied without the waiver -- gates only fire on
        # a forward stage move (validate_stage_transition returns immediately
        # when new_stage_order <= current_stage_order), so without this, an
        # uncheck-and-save at an already-reached stage sailed through even
        # with the required date still blank, erasing the one audit signal
        # (the named approver) that a shortcut was ever taken while keeping
        # its effect. Re-check the *current* effective stage's cumulative
        # gates as if arriving there fresh (current_stage_order=0, same
        # pattern create_opportunity uses for a brand-new Opportunity created
        # directly at a non-Lead stage), now that the override is gone. Only
        # the clear transition needs this -- a genuine forward move is
        # already checked above, and every other save (override staying set,
        # staying unset) doesn't change what exemption applies.
        if (
            "gate_override_approver_id" in updates
            and previous_gate_override_approver_id is not None
            and opportunity.gate_override_approver_id is None
        ):
            validate_stage_transition(
                new_stage_order=effective_stage.display_order,
                current_stage_order=0,
                lead_source_id=opportunity.lead_source_id,
                lead_source_name=lead_source_name,
                indicative_value=opportunity.indicative_value,
                demo_start_date=opportunity.demo_start_date,
                expected_closure_date=opportunity.expected_closure_date,
                po_number=opportunity.po_number,
                has_items=has_items,
                gate_override_approver_id=None,
            )

        # BR-OP-02 / BR-OP-03 / BR-OP-05 / BR-OP-09: status transition validation
        if "status_id" in updates:
            loss_reason_code: str | None = None
            if opportunity.loss_reason_id:
                loss_reason = self.repository.get_loss_reason(opportunity.loss_reason_id)
                if loss_reason:
                    loss_reason_code = loss_reason.reason_code

            validate_status_transition(
                current_status_code=current_status_code,
                current_is_terminal=current_is_terminal,
                new_status_code=effective_status.status_code,
                loss_reason_id=opportunity.loss_reason_id,
                loss_reason_code=loss_reason_code,
                competitor_name=opportunity.competitor_name,
                hold_reason_id=opportunity.hold_reason_id,
                reactivation_date=opportunity.reactivation_date,
                po_number=opportunity.po_number,
                has_items=has_items,
            )

        return self.repository.update(opportunity)

    # ------------------------------------------------------------------
    # Items
    # ------------------------------------------------------------------

    def list_items(self, opportunity_id: uuid.UUID) -> list[OpportunityItem]:
        return self.repository.list_items(opportunity_id)

    def add_item(
        self,
        opportunity_id: uuid.UUID,
        data: OpportunityItemCreate,
        *,
        created_by: uuid.UUID,
    ) -> OpportunityItem:
        opportunity = self.repository.get_for_update(opportunity_id)
        if not opportunity:
            raise NotFoundError(f"Opportunity {opportunity_id} not found")
        self._validate_item_sbus(
            opportunity.sbu_id, {data.product_id} if data.product_id is not None else set()
        )
        return self._create_item(opportunity_id, data, created_by=created_by)

    def delete_item(self, item_id: uuid.UUID) -> None:
        item = self.repository.get_item(item_id)
        if not item:
            raise NotFoundError(f"Opportunity item {item_id} not found")
        self.repository.delete_item(item)

    def replace_items(
        self,
        opportunity_id: uuid.UUID,
        data: ItemsBulkUpdate,
        *,
        updated_by: uuid.UUID,
    ) -> list[OpportunityItem]:
        opportunity = self.repository.get_for_update(opportunity_id)
        if not opportunity:
            raise NotFoundError(f"Opportunity {opportunity_id} not found")
        self._validate_item_sbus(
            opportunity.sbu_id, {item.product_id for item in data.items if item.product_id is not None}
        )

        new_items = [
            OpportunityItem(
                opportunity_id=opportunity_id,
                product_id=item.product_id,
                description=item.description,
                quantity=item.quantity,
                unit_price_lakhs=item.unit_price_lakhs,
                discount_lakhs=item.discount_lakhs,
                line_type=item.line_type,
                created_by=updated_by,
                updated_by=updated_by,
            )
            for item in data.items
        ]
        return self.repository.replace_items(opportunity_id, new_items)

    # ------------------------------------------------------------------
    # Splits
    # ------------------------------------------------------------------

    def list_splits(self, opportunity_id: uuid.UUID) -> list[Split]:
        return self.repository.list_splits(opportunity_id)

    def replace_splits(
        self,
        opportunity_id: uuid.UUID,
        data: SplitsBulkUpdate,
        *,
        updated_by: uuid.UUID,
    ) -> list[Split]:
        opportunity = self.repository.get_for_update(opportunity_id)
        if not opportunity:
            raise NotFoundError(f"Opportunity {opportunity_id} not found")

        if data.splits:
            total = sum(s.split_percentage for s in data.splits)
            if total != Decimal("100"):
                raise BusinessRuleViolation(
                    f"Split percentages must sum to 100% (got {total}%)."
                )

        # ADR-037 (Business-Rules.md BR-FIN-06): cross-SBU splits on a single
        # Opportunity are no longer supported -- multi-SBU deals are modeled via
        # Project-linked, per-SBU Opportunities instead. Only newly-added
        # participants are checked; participants already on the opportunity before
        # this call are grandfathered, since replace_splits re-submits the full
        # list on every save and a legacy cross-SBU row would otherwise block all
        # future edits to that opportunity's splits, not just new additions.
        existing_user_ids = {s.user_id for s in self.repository.list_splits(opportunity_id)}
        new_user_ids = {s.user_id for s in data.splits} - existing_user_ids
        if new_user_ids:
            sbu_by_user = self.repository.get_user_sbu_ids(new_user_ids)
            for user_id in new_user_ids:
                if sbu_by_user.get(user_id) != opportunity.sbu_id:
                    raise BusinessRuleViolation(
                        f"User {user_id} is not in this Opportunity's SBU; "
                        "split participants must belong to the same SBU as the Opportunity."
                    )

        new_splits = [
            Split(
                opportunity_id=opportunity_id,
                user_id=s.user_id,
                split_percentage=s.split_percentage,
                created_by=updated_by,
                updated_by=updated_by,
            )
            for s in data.splits
        ]
        return self.repository.replace_splits(opportunity_id, new_splits)

    # ------------------------------------------------------------------
    # Stakeholders
    # ------------------------------------------------------------------

    def list_stakeholders(self, opportunity_id: uuid.UUID) -> list[OpportunityStakeholder]:
        return self.repository.list_opportunity_stakeholders(opportunity_id)

    def replace_stakeholders(
        self,
        opportunity_id: uuid.UUID,
        data: StakeholdersBulkUpdate,
        *,
        updated_by: uuid.UUID,
    ) -> list[OpportunityStakeholder]:
        if not self.repository.get_for_update(opportunity_id):
            raise NotFoundError(f"Opportunity {opportunity_id} not found")

        new_links = [
            OpportunityStakeholder(
                opportunity_id=opportunity_id,
                stakeholder_id=link.stakeholder_id,
                influence_level=link.influence_level,
                decision_role=link.decision_role,
                notes=link.notes,
                created_by=updated_by,
                updated_by=updated_by,
            )
            for link in data.stakeholders
        ]
        return self.repository.replace_stakeholders(opportunity_id, new_links)

    def add_stakeholder(
        self,
        opportunity_id: uuid.UUID,
        data: StakeholderLinkCreate,
        *,
        created_by: uuid.UUID,
    ) -> OpportunityStakeholder:
        if not self.repository.get_for_update(opportunity_id):
            raise NotFoundError(f"Opportunity {opportunity_id} not found")
        if self.repository.get_stakeholder_link(opportunity_id, data.stakeholder_id):
            raise ConflictError(
                f"Stakeholder {data.stakeholder_id} is already linked to opportunity {opportunity_id}"
            )

        link = OpportunityStakeholder(
            opportunity_id=opportunity_id,
            stakeholder_id=data.stakeholder_id,
            influence_level=data.influence_level,
            decision_role=data.decision_role,
            notes=data.notes,
            created_by=created_by,
            updated_by=created_by,
        )
        return self.repository.add_stakeholder(link)

    def remove_stakeholder(self, opportunity_id: uuid.UUID, stakeholder_id: uuid.UUID) -> None:
        link = self.repository.get_stakeholder_link(opportunity_id, stakeholder_id)
        if not link:
            raise NotFoundError(
                f"Stakeholder {stakeholder_id} is not linked to opportunity {opportunity_id}"
            )
        self.repository.delete_stakeholder(link)

    def update_stakeholder(
        self,
        opportunity_id: uuid.UUID,
        stakeholder_id: uuid.UUID,
        data: StakeholderLinkUpdate,
        *,
        updated_by: uuid.UUID,
    ) -> OpportunityStakeholder:
        link = self.repository.get_stakeholder_link(opportunity_id, stakeholder_id)
        if not link:
            raise NotFoundError(
                f"Stakeholder {stakeholder_id} is not linked to opportunity {opportunity_id}"
            )
        updates = data.model_dump(exclude_unset=True)
        for field, value in updates.items():
            setattr(link, field, value)
        link.updated_by = updated_by
        return self.repository.update_stakeholder_link(link)

    # ------------------------------------------------------------------
    # Stakeholder -> opportunities (reverse linkage, Customer 360 bridge list)
    # ------------------------------------------------------------------

    def list_opportunities_for_stakeholder(self, stakeholder_id: uuid.UUID) -> list[Opportunity]:
        return self.repository.list_opportunities_for_stakeholder(stakeholder_id)

    def get_opportunity_counts_for_stakeholders(
        self, stakeholder_ids: list[uuid.UUID]
    ) -> dict[uuid.UUID, int]:
        return self.repository.count_opportunities_grouped_by_stakeholder_ids(stakeholder_ids)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _require_account(self, account_id: uuid.UUID) -> None:
        if not self.repository.account_exists(account_id):
            raise NotFoundError(f"Account {account_id} not found")

    def _validate_item_sbus(
        self, opportunity_sbu_id: uuid.UUID, product_ids: set[uuid.UUID]
    ) -> None:
        # BR-OP-11: a Product can only be added to an Opportunity in its own
        # SBU. Mirrors BR-FIN-06's split-participant SBU check (replace_splits,
        # above) -- same reasoning, applied to catalog items instead of split
        # participants. Unlike BR-FIN-06 there is no grandfathering concern
        # here: items are validated on every add/replace, not just "newly
        # added" ones, since (unlike splits) there's no legacy cross-SBU data
        # this would need to tolerate.
        if not product_ids:
            return
        sbu_by_product = self.repository.get_product_sbu_ids(product_ids)
        for product_id in product_ids:
            if sbu_by_product.get(product_id) != opportunity_sbu_id:
                raise BusinessRuleViolation(
                    f"Product {product_id} is not in this Opportunity's SBU; "
                    "products must belong to the same SBU as the Opportunity."
                )

    def _validate_gate_override(self, owner_id: uuid.UUID, approver_id: uuid.UUID) -> None:
        # BR-OP-14: approver must satisfy one of two paths -- the owner's own
        # manager (holding Area Manager), or any General Manager as an
        # escalation path for when that manager is unavailable, with no
        # reporting-line check for the escalation path.
        approver_role_name = self.repository.get_user_role_name(approver_id)

        if approver_role_name == _GATE_OVERRIDE_ESCALATION_ROLE:
            return

        manager_id = self.repository.get_owner_manager_id(owner_id)
        if manager_id is None or approver_id != manager_id:
            raise AuthorizationError(
                "Gate override approver must be the opportunity owner's immediate manager, or a General Manager."
            )
        if approver_role_name != _GATE_OVERRIDE_MANAGER_ROLE:
            raise AuthorizationError("Gate override approver must hold the Area Manager role.")

    def _create_item(
        self,
        opportunity_id: uuid.UUID,
        data: OpportunityItemCreate,
        *,
        created_by: uuid.UUID,
    ) -> OpportunityItem:
        item = OpportunityItem(
            opportunity_id=opportunity_id,
            product_id=data.product_id,
            description=data.description,
            quantity=data.quantity,
            unit_price_lakhs=data.unit_price_lakhs,
            discount_lakhs=data.discount_lakhs,
            line_type=data.line_type,
            created_by=created_by,
            updated_by=created_by,
        )
        return self.repository.add_item(item)
