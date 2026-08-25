import uuid

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session, noload

from app.db.base import BaseRepository
from app.domains.account.models import Account
from app.domains.opportunity.models import Opportunity, OpportunityItem, OpportunityStakeholder, Split
from app.domains.organization.models import UserProfile
from app.domains.product.models import Product
from app.domains.reference.models import (
    LeadSource,
    LossReason,
    OpportunityStage,
    OpportunityStatus,
    Role,
    ZoneClosure,
)


class OpportunityRepository(BaseRepository[Opportunity]):
    def __init__(self, db: Session):
        super().__init__(Opportunity, db)

    # ------------------------------------------------------------------
    # Reference data lookups (cached in SQLAlchemy identity map)
    # ------------------------------------------------------------------

    def get_stage(self, stage_id: uuid.UUID) -> OpportunityStage | None:
        return self.db.get(OpportunityStage, stage_id)

    def get_status(self, status_id: uuid.UUID) -> OpportunityStatus | None:
        return self.db.get(OpportunityStatus, status_id)

    def get_loss_reason(self, loss_reason_id: uuid.UUID) -> LossReason | None:
        return self.db.get(LossReason, loss_reason_id)

    def get_lead_source(self, lead_source_id: uuid.UUID) -> LeadSource | None:
        return self.db.get(LeadSource, lead_source_id)

    # ------------------------------------------------------------------
    # Gate override approver validation (BR-OP-14)
    # ------------------------------------------------------------------

    def get_owner_manager_id(self, owner_id: uuid.UUID) -> uuid.UUID | None:
        return self.db.scalar(select(UserProfile.manager_id).where(UserProfile.id == owner_id))

    def get_user_role_name(self, user_id: uuid.UUID) -> str | None:
        return self.db.scalar(
            select(Role.role_name).join(UserProfile, UserProfile.role_id == Role.id).where(UserProfile.id == user_id)
        )

    # ------------------------------------------------------------------
    # Account existence check
    # ------------------------------------------------------------------

    def account_exists(self, account_id: uuid.UUID) -> bool:
        return (self.db.scalar(select(1).where(Account.id == account_id)) or 0) > 0

    def sbu_exists(self, sbu_id: uuid.UUID) -> bool:
        from app.domains.reference.models import SBU

        return self.db.get(SBU, sbu_id) is not None

    # ------------------------------------------------------------------
    # Pipeline list (serves both Kanban and List views)
    # ------------------------------------------------------------------

    def list_pipeline(
        self,
        *,
        account_id: uuid.UUID | None = None,
        stage_id: uuid.UUID | None = None,
        status_id: uuid.UUID | None = None,
        owner_id: uuid.UUID | None = None,
        zone_id: uuid.UUID | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> list[Opportunity]:
        stmt = (
            select(Opportunity)
            .options(
                # noload the lazy="select" (heavy) relationships
                noload(Opportunity.opportunity_stakeholders),
                noload(Opportunity.splits),
                noload(Opportunity.items),
                noload(Opportunity.activities),
                noload(Opportunity.documents),
                # noload joined relationships not needed for pipeline cards
                noload(Opportunity.loss_reason),
                noload(Opportunity.hold_reason),
            )
        )
        if zone_id:
            # Opportunity has no zone_id of its own -- zone lives one hop away via
            # account_id -> account.zone_id, so this filter needs a join. Applied
            # only when zone_id is actually passed, so the unfiltered case stays
            # exactly as cheap as it is today. Matches the zone itself plus every
            # zone beneath it (e.g. picking "Kerala" also returns opportunities
            # for accounts tagged Kozhikode, Kottayam, etc.)
            descendant_ids = select(ZoneClosure.descendant_zone_id).where(
                ZoneClosure.ancestor_zone_id == zone_id
            )
            stmt = stmt.join(Account, Opportunity.account_id == Account.id).where(
                Account.zone_id.in_(descendant_ids)
            )
        if account_id:
            stmt = stmt.where(Opportunity.account_id == account_id)
        if stage_id:
            stmt = stmt.where(Opportunity.stage_id == stage_id)
        if status_id:
            stmt = stmt.where(Opportunity.status_id == status_id)
        if owner_id:
            stmt = stmt.where(Opportunity.owner_id == owner_id)
        stmt = stmt.order_by(Opportunity.created_at.desc()).offset(offset).limit(limit)
        return list(self.db.scalars(stmt).unique().all())

    def count_pipeline(
        self,
        *,
        account_id: uuid.UUID | None = None,
        stage_id: uuid.UUID | None = None,
        status_id: uuid.UUID | None = None,
        owner_id: uuid.UUID | None = None,
        zone_id: uuid.UUID | None = None,
    ) -> int:
        stmt = select(func.count(Opportunity.id))
        if zone_id:
            descendant_ids = select(ZoneClosure.descendant_zone_id).where(
                ZoneClosure.ancestor_zone_id == zone_id
            )
            stmt = stmt.join(Account, Opportunity.account_id == Account.id).where(
                Account.zone_id.in_(descendant_ids)
            )
        if account_id:
            stmt = stmt.where(Opportunity.account_id == account_id)
        if stage_id:
            stmt = stmt.where(Opportunity.stage_id == stage_id)
        if status_id:
            stmt = stmt.where(Opportunity.status_id == status_id)
        if owner_id:
            stmt = stmt.where(Opportunity.owner_id == owner_id)
        return self.db.scalar(stmt) or 0

    # ------------------------------------------------------------------
    # Single-opportunity detail (opens Opportunity Detail from any entry
    # point that only has an id — e.g. Reminder click-through)
    # ------------------------------------------------------------------

    def get_for_detail(self, opportunity_id: uuid.UUID) -> "Opportunity | None":
        return self.db.scalar(
            select(Opportunity)
            .where(Opportunity.id == opportunity_id)
            .options(
                # Same eager-load profile as list_pipeline — this feeds the
                # same PipelineOpportunity schema.
                noload(Opportunity.opportunity_stakeholders),
                noload(Opportunity.splits),
                noload(Opportunity.items),
                noload(Opportunity.activities),
                noload(Opportunity.documents),
                noload(Opportunity.loss_reason),
                noload(Opportunity.hold_reason),
            )
        )

    # ------------------------------------------------------------------
    # Account-scoped list (Customer 360 tab)
    # ------------------------------------------------------------------

    def list_by_account(self, account_id: uuid.UUID) -> list[Opportunity]:
        stmt = (
            select(Opportunity)
            .where(Opportunity.account_id == account_id)
            .options(
                noload(Opportunity.account),
                noload(Opportunity.project),
                noload(Opportunity.lead_source),
                noload(Opportunity.loss_reason),
                noload(Opportunity.hold_reason),
                noload(Opportunity.opportunity_stakeholders),
                noload(Opportunity.splits),
                noload(Opportunity.items),
                noload(Opportunity.activities),
                noload(Opportunity.documents),
            )
            .order_by(Opportunity.name)
        )
        return list(self.db.scalars(stmt).unique().all())

    # ------------------------------------------------------------------
    # Write path
    # ------------------------------------------------------------------

    def get_for_update(self, opportunity_id: uuid.UUID) -> "Opportunity | None":
        return self.db.scalar(
            select(Opportunity)
            .where(Opportunity.id == opportunity_id)
            .options(
                noload(Opportunity.account),
                noload(Opportunity.project),
                noload(Opportunity.owner),
                noload(Opportunity.stage),
                noload(Opportunity.status),
                noload(Opportunity.lead_source),
                noload(Opportunity.loss_reason),
                noload(Opportunity.hold_reason),
                noload(Opportunity.opportunity_stakeholders),
                noload(Opportunity.splits),
                noload(Opportunity.items),
                noload(Opportunity.activities),
                noload(Opportunity.documents),
            )
        )

    # ------------------------------------------------------------------
    # Items
    # ------------------------------------------------------------------

    def has_items(self, opportunity_id: uuid.UUID) -> bool:
        count = self.db.scalar(
            select(func.count(OpportunityItem.id)).where(
                OpportunityItem.opportunity_id == opportunity_id
            )
        )
        return (count or 0) > 0

    def list_items(self, opportunity_id: uuid.UUID) -> list[OpportunityItem]:
        return list(
            self.db.scalars(
                select(OpportunityItem).where(OpportunityItem.opportunity_id == opportunity_id)
            ).unique().all()
        )

    def get_item(self, item_id: uuid.UUID) -> "OpportunityItem | None":
        return self.db.get(OpportunityItem, item_id)

    def add_item(self, item: OpportunityItem) -> OpportunityItem:
        self.db.add(item)
        self.db.flush()
        self.db.refresh(item)
        return item

    def delete_item(self, item: OpportunityItem) -> None:
        self.db.delete(item)
        self.db.flush()

    def replace_items(
        self, opportunity_id: uuid.UUID, new_items: list[OpportunityItem]
    ) -> list[OpportunityItem]:
        self.db.execute(
            delete(OpportunityItem).where(OpportunityItem.opportunity_id == opportunity_id)
        )
        for item in new_items:
            self.db.add(item)
        self.db.flush()
        # Re-query so product relationship (lazy="joined") is loaded for the response
        return list(
            self.db.scalars(
                select(OpportunityItem).where(OpportunityItem.opportunity_id == opportunity_id)
            ).unique().all()
        )

    # ------------------------------------------------------------------
    # Splits
    # ------------------------------------------------------------------

    def list_splits(self, opportunity_id: uuid.UUID) -> list[Split]:
        return list(
            self.db.scalars(
                select(Split).where(Split.opportunity_id == opportunity_id)
            ).all()
        )

    def get_user_sbu_ids(self, user_ids: set[uuid.UUID]) -> dict[uuid.UUID, uuid.UUID]:
        if not user_ids:
            return {}
        rows = self.db.execute(
            select(UserProfile.id, UserProfile.sbu_id).where(UserProfile.id.in_(user_ids))
        ).all()
        return {row.id: row.sbu_id for row in rows}

    def get_product_sbu_ids(self, product_ids: set[uuid.UUID]) -> dict[uuid.UUID, uuid.UUID]:
        if not product_ids:
            return {}
        rows = self.db.execute(
            select(Product.id, Product.sbu_id).where(Product.id.in_(product_ids))
        ).all()
        return {row.id: row.sbu_id for row in rows}

    def replace_splits(
        self, opportunity_id: uuid.UUID, new_splits: list[Split]
    ) -> list[Split]:
        self.db.execute(delete(Split).where(Split.opportunity_id == opportunity_id))
        for split in new_splits:
            self.db.add(split)
        self.db.flush()
        # Re-query so user relationship (lazy="joined") is loaded for the response
        return list(
            self.db.scalars(
                select(Split).where(Split.opportunity_id == opportunity_id)
            ).all()
        )

    # ------------------------------------------------------------------
    # Stakeholders
    # ------------------------------------------------------------------

    def list_opportunity_stakeholders(
        self, opportunity_id: uuid.UUID
    ) -> list[OpportunityStakeholder]:
        return list(
            self.db.scalars(
                select(OpportunityStakeholder).where(
                    OpportunityStakeholder.opportunity_id == opportunity_id
                )
            ).all()
        )

    def replace_stakeholders(
        self, opportunity_id: uuid.UUID, new_links: list[OpportunityStakeholder]
    ) -> list[OpportunityStakeholder]:
        # Deletes and reinserts every link, so every already-linked stakeholder
        # gets a fresh created_at/created_by on every call — corrupts the audit
        # trail if used for a partial update (add/remove/edit one link). No
        # current caller; use add_stakeholder/delete_stakeholder/
        # update_stakeholder_link for single-item operations instead.
        self.db.execute(
            delete(OpportunityStakeholder).where(
                OpportunityStakeholder.opportunity_id == opportunity_id
            )
        )
        for link in new_links:
            self.db.add(link)
        self.db.flush()
        return list(
            self.db.scalars(
                select(OpportunityStakeholder).where(
                    OpportunityStakeholder.opportunity_id == opportunity_id
                )
            ).all()
        )

    def get_stakeholder_link(
        self, opportunity_id: uuid.UUID, stakeholder_id: uuid.UUID
    ) -> "OpportunityStakeholder | None":
        return self.db.get(OpportunityStakeholder, (opportunity_id, stakeholder_id))

    def add_stakeholder(self, link: OpportunityStakeholder) -> OpportunityStakeholder:
        self.db.add(link)
        self.db.flush()
        self.db.refresh(link)
        return link

    def delete_stakeholder(self, link: OpportunityStakeholder) -> None:
        self.db.delete(link)
        self.db.flush()

    def update_stakeholder_link(self, link: OpportunityStakeholder) -> OpportunityStakeholder:
        self.db.flush()
        self.db.refresh(link)
        return link

    # ------------------------------------------------------------------
    # Stakeholder -> opportunities (reverse linkage, Customer 360 bridge list)
    # ------------------------------------------------------------------

    def list_opportunities_for_stakeholder(self, stakeholder_id: uuid.UUID) -> list[Opportunity]:
        stmt = (
            select(Opportunity)
            .join(OpportunityStakeholder, OpportunityStakeholder.opportunity_id == Opportunity.id)
            .where(OpportunityStakeholder.stakeholder_id == stakeholder_id)
            .options(
                # stage/status stay eager (lazy="joined" on the model) — needed
                # by OpportunityForStakeholder. Everything else this response
                # doesn't use gets noloaded, same profile as list_by_account.
                noload(Opportunity.account),
                noload(Opportunity.sbu),
                noload(Opportunity.project),
                noload(Opportunity.owner),
                noload(Opportunity.lead_source),
                noload(Opportunity.loss_reason),
                noload(Opportunity.hold_reason),
                noload(Opportunity.opportunity_stakeholders),
                noload(Opportunity.splits),
                noload(Opportunity.items),
                noload(Opportunity.activities),
                noload(Opportunity.documents),
            )
            .order_by(Opportunity.name)
        )
        return list(self.db.scalars(stmt).unique().all())

    def count_opportunities_grouped_by_stakeholder_ids(
        self, stakeholder_ids: list[uuid.UUID]
    ) -> dict[uuid.UUID, int]:
        if not stakeholder_ids:
            return {}
        return {
            r.stakeholder_id: r.cnt
            for r in self.db.execute(
                select(OpportunityStakeholder.stakeholder_id, func.count().label("cnt"))
                .where(OpportunityStakeholder.stakeholder_id.in_(stakeholder_ids))
                .group_by(OpportunityStakeholder.stakeholder_id)
            ).all()
        }
