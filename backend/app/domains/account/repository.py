import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session, noload

from app.db.base import BaseRepository
from app.domains.account.models import Account, Stakeholder
from app.domains.asset.models import InstalledAsset
from app.domains.opportunity.models import Opportunity
from app.domains.project.models import Project
from app.domains.reference.models import Zone


class AccountRepository(BaseRepository[Account]):
    def __init__(self, db: Session):
        super().__init__(Account, db)

    def list_accounts(
        self,
        *,
        offset: int = 0,
        limit: int = 50,
        search: str | None = None,
        zone_id: uuid.UUID | None = None,
    ) -> tuple[list[Account], int]:
        # For the directory listing we only need name + zone + payer_behavior.
        # The Account model has 7 lazy="selectin" relationships which each fire a separate
        # SQL round-trip to Supabase (~150ms each). Suppress them all with noload() so
        # the directory query runs in 2 queries (count + select) instead of 9+.
        stmt = (
            select(Account)
            .options(
                noload(Account.stakeholders),
                noload(Account.projects),
                noload(Account.opportunities),
                noload(Account.activities),
                noload(Account.installed_assets),
                noload(Account.documents),
                noload(Account.coverage_plan_entries),
                noload(Account.child_accounts),
            )
        )

        if search:
            stmt = stmt.where(Account.name.ilike(f"%{search}%"))
        if zone_id:
            stmt = stmt.where(Account.zone_id == zone_id)

        stmt = stmt.order_by(Account.name)

        total = self.db.scalar(
            select(func.count()).select_from(stmt.subquery())
        )
        results = list(
            self.db.scalars(stmt.offset(offset).limit(limit)).unique().all()
        )
        return results, total or 0

    def exists_by_name(self, name: str, *, exclude_id: uuid.UUID | None = None) -> bool:
        stmt = select(func.count()).where(func.lower(Account.name) == func.lower(name))
        if exclude_id:
            stmt = stmt.where(Account.id != exclude_id)
        return (self.db.scalar(stmt) or 0) > 0

    def get_account_with_counts(self, account_id: uuid.UUID):
        account = self.db.scalar(
            select(Account)
            .where(Account.id == account_id)
            .options(
                noload(Account.stakeholders),
                noload(Account.projects),
                noload(Account.opportunities),
                noload(Account.activities),
                noload(Account.installed_assets),
                noload(Account.documents),
                noload(Account.coverage_plan_entries),
                noload(Account.child_accounts),
            )
        )
        if not account:
            return None, None

        stakeholder_count = (
            select(func.count()).select_from(Stakeholder).where(Stakeholder.account_id == account_id).scalar_subquery()
        )
        project_count = (
            select(func.count()).select_from(Project).where(Project.account_id == account_id).scalar_subquery()
        )
        opportunity_count = (
            select(func.count()).select_from(Opportunity).where(Opportunity.account_id == account_id).scalar_subquery()
        )
        asset_count = (
            select(func.count()).select_from(InstalledAsset).where(InstalledAsset.account_id == account_id).scalar_subquery()
        )
        counts = self.db.execute(
            select(
                stakeholder_count.label("stakeholder_count"),
                project_count.label("project_count"),
                opportunity_count.label("opportunity_count"),
                asset_count.label("asset_count"),
            )
        ).first()
        return account, counts

    def zone_exists(self, zone_id: uuid.UUID) -> bool:
        return self.db.get(Zone, zone_id) is not None

    def account_exists(self, account_id: uuid.UUID) -> bool:
        return self.db.get(Account, account_id) is not None
