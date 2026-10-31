import uuid
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from app.core.exceptions import BusinessRuleViolation, NotFoundError
from app.domains.activity.models import Activity, ActivityComment, Reminder
from app.domains.activity.repository import ActivityCommentRepository, ActivityRepository, ReminderRepository
from app.domains.activity.schemas import (
    NOT_CUSTOMER_FACING_TYPES,
    ActivityCommentCreate,
    ActivityCreate,
    ReminderCreate,
    ReminderUpdate,
)
from app.domains.notification.service import NotificationService
from app.domains.organization.models import UserProfile

# Cabio operates in India; a "day" for the Daily Activity Report means the IST
# calendar day, regardless of the DB session's own timezone (unconfigured --
# see repository.py's list_by_date for why this isn't a DB-side DATE() truncation).
_IST = ZoneInfo("Asia/Kolkata")


def _maybe_create_next_action_reminder(
    reminder_repository: ReminderRepository,
    *,
    activity: Activity,
    next_action_text: str | None,
    next_action_due_date: datetime | None,
    next_action_owner_id: uuid.UUID | None,
    created_by: uuid.UUID,
) -> Reminder | None:
    # BR-ACT-04: shared by ActivityService.log_activity (mandatory unless
    # MANAGER_NOTE) and ReminderService.patch_reminder (the follow-up when
    # closing a reminder, BR-ACT-05) -- same "given an Activity, maybe
    # attach a Reminder" logic either way.
    if not (next_action_text and next_action_due_date):
        return None
    resolved_owner = next_action_owner_id or activity.user_id
    reminder = Reminder(
        activity_id=activity.id,
        assigned_to_user_id=resolved_owner,
        due_date=next_action_due_date,
        reminder_text=next_action_text,
        is_completed=False,
        created_by=created_by,
        updated_by=created_by,
    )
    return reminder_repository.create(reminder)


