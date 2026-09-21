import uuid
from datetime import UTC, datetime
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.domains.organization.models import UserProfile
from app.domains.product.models import Product
from app.main import app

TEST_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
TEST_PRODUCT_ID = uuid.UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")
TEST_SBU_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")


def _mock_user(role_name: str = "Admin") -> MagicMock:
    user = MagicMock(spec=UserProfile)
    user.id = TEST_USER_ID
    user.is_active = True
    role = MagicMock()
    role.role_name = role_name
    user.role = role
    return user


def _mock_sbu() -> MagicMock:
    sbu = MagicMock()
    sbu.id = TEST_SBU_ID
    sbu.name = "Imaging"
    return sbu


def _mock_nested(name: str) -> MagicMock:
    nested = MagicMock()
    nested.id = uuid.uuid4()
    nested.name = name
    return nested


def _mock_product(**overrides) -> MagicMock:
    now = datetime.now(UTC)
    brand = _mock_nested("SonoScape")
    model = _mock_nested("S50")
    category = _mock_nested("Ultrasound")
    defaults = {
        "id": TEST_PRODUCT_ID,
        "sbu_id": TEST_SBU_ID,
        "name": "SonoScape S50 Ultrasound",
        "brand_id": brand.id,
        "model_id": model.id,
        "category_id": category.id,
        "brand": brand,
        "model": model,
        "category": category,
        "description": "Premium ultrasound system",
        "product_type": "NEW_EQUIPMENT",
        "is_active": True,
        "created_at": now,
        "updated_at": now,
        "sbu": _mock_sbu(),
    }
    defaults.update(overrides)
    obj = MagicMock(spec=Product)
    for k, v in defaults.items():
        setattr(obj, k, v)
    return obj


def _setup_overrides(mock_db: MagicMock, role_name: str = "Admin") -> None:
    app.dependency_overrides[get_current_user] = lambda: _mock_user(role_name)
    app.dependency_overrides[get_db] = lambda: mock_db


def _teardown_overrides() -> None:
    app.dependency_overrides.clear()


class TestListProducts:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.get("/api/v1/products")
        assert response.status_code == 401

    def test_returns_paginated_products(self, client: TestClient) -> None:
        product = _mock_product()
        mock_db = MagicMock()
        mock_db.scalar.return_value = 1
        mock_db.scalars.return_value.unique.return_value.all.return_value = [product]

        _setup_overrides(mock_db)
        try:
            response = client.get("/api/v1/products")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        data = body["data"]
        assert data["total"] == 1
        assert data["items"][0]["name"] == "SonoScape S50 Ultrasound"
        assert data["items"][0]["sbu"]["name"] == "Imaging"
        assert data["items"][0]["brand"]["name"] == "SonoScape"

    def test_search_filter(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0
        mock_db.scalars.return_value.unique.return_value.all.return_value = []

        _setup_overrides(mock_db)
        try:
            response = client.get("/api/v1/products?search=sono")
        finally:
            _teardown_overrides()

        assert response.status_code == 200

    def test_sbu_filter(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0
        mock_db.scalars.return_value.unique.return_value.all.return_value = []

        _setup_overrides(mock_db)
        try:
            response = client.get(f"/api/v1/products?sbu_id={TEST_SBU_ID}")
        finally:
            _teardown_overrides()

        assert response.status_code == 200

    def test_brand_filter(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0
        mock_db.scalars.return_value.unique.return_value.all.return_value = []

        _setup_overrides(mock_db)
        try:
            response = client.get("/api/v1/products?brand=SonoScape")
        finally:
            _teardown_overrides()

        assert response.status_code == 200

    def test_pagination_params(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0
        mock_db.scalars.return_value.unique.return_value.all.return_value = []

        _setup_overrides(mock_db)
        try:
            response = client.get("/api/v1/products?page=2&page_size=10")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        body = response.json()
        assert body["data"]["page"] == 2
        assert body["data"]["page_size"] == 10


class TestGetProduct:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.get(f"/api/v1/products/{TEST_PRODUCT_ID}")
        assert response.status_code == 401

    def test_returns_product_detail(self, client: TestClient) -> None:
        product = _mock_product()
        mock_db = MagicMock()
        mock_db.get.return_value = product

        _setup_overrides(mock_db)
        try:
            response = client.get(f"/api/v1/products/{TEST_PRODUCT_ID}")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        data = body["data"]
        assert data["id"] == str(TEST_PRODUCT_ID)
        assert data["name"] == "SonoScape S50 Ultrasound"
        assert data["brand"]["name"] == "SonoScape"
        assert data["model"]["name"] == "S50"
        assert data["description"] == "Premium ultrasound system"
        assert data["sbu"]["name"] == "Imaging"

    def test_not_found_returns_404(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.get.return_value = None

        _setup_overrides(mock_db)
        try:
            response = client.get(f"/api/v1/products/{uuid.uuid4()}")
        finally:
            _teardown_overrides()

        assert response.status_code == 404


class TestCreateProduct:
    def _body(self) -> dict:
        return {"sbu_id": str(TEST_SBU_ID), "model_id": str(uuid.uuid4())}

    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.post("/api/v1/products", json=self._body())
        assert response.status_code == 401

    def test_sales_executive_forbidden(self, client: TestClient) -> None:
        mock_db = MagicMock()

        _setup_overrides(mock_db, role_name="Sales Executive")
        try:
            response = client.post("/api/v1/products", json=self._body())
        finally:
            _teardown_overrides()

        assert response.status_code == 403

    def test_sales_staff_forbidden(self, client: TestClient) -> None:
        mock_db = MagicMock()

        _setup_overrides(mock_db, role_name="Sales Staff")
        try:
            response = client.post("/api/v1/products", json=self._body())
        finally:
            _teardown_overrides()

        assert response.status_code == 403


class TestUpdateProduct:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.put(f"/api/v1/products/{TEST_PRODUCT_ID}", json={"name": "X"})
        assert response.status_code == 401

    def test_sales_executive_forbidden(self, client: TestClient) -> None:
        mock_db = MagicMock()

        _setup_overrides(mock_db, role_name="Sales Executive")
        try:
            response = client.put(f"/api/v1/products/{TEST_PRODUCT_ID}", json={"name": "X"})
        finally:
            _teardown_overrides()

        assert response.status_code == 403

    def test_sales_staff_forbidden(self, client: TestClient) -> None:
        mock_db = MagicMock()

        _setup_overrides(mock_db, role_name="Sales Staff")
        try:
            response = client.put(f"/api/v1/products/{TEST_PRODUCT_ID}", json={"name": "X"})
        finally:
            _teardown_overrides()

        assert response.status_code == 403
