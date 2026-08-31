import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session, noload, selectinload

from app.db.base import BaseRepository
from app.domains.account.duplicate_matching import score_query_containment
from app.domains.account.models import Account, Stakeholder
from app.domains.activity.models import Activity
from app.domains.asset.models import InstalledAsset
from app.domains.opportunity.models import Opportunity
from app.domains.project.models import Project
from app.domains.reference.models import Zone, ZoneClosure


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
            # Match the zone itself plus every zone beneath it (e.g. picking
            # "Kerala" also returns hospitals tagged Kozhikode, Kottayam, etc.)
            descendant_ids = select(ZoneClosure.descendant_zone_id).where(
                ZoneClosure.ancestor_zone_id == zone_id
            )
            stmt = stmt.where(Account.zone_id.in_(descendant_ids))

        stmt = stmt.order_by(Account.name)

        total = self.db.scalar(
            select(func.count()).select_from(stmt.subquery())
        )
        results = list(
            self.db.scalars(stmt.offset(offset).limit(limit)).unique().all()
        )
        return results, total or 0

    def list_children(self, account_id: uuid.UUID) -> list[Account]:
        stmt = (
            select(Account)
            .where(Account.parent_account_id == account_id)
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
            .order_by(Account.name)
        )
        return list(self.db.scalars(stmt).unique().all())

    def exists_by_name(self, name: str, *, exclude_id: uuid.UUID | None = None) -> bool:
        stmt = select(func.count()).where(func.lower(Account.name) == func.lower(name))
        if exclude_id:
            stmt = stmt.where(Account.id != exclude_id)
        return (self.db.scalar(stmt) or 0) > 0

    def find_similar_by_name(
        self,
        name: str,
        *,
        zone_id: uuid.UUID,
        threshold: float = 0.5,
        limit: int = 5,
        exclude_id: uuid.UUID | None = None,
    ) -> list[Account]:
        """Near-duplicate check for hospital creation (BR pending Haroon sign-off,
        see docs/Duplicate-Hospital-Decision-Brief-2026-08-29.md's Option B).

        `exclude_id`, used by AccountService.update_account (renaming an
        existing hospital), excludes that account itself from the candidate
        pool. Deliberately separate from the exact-name exclusion below: on a
        rename, the account being edited still holds its *old* name in the DB
        when this query runs, so excluding by name alone wouldn't reliably
        exclude it from being scored against its own new name.

        Scoped to the whole operational zone branch (e.g. all of "North Kerala",
        not just whichever district/taluk zone was picked) via zone_closure --
        an exact zone_id match would miss a hospital filed at a parent zone
        against the same hospital re-filed at a child zone (found 2026-08-30:
        "Al Shifa Hospital" filed at North Kerala vs "al Shifa" filed at its
        Malappuram sub-zone).

        The branch root is the nearest ancestor at zone_level="ZONE"
        (North Kerala / South Kerala / Bangalore / Mangalore / etc.), not the
        topmost ancestor with no parent at all -- those two used to be the same
        zone, but no longer are: Kerala/Karnataka now sit above them as
        zone_level="STATE" parents (found 2026-08-30, testing against real
        Dev data: walking to the true root merged North Kerala and South
        Kerala into one pool, e.g. a Kozhikode hospital getting compared
        against an Ernakulam one).

        Scoring uses score_query_containment (duplicate_matching.py), not raw
        trigram similarity: widening the pool this much reintroduces the
        shared-generic-word false positives (two unrelated "Medical College
        Hospital"s) that raw similarity can't tell apart from a real duplicate
        -- confirmed on real data, where a false-positive pair scored *higher*
        on raw similarity than a true duplicate pair did. The candidate pool
        stays small (one zone branch's worth of accounts), so scoring it in
        Python is not a meaningful cost next to the DB round-trip itself.

        Fallback for zone_id itself being at or above zone_level="ZONE" (e.g.
        an account filed directly at the state "Kerala", not a district under
        it): there's no ZONE-level ancestor to walk up to, so the lookup below
        comes back empty. Found 2026-08-31 -- an account filed at bare "Kerala"
        silently matched against nothing, since branch_zone_ids resolved to
        `ancestor_zone_id = NULL`, which SQL never matches. Falling back to
        zone_id itself as the branch root means the walk-up-then-sweep-down
        behavior above still applies, just anchored one level higher than
        usual -- it naturally sweeps every ZONE branch underneath "Kerala"
        too, via the same zone_closure query, no special-casing needed.
        """
        root_zone_id = self.db.scalar(
            select(ZoneClosure.ancestor_zone_id)
            .join(Zone, Zone.id == ZoneClosure.ancestor_zone_id)
            .where(ZoneClosure.descendant_zone_id == zone_id, Zone.zone_level == "ZONE")
        )
        if root_zone_id is None:
            root_zone_id = zone_id
        branch_zone_ids = select(ZoneClosure.descendant_zone_id).where(
            ZoneClosure.ancestor_zone_id == root_zone_id
        )
        stmt = select(Account).where(
            Account.zone_id.in_(branch_zone_ids),
            func.lower(Account.name) != func.lower(name),
        )
        if exclude_id is not None:
            stmt = stmt.where(Account.id != exclude_id)
        candidates = self.db.scalars(stmt).all()

        scored = [(score_query_containment(name, c.name), c) for c in candidates]
        matches = sorted(
            (pair for pair in scored if pair[0] >= threshold),
            key=lambda pair: pair[0],
            reverse=True,
        )
        return [account for _, account in matches[:limit]]

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

    def get_parent_id(self, account_id: uuid.UUID) -> uuid.UUID | None:
        return self.db.scalar(select(Account.parent_account_id).where(Account.id == account_id))
