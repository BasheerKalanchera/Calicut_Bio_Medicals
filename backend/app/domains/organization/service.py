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
    ) -> tuple[list[UserProfile], int]:
        return self.repository.list_active(current_user, offset=offset, limit=limit, scope=scope)

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
            if manager.sbu_id != data.sbu_id:
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
            if manager.sbu_id != effective_sbu_id:
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
