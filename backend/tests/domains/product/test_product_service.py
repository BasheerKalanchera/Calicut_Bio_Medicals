import uuid
from decimal import Decimal
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
        "full_price_lakhs": None,
        "rep_floor_lakhs": None,
        "area_manager_floor_lakhs": None,
        "ceo_floor_lakhs": None,
        "cost_lakhs": None,
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
            offset=0, limit=10, search="sono", sbu_id=None, active_only=True, include_count=True
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


class TestListInactiveProducts:
    """Plan D5: only the GM and Admin may list inactive products; for anyone
    else the request is ignored, not refused."""

    @pytest.mark.parametrize("role_name", ["General Manager", "Admin"])
    def test_gm_and_admin_get_inactive_products_when_asked(self, role_name):
        repo = _make_repo()
        repo.list_products.return_value = ([], 0)

        ProductService(repository=repo).list_products(include_inactive=True, role_name=role_name)

        assert repo.list_products.call_args.kwargs["active_only"] is False

    @pytest.mark.parametrize("role_name", ["Sales Staff", "Area Manager", "SBU Manager", None])
    def test_everyone_else_still_gets_active_only(self, role_name):
        repo = _make_repo()
        repo.list_products.return_value = ([], 0)

        ProductService(repository=repo).list_products(include_inactive=True, role_name=role_name)

        assert repo.list_products.call_args.kwargs["active_only"] is True

    def test_gm_without_asking_gets_active_only(self):
        repo = _make_repo()
        repo.list_products.return_value = ([], 0)

        ProductService(repository=repo).list_products(role_name="General Manager")

        assert repo.list_products.call_args.kwargs["active_only"] is True

    def test_count_follows_the_same_rule(self):
        repo = _make_repo()
        repo.count_products.return_value = 0
        service = ProductService(repository=repo)

        service.count_products(include_inactive=True, role_name="Admin")
        assert repo.count_products.call_args.kwargs["active_only"] is False

        service.count_products(include_inactive=True, role_name="Sales Staff")
        assert repo.count_products.call_args.kwargs["active_only"] is True