class ActivityService:
    def __init__(
        self,
        repository: ActivityRepository,
        reminder_repository: ReminderRepository,
        notification_service: NotificationService,
    ):
        self.repository = repository
        self.reminder_repository = reminder_repository
        self.notification_service = notification_service

    def list_by_account(
        self,
        account_id: uuid.UUID,
        *,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[Activity], int]:
        if not self.repository.account_exists(account_id):
            raise NotFoundError(f"Account {account_id} not found")
        offset = (page - 1) * page_size
        items = self.repository.list_by_account(account_id, offset=offset, limit=page_size)
        # No separate COUNT round-trip here (unlike list_by_opportunity below) — the
        # authoritative total now comes for free from AccountDetailResponse.activity_count
        # (account/repository.py's get_account_with_counts), computed alongside the
        # account's other counts in one query. This total is a lower bound only, used
        # by callers that don't have the account response on hand.
        total = offset + len(items)
        return items, total

    def list_account_opportunities_lookup(self, account_id: uuid.UUID) -> list[tuple[uuid.UUID, str]]:
        # BR-ACT-10: feeds the "Related Opportunity" picker for Relationship
        # Support -- account_exists is a plain RLS-scoped check (the caller
        # must already be able to see the Account itself), but the
        # Opportunity list underneath deliberately isn't tier-scoped.
        if not self.repository.account_exists(account_id):
            raise NotFoundError(f"Account {account_id} not found")
        return self.repository.list_account_opportunities_lookup(account_id)

    def list_by_opportunity(
        self,
        opportunity_id: uuid.UUID,
        *,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[Activity], int]:
        if not self.repository.opportunity_exists(opportunity_id):
            raise NotFoundError(f"Opportunity {opportunity_id} not found")
        offset = (page - 1) * page_size
        items = self.repository.list_by_opportunity(opportunity_id, offset=offset, limit=page_size)
        total = self.repository.count_by_opportunity(opportunity_id)
        return items, total

    def list_by_project(
        self,
        project_id: uuid.UUID,
        *,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[Activity], int]:
        if not self.repository.project_exists(project_id):
            raise NotFoundError(f"Project {project_id} not found")
        offset = (page - 1) * page_size
        items = self.repository.list_by_project(project_id, offset=offset, limit=page_size)
        total = self.repository.count_by_project(project_id)
        return items, total

    def list_daily_report(
        self,
        current_user: UserProfile,
        report_date: date,
        *,
        user_id: uuid.UUID | None = None,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[Activity], int]:
        start = datetime(report_date.year, report_date.month, report_date.day, tzinfo=_IST)
        end = start + timedelta(days=1)
        offset = (page - 1) * page_size
        items = self.repository.list_by_date(
            current_user, start, end, user_id=user_id, offset=offset, limit=page_size
        )
        total = self.repository.count_by_date(current_user, start, end, user_id=user_id)
        return items, total

    def log_activity(
        self,
        data: ActivityCreate,
        *,
        created_by: uuid.UUID,
    ) -> tuple[Activity, Reminder | None]:
        # BR-ACT-01/BR-ACT-09: account must exist when provided -- required
        # for every type except the six Sales Development Activity types
        # (schema validator already enforces the account_id is present at all
        # for those; here we just don't gate on it being None).
        if data.account_id and not self.repository.account_exists(data.account_id):
            raise NotFoundError(f"Account {data.account_id} not found")

        if data.opportunity_id:
            # BR-ACT-10: a Relationship Support logger has no standing
            # (RLS-visible) route to the Opportunity, so opportunity_exists
            # alone would wrongly 404 a real one -- opportunity_in_account
            # is the deliberate, narrow carve-out for exactly that case.
            visible = self.repository.opportunity_exists(data.opportunity_id)
            in_account = bool(data.account_id) and self.repository.opportunity_in_account(
                data.opportunity_id, data.account_id
            )
            if not (visible or in_account):
                raise NotFoundError(f"Opportunity {data.opportunity_id} not found")

        activity_user_id = data.user_id if data.user_id is not None else created_by

        # BR-ACT-11: while the person this activity is for (plan D2) has an
        # open next action of their own on this Opportunity, they close it
        # (PATCH /reminders/{id}, BR-ACT-05) instead of logging a fresh
        # activity. Types that never carry a next action are unchanged.
        # Hospital next-action plan D1-D3: the same at Project level (an
        # activity on a Project without an Opportunity) and hospital level
        # (neither); each level blocks only itself.
        blocked_on = (
            None
            if data.activity_type in NOT_CUSTOMER_FACING_TYPES
            else self._open_next_action_level(data, activity_user_id)
        )
        if blocked_on:
            raise BusinessRuleViolation(
                f"There is an open next action on this {blocked_on} for this person. "
                "Close it, saying what happened, instead of logging a new activity."
            )

        activity = Activity(
            account_id=data.account_id,
            opportunity_id=data.opportunity_id,
            project_id=data.project_id,
            user_id=activity_user_id,
            activity_type=data.activity_type,
            activity_date=data.activity_date,
            notes=data.notes,
            outcome_notes=data.outcome_notes,
            created_by=created_by,
        )
        activity = self.repository.create(activity)

        # BR-ACT-04: next-action fields are absent only for MANAGER_NOTE
        # (schema validator enforces this) - no Reminder for those.
        reminder = _maybe_create_next_action_reminder(
            self.reminder_repository,
            activity=activity,
            next_action_text=data.next_action_text,
            next_action_due_date=data.next_action_due_date,
            next_action_owner_id=data.next_action_owner_id,
            created_by=created_by,
        )

        # Manager Note notification (2026-09-08): skip when the manager
        # logs a note against their own name -- no one to notify.
        if activity.activity_type == "MANAGER_NOTE" and activity.user_id != created_by:
            self.notification_service.notify_manager_note_added(
                recipient_user_id=activity.user_id,
                activity_id=activity.id,
                actor_id=created_by,
                is_urgent=data.is_urgent,
            )

        return activity, reminder

    def _open_next_action_level(self, data: ActivityCreate, user_id: uuid.UUID) -> str | None:
        # The level this activity is logged at, when the person already has
        # an open next action of their own there -- else None.
        if data.opportunity_id:
            has_open = self.reminder_repository.has_open_for_user_on_opportunity(data.opportunity_id, user_id)
            return "Opportunity" if has_open else None
        if data.project_id:
            has_open = self.reminder_repository.has_open_for_user_on_project(data.project_id, user_id)
            return "Project" if has_open else None
        if data.account_id:
            has_open = self.reminder_repository.has_open_for_user_on_account_level(data.account_id, user_id)
            return "hospital" if has_open else None
        return None

    def log_stage_change_note(
        self,
        *,
        opportunity_id: uuid.UUID,
        account_id: uuid.UUID,
        project_id: uuid.UUID | None,
        activity_date: datetime,
        notes: str,
        next_action_text: str | None,
        next_action_due_date: datetime | None,
        next_action_owner_id: uuid.UUID | None,
        created_by: uuid.UUID,
    ) -> Activity:
        # BR-OP-22: the Note saved with a stage or status change by someone
        # with no open next action of their own on the Opportunity. Not
        # log_activity: ActivityCreate forces a next action on every Note,
        # but here it's optional on Won/Lost (plan D12) -- OpportunityService
        # decides when it's required, since that depends on the new status.
        activity = self.repository.create(Activity(
            account_id=account_id,
            opportunity_id=opportunity_id,
            project_id=project_id,
            user_id=created_by,
            activity_type="NOTE",
            activity_date=activity_date,
            notes=notes,
            created_by=created_by,
        ))
        _maybe_create_next_action_reminder(
            self.reminder_repository,
            activity=activity,
            next_action_text=next_action_text,
            next_action_due_date=next_action_due_date,
            next_action_owner_id=next_action_owner_id,
            created_by=created_by,
        )
        return activity

    def log_first_activity(
        self,
        *,
        opportunity_id: uuid.UUID,
        account_id: uuid.UUID,
        project_id: uuid.UUID | None,
        activity_type: str,
        activity_date: datetime,
        notes: str,
        next_action_text: str,
        next_action_due_date: datetime,
        next_action_owner_id: uuid.UUID,
        created_by: uuid.UUID,
    ) -> Activity:
        # BR-OP-21: a new Opportunity's first activity, saved with it. Not
        # log_activity: the BR-ACT-11 check can't apply to an Opportunity
        # created a moment ago, and the schema already fixed type and fields.
        activity = self.repository.create(Activity(
            account_id=account_id,
            opportunity_id=opportunity_id,
            project_id=project_id,
            user_id=created_by,
            activity_type=activity_type,
            activity_date=activity_date,
            notes=notes,
            created_by=created_by,
        ))
        _maybe_create_next_action_reminder(
            self.reminder_repository,
            activity=activity,
            next_action_text=next_action_text,
            next_action_due_date=next_action_due_date,
            next_action_owner_id=next_action_owner_id,
            created_by=created_by,
        )
        return activity


