import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, noload

from app.db.base import BaseRepository
from app.domains.account.models import Account
from app.domains.asset.models import InstalledAsset


class InstalledAssetRepository(BaseRepository[InstalledAsset]):
    def __init__(self, db: Session):
        super().__init__(InstalledAsset, db)

    def list_by_account(self, account_id: uuid.UUID) -> list[InstalledAsset]:
        stmt = (
            select(InstalledAsset)
            .where(InstalledAsset.account_id == account_id)
            .options(noload(InstalledAsset.account))
            .order_by(InstalledAsset.installation_date)
        )
        return list(self.db.scalars(stmt).all())

    def get_for_update(self, asset_id: uuid.UUID) -> InstalledAsset | None:
        return self.db.scalar(
            select(InstalledAsset)
            .where(InstalledAsset.id == asset_id)
            .options(noload(InstalledAsset.account))
        )

    def account_exists(self, account_id: uuid.UUID) -> bool:
        return (self.db.scalar(select(1).where(Account.id == account_id)) or 0) > 0

    def product_exists(self, product_id: uuid.UUID) -> bool:
        from app.domains.product.models import Product
        return (self.db.scalar(select(1).where(Product.id == product_id)) or 0) > 0
