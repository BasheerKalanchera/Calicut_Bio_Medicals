import uuid
from unittest.mock import MagicMock

from app.domains.reference.models import Zone
from app.domains.reference.repository import ZoneRepository


def _make_zone(**overrides) -> MagicMock:
    defaults = {"id": uuid.uuid4(), "name": "Test Zone", "parent_zone_id": None}
    defaults.update(overrides)
    zone = MagicMock(spec=Zone)
    for k, v in defaults.items():
        setattr(zone, k, v)
    return zone


class TestZoneExists:
    def test_true_when_found(self):
        mock_db = MagicMock()
        mock_db.get.return_value = _make_zone()
        repo = ZoneRepository(mock_db)

        assert repo.zone_exists(uuid.uuid4()) is True

    def test_false_when_not_found(self):
        mock_db = MagicMock()
        mock_db.get.return_value = None
        repo = ZoneRepository(mock_db)

        assert repo.zone_exists(uuid.uuid4()) is False


class TestGetParentId:
    def test_returns_scalar_result(self):
        parent_id = uuid.uuid4()
        mock_db = MagicMock()
        mock_db.scalar.return_value = parent_id
        repo = ZoneRepository(mock_db)

        assert repo.get_parent_id(uuid.uuid4()) == parent_id

    def test_returns_none_for_root_zone(self):
        mock_db = MagicMock()
        mock_db.scalar.return_value = None
        repo = ZoneRepository(mock_db)

        assert repo.get_parent_id(uuid.uuid4()) is None


class TestGetTree:
    def test_returns_root_zones_only(self):
        roots = [_make_zone(name="Kerala"), _make_zone(name="Karnataka")]
        mock_db = MagicMock()
        mock_db.scalars.return_value.all.return_value = roots
        repo = ZoneRepository(mock_db)

        result = repo.get_tree()

        assert result == roots


class TestRebuildAllClosure:
    def test_deletes_then_inserts_via_recursive_cte_in_one_transaction(self):
        """Asserts the shape (delete, then a single recursive-CTE insert,
        then flush) without asserting the exact SQL string -- that's covered
        by manual verification against a real Postgres connection (schema-
        level unit tests can't exercise real recursive-CTE execution
        correctness, same caveat as every RLS-adjacent test this session).

        DELETE, not TRUNCATE: cabio_app (the app's runtime DB role) isn't
        granted TRUNCATE on zone_closure -- confirmed live on Dev when this
        used TRUNCATE and failed with InsufficientPrivilege.
        """
        mock_db = MagicMock()
        repo = ZoneRepository(mock_db)

        repo.rebuild_all_closure()

        assert mock_db.execute.call_count == 2
        delete_call, insert_call = mock_db.execute.call_args_list
        delete_text = str(delete_call.args[0])
        insert_text = str(insert_call.args[0])
        assert "DELETE FROM zone_closure" in delete_text
        assert "INSERT INTO zone_closure" in insert_text
        assert "WITH RECURSIVE" in insert_text
        mock_db.flush.assert_called_once()


class TestBlastRadius:
    def test_returns_account_and_user_counts(self):
        mock_db = MagicMock()
        mock_db.scalar.side_effect = [5, 2]  # account_count, then user_count
        repo = ZoneRepository(mock_db)

        result = repo.blast_radius(uuid.uuid4())

        assert result == (5, 2)

    def test_defaults_to_zero_when_scalar_returns_none(self):
        mock_db = MagicMock()
        mock_db.scalar.side_effect = [None, None]
        repo = ZoneRepository(mock_db)

        result = repo.blast_radius(uuid.uuid4())

        assert result == (0, 0)
