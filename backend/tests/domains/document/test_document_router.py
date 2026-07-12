import uuid
from datetime import UTC, datetime
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.domains.document.models import Document
from app.domains.organization.models import UserProfile
from app.domains.product.models import Product
from app.main import app

TEST_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
TEST_PRODUCT_ID = uuid.UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")
TEST_DOCUMENT_ID = uuid.UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")


def _mock_user() -> MagicMock:
    user = MagicMock(spec=UserProfile)
    user.id = TEST_USER_ID
    user.is_active = True
    return user


def _mock_document(**overrides) -> MagicMock:
    defaults = {
        "id": TEST_DOCUMENT_ID,
        "file_name": "Product Brochure 2026",
        "file_type": "BROCHURE",
        "storage_path": "https://example.com/brochure.pdf",
        "uploaded_at": datetime.now(UTC),
    }
    defaults.update(overrides)
    obj = MagicMock(spec=Document)
    for k, v in defaults.items():
        setattr(obj, k, v)
    return obj


def _setup_overrides(mock_db: MagicMock) -> None:
    app.dependency_overrides[get_current_user] = lambda: _mock_user()
    app.dependency_overrides[get_db] = lambda: mock_db


def _teardown_overrides() -> None:
    app.dependency_overrides.clear()


class TestListProductDocuments:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.get(f"/api/v1/products/{TEST_PRODUCT_ID}/documents")
        assert response.status_code == 401

    def test_product_not_found_returns_404(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.get.return_value = None

        _setup_overrides(mock_db)
        try:
            response = client.get(f"/api/v1/products/{TEST_PRODUCT_ID}/documents")
        finally:
            _teardown_overrides()

        assert response.status_code == 404

    def test_returns_documents_for_product(self, client: TestClient) -> None:
        document = _mock_document()
        mock_db = MagicMock()
        mock_db.get.return_value = MagicMock(spec=Product)
        mock_db.scalars.return_value.all.return_value = [document]

        _setup_overrides(mock_db)
        try:
            response = client.get(f"/api/v1/products/{TEST_PRODUCT_ID}/documents")
        finally:
            _teardown_overrides()

        assert response.status_code == 200
        data = response.json()["data"]
        assert len(data) == 1
        assert data[0]["file_name"] == "Product Brochure 2026"
        assert data[0]["storage_path"] == "https://example.com/brochure.pdf"


class TestCreateProductDocument:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.post(
            f"/api/v1/products/{TEST_PRODUCT_ID}/documents",
            json={"file_name": "x", "file_type": "BROCHURE", "storage_path": "https://x.com"},
        )
        assert response.status_code == 401

    def test_product_not_found_returns_404(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.get.return_value = None

        _setup_overrides(mock_db)
        try:
            response = client.post(
                f"/api/v1/products/{TEST_PRODUCT_ID}/documents",
                json={"file_name": "x", "file_type": "BROCHURE", "storage_path": "https://x.com"},
            )
        finally:
            _teardown_overrides()

        assert response.status_code == 404

    def test_creates_document(self, client: TestClient) -> None:
        document = _mock_document()
        mock_db = MagicMock()
        mock_db.get.return_value = MagicMock(spec=Product)

        def _capture_add(obj: object) -> None:
            for attr in ["id", "uploaded_at"]:
                if getattr(obj, attr, None) is None:
                    setattr(obj, attr, getattr(document, attr))

        mock_db.add.side_effect = _capture_add

        _setup_overrides(mock_db)
        try:
            response = client.post(
                f"/api/v1/products/{TEST_PRODUCT_ID}/documents",
                json={
                    "file_name": "Product Brochure 2026",
                    "file_type": "BROCHURE",
                    "storage_path": "https://example.com/brochure.pdf",
                },
            )
        finally:
            _teardown_overrides()

        assert response.status_code == 201
        data = response.json()["data"]
        assert data["file_name"] == "Product Brochure 2026"
        assert data["storage_path"] == "https://example.com/brochure.pdf"
        mock_db.add.assert_called_once()


class TestDeleteDocument:
    def test_unauthenticated_returns_401(self, client: TestClient) -> None:
        response = client.delete(f"/api/v1/documents/{TEST_DOCUMENT_ID}")
        assert response.status_code == 401

    def test_not_found_returns_404(self, client: TestClient) -> None:
        mock_db = MagicMock()
        mock_db.get.return_value = None

        _setup_overrides(mock_db)
        try:
            response = client.delete(f"/api/v1/documents/{TEST_DOCUMENT_ID}")
        finally:
            _teardown_overrides()

        assert response.status_code == 404

    def test_deletes_document(self, client: TestClient) -> None:
        document = _mock_document()
        mock_db = MagicMock()
        mock_db.get.return_value = document

        _setup_overrides(mock_db)
        try:
            response = client.delete(f"/api/v1/documents/{TEST_DOCUMENT_ID}")
        finally:
            _teardown_overrides()

        assert response.status_code == 204
        mock_db.delete.assert_called_once_with(document)