class TestDeactivateProduct:
    @pytest.mark.parametrize("role_name", ["General Manager", "Admin"])
    def test_allowed_roles_can_deactivate(self, role_name):
        product = _make_product(is_active=True)
        repo = _make_repo()
        repo.get_by_id.return_value = product
        repo.update.return_value = product
        user_id = uuid.uuid4()

        result = ProductService(repository=repo).deactivate_product(
            product.id, updated_by=user_id, role_name=role_name
        )

        assert result is product
        assert product.is_active is False
        assert product.updated_by == user_id
        repo.update.assert_called_once_with(product)

    @pytest.mark.parametrize("role_name", ["Sales Staff", "Area Manager", "SBU Manager", "Marketing User"])
    def test_other_roles_are_refused(self, role_name):
        repo = _make_repo()

        with pytest.raises(AuthorizationError):
            ProductService(repository=repo).deactivate_product(
                uuid.uuid4(), updated_by=uuid.uuid4(), role_name=role_name
            )

        repo.get_by_id.assert_not_called()
        repo.update.assert_not_called()

    def test_unknown_product_raises_not_found(self):
        repo = _make_repo()
        repo.get_by_id.return_value = None

        with pytest.raises(NotFoundError):
            ProductService(repository=repo).deactivate_product(
                uuid.uuid4(), updated_by=uuid.uuid4(), role_name="Admin"
            )

    def test_already_inactive_is_a_conflict(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_product(is_active=False)

        with pytest.raises(ConflictError, match="already inactive"):
            ProductService(repository=repo).deactivate_product(
                uuid.uuid4(), updated_by=uuid.uuid4(), role_name="Admin"
            )

        repo.update.assert_not_called()

    def test_empty_active_flag_counts_as_active(self):
        """The column allows NULL (server default true); NULL can be deactivated."""
        repo = _make_repo()
        product = _make_product(is_active=None)
        repo.get_by_id.return_value = product
        repo.update.return_value = product

        ProductService(repository=repo).deactivate_product(product.id, updated_by=uuid.uuid4(), role_name="Admin")

        assert product.is_active is False
        repo.update.assert_called_once_with(product)

    def test_does_not_check_whether_the_product_is_in_use(self):
        """Plan D2/D3: a product on open Opportunities can still be deactivated;
        the pop-up only warns."""
        repo = _make_repo()
        product = _make_product(is_active=True)
        repo.get_by_id.return_value = product
        repo.update.return_value = product

        ProductService(repository=repo).deactivate_product(product.id, updated_by=uuid.uuid4(), role_name="Admin")

        repo.usage_counts.assert_not_called()


class TestReactivateProduct:
    @pytest.mark.parametrize("role_name", ["General Manager", "Admin"])
    def test_allowed_roles_can_reactivate(self, role_name):
        product = _make_product(is_active=False)
        repo = _make_repo()
        repo.get_by_id.return_value = product
        repo.active_product_exists_for_model.return_value = False
        repo.update.return_value = product
        user_id = uuid.uuid4()

        result = ProductService(repository=repo).reactivate_product(
            product.id, updated_by=user_id, role_name=role_name
        )

        assert result is product
        assert product.is_active is True
        assert product.updated_by == user_id
        repo.active_product_exists_for_model.assert_called_once_with(product.model_id, exclude_id=product.id)

    @pytest.mark.parametrize("role_name", ["Sales Staff", "Area Manager", "SBU Manager", "Marketing User"])
    def test_other_roles_are_refused(self, role_name):
        repo = _make_repo()

        with pytest.raises(AuthorizationError):
            ProductService(repository=repo).reactivate_product(
                uuid.uuid4(), updated_by=uuid.uuid4(), role_name=role_name
            )

        repo.update.assert_not_called()

    def test_refused_when_another_active_product_has_the_same_model(self):
        """Plan D6: the catalog allows one active product per model."""
        product = _make_product(is_active=False)
        repo = _make_repo()
        repo.get_by_id.return_value = product
        repo.active_product_exists_for_model.return_value = True

        with pytest.raises(ConflictError, match="another active product already exists"):
            ProductService(repository=repo).reactivate_product(
                product.id, updated_by=uuid.uuid4(), role_name="Admin"
            )

        assert product.is_active is False
        repo.update.assert_not_called()

    def test_already_active_is_a_conflict(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_product(is_active=True)

        with pytest.raises(ConflictError, match="already active"):
            ProductService(repository=repo).reactivate_product(
                uuid.uuid4(), updated_by=uuid.uuid4(), role_name="Admin"
            )

    def test_empty_active_flag_counts_as_already_active(self):
        repo = _make_repo()
        repo.get_by_id.return_value = _make_product(is_active=None)

        with pytest.raises(ConflictError, match="already active"):
            ProductService(repository=repo).reactivate_product(
                uuid.uuid4(), updated_by=uuid.uuid4(), role_name="Admin"
            )

        repo.update.assert_not_called()

    def test_unknown_product_raises_not_found(self):
        repo = _make_repo()
        repo.get_by_id.return_value = None

        with pytest.raises(NotFoundError):
            ProductService(repository=repo).reactivate_product(
                uuid.uuid4(), updated_by=uuid.uuid4(), role_name="Admin"
            )


class TestProductUsage:
    @pytest.mark.parametrize("role_name", ["General Manager", "Admin"])
    def test_returns_both_counts(self, role_name):
        product = _make_product()
        repo = _make_repo()
        repo.get_by_id.return_value = product
        repo.usage_counts.return_value = (3, 1)

        usage = ProductService(repository=repo).get_usage(product.id, role_name=role_name)

        assert usage.open_opportunity_count == 3
        assert usage.waiting_lead_count == 1
        repo.usage_counts.assert_called_once_with(product.id)

    def test_other_roles_are_refused(self):
        repo = _make_repo()

        with pytest.raises(AuthorizationError):
            ProductService(repository=repo).get_usage(uuid.uuid4(), role_name="Sales Staff")

        repo.usage_counts.assert_not_called()

    def test_unknown_product_raises_not_found(self):
        repo = _make_repo()
        repo.get_by_id.return_value = None

        with pytest.raises(NotFoundError):
            ProductService(repository=repo).get_usage(uuid.uuid4(), role_name="Admin")


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


class TestFirstCostFillsWonSales:
    """Margin Report plan D16: only a product's FIRST cost (empty -> a value)
    fills its Won sales that have no saved cost."""

    def _save(self, old_cost, data: ProductUpdate, role_name: str = "General Manager"):
        product = _make_product(cost_lakhs=old_cost)
        repo = _make_repo()
        repo.get_by_id.return_value = product
        repo.update.return_value = product
        ProductService(repository=repo).update_product(
            product.id, data, updated_by=uuid.uuid4(), role_name=role_name
        )
        return repo, product

    def test_first_cost_fills_with_the_product_id_and_the_new_cost(self):
        repo, product = self._save(None, ProductUpdate(cost_lakhs=Decimal("5.00")))
        repo.fill_empty_won_costs.assert_called_once_with(product.id, Decimal("5.00"))

    def test_fill_runs_after_the_product_is_saved(self):
        repo, _ = self._save(None, ProductUpdate(cost_lakhs=Decimal("5.00")))
        names = [c[0] for c in repo.method_calls if c[0] in ("update", "fill_empty_won_costs")]
        assert names == ["update", "fill_empty_won_costs"]

    def test_a_changed_cost_fills_nothing(self):
        repo, _ = self._save(Decimal("20.00"), ProductUpdate(cost_lakhs=Decimal("22.00")))
        repo.fill_empty_won_costs.assert_not_called()

    def test_a_save_that_leaves_the_cost_alone_fills_nothing(self):
        repo, _ = self._save(None, ProductUpdate(description="New Description"))
        repo.fill_empty_won_costs.assert_not_called()

    def test_clearing_the_cost_fills_nothing(self):
        repo, _ = self._save(Decimal("20.00"), ProductUpdate(cost_lakhs=None))
        repo.fill_empty_won_costs.assert_not_called()

    def test_a_refused_save_fills_nothing(self):
        repo = _make_repo()
        with pytest.raises(AuthorizationError):
            ProductService(repository=repo).update_product(
                uuid.uuid4(),
                ProductUpdate(cost_lakhs=Decimal("5.00")),
                updated_by=uuid.uuid4(),
                role_name="Sales Staff",
            )
        repo.fill_empty_won_costs.assert_not_called()
