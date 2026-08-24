"""
Unit tests for NotificationRepository's query-shaping methods. Repository is
exercised against a mocked DB (no real SQL execution) -- the generated
WHERE clause is compiled to a SQL string and asserted against, mirroring
tests/domains/activity/test_activity_repository.py's pattern. These are the
two queries most load-bearing for correctness: mark_read_for_entity must
scope strictly to (recipient, entity), and count_unread/list_urgent_unread
must always filter read_at IS NULL -- both are what the header-bell/urgent-
dialog poll relies on.
"""

import uuid
from unittest.mock import MagicMock

from app.domains.notification.repository import NotificationRepository

USER_ID = uuid.uuid4()
OPP_ID = uuid.uuid4()


def _compiled(clause) -> str:
    return str(clause.compile(compile_kwargs={"literal_binds": True}))


class TestMarkReadForEntity:
    def test_scopes_to_recipient_entity_and_unread_only(self):
        mock_db = MagicMock()
        repo = NotificationRepository(mock_db)

        repo.mark_read_for_entity(USER_ID, "opportunity", OPP_ID)

        stmt = mock_db.execute.call_args.args[0]
        sql = _compiled(stmt.whereclause)
        assert f"notification.recipient_user_id = '{USER_ID.hex}'" in sql
        assert "notification.entity_type = 'opportunity'" in sql
        assert f"notification.entity_id = '{OPP_ID.hex}'" in sql
        assert "notification.read_at IS NULL" in sql


class TestCountUnread:
    def test_filters_recipient_and_unread_only(self):
        mock_db = MagicMock()
        mock_db.execute.return_value.one.return_value = (0, 0)
        repo = NotificationRepository(mock_db)

        repo.count_unread(USER_ID)

        stmt = mock_db.execute.call_args.args[0]
        sql = _compiled(stmt.whereclause)
        assert f"notification.recipient_user_id = '{USER_ID.hex}'" in sql
        assert "notification.read_at IS NULL" in sql


class TestListUrgentUnread:
    def test_filters_recipient_urgent_and_unread_only(self):
        mock_db = MagicMock()
        mock_db.execute.return_value.all.return_value = []
        repo = NotificationRepository(mock_db)

        repo.list_urgent_unread(USER_ID)

        stmt = mock_db.execute.call_args.args[0]
        sql = _compiled(stmt.whereclause)
        assert f"notification.recipient_user_id = '{USER_ID.hex}'" in sql
        assert "notification.is_urgent = true" in sql
        assert "notification.read_at IS NULL" in sql
