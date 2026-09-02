"""
Unit tests for NotificationService.

Repository is fully mocked — no DB required. Tests cover:
  - notify_opportunity_assigned: always is_urgent=False as of the Lead
    Management change (docs/Lead-Management-Implementation-Plan.md) --
    IndiaMART's 4-hour SLA is now met by the Marketing User directly on
    IndiaMART's platform, before anything reaches this notification.
  - pass-through methods (list_for_user, list_urgent_unread, count_unread,
    mark_read_for_entity) delegate to the repository unchanged
"""

import uuid
from unittest.mock import MagicMock

from app.domains.notification.repository import NotificationRepository
from app.domains.notification.service import NotificationService

RECIPIENT_ID = uuid.uuid4()
OPP_ID = uuid.uuid4()
ACTOR_ID = uuid.uuid4()


def _make_repo() -> MagicMock:
    repo = MagicMock(spec=NotificationRepository)
    repo.create.side_effect = lambda obj: obj
    return repo


class TestNotifyOpportunityAssigned:
    def test_is_never_urgent(self):
        service = NotificationService(repository=_make_repo())

        notification = service.notify_opportunity_assigned(
            recipient_user_id=RECIPIENT_ID,
            opportunity_id=OPP_ID,
            actor_id=ACTOR_ID,
        )

        assert notification.is_urgent is False

    def test_created_row_shape(self):
        repo = _make_repo()
        service = NotificationService(repository=repo)

        service.notify_opportunity_assigned(
            recipient_user_id=RECIPIENT_ID,
            opportunity_id=OPP_ID,
            actor_id=ACTOR_ID,
        )

        created = repo.create.call_args[0][0]
        assert created.recipient_user_id == RECIPIENT_ID
        assert created.type == "OPPORTUNITY_ASSIGNED"
        assert created.entity_type == "opportunity"
        assert created.entity_id == OPP_ID
        assert created.created_by == ACTOR_ID


class TestNotifyGateOverrideNamed:
    def test_created_row_shape(self):
        repo = _make_repo()
        service = NotificationService(repository=repo)

        service.notify_gate_override_named(
            recipient_user_id=RECIPIENT_ID,
            opportunity_id=OPP_ID,
            actor_id=ACTOR_ID,
        )

        created = repo.create.call_args[0][0]
        assert created.recipient_user_id == RECIPIENT_ID
        assert created.type == "GATE_OVERRIDE_NAMED"
        assert created.entity_type == "opportunity"
        assert created.entity_id == OPP_ID
        assert created.created_by == ACTOR_ID

    def test_is_never_urgent(self):
        service = NotificationService(repository=_make_repo())

        notification = service.notify_gate_override_named(
            recipient_user_id=RECIPIENT_ID,
            opportunity_id=OPP_ID,
            actor_id=ACTOR_ID,
        )

        assert notification.is_urgent is False


class TestPassThroughMethods:
    def test_list_for_user_delegates(self):
        repo = _make_repo()
        repo.list_for_user.return_value = ["row"]
        service = NotificationService(repository=repo)

        result = service.list_for_user(RECIPIENT_ID, limit=5)

        repo.list_for_user.assert_called_once_with(RECIPIENT_ID, limit=5)
        assert result == ["row"]

    def test_list_urgent_unread_delegates(self):
        repo = _make_repo()
        repo.list_urgent_unread.return_value = ["row"]
        service = NotificationService(repository=repo)

        result = service.list_urgent_unread(RECIPIENT_ID)

        repo.list_urgent_unread.assert_called_once_with(RECIPIENT_ID)
        assert result == ["row"]

    def test_count_unread_delegates(self):
        repo = _make_repo()
        repo.count_unread.return_value = (3, 1)
        service = NotificationService(repository=repo)

        result = service.count_unread(RECIPIENT_ID)

        repo.count_unread.assert_called_once_with(RECIPIENT_ID)
        assert result == (3, 1)

    def test_mark_read_for_entity_delegates(self):
        repo = _make_repo()
        service = NotificationService(repository=repo)

        service.mark_read_for_entity(RECIPIENT_ID, "opportunity", OPP_ID)

        repo.mark_read_for_entity.assert_called_once_with(RECIPIENT_ID, "opportunity", OPP_ID)