class ActivityCommentService:
    def __init__(self, repository: ActivityCommentRepository, notification_service: NotificationService):
        self.repository = repository
        self.notification_service = notification_service

    def list_for_activity(self, activity_id: uuid.UUID) -> list[ActivityComment]:
        if not self.repository.activity_exists(activity_id):
            raise NotFoundError(f"Activity {activity_id} not found")
        return self.repository.list_for_activity(activity_id)

    def create_comment(
        self,
        activity_id: uuid.UUID,
        data: ActivityCommentCreate,
        *,
        author_id: uuid.UUID,
    ) -> ActivityComment:
        if not self.repository.activity_exists(activity_id):
            raise NotFoundError(f"Activity {activity_id} not found")

        # docs/Activity-Comment-Implementation-Plan.md's Decision 4: notify
        # the Activity's owner plus everyone who's already commented, minus
        # whoever's posting right now -- computed before this comment is
        # created so the poster's own new row can't leak into "prior
        # commenters".
        owner_id = self.repository.get_activity_owner_id(activity_id)
        prior_commenter_ids = self.repository.list_distinct_commenter_ids(activity_id)
        recipient_ids = {owner_id, *prior_commenter_ids} - {author_id, None}

        comment = ActivityComment(
            activity_id=activity_id,
            body=data.body,
            created_by=author_id,
        )
        comment = self.repository.create(comment)

        for recipient_id in recipient_ids:
            self.notification_service.notify_activity_comment_added(
                recipient_user_id=recipient_id,
                activity_id=activity_id,
                actor_id=author_id,
            )

        return comment


