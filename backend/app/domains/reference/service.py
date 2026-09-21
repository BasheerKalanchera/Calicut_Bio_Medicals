import uuid

from app.core.exceptions import (
    AuthorizationError,
    BusinessRuleViolation,
    ConflictError,
    NotFoundError,
    ValidationError,
)
from app.domains.reference.models import Brand, Category, Model, Zone
from app.domains.reference.repository import BrandRepository, CategoryRepository, ModelRepository, ZoneRepository
from app.domains.reference.schemas import BrandCreate, CategoryCreate, ModelCreate, ZoneCreate, ZoneUpdate

# Territory map edits are rare, deliberate admin actions (Discussion-Zone-
# Hierarchy-2026-08.md) -- same role-gate shape as opportunity/service.py's
# _SBU_OVERRIDE_ROLES, not a new authorization mechanism.
_TERRITORY_MAP_ADMIN_ROLES = {"Admin", "General Manager"}

# Same shape, reused for the Product Catalog hierarchy (docs/Product-Catalog-
# Name-Derivation-Implementation-Plan.md) -- Brand/Category/Model edits are
# rare, deliberate admin actions too.
_CATALOG_ADMIN_ROLES = {"Admin", "General Manager"}


class CatalogAdminService:
    def __init__(self, *, brands: BrandRepository, categories: CategoryRepository, models: ModelRepository):
        self.brands = brands
        self.categories = categories
        self.models = models

    def _require_admin(self, role_name: str) -> None:
        if role_name not in _CATALOG_ADMIN_ROLES:
            raise AuthorizationError(
                "Only Admin/General Manager can manage the product catalog's Brand/Category/Model lists"
            )

    def list_brands(self, *, sbu_id: uuid.UUID) -> list[Brand]:
        return self.brands.list_active_for_sbu(sbu_id)

    def list_categories(self, *, sbu_id: uuid.UUID) -> list[Category]:
        return self.categories.list_active_for_sbu(sbu_id)

    def list_models(self, *, brand_id: uuid.UUID) -> list[Model]:
        return self.models.list_active_for_brand(brand_id)

    def create_brand(self, data: BrandCreate, *, role_name: str) -> Brand:
        self._require_admin(role_name)
        if self.brands.exists_by_name(data.name, sbu_id=data.sbu_id):
            raise ConflictError(f"A brand named '{data.name}' already exists")
        return self.brands.create(Brand(sbu_id=data.sbu_id, name=data.name))

    def create_category(self, data: CategoryCreate, *, role_name: str) -> Category:
        self._require_admin(role_name)
        if self.categories.exists_by_name(data.name, sbu_id=data.sbu_id):
            raise ConflictError(f"A category named '{data.name}' already exists")
        return self.categories.create(Category(sbu_id=data.sbu_id, name=data.name))

    def create_model(self, data: ModelCreate, *, role_name: str) -> Model:
        self._require_admin(role_name)
        brand = self.brands.get_by_id(data.brand_id)
        if brand is None:
            raise NotFoundError(f"Brand {data.brand_id} not found")
        if self.categories.get_by_id(data.category_id) is None:
            raise NotFoundError(f"Category {data.category_id} not found")
        if self.models.exists_by_name(data.name, brand_id=data.brand_id):
            raise ConflictError(f"A model named '{data.name}' already exists for this brand")
        # sbu_id is set by the trg_model_sync_sbu trigger (migration 0048),
        # not supplied here -- always follows brand.sbu_id.
        model = Model(brand_id=data.brand_id, category_id=data.category_id, name=data.name, sbu_id=brand.sbu_id)
        return self.models.create(model)


