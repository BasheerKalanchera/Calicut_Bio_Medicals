"""
Unit tests for MarketingLeadCommentService. Repository is fully mocked -- no
DB required. Mirrors test_activity_service.py's ActivityCommentService tests
exactly (same fan-out rule, docs/Lead-Followup-Comments-Implementation-Plan.md).
"""

import uuid
from datetime import UTC, datetime
from unittest.mock import MagicMock

import pytest

from app.core.exceptions import NotFoundError
from app.domains.marketing_lead.models import MarketingLeadComment
from app.domains.marketing_lead.repository import MarketingLeadCommentRepository
from app.domains.marketing_lead.schemas import MarketingLeadCommentCreate
from app.domains.marketing_lead.service import MarketingLeadCommentService
from app.domains.notification.service import NotificationService

LEAD_ID = uuid.uuid4()
USER_ID = uuid.uuid4()
ACTOR_ID = uuid.uuid4()
NOW = datetime(2026, 9, 18, 8, 0, 0, tzinfo=UTC)


def _make_repo() -> MagicMock:
    repo = MagicMock(spec=MarketingLeadCommentRepository)
    repo.lead_exists.return_value = True
    repo.list_for_lead.return_value = []
    repo.get_lead_owner_id.return_value = USER_ID
    repo.list_distinct_commenter_ids.return_value = []
    return repo


def _make_notification_service() -> MagicMock:
    return MagicMock(spec=NotificationService)


def _make_comment(**overrides) -> MarketingLeadComment:
    c = MagicMock(spec=MarketingLeadComment)
    c.id = overrides.get("id", uuid.uuid4())
    c.marketing_lead_id = overrides.get("marketing_lead_id", LEAD_ID)
    c.body = overrides.get("body", "Called, waiting on their procurement sign-off")
    c.created_by = overrides.get("created_by", ACTOR_ID)
    c.created_at = NOW
    return c


# ---------------------------------------------------------------------------
# MarketingLeadCommentService.list_for_lead
# ---------------------------------------------------------------------------

class TestListMarketingLeadComments:
    def test_raises_not_found_when_lead_missing(self):
        repo = _make_repo()
        repo.lead_exists.return_value = False
        svc = MarketingLeadCommentService(repository=repo, notification_service=_make_notification_service())

        with pytest.raises(NotFoundError):
            svc.list_for_lead(LEAD_ID)

    def test_returns_comments_from_repo(self):
        repo = _make_repo()
        comments = [_make_comment(), _make_comment()]
        repo.list_for_lead.return_value = comments
        svc = MarketingLeadCommentService(repository=repo, notification_service=_make_notification_service())

        result = svc.list_for_lead(LEAD_ID)

        assert result == comments


# ---------------------------------------------------------------------------
# MarketingLeadCommentService.create_comment
# ---------------------------------------------------------------------------

class TestCreateMarketingLeadComment:
    def test_raises_not_found_when_lead_missing(self):
        repo = _make_repo()
        repo.lead_exists.return_value = False
        svc = MarketingLeadCommentService(repository=repo, notification_service=_make_notification_service())

        with pytest.raises(NotFoundError):
            svc.create_comment(LEAD_ID, MarketingLeadCommentCreate(body="Hi"), author_id=ACTOR_ID)

    def test_created_by_set_to_author_id(self):
        repo = _make_repo()
        repo.create.return_value = _make_comment()
        svc = MarketingLeadCommentService(repository=repo, notification_service=_make_notification_service())

        svc.create_comment(LEAD_ID, MarketingLeadCommentCreate(body="Hi"), author_id=ACTOR_ID)

        call_args = repo.create.call_args[0][0]
        assert call_args.created_by == ACTOR_ID

    def test_lead_id_and_body_set_correctly(self):
        repo = _make_repo()
        repo.create.return_value = _make_comment()
        svc = MarketingLeadCommentService(repository=repo, notification_service=_make_notification_service())

        svc.create_comment(LEAD_ID, MarketingLeadCommentCreate(body="Called, no answer"), author_id=ACTOR_ID)

        call_args = repo.create.call_args[0][0]
        assert call_args.marketing_lead_id == LEAD_ID
        assert call_args.body == "Called, no answer"

    def test_returns_comment_from_repo(self):
        repo = _make_repo()
        comment = _make_comment()
        repo.create.return_value = comment
        svc = MarketingLeadCommentService(repository=repo, notification_service=_make_notification_service())

        result = svc.create_comment(LEAD_ID, MarketingLeadCommentCreate(body="Hi"), author_id=ACTOR_ID)

        assert result is comment


