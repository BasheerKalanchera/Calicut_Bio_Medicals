import uuid

from app.core.exceptions import AuthorizationError, ConflictError, NotFoundError, ValidationError
from app.domains.organization.models import UserProfile
from app.domains.organization.repository import UserRepository
from app.domains.organization.schemas import UserCreate, UserUpdate

_USER_WRITE_ROLES = {"General Manager", "Admin"}


class UserService:
    def __init__(self, repository: UserRepository):
        self.repository = repository

    def list_active_users(
        self,
        current_user: UserProfile,
        offset: int = 0,
        limit: int = 50,
        *,
        scope: str = "scoped",
        include_inactive: bool = False,
    ) -> tuple[list[UserProfile], int]:
        return self.repository.list_active(
            current_user, offset=offset, limit=limit, scope=scope, include_inactive=include_inactive
        )

    def create_user(self, data: UserCreate, *, role_name: str) -> UserProfile:
        if role_name not in _USER_WRITE_ROLES:
            raise AuthorizationError("Only General Manager and Admin roles can add users")
        if self.repository.get_by_id(data.id):
            raise ConflictError(f"User {data.id} already exists")
        if not self.repository.sbu_exists(data.sbu_id):
            raise NotFoundError(f"SBU {data.sbu_id} not found")
        if not self.repository.role_exists(data.role_id):
            raise NotFoundError(f"Role {data.role_id} not found")
        if data.zone_id is not None and not self.repository.zone_exists(data.zone_id):
            raise NotFoundError(f"Zone {data.zone_id} not found")
        for zone_id in data.zone_ids:
            if not self.repository.zone_exists(zone_id):
                raise NotFoundError(f"Zone {zone_id} not found")
        # Design doc SS3 invariant: the primary zone_id must always be a member of
        # zone_ids -- never a silently-orphaned pointer to a zone the user isn't
        # otherwise assigned to.
        if data.zone_id is not None and data.zone_id not in data.zone_ids:
            raise ValidationError("Primary zone_id must be included in zone_ids")
        if data.manager_id is not None:
            manager = self.repository.get_by_id(data.manager_id)
            if not manager:
                raise NotFoundError(f"Manager {data.manager_id} not found")
            # Admin/GM (_USER_WRITE_ROLES) are an SBU-agnostic overlay tier --
            # their own sbu_id is a real column value today (not yet nullable,
            # see Backlog.md) but a meaningless placeholder, not real
            # membership. The same-SBU invariant only makes sense for a
            # manager who actually belongs to an SBU.
            if manager.role.role_name not in _USER_WRITE_ROLES and manager.sbu_id != data.sbu_id:
                raise ValidationError("Manager must belong to the same SBU as the user")
        user = UserProfile(
            id=data.id,
            display_name=data.display_name,
            sbu_id=data.sbu_id,
            role_id=data.role_id,
            zone_id=data.zone_id,
            manager_id=data.manager_id,
        )
        user = self.repository.create(user)
        self.repository.replace_zones(user, data.zone_ids)
        return user

    def update_user(self, user_id: uuid.UUID, data: UserUpdate, *, role_name: str) -> UserProfile:
        if role_name not in _USER_WRITE_ROLES:
            raise AuthorizationError("Only General Manager and Admin roles can edit users")
        user = self.repository.get_by_id(user_id)
        if not user:
            raise NotFoundError(f"User {user_id} not found")
        if data.manager_id is not None:
            if data.manager_id == user_id:
                raise ValidationError("A user cannot be their own manager")
            manager = self.repository.get_by_id(data.manager_id)
            if not manager:
                raise NotFoundError(f"Manager {data.manager_id} not found")
            # Effective SBU: this same update may also change sbu_id (PATCH
            # semantics) -- compare against the value the user will actually
            # end up with, not necessarily their current one.
            effective_sbu_id = data.sbu_id if data.sbu_id is not None else user.sbu_id
            # Admin/GM (_USER_WRITE_ROLES) are an SBU-agnostic overlay tier --
            # see the matching comment in create_user for why they're exempt
            # from this invariant.
            if manager.role.role_name not in _USER_WRITE_ROLES and manager.sbu_id != effective_sbu_id:
                raise ValidationError("Manager must belong to the same SBU as the user")
        if data.sbu_id is not None and not self.repository.sbu_exists(data.sbu_id):
            raise NotFoundError(f"SBU {data.sbu_id} not found")
        if data.role_id is not None and not self.repository.role_exists(data.role_id):
            raise NotFoundError(f"Role {data.role_id} not found")
        if data.zone_id is not None and not self.repository.zone_exists(data.zone_id):
            raise NotFoundError(f"Zone {data.zone_id} not found")
        if data.zone_ids is not None:
            for zone_id in data.zone_ids:
                if not self.repository.zone_exists(zone_id):
                    raise NotFoundError(f"Zone {zone_id} not found")
        # Same SS3 invariant as create_user, checked against the effective
        # post-update state -- either field may be omitted from this PATCH.
        effective_zone_id = data.zone_id if data.zone_id is not None else user.zone_id
        effective_zone_ids = (
            data.zone_ids if data.zone_ids is not None else [uz.zone_id for uz in user.zones]
        )
        if effective_zone_id is not None and effective_zone_id not in effective_zone_ids:
            raise ValidationError("Primary zone_id must be included in zone_ids")
        for field, value in data.model_dump(exclude_unset=True, exclude={"zone_ids"}).items():
            setattr(user, field, value)
        user = self.repository.update(user)
        if data.zone_ids is not None:
            self.repository.replace_zones(user, data.zone_ids)
        return user

    def user_blast_radius(self, user_id: uuid.UUID, *, role_name: str) -> tuple[int, int]:
        if role_name not in _USER_WRITE_ROLES:
            raise AuthorizationError("Only General Manager and Admin roles can manage users")
        if not self.repository.get_by_id(user_id):
            raise NotFoundError(f"User {user_id} not found")
        return self.repository.blast_radius(user_id)

    def deactivate_user(self, user_id: uuid.UUID, *, role_name: str) -> UserProfile:
        if role_name not in _USER_WRITE_ROLES:
            raise AuthorizationError("Only General Manager and Admin roles can deactivate users")
        user = self.repository.get_by_id(user_id)
        if not user:
            raise NotFoundError(f"User {user_id} not found")
        # Deliberate: does NOT delete the row, does NOT touch manager_id
        # references from their reports, owner_id on their opportunities, or
        # created_by on their activities -- grandfathered exactly like
        # Zone.deactivate_zone. Only blocks new logins going forward
        # (api/dependencies.py's get_current_user already rejects
        # is_active=False) and drops out of the three assignment pickers
        # (UserRepository.list_active's default include_inactive=False).
        user.is_active = False
        return self.repository.update(user)

    def reactivate_user(self, user_id: uuid.UUID, *, role_name: str) -> UserProfile:
        if role_name not in _USER_WRITE_ROLES:
            raise AuthorizationError("Only General Manager and Admin roles can reactivate users")
        user = self.repository.get_by_id(user_id)
        if not user:
            raise NotFoundError(f"User {user_id} not found")
        user.is_active = True
        return self.repository.update(user)
