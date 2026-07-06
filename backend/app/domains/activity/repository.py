import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session, noload

from app.db.base import BaseRepository
from app.domains.account.models import Account
from app.domains.activity.models import Activity, Reminder
from app.domains.opportunity.models import Opportunity


class ActivityRepository(BaseRepository[Activity]):
    def __init__(self, db: Session):
        super().__init__(Activity, db)

    def account_exists(self, account_id: uuid.UUID) -> bool:
        return (self.db.scalar(select(1).where(Account.id == account_id)) or 0) > 0

    def opportunity_exists(self, opportunity_id: uuid.UUID) -> bool:
        return (self.db.scalar(select(1).where(Opportunity.id == opportunity_id)) or 0) > 0

    def list_by_account(
        self,
        account_id: uuid.UUID,
        *,
        offset: int = 0,
        limit: int = 50,
    ) -> list[Activity]:
        stmt = (
            select(Activity)
            .where(Activity.account_id == account_id)
            .options(
                noload(Activity.reminders),
                # account/project/opportunity are lazy="joined" by default on the model,
                # but ActivityResponse only needs their scalar _id columns, not the nested
                # objects — noload so this query only joins what it actually uses (user).
                noload(Activity.account),
                noload(Activity.project),
                noload(Activity.opportunity),
            )
            .order_by(Activity.activity_date.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(self.db.scalars(stmt).unique().all())

    def count_by_account(self, account_id: uuid.UUID) -> int:
        return self.db.scalar(
            select(func.count(Activity.id)).where(Activity.account_id == account_id)
        ) or 0

    def list_by_opportunity(
        self,
        opportunity_id: uuid.UUID,
        *,
        offset: int = 0,
        limit: int = 50,
    ) -> list[Activity]:
        stmt = (
            select(Activity)
            .where(Activity.opportunity_id == opportunity_id)
            .options(
                noload(Activity.reminders),
                noload(Activity.account),
                noload(Activity.project),
                noload(Activity.opportunity),
            )
            .order_by(Activity.activity_date.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(self.db.scalars(stmt).unique().all())

    def count_by_opportunity(self, opportunity_id: uuid.UUID) -> int:
        return self.db.scalar(
            select(func.count(Activity.id)).where(Activity.opportunity_id == opportunity_id)
        ) or 0


class ReminderRepository(BaseRepository[Reminder]):
    def __init__(self, db: Session):
        super().__init__(Reminder, db)

    def activity_exists(self, activity_id: uuid.UUID) -> bool:
        return (self.db.scalar(select(1).where(Activity.id == activity_id)) or 0) > 0

    def list_for_user(
        self,
        user_id: uuid.UUID,
        *,
        include_completed: bool = False,
        offset: int = 0,
        limit: int = 50,
    ) -> list[Reminder]:
        stmt = (
            select(Reminder)
            .where(Reminder.assigned_to_user_id == user_id)
            .order_by(Reminder.due_date.asc())
            .offset(offset)
            .limit(limit)
        )
        if not include_completed:
            stmt = stmt.where(Reminder.is_completed == False)  # noqa: E712
        return list(self.db.scalars(stmt).all())

    def count_for_user(
        self,
        user_id: uuid.UUID,
        *,
        include_completed: bool = False,
    ) -> int:
        stmt = select(func.count(Reminder.id)).where(
            Reminder.assigned_to_user_id == user_id
        )
        if not include_completed:
            stmt = stmt.where(Reminder.is_completed == False)  # noqa: E712
        return self.db.scalar(stmt) or 0
