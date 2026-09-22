import uuid
from unittest.mock import MagicMock

import pytest

from app.core.exceptions import AuthorizationError, ConflictError, NotFoundError
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
        "name": "SonoScape S50 Ultrasound",
        "brand_id": uuid.uuid4(),
        "model_id": uuid.uuid4(),
        "category_id": uuid.uuid4(),
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
        defaults = {"sbu_id": uuid.uuid4(), "model_id": uuid.uuid4()}
        defaults.update(overrides)
        return ProductCreate(**defaults)

    @pytest.mark.parametrize("role_name", ["General Manager", "Admin"])
    def test_allowed_roles_can_create(self, role_name):
        product = _make_product()
        repo = _make_repo()
        repo.sbu_exists.return_value = True
        repo.active_product_exists_for_model.return_value = False
        repo.create.return_value = product
        data = self._data()
        repo.get_model_sbu_id.return_value = data.sbu_id

        service = ProductService(repository=repo)
        result = service.create_product(data, created_by=uuid.uuid4(), role_name=role_name)

        assert result is product
        repo.create.assert_called_once()

    def test_disallowed_roles_raise_authorization_error(self):
        repo = _make_repo()

        service = ProductService(repository=repo)
        with pytest.raises(AuthorizationError):
            service.create_product(self._data(), created_by=uuid.uuid4(), role_name="Sales Staff")

        repo.sbu_exists.assert_not_called()
        repo.create.assert_not_called()

    def test_rejects_a_second_active_product_for_the_same_model(self):
        """Found live, 2026-09-22: nothing stopped a duplicate catalog entry
        for a Model that already had an active Product -- the screen would
        silently create a second, identically-named row. Backed by the
        uq_product_model_id_active partial index (migration 0052); this is
        the friendly pre-check ahead of that DB constraint."""
        repo = _make_repo()
        repo.sbu_exists.return_value = True
        repo.active_product_exists_for_model.return_value = True
        data = self._data()
        repo.get_model_sbu_id.return_value = data.sbu_id

        service = ProductService(repository=repo)
        with pytest.raises(ConflictError, match="already exists"):
            service.create_product(data, created_by=uuid.uuid4(), role_name="Admin")
        repo.create.assert_not_called()

    def test_defaults_product_type_to_new_equipment(self):
        repo = _make_repo()
        repo.sbu_exists.return_value = True
        repo.active_product_exists_for_model.return_value = False
        repo.create.side_effect = lambda product: product
        data = self._data()
        repo.get_model_sbu_id.return_value = data.sbu_id

        service = ProductService(repository=repo)
        result = service.create_product(data, created_by=uuid.uuid4(), role_name="Admin")

        assert result.product_type == "NEW_EQUIPMENT"

    def test_passes_through_explicit_product_type(self):
        repo = _make_repo()
        repo.sbu_exists.return_value = True
        repo.active_product_exists_for_model.return_value = False
        repo.create.side_effect = lambda product: product
        data = self._data(product_type="REFURBISHED")
        repo.get_model_sbu_id.return_value = data.sbu_id

        service = ProductService(repository=repo)
        result = service.create_product(data, created_by=uuid.uuid4(), role_name="Admin")

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
            product.id, ProductUpdate(description="New Description"), updated_by=uuid.uuid4(), role_name=role_name
        )

        assert result is product
        repo.update.assert_called_once()

    def test_disallowed_roles_raise_authorization_error(self):
        repo = _make_repo()

        service = ProductService(repository=repo)
        with pytest.raises(AuthorizationError):
            service.update_product(
                uuid.uuid4(),
                ProductUpdate(description="New Description"),
                updated_by=uuid.uuid4(),
                role_name="Sales Staff",
            )

        repo.get_by_id.assert_not_called()
        repo.update.assert_not_called()

    def test_rejects_moving_to_a_model_another_active_product_already_uses(self):
        product = _make_product()
        new_model_id = uuid.uuid4()
        repo = _make_repo()
        repo.get_by_id.return_value = product
        repo.get_model_sbu_id.return_value = product.sbu_id
        repo.active_product_exists_for_model.return_value = True

        service = ProductService(repository=repo)
        with pytest.raises(ConflictError, match="already exists"):
            service.update_product(
                product.id, ProductUpdate(model_id=new_model_id), updated_by=uuid.uuid4(), role_name="Admin"
            )
        repo.active_product_exists_for_model.assert_called_once_with(new_model_id, exclude_id=product.id)
        repo.update.assert_not_called()

    def test_moving_to_the_products_own_current_model_is_not_a_conflict(self):
        """A no-op model_id (re-saving the same value) must not trigger the
        duplicate check against itself."""
        product = _make_product()
        repo = _make_repo()
        repo.get_by_id.return_value = product
        repo.get_model_sbu_id.return_value = product.sbu_id
        repo.update.return_value = product

        service = ProductService(repository=repo)
        service.update_product(
            product.id, ProductUpdate(model_id=product.model_id), updated_by=uuid.uuid4(), role_name="Admin"
        )

        repo.active_product_exists_for_model.assert_not_called()
