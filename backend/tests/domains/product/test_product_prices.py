"""Product prices and cost (migration 0066; docs/Product-Pricing-And-Cost-
Implementation-Plan.md step 1). Who sees which figure is BR-CAT-04 and is
decided server-side only, in product/schemas.py."""

import uuid
from decimal import Decimal
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.domains.account.workspace_schemas import ProductNested as AccountProductNested
from app.domains.opportunity.schemas import ProductNested as OpportunityProductNested
from app.domains.product.schemas import ProductCreate, ProductUpdate
from app.domains.product.service import ProductService
from tests.domains.product.test_product_router import (
    TEST_PRODUCT_ID,
    _mock_product,
    _setup_overrides,
    _teardown_overrides,
)

_PRICES = {
    "full_price_lakhs": Decimal("35.00"),
    "rep_floor_lakhs": Decimal("31.50"),
    "area_manager_floor_lakhs": Decimal("29.00"),
    "ceo_floor_lakhs": Decimal("27.00"),
    "cost_lakhs": Decimal("24.00"),
}
_PRICE_KEYS = set(_PRICES)


def _get_prices(client: TestClient, role_name: str, path: str = f"/api/v1/products/{TEST_PRODUCT_ID}"):
    mock_db = MagicMock()
    mock_db.scalar.return_value = 1
    product = _mock_product(**_PRICES)
    mock_db.get.return_value = product
    mock_db.scalars.return_value.unique.return_value.all.return_value = [product]
    mock_db.scalars.return_value.unique.return_value.first.return_value = product
    mock_db.scalar_one_or_none.return_value = product
    _setup_overrides(mock_db, role_name)
    try:
        response = client.get(path)
    finally:
        _teardown_overrides()
    assert response.status_code == 200, response.text
    return response.json()["data"]


class TestProductPageVisibility:
    @pytest.mark.parametrize("role_name", ["Admin", "General Manager"])
    def test_admin_and_general_manager_see_all_five(self, client, role_name):
        prices = _get_prices(client, role_name)["prices"]
        assert set(prices) == _PRICE_KEYS
        assert Decimal(prices["cost_lakhs"]) == Decimal("24.00")

    def test_area_manager_sees_full_and_own_lowest_only(self, client):
        prices = _get_prices(client, "Area Manager")["prices"]
        assert set(prices) == {"full_price_lakhs", "area_manager_floor_lakhs"}

    def test_sbu_manager_sees_area_managers_lowest_for_now(self, client):
        prices = _get_prices(client, "SBU Manager")["prices"]
        assert set(prices) == {"full_price_lakhs", "area_manager_floor_lakhs"}

    @pytest.mark.parametrize("role_name", ["Sales Staff", "Sales Executive"])
    def test_rep_sees_full_and_rep_lowest_only(self, client, role_name):
        prices = _get_prices(client, role_name)["prices"]
        assert set(prices) == {"full_price_lakhs", "rep_floor_lakhs"}

    def test_marketing_user_sees_no_prices(self, client):
        assert _get_prices(client, "Marketing User")["prices"] is None

    @pytest.mark.parametrize("role_name", ["Sales Staff", "Area Manager", "SBU Manager", "Marketing User"])
    def test_hidden_figures_are_absent_not_null(self, client, role_name):
        body = _get_prices(client, role_name)
        text = str(body)
        assert "cost_lakhs" not in text
        assert "ceo_floor_lakhs" not in text

    def test_rep_never_sees_a_higher_roles_lowest(self, client):
        prices = _get_prices(client, "Sales Staff")["prices"]
        assert "area_manager_floor_lakhs" not in prices
        assert "ceo_floor_lakhs" not in prices

    def test_unentered_prices_are_left_out(self, client):
        mock_db = MagicMock()
        mock_db.get.return_value = _mock_product(full_price_lakhs=Decimal("35.00"))
        mock_db.scalars.return_value.unique.return_value.first.return_value = mock_db.get.return_value
        mock_db.scalar_one_or_none.return_value = mock_db.get.return_value
        _setup_overrides(mock_db, "Admin")
        try:
            client_response = client.get(f"/api/v1/products/{TEST_PRODUCT_ID}")
        finally:
            _teardown_overrides()
        assert client_response.status_code == 200
        assert set(client_response.json()["data"]["prices"]) == {"full_price_lakhs"}


