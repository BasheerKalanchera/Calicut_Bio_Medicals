import uuid
from decimal import Decimal

from app.core.exceptions import BusinessRuleViolation, NotFoundError
from app.domains.opportunity.models import Opportunity, OpportunityItem, OpportunityStakeholder, Split
from app.domains.opportunity.repository import OpportunityRepository
from app.domains.opportunity.schemas import (
    ItemsBulkUpdate,
    OpportunityCreate,
    OpportunityItemCreate,
    OpportunityUpdate,
    SplitsBulkUpdate,
    StakeholdersBulkUpdate,
)
from app.domains.opportunity.validators import validate_stage_transition, validate_status_transition


class OpportunityService:
    def __init__(self, repository: OpportunityRepository):
        self.repository = repository

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
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[Opportunity], int]:
        offset = (page - 1) * page_size
        items = self.repository.list_pipeline(
            account_id=account_id,
            stage_id=stage_id,
            status_id=status_id,
            owner_id=owner_id,
            offset=offset,
            limit=page_size,
        )
        total = self.repository.count_pipeline(
            account_id=account_id,
            stage_id=stage_id,
            status_id=status_id,
            owner_id=owner_id,
        )
        return items, total

    def list_by_account(self, account_id: uuid.UUID) -> list[Opportunity]:
        self._require_account(account_id)
        return self.repository.list_by_account(account_id)

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
    ) -> Opportunity:
        self._require_account(account_id)

        new_stage = self.repository.get_stage(data.stage_id)
        if not new_stage:
            raise NotFoundError(f"Stage {data.stage_id} not found")

        new_status = self.repository.get_status(data.status_id)
        if not new_status:
            raise NotFoundError(f"Status {data.status_id} not found")

        # BR-OP-00: gates apply even on creation at a non-Lead stage
        validate_stage_transition(
            new_stage_order=new_stage.display_order,
            current_stage_order=0,
            lead_source_id=data.lead_source_id,
            indicative_value=data.indicative_value,
            demo_start_date=data.demo_start_date,
            expected_closure_date=data.expected_closure_date,
            po_number=data.po_number,
            has_items=bool(data.items),
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
            sbu_id=sbu_id,
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
            created_by=created_by,
            updated_by=created_by,
        )
        opp = self.repository.create(opportunity)

        for item_data in data.items:
            self._create_item(opp.id, item_data, created_by=created_by)

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

        # Apply field updates
        for field, value in updates.items():
            setattr(opportunity, field, value)
        opportunity.updated_by = updated_by

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

        # BR-OP-00 / BR-OP-01: stage gate validation on advance
        if "stage_id" in updates:
            validate_stage_transition(
                new_stage_order=effective_stage.display_order,
                current_stage_order=current_stage_order,
                lead_source_id=opportunity.lead_source_id,
                indicative_value=opportunity.indicative_value,
                demo_start_date=opportunity.demo_start_date,
                expected_closure_date=opportunity.expected_closure_date,
                po_number=opportunity.po_number,
                has_items=has_items,
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
        if not self.repository.get_for_update(opportunity_id):
            raise NotFoundError(f"Opportunity {opportunity_id} not found")

        new_items = [
            OpportunityItem(
                opportunity_id=opportunity_id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price_lakhs=item.unit_price_lakhs,
                discount_lakhs=item.discount_lakhs,
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
        if not self.repository.get_for_update(opportunity_id):
            raise NotFoundError(f"Opportunity {opportunity_id} not found")

        if data.splits:
            total = sum(s.split_percentage for s in data.splits)
            if total != Decimal("100"):
                raise BusinessRuleViolation(
                    f"Split percentages must sum to 100% (got {total}%)."
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

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _require_account(self, account_id: uuid.UUID) -> None:
        if not self.repository.account_exists(account_id):
            raise NotFoundError(f"Account {account_id} not found")

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
            quantity=data.quantity,
            unit_price_lakhs=data.unit_price_lakhs,
            discount_lakhs=data.discount_lakhs,
            created_by=created_by,
            updated_by=created_by,
        )
        return self.repository.add_item(item)
