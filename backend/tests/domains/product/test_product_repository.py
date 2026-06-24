import uuid
from unittest.mock import MagicMock

from app.domains.product.models import Product
from app.domains.product.repository import ProductRepository


def _make_product(**overrides) -> MagicMock:
    defaults = {
        "id": uuid.uuid4(),
        "sbu_id": uuid.uuid4(),
        "name": "SonoScape S50",
        "oem_name": "SonoScape",
        "model_number": "S50",
        "category_name": "Ultrasound",
        "is_active": True,
    }
    defaults.update(overrides)
    obj = MagicMock(spec=Product)
    for k, v in defaults.items():
        setattr(obj, k, v)
    return obj


class TestProductRepositoryGetById:
    def test_returns_product_when_found(self):
        product = _make_product()
        mock_db = MagicMock()
        mock_db.get.return_value = product

        repo = ProductRepository(mock_db)
        assert repo.get_by_id(product.id) is product

    def test_returns_none_when_not_found(self):
        mock_db = MagicMock()
        mock_db.get.return_value = None

        repo = ProductRepository(mock_db)
        assert repo.get_by_id(uuid.uuid4()) is None


class TestProductRepositoryListProducts:
    def test_returns_products_and_total(self):
        product = _make_product()
        mock_db = MagicMock()
        mock_db.scalar.return_value = 1
        mock_db.scalars.return_value.unique.return_value.all.return_value = [product]

        repo = ProductRepository(mock_db)
        results, total = repo.list_products()

        assert total == 1
        assert len(results) == 1

    def test_returns_empty_when_no_products(self):
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0
        mock_db.scalars.return_value.unique.return_value.all.return_value = []

        repo = ProductRepository(mock_db)
        results, total = repo.list_products()

        assert total == 0
        assert results == []

    def test_applies_pagination(self):
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0
        mock_db.scalars.return_value.unique.return_value.all.return_value = []

        repo = ProductRepository(mock_db)
        repo.list_products(offset=10, limit=5)

        mock_db.scalars.assert_called_once()