class TestProductListVisibility:
    @pytest.mark.parametrize("role_name", ["Admin", "General Manager"])
    def test_admin_and_general_manager_list_carries_full_price_and_cost(self, client, role_name):
        item = _get_prices(client, role_name, "/api/v1/products")["items"][0]
        assert set(item["prices"]) == {"full_price_lakhs", "cost_lakhs"}

    @pytest.mark.parametrize(
        "role_name", ["Sales Staff", "Sales Executive", "Area Manager", "SBU Manager", "Marketing User"]
    )
    def test_everyone_else_list_carries_no_prices(self, client, role_name):
        item = _get_prices(client, role_name, "/api/v1/products")["items"][0]
        assert item["prices"] is None
        assert "_lakhs" not in str(item)


class TestOtherSchemasCarryNoPrices:
    """Opportunity and Customer pages nest a slim product; a price or cost
    there would reach every role that can open them (BR-CAT-04)."""

    @pytest.mark.parametrize("schema", [OpportunityProductNested, AccountProductNested])
    def test_no_price_or_cost_field(self, schema):
        leaked = [name for name in schema.model_fields if "price" in name or "floor" in name or "cost" in name]
        assert leaked == []


class TestPriceInput:
    def test_create_accepts_prices(self):
        data = ProductCreate(sbu_id=uuid.uuid4(), model_id=uuid.uuid4(), **_PRICES)
        assert data.full_price_lakhs == Decimal("35.00")

    def test_create_prices_default_to_none(self):
        data = ProductCreate(sbu_id=uuid.uuid4(), model_id=uuid.uuid4())
        assert all(getattr(data, key) is None for key in _PRICE_KEYS)

    def test_negative_price_is_rejected(self):
        with pytest.raises(ValidationError):
            ProductUpdate(rep_floor_lakhs=Decimal("-1"))

    def test_more_than_two_decimals_is_rejected(self):
        with pytest.raises(ValidationError):
            ProductUpdate(full_price_lakhs=Decimal("35.123"))

    def test_update_can_clear_a_price_with_explicit_null(self):
        data = ProductUpdate(rep_floor_lakhs=None)
        assert data.model_dump(exclude_unset=True) == {"rep_floor_lakhs": None}

    def test_update_leaves_unsent_prices_alone(self):
        assert ProductUpdate(description="x").model_dump(exclude_unset=True) == {"description": "x"}


def _create_with(**prices):
    from app.domains.product.repository import ProductRepository

    repo = MagicMock(spec=ProductRepository)
    repo.sbu_exists.return_value = True
    repo.active_product_exists_for_model.return_value = False
    data = ProductCreate(sbu_id=uuid.uuid4(), model_id=uuid.uuid4(), **prices)
    repo.get_model_sbu_id.return_value = data.sbu_id
    repo.create.side_effect = lambda product: product
    return ProductService(repository=repo).create_product(data, created_by=uuid.uuid4(), role_name="Admin")


def _update_with(saved: dict, **sent):
    from app.domains.product.repository import ProductRepository

    product = _mock_product(**saved)
    repo = MagicMock(spec=ProductRepository)
    repo.get_by_id.return_value = product
    repo.update.side_effect = lambda p: p
    ProductService(repository=repo).update_product(
        product.id, ProductUpdate(**sent), updated_by=uuid.uuid4(), role_name="General Manager"
    )
    return product