class ReminderService:
    def __init__(self, repository: ReminderRepository, activity_repository: ActivityRepository):
        self.repository = repository
        self.activity_repository = activity_repository

    def list_for_user(
        self,
        user_id: uuid.UUID,
        *,
        include_completed: bool = False,
        due_after: datetime | None = None,
        due_before: datetime | None = None,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[Reminder], int]:
        offset = (page - 1) * page_size
        items = self.repository.list_for_user(
            user_id,
            include_completed=include_completed,
            due_after=due_after,
            due_before=due_before,
            offset=offset,
            limit=page_size,
        )
        total = self.repository.count_for_user(
            user_id,
            include_completed=include_completed,
            due_after=due_after,
            due_before=due_before,
        )
        return items, total

    def list_for_opportunity(
        self,
        opportunity_id: uuid.UUID,
        *,
        include_completed: bool = False,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[Reminder], int]:
        if not self.repository.opportunity_exists(opportunity_id):
            raise NotFoundError(f"Opportunity {opportunity_id} not found")
        offset = (page - 1) * page_size
        items = self.repository.list_by_opportunity(
            opportunity_id,
            include_completed=include_completed,
            offset=offset,
            limit=page_size,
        )
        total = self.repository.count_by_opportunity(opportunity_id, include_completed=include_completed)
        return items, total

    def list_for_account(
        self,
        account_id: uuid.UUID,
        *,
        include_completed: bool = False,
        hospital_level_only: bool = False,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[Reminder], int]:
        if not self.repository.account_exists(account_id):
            raise NotFoundError(f"Account {account_id} not found")
        offset = (page - 1) * page_size
        items = self.repository.list_by_account(
            account_id,
            include_completed=include_completed,
            hospital_level_only=hospital_level_only,
            offset=offset,
            limit=page_size,
        )
        total = self.repository.count_by_account(
            account_id, include_completed=include_completed, hospital_level_only=hospital_level_only
        )
        return items, total

    def list_for_project(
        self,
        project_id: uuid.UUID,
        *,
        include_completed: bool = False,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[Reminder], int]:
        if not self.repository.project_exists(project_id):
            raise NotFoundError(f"Project {project_id} not found")
        offset = (page - 1) * page_size
        items = self.repository.list_by_project(
            project_id,
            include_completed=include_completed,
            offset=offset,
            limit=page_size,
        )
        total = self.repository.count_by_project(project_id, include_completed=include_completed)
        return items, total

    def create_reminder(
        self,
        data: ReminderCreate,
        *,
        created_by: uuid.UUID,
    ) -> Reminder:
        if not self.repository.activity_exists(data.activity_id):
            raise NotFoundError(f"Activity {data.activity_id} not found")

        reminder = Reminder(
            activity_id=data.activity_id,
            assigned_to_user_id=data.assigned_to_user_id,
            due_date=data.due_date,
            reminder_text=data.reminder_text,
            is_completed=False,
            created_by=created_by,
            updated_by=created_by,
        )
        return self.repository.create(reminder)

    def patch_reminder(
        self,
        reminder_id: uuid.UUID,
        data: ReminderUpdate,
        *,
        updated_by: uuid.UUID,
    ) -> Reminder:
        reminder = self.repository.get_by_id(reminder_id)
        if not reminder:
            raise NotFoundError(f"Reminder {reminder_id} not found")
        # A retried close (the first save went through, its reply was lost)
        # must not save the visit and its follow-up a second time.
        if data.is_completed and reminder.is_completed:
            raise BusinessRuleViolation("This next action is already closed.")
        also_close = self._others_to_close(reminder, data.also_close_ids)

        reminder.is_completed = data.is_completed
        reminder.updated_by = updated_by

        # BR-ACT-05: completing a reminder requires documenting what was done
        # -- the schema validator guarantees activity_type/activity_date/notes
        # are all present whenever is_completed=True. The closing Activity
        # inherits its account/opportunity/project context from the
        # reminder's own (creating) activity, since it's the same
        # customer/deal thread; the loop mirrors BR-ACT-04 in reverse
        # (Activity -> mandatory Reminder becomes Reminder completion ->
        # mandatory Activity), both created atomically with the state change
        # they accompany.
        if data.is_completed:
            original = reminder.activity
            if not data.next_action_text:
                self._require_follow_up_exemption(reminder, original, data.produced_opportunity_id, updated_by)
            elif data.produced_opportunity_id:
                raise BusinessRuleViolation(
                    "Give either a follow-up next action or the new Opportunity this visit produced, not both."
                )
            if data.produced_opportunity_id:
                # Plan D20: the visit is recorded once, as the new
                # Opportunity's first activity (D17 pre-fills it from this
                # close form), so it closes this next action -- no second,
                # hospital-level copy. The close's own type/date/notes,
                # required by ReminderUpdate, aren't saved in this case.
                first_activity_id = self.repository.first_activity_id_on_opportunity(data.produced_opportunity_id)
                if first_activity_id is None:
                    raise BusinessRuleViolation("The new Opportunity has no first activity to close this with.")
                reminder.closing_activity_id = first_activity_id
                return self.repository.update(reminder)
            closing_activity = Activity(
                account_id=original.account_id,
                opportunity_id=original.opportunity_id,
                project_id=original.project_id,
                user_id=data.user_id if data.user_id is not None else updated_by,
                activity_type=data.activity_type,
                activity_date=data.activity_date,
                notes=data.notes,
                created_by=updated_by,
            )
            closing_activity = self.activity_repository.create(closing_activity)
            reminder.closing_activity_id = closing_activity.id
            # Plan D22: the others ticked in the close form share this
            # closing Activity and the one follow-up below.
            for other in also_close:
                other.is_completed = True
                other.updated_by = updated_by
                other.closing_activity_id = closing_activity.id
                self.repository.update(other)

            # The follow-up (BR-ACT-05 change: required unless exempt, see
            # _require_follow_up_exemption) -- same BR-ACT-04 mechanism as
            # any other Activity. Linked to the closing Activity, not the
            # original one, since it's a fresh commitment made now, not
            # part of the original interaction.
            _maybe_create_next_action_reminder(
                self.repository,
                activity=closing_activity,
                next_action_text=data.next_action_text,
                next_action_due_date=data.next_action_due_date,
                next_action_owner_id=data.next_action_owner_id,
                created_by=updated_by,
            )

        return self.repository.update(reminder)

    def has_open_own_on_opportunity(self, opportunity_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        return self.repository.has_open_for_user_on_opportunity(opportunity_id, user_id)

    def close_for_stage_change(
        self,
        reminder_id: uuid.UUID,
        *,
        opportunity_id: uuid.UUID,
        closed_by: uuid.UUID,
        data: ReminderUpdate,
    ) -> Reminder:
        # BR-OP-22 / plan D13: a stage or status change closes the changer's
        # own open next action on this Opportunity -- not someone else's,
        # and not one on another Opportunity. The closing itself is the
        # ordinary BR-ACT-05 close (same follow-up rules).
        reminder = self.repository.get_by_id(reminder_id)
        if (
            not reminder
            or reminder.is_completed
            or reminder.assigned_to_user_id != closed_by
            or reminder.activity.opportunity_id != opportunity_id
        ):
            raise BusinessRuleViolation(
                "The next action to close must be an open one of your own on this Opportunity."
            )
        return self.patch_reminder(reminder_id, data, updated_by=closed_by)

    def _others_to_close(self, reminder: Reminder, also_close_ids: list[uuid.UUID]) -> list[Reminder]:
        # Plan D22 / BR-ACT-05: closing several at once is only for the same
        # person's open next actions at the same level -- the same
        # Opportunity, or (hospital next-action plan D1, D2) the same
        # Project or hospital with no Opportunity -- checked before
        # anything is saved.
        if not also_close_ids:
            return []
        if len(set(also_close_ids)) != len(also_close_ids) or reminder.id in also_close_ids:
            raise BusinessRuleViolation("Each next action can only be closed once.")
        first = reminder.activity
        others = []
        for other_id in also_close_ids:
            other = self.repository.get_by_id(other_id)
            if (
                not other
                or other.is_completed
                or other.assigned_to_user_id != reminder.assigned_to_user_id
                or not self._same_level(first, other.activity)
            ):
                raise BusinessRuleViolation(
                    "Next actions closed together must be open ones of the same person "
                    "on the same Opportunity, Project or hospital."
                )
            others.append(other)
        return others

    @staticmethod
    def _same_level(a: Activity, b: Activity) -> bool:
        # An Opportunity is its own level; with no Opportunity, the level is
        # the Project, or failing that the hospital.
        if a.opportunity_id or b.opportunity_id:
            return a.opportunity_id == b.opportunity_id
        if a.project_id or b.project_id:
            return a.project_id == b.project_id
        return a.account_id is not None and a.account_id == b.account_id

    def _require_follow_up_exemption(
        self,
        reminder: Reminder,
        original: Activity,
        produced_opportunity_id: uuid.UUID | None,
        closed_by: uuid.UUID,
    ) -> None:
        # BR-ACT-05 change (next-action rules plan, point 2): closing a next
        # action needs a follow-up, except (a) its Opportunity is Won or
        # Lost, or (b) a hospital-level or Project-level next action whose
        # visit produced a new Opportunity on the same hospital (plan D3;
        # Project level: hospital-next-action plan D12).
        if original.opportunity_id:
            if produced_opportunity_id:
                raise BusinessRuleViolation(
                    "A new Opportunity can only stand in for the follow-up on a hospital-level "
                    "or Project-level next action."
                )
            if self.repository.get_opportunity_status_code(original.opportunity_id) in {"WON", "LOST"}:
                return
            raise BusinessRuleViolation(
                "Closing a next action needs a follow-up next action, unless the Opportunity is Won or Lost."
            )
        if produced_opportunity_id and self.repository.opportunity_created_on_account_since(
            produced_opportunity_id, original.account_id, reminder.created_at, created_by=closed_by
        ):
            return
        raise BusinessRuleViolation(
            "Closing a next action needs a follow-up next action, "
            "unless this visit produced a new Opportunity on this hospital."
        )
