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

        # One round trip, not three: all context vars are set via a single
        # set_config(...) statement (see set_rls_context's docstring).
        calls = db.execute.call_args_list
        assert len(calls) == 1
        sql, params = str(calls[0].args[0]), calls[0].args[1]
        assert "set_config('app.current_user_id', :uid, true)" in sql
        assert "set_config('app.current_sbu_id', :sid, true)" in sql
        assert "set_config('app.current_role_id', :rid, true)" in sql
        assert params == {
            "uid": str(user.id),
            "sid": str(user.sbu_id),
            "rid": str(user.role_id),
        }