class TestPriceOrder:
    """Plan D15: Full >= Rep >= Area Manager >= CEO >= Cost; equal allowed;
    the three lowest prices all-or-none and need the Full price."""

    def test_in_order_saves(self):
        assert _create_with(**_PRICES).full_price_lakhs == Decimal("35.00")

    def test_equal_prices_save(self):
        flat = {key: Decimal("35.00") for key in _PRICES}
        assert _create_with(**flat).cost_lakhs == Decimal("35.00")

    def test_nothing_entered_saves(self):
        assert _create_with().full_price_lakhs is None

    def test_full_price_alone_saves(self):
        assert _create_with(full_price_lakhs=Decimal("35.00")).rep_floor_lakhs is None

    def test_full_price_and_cost_without_lowest_prices_save(self):
        saved = _create_with(full_price_lakhs=Decimal("35.00"), cost_lakhs=Decimal("24.00"))
        assert saved.cost_lakhs == Decimal("24.00")

    @pytest.mark.parametrize(
        ("swap", "message"),
        [
            ({"rep_floor_lakhs": Decimal("36.00")}, "Rep's lowest can't be more than Full price"),
            ({"area_manager_floor_lakhs": Decimal("32.00")}, "Area Manager's lowest can't be more than Rep's lowest"),
            ({"ceo_floor_lakhs": Decimal("30.00")}, "CEO's lowest can't be more than Area Manager's lowest"),
            ({"cost_lakhs": Decimal("28.00")}, "Cost can't be more than CEO's lowest"),
        ],
    )
    def test_each_link_of_the_ladder_is_checked(self, swap, message):
        from app.core.exceptions import ValidationError as AppValidationError

        with pytest.raises(AppValidationError, match=message):
            _create_with(**{**_PRICES, **swap})

    def test_cost_above_full_price_without_lowest_prices_is_refused(self):
        from app.core.exceptions import ValidationError as AppValidationError

        with pytest.raises(AppValidationError, match="Cost can't be more than Full price"):
            _create_with(full_price_lakhs=Decimal("20.00"), cost_lakhs=Decimal("24.00"))

    @pytest.mark.parametrize("only", ["rep_floor_lakhs", "area_manager_floor_lakhs", "ceo_floor_lakhs"])
    def test_a_partial_set_of_lowest_prices_is_refused(self, only):
        from app.core.exceptions import ValidationError as AppValidationError

        with pytest.raises(AppValidationError, match="all three lowest prices"):
            _create_with(full_price_lakhs=Decimal("35.00"), **{only: Decimal("30.00")})

    def test_two_of_three_lowest_prices_is_refused(self):
        from app.core.exceptions import ValidationError as AppValidationError

        with pytest.raises(AppValidationError, match="all three lowest prices"):
            _create_with(
                full_price_lakhs=Decimal("35.00"),
                rep_floor_lakhs=Decimal("33.00"),
                area_manager_floor_lakhs=Decimal("31.00"),
            )

    def test_lowest_prices_without_a_full_price_are_refused(self):
        from app.core.exceptions import ValidationError as AppValidationError

        lowest_only = {k: v for k, v in _PRICES.items() if k != "full_price_lakhs"}
        with pytest.raises(AppValidationError, match="Full price too"):
            _create_with(**lowest_only)

    def test_edit_is_checked_against_the_saved_levels(self):
        from app.core.exceptions import ValidationError as AppValidationError

        # Only the CEO's lowest is sent; the saved Area Manager's lowest is 29.
        with pytest.raises(AppValidationError, match="CEO's lowest can't be more than Area Manager's lowest"):
            _update_with(_PRICES, ceo_floor_lakhs=Decimal("30.00"))

    def test_edit_that_keeps_the_order_saves(self):
        product = _update_with(_PRICES, ceo_floor_lakhs=Decimal("28.00"))
        assert product.ceo_floor_lakhs == Decimal("28.00")

    def test_edit_clearing_one_lowest_price_alone_is_refused(self):
        from app.core.exceptions import ValidationError as AppValidationError

        with pytest.raises(AppValidationError, match="all three lowest prices"):
            _update_with(_PRICES, rep_floor_lakhs=None)

    def test_edit_that_does_not_touch_prices_saves_unchanged(self):
        product = _update_with(_PRICES, description="New text")
        assert product.description == "New text"
        assert product.rep_floor_lakhs == Decimal("31.50")


class TestServiceStoresPrices:
    def test_create_passes_every_price_to_the_product(self):
        from app.domains.product.repository import ProductRepository

        repo = MagicMock(spec=ProductRepository)
        repo.sbu_exists.return_value = True
        repo.active_product_exists_for_model.return_value = False
        data = ProductCreate(sbu_id=uuid.uuid4(), model_id=uuid.uuid4(), **_PRICES)
        repo.get_model_sbu_id.return_value = data.sbu_id
        repo.create.side_effect = lambda product: product

        saved = ProductService(repository=repo).create_product(data, created_by=uuid.uuid4(), role_name="Admin")

        for key, value in _PRICES.items():
            assert getattr(saved, key) == value

    def test_update_sets_only_the_prices_sent(self):
        from app.domains.product.repository import ProductRepository

        product = _mock_product(**_PRICES)
        repo = MagicMock(spec=ProductRepository)
        repo.get_by_id.return_value = product
        repo.update.side_effect = lambda p: p

        ProductService(repository=repo).update_product(
            product.id,
            ProductUpdate(rep_floor_lakhs=Decimal("30.00"), cost_lakhs=None),
            updated_by=uuid.uuid4(),
            role_name="General Manager",
        )

        assert product.rep_floor_lakhs == Decimal("30.00")
        assert product.cost_lakhs is None
        assert product.full_price_lakhs == Decimal("35.00")
        assert product.ceo_floor_lakhs == Decimal("27.00")
