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


def _mock_product(**overrides) -> MagicMock:
    now = datetime.now(UTC)
    defaults = {
        "id": TEST_PRODUCT_ID,
        "sbu_id": TEST_SBU_ID,
        "name": "SonoScape S50",
        "oem_name": "SonoScape",
        "model_number": "S50",
        "category_name": "Ultrasound",
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
        assert data["items"][0]["name"] == "SonoScape S50"
        assert data["items"][0]["sbu"]["name"] == "Imaging"

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
        assert data["name"] == "SonoScape S50"
        assert data["oem_name"] == "SonoScape"
        assert data["model_number"] == "S50"
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
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.post("/api/v1/products", json={"name": "X", "sbu_id": str(TEST_SBU_ID)})
        assert response.status_code == 401

    def test_sales_executive_forbidden(self, client: TestClient) -> None:
        mock_db = MagicMock()

        _setup_overrides(mock_db, role_name="Sales Executive")
        try:
            response = client.post("/api/v1/products", json={"name": "X", "sbu_id": str(TEST_SBU_ID)})
        finally:
            _teardown_overrides()

        assert response.status_code == 403

    def test_sales_manager_forbidden(self, client: TestClient) -> None:
        mock_db = MagicMock()

        _setup_overrides(mock_db, role_name="Sales Manager")
        try:
            response = client.post("/api/v1/products", json={"name": "X", "sbu_id": str(TEST_SBU_ID)})
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

    def test_sales_manager_forbidden(self, client: TestClient) -> None:
        mock_db = MagicMock()

        _setup_overrides(mock_db, role_name="Sales Manager")
        try:
            response = client.put(f"/api/v1/products/{TEST_PRODUCT_ID}", json={"name": "X"})
        finally:
            _teardown_overrides()

        assert response.status_code == 403
