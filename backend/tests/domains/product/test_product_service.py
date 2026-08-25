import uuid
from unittest.mock import MagicMock

import pytest

from app.core.exceptions import AuthorizationError, NotFoundError
from app.domains.product.models import Product
from app.domains.product.repository import ProductRepository
from app.domains.product.schemas import ProductCreate, ProductUpdate
from app.domains.product.service import ProductService


def _make_repo(**overrides) -> MagicMock:
    repo = MagicMock(spec=ProductRepository)
    for k, v in overrides.items():
        setattr(repo, k, v)
    return repo


def _make_product(**overrides) -> MagicMock:
    defaults = {
        "id": uuid.uuid4(),
        "sbu_id": uuid.uuid4(),
        "name": "SonoScape S50",
        "oem_name": "SonoScape",
        "model_number": "S50",
        "category_name": "Ultrasound",
        "description": "Premium ultrasound",
        "is_active": True,
    }
    defaults.update(overrides)
    obj = MagicMock(spec=Product)
    for k, v in defaults.items():
        setattr(obj, k, v)
    return obj


class TestGetProduct:
    def test_returns_product(self):
        product = _make_product()
        repo = _make_repo()
        repo.get_by_id.return_value = product

        service = ProductService(repository=repo)
        assert service.get_product(product.id) is product

    def test_raises_not_found(self):
        repo = _make_repo()
        repo.get_by_id.return_value = None

        service = ProductService(repository=repo)
        with pytest.raises(NotFoundError, match="Product"):
            service.get_product(uuid.uuid4())


class TestListProducts:
    def test_delegates_to_repository(self):
        repo = _make_repo()
        repo.list_products.return_value = ([], 0)

        service = ProductService(repository=repo)
        # No `brand` filter — ProductService.list_products() has no such
        # parameter today. Add one alongside a real test when brand
        # filtering is actually implemented.
        _results, total = service.list_products(
            offset=0, limit=10, search="sono", sbu_id=None
        )

        repo.list_products.assert_called_once_with(
            offset=0, limit=10, search="sono", sbu_id=None, include_count=True
        )
        assert total == 0

    def test_returns_products(self):
        product = _make_product()
        repo = _make_repo()
        repo.list_products.return_value = ([product], 1)

        service = ProductService(repository=repo)
        results, total = service.list_products()

        assert total == 1
        assert results[0] is product


class TestCreateProduct:
    def _data(self, **overrides) -> ProductCreate:
        defaults = {"name": "SonoScape S50", "sbu_id": uuid.uuid4()}
        defaults.update(overrides)
        return ProductCreate(**defaults)

    @pytest.mark.parametrize("role_name", ["General Manager", "Admin"])
    def test_allowed_roles_can_create(self, role_name):
        product = _make_product()
        repo = _make_repo()
        repo.sbu_exists.return_value = True
        repo.create.return_value = product

        service = ProductService(repository=repo)
        result = service.create_product(self._data(), created_by=uuid.uuid4(), role_name=role_name)

        assert result is product
        repo.create.assert_called_once()

    def test_disallowed_roles_raise_authorization_error(self):
        repo = _make_repo()

        service = ProductService(repository=repo)
        with pytest.raises(AuthorizationError):
            service.create_product(self._data(), created_by=uuid.uuid4(), role_name="Sales Staff")

        repo.sbu_exists.assert_not_called()
        repo.create.assert_not_called()

    def test_defaults_product_type_to_new_equipment(self):
        repo = _make_repo()
        repo.sbu_exists.return_value = True
        repo.create.side_effect = lambda product: product

        service = ProductService(repository=repo)
        result = service.create_product(self._data(), created_by=uuid.uuid4(), role_name="Admin")

        assert result.product_type == "NEW_EQUIPMENT"

    def test_passes_through_explicit_product_type(self):
        repo = _make_repo()
        repo.sbu_exists.return_value = True
        repo.create.side_effect = lambda product: product

        service = ProductService(repository=repo)
        result = service.create_product(
            self._data(product_type="REFURBISHED"), created_by=uuid.uuid4(), role_name="Admin"
        )

        assert result.product_type == "REFURBISHED"


class TestUpdateProduct:
    @pytest.mark.parametrize("role_name", ["General Manager", "Admin"])
    def test_allowed_roles_can_update(self, role_name):
        product = _make_product()
        repo = _make_repo()
        repo.get_by_id.return_value = product
        repo.update.return_value = product

        service = ProductService(repository=repo)
        result = service.update_product(
            product.id, ProductUpdate(name="New Name"), updated_by=uuid.uuid4(), role_name=role_name
        )

        assert result is product
        repo.update.assert_called_once()

    def test_disallowed_roles_raise_authorization_error(self):
        repo = _make_repo()

        service = ProductService(repository=repo)
        with pytest.raises(AuthorizationError):
            service.update_product(
                uuid.uuid4(), ProductUpdate(name="New Name"), updated_by=uuid.uuid4(), role_name="Sales Staff"
            )

        repo.get_by_id.assert_not_called()
        repo.update.assert_not_called()
