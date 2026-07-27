import uuid
from unittest.mock import MagicMock

from app.db.session import set_rls_context
from app.domains.organization.models import UserProfile


def _mock_user(*, zone_id: uuid.UUID | None) -> UserProfile:
    user = MagicMock(spec=UserProfile)
    user.id = uuid.uuid4()
    user.sbu_id = uuid.uuid4()
    user.role_id = uuid.uuid4()
    user.zone_id = zone_id
    return user


class TestSetRlsContext:
    def test_sets_user_sbu_and_role_session_variables(self):
        db = MagicMock()
        user = _mock_user(zone_id=uuid.uuid4())

        set_rls_context(db, user)

        calls = db.execute.call_args_list
        rendered = [(str(call.args[0]), call.args[1]) for call in calls]

        assert ("SET LOCAL app.current_user_id = :uid", {"uid": str(user.id)}) in rendered
        assert ("SET LOCAL app.current_sbu_id = :sid", {"sid": str(user.sbu_id)}) in rendered
        assert ("SET LOCAL app.current_role_id = :rid", {"rid": str(user.role_id)}) in rendered

    def test_sets_zone_session_variable_when_present(self):
        db = MagicMock()
        user = _mock_user(zone_id=uuid.uuid4())

        set_rls_context(db, user)

        calls = db.execute.call_args_list
        rendered = [(str(call.args[0]), call.args[1]) for call in calls]

        assert ("SET LOCAL app.current_zone_id = :zid", {"zid": str(user.zone_id)}) in rendered
        assert len(calls) == 4

    def test_skips_zone_session_variable_when_none(self):
        db = MagicMock()
        user = _mock_user(zone_id=None)

        set_rls_context(db, user)

        calls = db.execute.call_args_list
        assert len(calls) == 3
        for call in calls:
            assert "current_zone_id" not in str(call.args[0])
