import uuid
from collections.abc import Sequence

from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.db.base import BaseRepository, ReferenceRepository
from app.domains.account.models import Account
from app.domains.organization.models import UserZone
from app.domains.reference.models import SBU, Brand, Category, Model, OpportunityStage, Zone, ZoneClosure


def _exists_by_name_in_scope(db: Session, name_column, name: str, *, scope_column, scope_value: uuid.UUID) -> bool:
    """Shared by Brand/Category/Model's exists_by_name -- each is a
    case-insensitive name check scoped to one column (sbu_id or brand_id)."""
    stmt = select(func.count()).where(scope_column == scope_value, func.lower(name_column) == func.lower(name))
    return (db.scalar(stmt) or 0) > 0


def _sbu_exists(db: Session, sbu_id: uuid.UUID) -> bool:
    """Shared by Brand/Category's sbu_exists -- same check as
    ProductRepository.sbu_exists, needed here so create_brand/create_category
    can reject a made-up sbu_id with a clean 404 instead of a raw FK
    IntegrityError (found by /code-review, 2026-09-22)."""
    return db.get(SBU, sbu_id) is not None


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


class BrandRepository(ReferenceRepository[Brand]):
    def __init__(self, db: Session):
        super().__init__(Brand, db)

    def list_active_for_sbu(self, sbu_id: uuid.UUID) -> list[Brand]:
        stmt = (
            select(Brand)
            .where(Brand.sbu_id == sbu_id, Brand.is_active == True)  # noqa: E712
            .order_by(Brand.name)
        )
        return list(self.db.scalars(stmt).all())

    def exists_by_name(self, name: str, *, sbu_id: uuid.UUID) -> bool:
        return _exists_by_name_in_scope(self.db, Brand.name, name, scope_column=Brand.sbu_id, scope_value=sbu_id)

    def sbu_exists(self, sbu_id: uuid.UUID) -> bool:
        return _sbu_exists(self.db, sbu_id)


class CategoryRepository(ReferenceRepository[Category]):
    def __init__(self, db: Session):
        super().__init__(Category, db)

    def list_active_for_sbu(self, sbu_id: uuid.UUID) -> list[Category]:
        stmt = (
            select(Category)
            .where(Category.sbu_id == sbu_id, Category.is_active == True)  # noqa: E712
            .order_by(Category.name)
        )
        return list(self.db.scalars(stmt).all())

    def exists_by_name(self, name: str, *, sbu_id: uuid.UUID) -> bool:
        return _exists_by_name_in_scope(self.db, Category.name, name, scope_column=Category.sbu_id, scope_value=sbu_id)

    def sbu_exists(self, sbu_id: uuid.UUID) -> bool:
        return _sbu_exists(self.db, sbu_id)


class ModelRepository(ReferenceRepository[Model]):
    def __init__(self, db: Session):
        super().__init__(Model, db)

    def list_active_for_brand(self, brand_id: uuid.UUID) -> list[Model]:
        stmt = (
            select(Model)
            .where(Model.brand_id == brand_id, Model.is_active == True)  # noqa: E712
            .order_by(Model.name)
        )
        return list(self.db.scalars(stmt).all())

    def exists_by_name(self, name: str, *, brand_id: uuid.UUID) -> bool:
        return _exists_by_name_in_scope(self.db, Model.name, name, scope_column=Model.brand_id, scope_value=brand_id)


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

    def search_by_name(
        self, query: str, limit: int = 10, *, within_zone_ids: Sequence[uuid.UUID] | None = None
    ) -> list[Zone]:
        """Trigram similarity search over active zones, backing the
        ZonePicker component (docs/ZonePicker-And-Coverage-View-
        Implementation-Plan.md). Only active zones are searchable, matching
        the existing list_active() convention used everywhere else.

        `within_zone_ids`, when given, restricts results to those zones plus
        everything under each of them (via zone_closure) -- backs the
        Add/Edit Hospital picker's rep-scoped search (master_data.py's
        search_zones_for_hospital), same descendant-sweep pattern as
        AccountRepository.find_similar_by_name and list_accounts. Takes every
        zone a caller is assigned to (not just their primary zone_id) --
        found 2026-09-09, a rep with additional zones beyond their primary
        (e.g. Vivek: Alappuzha primary + 5 more districts) couldn't find any
        of the others here, only the primary."""
        similarity = func.similarity(Zone.name, query)
        stmt = select(Zone).where(Zone.is_active == True, similarity > 0)  # noqa: E712
        if within_zone_ids is not None:
            descendant_ids = select(ZoneClosure.descendant_zone_id).where(
                ZoneClosure.ancestor_zone_id.in_(within_zone_ids)
            )
            stmt = stmt.where(Zone.id.in_(descendant_ids))
        stmt = stmt.order_by(similarity.desc()).limit(limit)
        return list(self.db.scalars(stmt).all())

    def exists_by_name(
        self, name: str, *, parent_zone_id: uuid.UUID | None, exclude_id: uuid.UUID | None = None
    ) -> bool:
        """Scoped per-parent, matching uq_zone_parent_name / uq_zone_root_name
        (migration 0019) -- a name can repeat across different parents, just
        not twice under the same one (or twice at the top level)."""
        stmt = select(func.count()).where(func.lower(Zone.name) == func.lower(name))
        stmt = stmt.where(Zone.parent_zone_id == parent_zone_id) if parent_zone_id else stmt.where(
            Zone.parent_zone_id.is_(None)
        )
        if exclude_id:
            stmt = stmt.where(Zone.id != exclude_id)
        return (self.db.scalar(stmt) or 0) > 0

    def find_by_name_elsewhere(
        self, name: str, *, parent_zone_id: uuid.UUID | None, exclude_id: uuid.UUID | None = None
    ) -> list[Zone]:
        """Active zones sharing this exact name outside the given parent
        scope -- backs the Add/Edit Zone form's soft "this name exists
        elsewhere" warning. Purely informational: uq_zone_parent_name /
        uq_zone_root_name (migration 0019) deliberately only enforce
        per-parent uniqueness, so the same name in a different branch is
        allowed by design -- this just surfaces it before the Admin
        commits, in case it's the same real place added twice by mistake
        (e.g. Kasaragod under both North and South Kerala) rather than a
        legitimate name reused across branches.
        is_distinct_from is NULL-safe: two top-level zones (both
        parent_zone_id IS NULL) count as the same scope, not "elsewhere."
        """
        stmt = select(Zone).where(
            Zone.is_active == True,  # noqa: E712
            func.lower(Zone.name) == func.lower(name),
            Zone.parent_zone_id.is_distinct_from(parent_zone_id),
        )
        if exclude_id:
            stmt = stmt.where(Zone.id != exclude_id)
        return list(self.db.scalars(stmt).all())

    def build_breadcrumb(self, zone: Zone) -> str:
        """Walks Zone.parent (lazy="joined" one level, further hops lazy-
        load on demand) up to the root, joining ancestor names -- excludes
        the zone's own name. Cheap given ZonePicker results are capped at
        ~10 per search and the tree is shallow."""
        names: list[str] = []
        current = zone.parent
        while current is not None:
            names.append(current.name)
            current = current.parent
        return " > ".join(reversed(names))
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
        Called after every create/rename/move/deactivate, and directly
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
        backs the Admin screen's pre-move/pre-deactivate confirmation."""
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
