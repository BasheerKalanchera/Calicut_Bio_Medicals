from app.domains.organization.models import UserProfile
from app.domains.organization.repository import UserRepository


class UserService:
    def __init__(self, repository: UserRepository):
        self.repository = repository

    def list_active_users(
        self,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[UserProfile], int]:
        return self.repository.list_active(offset=offset, limit=limit)
