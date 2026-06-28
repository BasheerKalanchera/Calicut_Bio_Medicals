import uuid

from app.core.exceptions import NotFoundError
from app.domains.opportunity.models import Opportunity, OpportunityItem
from app.domains.opportunity.repository import OpportunityRepository
from app.domains.opportunity.schemas import OpportunityCreate, OpportunityItemCreate, OpportunityUpdate


class OpportunityService:
    def __init__(self, repository: OpportunityRepository):
        self.repository = repository

    def _require_account(self, account_id: uuid.UUID) -> None:
        if not self.repository.account_exists(account_id):
            raise NotFoundError(f"Account {account_id} not found")

    def list_by_account(self, account_id: uuid.UUID) -> list[Opportunity]:
        self._require_account(account_id)
        return self.repository.list_by_account(account_id)

    def create_opportunity(
        self,
        account_id: uuid.UUID,
        data: OpportunityCreate,
        *,
        created_by: uuid.UUID,
        sbu_id: uuid.UUID,
    ) -> Opportunity:
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
            created_by=created_by,
            updated_by=created_by,
        )
        opp = self.repository.create(opportunity)
        for item_data in data.items:
            self._create_item(opp.id, item_data, created_by=created_by)
        return opp

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
        for field, value in updates.items():
            setattr(opportunity, field, value)

        opportunity.updated_by = updated_by
        return self.repository.update(opportunity)

    # ------------------------------------------------------------------
    # Opportunity items
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
