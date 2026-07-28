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
    ) -> tuple[list[UserProfile], int]:
        return self.repository.list_active(current_user, offset=offset, limit=limit)

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
        if data.manager_id is not None and not self.repository.get_by_id(data.manager_id):
            raise NotFoundError(f"Manager {data.manager_id} not found")
        user = UserProfile(
            id=data.id,
            display_name=data.display_name,
            sbu_id=data.sbu_id,
            role_id=data.role_id,
            zone_id=data.zone_id,
            manager_id=data.manager_id,
        )
        return self.repository.create(user)

    def update_user(self, user_id: uuid.UUID, data: UserUpdate, *, role_name: str) -> UserProfile:
        if role_name not in _USER_WRITE_ROLES:
            raise AuthorizationError("Only General Manager and Admin roles can edit users")
        user = self.repository.get_by_id(user_id)
        if not user:
            raise NotFoundError(f"User {user_id} not found")
        if data.manager_id is not None:
            if data.manager_id == user_id:
                raise ValidationError("A user cannot be their own manager")
            if not self.repository.get_by_id(data.manager_id):
                raise NotFoundError(f"Manager {data.manager_id} not found")
        if data.sbu_id is not None and not self.repository.sbu_exists(data.sbu_id):
            raise NotFoundError(f"SBU {data.sbu_id} not found")
        if data.role_id is not None and not self.repository.role_exists(data.role_id):
            raise NotFoundError(f"Role {data.role_id} not found")
        if data.zone_id is not None and not self.repository.zone_exists(data.zone_id):
            raise NotFoundError(f"Zone {data.zone_id} not found")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(user, field, value)
        return self.repository.update(user)
