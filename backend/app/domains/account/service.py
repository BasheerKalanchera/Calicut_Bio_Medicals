import uuid

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.domains.account.models import Account
from app.domains.account.repository import AccountRepository
from app.domains.account.schemas import AccountCreate, AccountUpdate


class AccountService:
    def __init__(self, repository: AccountRepository):
        self.repository = repository

    def get_account(self, account_id: uuid.UUID) -> Account:
        account = self.repository.get_by_id(account_id)
        if not account:
            raise NotFoundError(f"Account {account_id} not found")
        return account

    def get_counts_for_accounts(self, account_ids: list[uuid.UUID]) -> dict:
        return self.repository.fetch_counts_for_accounts(account_ids)

    def get_account_with_counts(self, account_id: uuid.UUID) -> tuple:
        account, counts = self.repository.get_account_with_counts(account_id)
        if not account:
            raise NotFoundError(f"Account {account_id} not found")
        return account, counts

    def list_children(self, account_id: uuid.UUID) -> list[Account]:
        return self.repository.list_children(account_id)

    def list_accounts(
        self,
        *,
        offset: int = 0,
        limit: int = 50,
        search: str | None = None,
        zone_id: uuid.UUID | None = None,
    ) -> tuple[list[Account], int]:
        return self.repository.list_accounts(
            offset=offset,
            limit=limit,
            search=search,
            zone_id=zone_id,
        )

    def _validate_references(
        self,
        *,
        zone_id: uuid.UUID | None = None,
        parent_account_id: uuid.UUID | None = None,
        account_id: uuid.UUID | None = None,
    ) -> None:
        if zone_id is not None and not self.repository.zone_exists(zone_id):
            raise ValidationError(f"Zone {zone_id} does not exist")

        if parent_account_id is not None:
            if account_id is not None and parent_account_id == account_id:
                raise ValidationError("Account cannot be its own parent")
            if not self.repository.account_exists(parent_account_id):
                raise ValidationError(f"Parent account {parent_account_id} does not exist")
            if account_id is not None and self._creates_cycle(
                account_id=account_id, parent_account_id=parent_account_id
            ):
                raise ValidationError(
                    "Setting this parent would create a circular reference"
                )

    def _creates_cycle(
        self, *, account_id: uuid.UUID, parent_account_id: uuid.UUID
    ) -> bool:
        """Walk the ancestor chain from parent_account_id looking for account_id.

        Only meaningful on update (a brand-new account can't already be
        anyone's ancestor), so callers only invoke this when account_id is set.

        One DB round-trip per ancestor level (O(depth)) — fine today since this
        app's account hierarchy is at most 1-2 levels deep (hospital group ->
        branch) and this only runs on save, not on any read path. If a future
        milestone introduces deeper hierarchies and this loop becomes a real
        cost, replace it with a single `WITH RECURSIVE ancestors AS (...)` CTE
        that returns the whole chain in one round-trip, instead of adding that
        complexity now for a cost that doesn't exist yet.
        """
        visited: set[uuid.UUID] = set()
        current_id: uuid.UUID | None = parent_account_id
        while current_id is not None:
            if current_id == account_id:
                return True
            if current_id in visited:
                break  # pre-existing cycle in the data; stop rather than loop forever
            visited.add(current_id)
            current_id = self.repository.get_parent_id(current_id)
        return False

    def create_account(
        self,
        data: AccountCreate,
        *,
        created_by: uuid.UUID,
        default_zone_id: uuid.UUID | None = None,
    ) -> Account:
        if self.repository.exists_by_name(data.name):
            raise ConflictError(f"Account with name '{data.name}' already exists")

        zone_id = data.zone_id if data.zone_id else default_zone_id
        if not zone_id:
            raise ValidationError("Zone is required. No zone was provided and the creating user has no zone assigned.")

        self._validate_references(
            zone_id=zone_id,
            parent_account_id=data.parent_account_id,
        )

        account = Account(
            name=data.name,
            parent_account_id=data.parent_account_id,
            zone_id=zone_id,
            payer_behavior=data.payer_behavior,
            customer_type=data.customer_type,
            created_by=created_by,
            updated_by=created_by,
        )
        return self.repository.create(account)

    def update_account(
        self, account_id: uuid.UUID, data: AccountUpdate, *, updated_by: uuid.UUID
    ) -> Account:
        account = self.repository.get_for_update(account_id)
        if not account:
            raise NotFoundError(f"Account {account_id} not found")
        updates = data.model_dump(exclude_unset=True)

        new_name = updates.get("name")
        if (
            new_name is not None
            and new_name != account.name
            and self.repository.exists_by_name(new_name, exclude_id=account_id)
        ):
            raise ConflictError(f"Account with name '{new_name}' already exists")

        self._validate_references(
            zone_id=updates.get("zone_id"),
            parent_account_id=updates.get("parent_account_id"),
            account_id=account_id,
        )

        for field, value in updates.items():
            setattr(account, field, value)

        account.updated_by = updated_by
        return self.repository.update(account)
