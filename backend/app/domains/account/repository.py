import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session, noload, selectinload

from app.db.base import BaseRepository
from app.domains.account.models import Account, Stakeholder
from app.domains.activity.models import Activity
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
        activity_count = (
            select(func.count()).select_from(Activity).where(Activity.account_id == account_id).scalar_subquery()
        )
        counts = self.db.execute(
            select(
                stakeholder_count.label("stakeholder_count"),
                project_count.label("project_count"),
                opportunity_count.label("opportunity_count"),
                asset_count.label("asset_count"),
                activity_count.label("activity_count"),
            )
        ).first()
        return account, counts

    def fetch_counts_for_accounts(self, account_ids: list[uuid.UUID]) -> dict[uuid.UUID, dict]:
        if not account_ids:
            return {}

        sh_map = {
            r.account_id: r.cnt
            for r in self.db.execute(
                select(Stakeholder.account_id, func.count().label("cnt"))
                .where(Stakeholder.account_id.in_(account_ids))
                .group_by(Stakeholder.account_id)
            ).all()
        }
        pr_map = {
            r.account_id: r.cnt
            for r in self.db.execute(
                select(Project.account_id, func.count().label("cnt"))
                .where(Project.account_id.in_(account_ids))
                .group_by(Project.account_id)
            ).all()
        }
        opp_map = {
            r.account_id: r.cnt
            for r in self.db.execute(
                select(Opportunity.account_id, func.count().label("cnt"))
                .where(Opportunity.account_id.in_(account_ids))
                .group_by(Opportunity.account_id)
            ).all()
        }
        ast_map = {
            r.account_id: r.cnt
            for r in self.db.execute(
                select(InstalledAsset.account_id, func.count().label("cnt"))
                .where(InstalledAsset.account_id.in_(account_ids))
                .group_by(InstalledAsset.account_id)
            ).all()
        }

        return {
            aid: {
                "stakeholder_count": sh_map.get(aid, 0),
                "project_count": pr_map.get(aid, 0),
                "opportunity_count": opp_map.get(aid, 0),
                "asset_count": ast_map.get(aid, 0),
            }
            for aid in account_ids
        }

    def get_for_update(self, account_id: uuid.UUID) -> "Account | None":
        return self.db.scalar(
            select(Account)
            .where(Account.id == account_id)
            .options(
                noload(Account.child_accounts),
                noload(Account.stakeholders),
                noload(Account.projects),
                noload(Account.opportunities),
                noload(Account.activities),
                noload(Account.installed_assets),
                noload(Account.documents),
                noload(Account.coverage_plan_entries),
            )
        )

    def get_for_workspace(self, account_id: uuid.UUID) -> "Account | None":
        return self.db.scalar(
            select(Account)
            .where(Account.id == account_id)
            .options(
                selectinload(Account.stakeholders),
                selectinload(Account.projects),
                selectinload(Account.opportunities),
                selectinload(Account.installed_assets),
                noload(Account.activities),
                noload(Account.documents),
                noload(Account.coverage_plan_entries),
                noload(Account.child_accounts),
            )
        )

    def zone_exists(self, zone_id: uuid.UUID) -> bool:
        return (self.db.scalar(select(func.count()).where(Zone.id == zone_id)) or 0) > 0

    def account_exists(self, account_id: uuid.UUID) -> bool:
        return (self.db.scalar(select(func.count()).where(Account.id == account_id)) or 0) > 0
