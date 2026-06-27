import uuid

from app.core.exceptions import BusinessRuleViolation, NotFoundError
from app.domains.asset.models import InstalledAsset
from app.domains.asset.repository import InstalledAssetRepository
from app.domains.asset.schemas import InstalledAssetCreate, InstalledAssetUpdate


class InstalledAssetService:
    def __init__(self, repository: InstalledAssetRepository):
        self.repository = repository

    def list_by_account(self, account_id: uuid.UUID) -> list[InstalledAsset]:
        if not self.repository.account_exists(account_id):
            raise NotFoundError(f"Account {account_id} not found")
        return self.repository.list_by_account(account_id)

    def create_installed_asset(
        self,
        account_id: uuid.UUID,
        data: InstalledAssetCreate,
        *,
        created_by: uuid.UUID,
    ) -> InstalledAsset:
        if not self.repository.account_exists(account_id):
            raise NotFoundError(f"Account {account_id} not found")
        if not data.is_competitor_equipment and data.product_id:
            if not self.repository.product_exists(data.product_id):
                raise NotFoundError(f"Product {data.product_id} not found")
        asset = InstalledAsset(
            account_id=account_id,
            product_id=data.product_id,
            is_competitor_equipment=data.is_competitor_equipment,
            competitor_product_name=data.competitor_product_name,
            installation_date=data.installation_date,
            department=data.department,
            created_by=created_by,
            updated_by=created_by,
        )
        return self.repository.create(asset)

    def update_installed_asset(
        self,
        asset_id: uuid.UUID,
        data: InstalledAssetUpdate,
        *,
        updated_by: uuid.UUID,
    ) -> InstalledAsset:
        asset = self.repository.get_for_update(asset_id)
        if not asset:
            raise NotFoundError(f"Installed asset {asset_id} not found")

        updates = data.model_dump(exclude_unset=True)
        for field, value in updates.items():
            setattr(asset, field, value)

        if not asset.is_competitor_equipment and asset.product_id is None:
            raise BusinessRuleViolation("product_id is required when not competitor equipment")

        asset.updated_by = updated_by
        return self.repository.update(asset)
