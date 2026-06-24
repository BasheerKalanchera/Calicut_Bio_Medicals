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

    def list_accounts(
        self,
        *,
        offset: int = 0,
        limit: int = 50,
        search: str | None = None,
        zone_id: uuid.UUID | None = None,
        sbu_id: uuid.UUID | None = None,
    ) -> tuple[list[Account], int]:
        return self.repository.list_accounts(
            offset=offset,
            limit=limit,
            search=search,
            zone_id=zone_id,
            sbu_id=sbu_id,
        )

    def _validate_references(
        self,
        *,
        managing_sbu_id: uuid.UUID | None = None,
        parent_account_id: uuid.UUID | None = None,
        account_id: uuid.UUID | None = None,
    ) -> None:
        if managing_sbu_id is not None and not self.repository.sbu_exists(managing_sbu_id):
            raise ValidationError(f"SBU {managing_sbu_id} does not exist")

        if parent_account_id is not None:
            if account_id is not None and parent_account_id == account_id:
                raise ValidationError("Account cannot be its own parent")
            if not self.repository.account_exists(parent_account_id):
                raise ValidationError(f"Parent account {parent_account_id} does not exist")

    def create_account(self, data: AccountCreate, *, created_by: uuid.UUID) -> Account:
        if self.repository.exists_by_name(data.name):
            raise ConflictError(f"Account with name '{data.name}' already exists")

        self._validate_references(
            managing_sbu_id=data.managing_sbu_id,
            parent_account_id=data.parent_account_id,
        )

        account = Account(
            name=data.name,
            parent_account_id=data.parent_account_id,
            managing_sbu_id=data.managing_sbu_id,
            payer_behavior=data.payer_behavior,
            created_by=created_by,
            updated_by=created_by,
        )
        return self.repository.create(account)

    def update_account(
        self, account_id: uuid.UUID, data: AccountUpdate, *, updated_by: uuid.UUID
    ) -> Account:
        account = self.get_account(account_id)
        updates = data.model_dump(exclude_unset=True)

        new_name = updates.get("name")
        if (
            new_name is not None
            and new_name != account.name
            and self.repository.exists_by_name(new_name, exclude_id=account_id)
        ):
            raise ConflictError(f"Account with name '{new_name}' already exists")

        self._validate_references(
            managing_sbu_id=updates.get("managing_sbu_id"),
            parent_account_id=updates.get("parent_account_id"),
            account_id=account_id,
        )

        for field, value in updates.items():
            setattr(account, field, value)

        account.updated_by = updated_by
        return self.repository.update(account)
