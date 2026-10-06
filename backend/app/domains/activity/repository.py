import uuid
from collections.abc import Iterable
from datetime import datetime

from sqlalchemy import ScalarSelect, func, or_, select, text
from sqlalchemy.orm import Session, joinedload, noload, selectinload

from app.db.base import BaseRepository
from app.domains.account.models import Account
from app.domains.activity.models import Activity, ActivityComment, Reminder
from app.domains.opportunity.models import Opportunity
from app.domains.organization.models import UserProfile
from app.domains.organization.repository import TEAM_SCOPE_BUILDERS, UNRESTRICTED_ROLES
from app.domains.project.models import Project


class ActivityRepository(BaseRepository[Activity]):
    def __init__(self, db: Session):
        super().__init__(Activity, db)

    def account_exists(self, account_id: uuid.UUID) -> bool:
        return (self.db.scalar(select(1).where(Account.id == account_id)) or 0) > 0

    def opportunity_exists(self, opportunity_id: uuid.UUID) -> bool:
        return (self.db.scalar(select(1).where(Opportunity.id == opportunity_id)) or 0) > 0

    def opportunity_in_account(self, opportunity_id: uuid.UUID, account_id: uuid.UUID) -> bool:
        # BR-ACT-10: raw call to the SECURITY DEFINER function, not a plain
        # RLS-scoped query -- a cross-SBU Relationship Support logger's own
        # session would otherwise have this Opportunity filtered out as
        # invisible, even though it genuinely exists.
        return bool(
            self.db.execute(
                text("SELECT cabio_app_opportunity_in_account(:opportunity_id, :account_id)"),
                {"opportunity_id": opportunity_id, "account_id": account_id},
            ).scalar()
        )

    def list_account_opportunities_lookup(self, account_id: uuid.UUID) -> list[tuple[uuid.UUID, str]]:
        # BR-ACT-10: same SECURITY DEFINER widening as above, feeding the
        # "Related Opportunity" picker -- id+name only, deliberately
        # unscoped by the caller's own SBU/zone.
        rows = self.db.execute(
            text("SELECT id, name FROM cabio_app_account_opportunities(:account_id)"),
            {"account_id": account_id},
        ).all()
        return [(row.id, row.name) for row in rows]

    def project_exists(self, project_id: uuid.UUID) -> bool:
        return (self.db.scalar(select(1).where(Project.id == project_id)) or 0) > 0

    def _comment_count_column(self) -> ScalarSelect:
        # Correlated scalar subquery, not a join -- one extra column on the
        # existing Activity query instead of a separate per-row fetch, so
        # ActivityTimeline.tsx can show "Comments (N)" without an N+1 request.
        return (
            select(func.count(ActivityComment.id))
            .where(ActivityComment.activity_id == Activity.id)
            .correlate(Activity)
            .scalar_subquery()
        )

    def _rows_with_comment_counts(self, rows: Iterable[tuple[Activity, int]]) -> list[Activity]:
        activities = []
        for activity, comment_count in rows:
            activity.comment_count = comment_count
            activities.append(activity)
        return activities

    def list_by_account(
        self,
        account_id: uuid.UUID,
        *,
        offset: int = 0,
        limit: int = 50,
    ) -> list[Activity]:
        stmt = (
            select(Activity, self._comment_count_column())
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
        return self._rows_with_comment_counts(self.db.execute(stmt).unique().all())

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
            select(Activity, self._comment_count_column())
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
        return self._rows_with_comment_counts(self.db.execute(stmt).unique().all())

    def count_by_opportunity(self, opportunity_id: uuid.UUID) -> int:
        return self.db.scalar(
            select(func.count(Activity.id)).where(Activity.opportunity_id == opportunity_id)
        ) or 0

    def list_by_project(
        self,
        project_id: uuid.UUID,
        *,
        offset: int = 0,
        limit: int = 50,
    ) -> list[Activity]:
        stmt = (
            select(Activity, self._comment_count_column())
            .where(Activity.project_id == project_id)
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
        return self._rows_with_comment_counts(self.db.execute(stmt).unique().all())

    def count_by_project(self, project_id: uuid.UUID) -> int:
        return self.db.scalar(
            select(func.count(Activity.id)).where(Activity.project_id == project_id)
        ) or 0

    def _apply_daily_report_scope(self, stmt, current_user: UserProfile, user_id: uuid.UUID | None):
        # Mirrors UserRepository.list_active's tier scoping (organization/repository.py)
        # applied to who *logged* the activity rather than to user_profile rows directly.
        # Unrestricted roles see everything; every other tier sees its scope plus itself.
        role_name = current_user.role.role_name
        if role_name not in UNRESTRICTED_ROLES:
            scope_builder = TEAM_SCOPE_BUILDERS.get(role_name)
            self_row = Activity.user_id == current_user.id
            visible = or_(scope_builder(current_user), self_row) if scope_builder else self_row
            stmt = stmt.where(visible)
        if user_id is not None:
            stmt = stmt.where(Activity.user_id == user_id)
        return stmt

    def list_by_date(
        self,
        current_user: UserProfile,
        start: datetime,
        end: datetime,
        *,
        user_id: uuid.UUID | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> list[Activity]:
        stmt = (
            select(Activity)
            .join(UserProfile, Activity.user_id == UserProfile.id)
            .where(Activity.activity_date >= start, Activity.activity_date < end)
            .options(
                noload(Activity.reminders),
                # ActivityReportRow shows only these names (Query Load Fixes, fix 2).
                _name_only(Activity.account, Account.id, Account.name),
                _name_only(Activity.opportunity, Opportunity.id, Opportunity.name),
                _name_only(Activity.project, Project.id, Project.name),
                _name_only(Activity.user, UserProfile.id, UserProfile.display_name),
                _name_only(Activity.created_by_user, UserProfile.id, UserProfile.display_name),
            )
        )
        stmt = self._apply_daily_report_scope(stmt, current_user, user_id)
        stmt = stmt.order_by(Activity.activity_date.desc()).offset(offset).limit(limit)
        return list(self.db.scalars(stmt).unique().all())

    def count_by_date(
        self,
        current_user: UserProfile,
        start: datetime,
        end: datetime,
        *,
        user_id: uuid.UUID | None = None,
    ) -> int:
        stmt = (
            select(func.count(Activity.id))
            .join(UserProfile, Activity.user_id == UserProfile.id)
            .where(Activity.activity_date >= start, Activity.activity_date < end)
        )
        stmt = self._apply_daily_report_scope(stmt, current_user, user_id)
        return self.db.scalar(stmt) or 0


class ActivityCommentRepository(BaseRepository[ActivityComment]):
    def __init__(self, db: Session):
        super().__init__(ActivityComment, db)

    def activity_exists(self, activity_id: uuid.UUID) -> bool:
        return (self.db.scalar(select(1).where(Activity.id == activity_id)) or 0) > 0

    def get_activity_owner_id(self, activity_id: uuid.UUID) -> uuid.UUID | None:
        # Feeds the notification fan-out (Decision 4) -- the Activity's own
        # `user_id`, always included as a recipient so the very first comment
        # on a note still notifies someone, even before anyone else has
        # commented.
        return self.db.scalar(select(Activity.user_id).where(Activity.id == activity_id))

    def list_for_activity(self, activity_id: uuid.UUID) -> list[ActivityComment]:
        stmt = (
            select(ActivityComment)
            .options(*_comment_display_options())
            .where(ActivityComment.activity_id == activity_id)
            .order_by(ActivityComment.created_at.asc())
        )
        return list(self.db.scalars(stmt).all())

    def list_distinct_commenter_ids(self, activity_id: uuid.UUID) -> list[uuid.UUID]:
        # docs/Activity-Comment-Implementation-Plan.md's Decision 4: feeds
        # the notification fan-out (Activity owner + everyone who's already
        # commented, minus whoever's posting right now) -- called before the
        # new comment is flushed, so it never includes the current poster's
        # own not-yet-committed row.
        stmt = select(ActivityComment.created_by).where(ActivityComment.activity_id == activity_id).distinct()
        return list(self.db.scalars(stmt).all())


def _name_only(relationship, *columns):
    # Join the related row, but only the given columns (what the calling
    # response schema shows -- reminders, Daily Report rows, comments), and
    # stop there: lazyload("*") switches off the model's own lazy="joined"
    # chains (user -> sbu/role/zone ...) that otherwise balloon the query.
    return joinedload(relationship).load_only(*columns).lazyload("*")


def _comment_display_options():
    # ActivityCommentResponse uses activity_id (a column) and the author's
    # name -- not the Activity itself.
    return (
        noload(ActivityComment.activity),
        _name_only(ActivityComment.author, UserProfile.id, UserProfile.display_name),
    )


def _activity_display_options(relationship, loader=joinedload):
    # ActivityContextNested needs the activity's own columns plus the
    # account, opportunity, user and created-by names -- nothing else.
    return loader(relationship).options(
        _name_only(Activity.account, Account.id, Account.name),
        _name_only(Activity.opportunity, Opportunity.id, Opportunity.name),
        _name_only(Activity.user, UserProfile.id, UserProfile.display_name),
        _name_only(Activity.created_by_user, UserProfile.id, UserProfile.display_name),
        noload(Activity.project),
    )


# Soonest due first; same due date -> logged earlier first (it has waited
# longer); id as the last tie-break so the order is identical on every load.
_REMINDER_ORDER = (Reminder.due_date.asc(), Reminder.created_at.asc(), Reminder.id.asc())


def _reminder_display_options(include_completed: bool):
    # Without these, each reminder pulls ~118 joined tables in one statement
    # (UAT outage 2026-10-05, docs/Progress-Archive-2026-10.md).
    #
    # Completed list: every row has a closing activity and the screen shows
    # it, so it joins in the same statement. Pending list: none has one (no
    # screen reopens a Next Action), so it loads in a separate lookup that
    # SQLAlchemy skips when no row on the page has a closing_activity_id --
    # the main statement stays small and a reopened row would still show it.
    return (
        _activity_display_options(Reminder.activity),
        _activity_display_options(
            Reminder.closing_activity, loader=joinedload if include_completed else selectinload
        ),
        _name_only(Reminder.assigned_to_user, UserProfile.id, UserProfile.display_name),
    )


class ReminderRepository(BaseRepository[Reminder]):
    def __init__(self, db: Session):
        super().__init__(Reminder, db)

    def activity_exists(self, activity_id: uuid.UUID) -> bool:
        return (self.db.scalar(select(1).where(Activity.id == activity_id)) or 0) > 0

    def opportunity_exists(self, opportunity_id: uuid.UUID) -> bool:
        return (self.db.scalar(select(1).where(Opportunity.id == opportunity_id)) or 0) > 0

    def list_for_user(
        self,
        user_id: uuid.UUID,
        *,
        include_completed: bool = False,
        due_after: datetime | None = None,
        due_before: datetime | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> list[Reminder]:
        stmt = (
            select(Reminder)
            .options(*_reminder_display_options(include_completed))
            .where(Reminder.assigned_to_user_id == user_id)
            .where(Reminder.is_completed == include_completed)
        )
        if due_after is not None:
            stmt = stmt.where(Reminder.due_date >= due_after)
        if due_before is not None:
            stmt = stmt.where(Reminder.due_date <= due_before)
        stmt = stmt.order_by(*_REMINDER_ORDER).offset(offset).limit(limit)
        return list(self.db.scalars(stmt).all())

    def count_for_user(
        self,
        user_id: uuid.UUID,
        *,
        include_completed: bool = False,
        due_after: datetime | None = None,
        due_before: datetime | None = None,
    ) -> int:
        stmt = select(func.count(Reminder.id)).where(
            Reminder.assigned_to_user_id == user_id,
            Reminder.is_completed == include_completed,
        )
        if due_after is not None:
            stmt = stmt.where(Reminder.due_date >= due_after)
        if due_before is not None:
            stmt = stmt.where(Reminder.due_date <= due_before)
        return self.db.scalar(stmt) or 0

    def list_by_opportunity(
        self,
        opportunity_id: uuid.UUID,
        *,
        include_completed: bool = False,
        offset: int = 0,
        limit: int = 50,
    ) -> list[Reminder]:
        stmt = (
            select(Reminder)
            .options(*_reminder_display_options(include_completed))
            .join(Activity, Reminder.activity_id == Activity.id)
            .where(Activity.opportunity_id == opportunity_id)
            .where(Reminder.is_completed == include_completed)
            .order_by(*_REMINDER_ORDER)
            .offset(offset)
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())

    def count_by_opportunity(
        self,
        opportunity_id: uuid.UUID,
        *,
        include_completed: bool = False,
    ) -> int:
        stmt = (
            select(func.count(Reminder.id))
            .join(Activity, Reminder.activity_id == Activity.id)
            .where(Activity.opportunity_id == opportunity_id)
            .where(Reminder.is_completed == include_completed)
        )
        return self.db.scalar(stmt) or 0
