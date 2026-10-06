"""docs/Query-Load-Fixes-Implementation-Plan.md: the document lists joined 59
tables through Document's lazy="joined" relationships, and the existence
checks loaded the whole Opportunity/Product. DocumentResponse shows only the
document's own columns, so neither may join anything now."""

import uuid
from unittest.mock import MagicMock

from sqlalchemy.dialects import postgresql

from app.domains.document.repository import DocumentRepository


def _sql(stmt) -> str:
    return str(stmt.compile(dialect=postgresql.dialect())).lower()


def _list_sql(call) -> str:
    mock_db = MagicMock()
    mock_db.scalars.return_value.all.return_value = []
    call(DocumentRepository(mock_db))
    return _sql(mock_db.scalars.call_args.args[0])


def test_opportunity_documents_list_joins_nothing():
    assert " join " not in _list_sql(lambda repo: repo.list_by_opportunity(uuid.uuid4()))


def test_product_documents_list_joins_nothing():
    assert " join " not in _list_sql(lambda repo: repo.list_by_product(uuid.uuid4()))


def test_existence_checks_are_plain_id_lookups():
    mock_db = MagicMock()
    mock_db.scalar.return_value = 1
    repo = DocumentRepository(mock_db)

    assert repo.opportunity_exists(uuid.uuid4()) is True
    assert repo.product_exists(uuid.uuid4()) is True
    for call in mock_db.scalar.call_args_list:
        assert " join " not in _sql(call.args[0])
    mock_db.get.assert_not_called()


def test_existence_check_false_when_no_row():
    mock_db = MagicMock()
    mock_db.scalar.return_value = None
    assert DocumentRepository(mock_db).opportunity_exists(uuid.uuid4()) is False
