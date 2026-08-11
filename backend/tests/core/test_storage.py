"""
Unit tests for app.core.storage — the thin wrapper around Supabase Storage's
REST API. httpx is fully mocked; no real Supabase Storage calls.
"""

from unittest.mock import MagicMock, patch

import pytest
from pydantic import SecretStr

from app.core import storage


@pytest.fixture(autouse=True)
def _configure_settings(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(storage.settings, "SUPABASE_URL", "https://project.supabase.co")
    monkeypatch.setattr(storage.settings, "SUPABASE_SERVICE_ROLE_KEY", SecretStr("service-role-secret"))


class TestUpload:
    @patch("app.core.storage.httpx.post")
    def test_posts_to_expected_path_with_service_role_headers(self, mock_post: MagicMock) -> None:
        mock_post.return_value = MagicMock(raise_for_status=MagicMock())

        storage.upload("opportunity/xyz/abc-po.pdf", b"bytes", "application/pdf")

        args, kwargs = mock_post.call_args
        assert args[0] == "https://project.supabase.co/storage/v1/object/documents/opportunity/xyz/abc-po.pdf"
        assert kwargs["headers"]["apikey"] == "service-role-secret"
        assert kwargs["headers"]["Authorization"] == "Bearer service-role-secret"
        assert kwargs["headers"]["Content-Type"] == "application/pdf"
        assert kwargs["content"] == b"bytes"
        mock_post.return_value.raise_for_status.assert_called_once()

    def test_raises_clearly_when_service_role_key_missing(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(storage.settings, "SUPABASE_SERVICE_ROLE_KEY", None)

        with pytest.raises(RuntimeError, match="SUPABASE_SERVICE_ROLE_KEY"):
            storage.upload("path", b"bytes", "application/pdf")


class TestDelete:
    @patch("app.core.storage.httpx.request")
    def test_sends_delete_to_expected_path(self, mock_request: MagicMock) -> None:
        mock_request.return_value = MagicMock(raise_for_status=MagicMock())

        storage.delete("opportunity/xyz/abc-po.pdf")

        args, _kwargs = mock_request.call_args
        assert args[0] == "DELETE"
        assert args[1] == "https://project.supabase.co/storage/v1/object/documents/opportunity/xyz/abc-po.pdf"
        mock_request.return_value.raise_for_status.assert_called_once()


class TestCreateSignedUrl:
    @patch("app.core.storage.httpx.post")
    def test_builds_full_url_from_relative_signed_path(self, mock_post: MagicMock) -> None:
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "signedURL": "/object/sign/documents/opportunity/xyz/abc-po.pdf?token=abc123"
        }
        mock_post.return_value = mock_response

        url = storage.create_signed_url("opportunity/xyz/abc-po.pdf", 300)

        args, kwargs = mock_post.call_args
        assert args[0] == "https://project.supabase.co/storage/v1/object/sign/documents/opportunity/xyz/abc-po.pdf"
        assert kwargs["json"] == {"expiresIn": 300}
        assert url == "https://project.supabase.co/storage/v1/object/sign/documents/opportunity/xyz/abc-po.pdf?token=abc123"
        mock_response.raise_for_status.assert_called_once()
