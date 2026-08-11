import uuid

from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.db.base import BaseRepository, ReferenceRepository
from app.domains.account.models import Account
from app.domains.organization.models import UserZone
from app.domains.reference.models import OpportunityStage, Zone, ZoneClosure


class OpportunityStageRepository(ReferenceRepository[OpportunityStage]):
    def __init__(self, db: Session):
        super().__init__(OpportunityStage, db)

    def list_active_ordered(self) -> list[OpportunityStage]:
        stmt = (
            select(OpportunityStage)
            .where(OpportunityStage.is_active == True)  # noqa: E712
            .order_by(OpportunityStage.display_order)
        )
        return list(self.db.scalars(stmt).all())


class ZoneRepository(BaseRepository[Zone]):
    def __init__(self, db: Session):
        super().__init__(Zone, db)

    def zone_exists(self, zone_id: uuid.UUID) -> bool:
        return self.db.get(Zone, zone_id) is not None

    def get_parent_id(self, zone_id: uuid.UUID) -> uuid.UUID | None:
        """Mirrors AccountRepository.get_parent_id -- used by the move_zone
        cycle guard (same walk-the-ancestor-chain pattern as
        AccountService._creates_cycle, applied to zone_id/parent_zone_id
        instead of account_id/parent_account_id)."""
        return self.db.scalar(select(Zone.parent_zone_id).where(Zone.id == zone_id))

    def get_tree(self) -> list[Zone]:
        """Root zones (parent_zone_id IS NULL); children load lazily via
        Zone.children as the tree-view UI expands each node -- not eager
        loaded here, since the whole tree could be a few hundred rows deep
        and wide once fully seeded, and the UI only needs one level at a
        time."""
        stmt = select(Zone).where(Zone.parent_zone_id.is_(None)).order_by(Zone.name)
        return list(self.db.scalars(stmt).all())

    def rebuild_all_closure(self) -> None:
        """The *only* closure-maintenance method -- no incremental
        "recompute just the affected subtree" variant exists deliberately.

        An incremental algorithm is exactly the kind of logic where an
        off-by-one silently over- or under-grants RLS visibility (a
        security-relevant bug, not a data-hygiene one). Given the whole
        tree stays in the low hundreds of rows even fully built out
        pan-India, and zone-map edits are rare, deliberate admin actions
        (not something happening while someone's just using the app), a
        full delete + single-statement recursive-CTE rebuild on every
        edit is cheap enough that there's no reason to accept an
        incremental algorithm's risk for a performance gain nobody needs.
        Called after every create/rename/move/deprecate, and directly
        exposed as the Admin screen's manual "rebuild everything" safety
        net -- same method, not a second code path to keep in sync.

        DELETE, not TRUNCATE: cabio_app (the app's runtime DB role) is
        granted DELETE/INSERT/SELECT/UPDATE on zone_closure but not
        TRUNCATE (confirmed live on Dev) -- consistent with the app role
        being deliberately denied the table-level lock/ACL-bypass that
        TRUNCATE implies. No downside here: no sequence to reset, and the
        table is small enough that DELETE's extra cost is irrelevant.
        """
        self.db.execute(text("DELETE FROM zone_closure"))
        self.db.execute(
            text(
                """
                INSERT INTO zone_closure (ancestor_zone_id, descendant_zone_id)
                WITH RECURSIVE ancestry AS (
                    SELECT id AS descendant_zone_id, id AS ancestor_zone_id FROM zone
                    UNION ALL
                    SELECT ancestry.descendant_zone_id, zone.parent_zone_id
                    FROM ancestry
                    JOIN zone ON zone.id = ancestry.ancestor_zone_id
                    WHERE zone.parent_zone_id IS NOT NULL
                )
                SELECT ancestor_zone_id, descendant_zone_id FROM ancestry
                """
            )
        )
        self.db.flush()

    def blast_radius(self, zone_id: uuid.UUID) -> tuple[int, int]:
        """(account_count, user_count) currently assigned somewhere in this
        zone's own subtree (itself + every descendant, via zone_closure) --
        backs the Admin screen's pre-move/pre-deprecate confirmation."""
        descendant_ids = select(ZoneClosure.descendant_zone_id).where(
            ZoneClosure.ancestor_zone_id == zone_id
        )
        account_count = self.db.scalar(
            select(func.count(Account.id)).where(Account.zone_id.in_(descendant_ids))
        ) or 0
        user_count = self.db.scalar(
            select(func.count(func.distinct(UserZone.user_id))).where(
                UserZone.zone_id.in_(descendant_ids)
            )
        ) or 0
        return account_count, user_count