# ---------------------------------------------------------------------------
# MarketingLeadCommentService.create_comment -- notification fan-out
# (same Decision-4 shape as Activity Comments: the lead's assigned rep plus
# everyone who's already commented, minus whoever's posting right now)
# ---------------------------------------------------------------------------

class TestCreateMarketingLeadCommentNotificationFanOut:
    def _recipients(self, notification_service: MagicMock) -> set:
        return {
            call.kwargs["recipient_user_id"]
            for call in notification_service.notify_marketing_lead_comment_added.call_args_list
        }

    def test_first_comment_notifies_only_the_assigned_rep(self):
        repo = _make_repo()
        repo.get_lead_owner_id.return_value = USER_ID
        repo.list_distinct_commenter_ids.return_value = []
        repo.create.return_value = _make_comment()
        notification_service = _make_notification_service()
        svc = MarketingLeadCommentService(repository=repo, notification_service=notification_service)

        svc.create_comment(LEAD_ID, MarketingLeadCommentCreate(body="Please follow up"), author_id=ACTOR_ID)

        assert self._recipients(notification_service) == {USER_ID}

    def test_rep_replying_to_their_own_lead_notifies_no_one(self):
        # The lead's assigned rep is the one posting, and nobody else has
        # commented yet -- there's genuinely no one else in the thread.
        repo = _make_repo()
        repo.get_lead_owner_id.return_value = ACTOR_ID
        repo.list_distinct_commenter_ids.return_value = []
        repo.create.return_value = _make_comment()
        notification_service = _make_notification_service()
        svc = MarketingLeadCommentService(repository=repo, notification_service=notification_service)

        svc.create_comment(LEAD_ID, MarketingLeadCommentCreate(body="Called, no answer"), author_id=ACTOR_ID)

        notification_service.notify_marketing_lead_comment_added.assert_not_called()

    def test_rep_replying_after_someone_else_commented_notifies_that_person(self):
        other_commenter = uuid.uuid4()
        repo = _make_repo()
        repo.get_lead_owner_id.return_value = ACTOR_ID
        repo.list_distinct_commenter_ids.return_value = [other_commenter]
        repo.create.return_value = _make_comment()
        notification_service = _make_notification_service()
        svc = MarketingLeadCommentService(repository=repo, notification_service=notification_service)

        svc.create_comment(LEAD_ID, MarketingLeadCommentCreate(body="On it"), author_id=ACTOR_ID)

        assert self._recipients(notification_service) == {other_commenter}

    def test_multi_person_thread_notifies_everyone_except_the_poster(self):
        owner_id = uuid.uuid4()
        first_commenter = uuid.uuid4()
        second_commenter = uuid.uuid4()
        repo = _make_repo()
        repo.get_lead_owner_id.return_value = owner_id
        repo.list_distinct_commenter_ids.return_value = [first_commenter, second_commenter]
        repo.create.return_value = _make_comment()
        notification_service = _make_notification_service()
        svc = MarketingLeadCommentService(repository=repo, notification_service=notification_service)

        svc.create_comment(LEAD_ID, MarketingLeadCommentCreate(body="Reply"), author_id=first_commenter)

        assert self._recipients(notification_service) == {owner_id, second_commenter}

    def test_owner_already_among_prior_commenters_is_notified_only_once(self):
        owner_id = uuid.uuid4()
        repo = _make_repo()
        repo.get_lead_owner_id.return_value = owner_id
        repo.list_distinct_commenter_ids.return_value = [owner_id]
        repo.create.return_value = _make_comment()
        notification_service = _make_notification_service()
        svc = MarketingLeadCommentService(repository=repo, notification_service=notification_service)

        svc.create_comment(LEAD_ID, MarketingLeadCommentCreate(body="Reply"), author_id=ACTOR_ID)

        notification_service.notify_marketing_lead_comment_added.assert_called_once()
        assert self._recipients(notification_service) == {owner_id}

    def test_notify_call_carries_correct_lead_and_actor(self):
        repo = _make_repo()
        repo.get_lead_owner_id.return_value = USER_ID
        repo.list_distinct_commenter_ids.return_value = []
        repo.create.return_value = _make_comment()
        notification_service = _make_notification_service()
        svc = MarketingLeadCommentService(repository=repo, notification_service=notification_service)

        svc.create_comment(LEAD_ID, MarketingLeadCommentCreate(body="Hi"), author_id=ACTOR_ID)

        call = notification_service.notify_marketing_lead_comment_added.call_args
        assert call.kwargs["marketing_lead_id"] == LEAD_ID
        assert call.kwargs["actor_id"] == ACTOR_ID