class ZoneAdminService:
    def __init__(self, repository: ZoneRepository):
        self.repository = repository

    def _require_admin(self, role_name: str) -> None:
        if role_name not in _TERRITORY_MAP_ADMIN_ROLES:
            raise AuthorizationError("Only Admin/General Manager can manage the territory map")

    def _validate_parent(self, parent_zone_id: uuid.UUID) -> None:
        parent = self.repository.get_by_id(parent_zone_id)
        if parent is None:
            raise NotFoundError(f"Zone {parent_zone_id} not found")
        # A deactivated zone can't gain new structure underneath it -- matches
        # deactivate_zone's own "blocks new assignments" behavior, applied to
        # new child territories the same way it applies to new user_zone rows.
        if not parent.is_active:
            raise BusinessRuleViolation(f"Zone {parent_zone_id} is deactivated and cannot be used as a parent")

    def get_tree(self, *, role_name: str) -> list[Zone]:
        self._require_admin(role_name)
        return self.repository.get_tree()

    def create_zone(self, data: ZoneCreate, *, role_name: str) -> Zone:
        self._require_admin(role_name)
        if data.parent_zone_id is not None:
            self._validate_parent(data.parent_zone_id)
        if self.repository.exists_by_name(data.name, parent_zone_id=data.parent_zone_id):
            raise ConflictError(f"A zone named '{data.name}' already exists under this parent")
        zone = Zone(name=data.name, parent_zone_id=data.parent_zone_id, zone_level=data.zone_level)
        zone = self.repository.create(zone)
        self.repository.rebuild_all_closure()
        return zone

    def update_zone(self, zone_id: uuid.UUID, data: ZoneUpdate, *, role_name: str) -> Zone:
        self._require_admin(role_name)
        zone = self.repository.get_by_id(zone_id)
        if zone is None:
            raise NotFoundError(f"Zone {zone_id} not found")

        closure_affected = False
        new_parent_id = zone.parent_zone_id
        # "parent_zone_id" present in the payload but explicitly null means
        # "make this zone top-level" -- distinct from the field being absent
        # entirely, which means "leave the parent alone." A bare `is not
        # None` check can't tell those apart, which used to make clearing
        # the field in the Edit form silently no-op.
        parent_provided = "parent_zone_id" in data.model_fields_set
        if parent_provided and data.parent_zone_id != zone.parent_zone_id:
            if data.parent_zone_id is not None:
                self._validate_parent(data.parent_zone_id)
                if self._creates_cycle(zone_id=zone_id, parent_zone_id=data.parent_zone_id):
                    raise ValidationError("Setting this parent would create a circular reference")
            new_parent_id = data.parent_zone_id
            closure_affected = True

        new_name = data.name if data.name is not None else zone.name
        if (new_name, new_parent_id) != (zone.name, zone.parent_zone_id) and self.repository.exists_by_name(
            new_name, parent_zone_id=new_parent_id, exclude_id=zone_id
        ):
            raise ConflictError(f"A zone named '{new_name}' already exists under this parent")

        if closure_affected:
            zone.parent_zone_id = new_parent_id
        if data.name is not None:
            zone.name = data.name
        if data.zone_level is not None:
            zone.zone_level = data.zone_level

        zone = self.repository.update(zone)
        # Renaming/relabeling alone doesn't change closure (keyed by id, not
        # name) -- only rebuild when the parent actually moved. Cheap either
        # way given the tree's size, but no reason to run it when nothing
        # about the tree's shape changed.
        if closure_affected:
            self.repository.rebuild_all_closure()
        return zone

    def deactivate_zone(self, zone_id: uuid.UUID, *, role_name: str) -> Zone:
        self._require_admin(role_name)
        zone = self.repository.get_by_id(zone_id)
        if zone is None:
            raise NotFoundError(f"Zone {zone_id} not found")
        # Deliberate: does NOT delete the row, does NOT touch any existing
        # account.zone_id/user_zone.zone_id row referencing it, and does NOT
        # remove it from zone_closure. Existing RLS visibility is
        # grandfathered, not revoked -- mirrors BR-FIN-06's split
        # grandfathering exactly (existing stays, only new is gated). Only
        # NEW assignments are blocked: the zone picker (frontend, later
        # phase) filters is_active=true, and _validate_parent above rejects
        # a deactivated zone as a new parent for create/move.
        zone.is_active = False
        return self.repository.update(zone)

    def reactivate_zone(self, zone_id: uuid.UUID, *, role_name: str) -> Zone:
        self._require_admin(role_name)
        zone = self.repository.get_by_id(zone_id)
        if zone is None:
            raise NotFoundError(f"Zone {zone_id} not found")
        zone.is_active = True
        return self.repository.update(zone)

    def blast_radius(self, zone_id: uuid.UUID, *, role_name: str) -> tuple[int, int]:
        self._require_admin(role_name)
        if not self.repository.zone_exists(zone_id):
            raise NotFoundError(f"Zone {zone_id} not found")
        return self.repository.blast_radius(zone_id)

    def find_name_elsewhere(
        self, name: str, *, parent_zone_id: uuid.UUID | None, exclude_id: uuid.UUID | None, role_name: str
    ) -> list[Zone]:
        self._require_admin(role_name)
        return self.repository.find_by_name_elsewhere(name, parent_zone_id=parent_zone_id, exclude_id=exclude_id)

    def rebuild_all_closure(self, *, role_name: str) -> None:
        self._require_admin(role_name)
        self.repository.rebuild_all_closure()

    def _creates_cycle(self, *, zone_id: uuid.UUID, parent_zone_id: uuid.UUID) -> bool:
        """Mirrors AccountService._creates_cycle exactly (account/service.py) --
        same walk-the-ancestor-chain-looking-for-self pattern (O(depth) DB
        round-trips, fine at this tree's size -- see that method's own
        docstring for why a recursive CTE isn't worth it yet), applied to
        zone_id/parent_zone_id instead of account_id/parent_account_id.
        """
        visited: set[uuid.UUID] = set()
        current_id: uuid.UUID | None = parent_zone_id
        while current_id is not None:
            if current_id == zone_id:
                return True
            if current_id in visited:
                break  # pre-existing cycle in the data; stop rather than loop forever
            visited.add(current_id)
            current_id = self.repository.get_parent_id(current_id)
        return False
