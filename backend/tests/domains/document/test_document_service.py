"""
Unit tests for DocumentService.

Repository and the app.core.storage module are fully mocked — no DB and no
real Supabase Storage calls. Covers:
  - upload_document: BR-ACT-08 file type/size validation, storage path shape,
    rejects before ever calling the storage client
  - get_download_url: RLS-gated NotFoundError, external-link documents rejected
    (Product Catalog's URL-only collateral links have no real Storage object)
  - delete_document: Storage object deleted before the DB row, in that order;
    external-link documents skip the Storage delete entirely
"""

import uuid
from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

import pytest
from fastapi import UploadFile

from app.core.exceptions import BusinessRuleViolation, NotFoundError
from app.domains.document.models import Document
from app.domains.document.repository import DocumentRepository
from app.domains.document.service import (
    ALLOWED_CONTENT_TYPES,
    MAX_FILE_SIZE_BYTES,
    DocumentService,
)

OPPORTUNITY_ID = uuid.uuid4()
DOCUMENT_ID = uuid.uuid4()
USER_ID = uuid.uuid4()


def _make_repo() -> MagicMock:
    repo = MagicMock(spec=DocumentRepository)
    repo.opportunity_exists.return_value = True
    return repo


def _make_upload_file(
    *, filename: str = "po.pdf", content_type: str = "application/pdf", content: bytes = b"fake-bytes"
) -> MagicMock:
    upload = MagicMock(spec=UploadFile)
    upload.filename = filename
    upload.content_type = content_type
    upload.file = MagicMock()
    upload.file.read.return_value = content
    return upload


def _make_document(*, storage_path: str = "opportunity/xyz/abc-po.pdf", **overrides) -> MagicMock:
    defaults = {
        "id": DOCUMENT_ID,
        "storage_path": storage_path,
        "opportunity_id": OPPORTUNITY_ID,
        "file_name": "po.pdf",
        "file_type": "application/pdf",
        "uploaded_at": datetime.now(UTC),
    }
    defaults.update(overrides)
    doc = MagicMock(spec=Document)
    for k, v in defaults.items():
        setattr(doc, k, v)
    return doc


class TestUploadDocument:
    def test_opportunity_not_found_raises(self) -> None:
        repo = _make_repo()
        repo.opportunity_exists.return_value = False
        service = DocumentService(repo)

        with pytest.raises(NotFoundError):
            service.upload_document(OPPORTUNITY_ID, _make_upload_file(), uploaded_by=USER_ID)

    @patch("app.domains.document.service.storage")
    def test_disallowed_mime_type_rejected_before_storage_call(self, mock_storage: MagicMock) -> None:
        repo = _make_repo()
        service = DocumentService(repo)
        upload = _make_upload_file(content_type="application/x-msdownload")

        with pytest.raises(BusinessRuleViolation):
            service.upload_document(OPPORTUNITY_ID, upload, uploaded_by=USER_ID)

        mock_storage.upload.assert_not_called()
        repo.create.assert_not_called()

    @patch("app.domains.document.service.storage")
    def test_oversized_file_rejected_before_storage_call(self, mock_storage: MagicMock) -> None:
        repo = _make_repo()
        service = DocumentService(repo)
        upload = _make_upload_file(content=b"x" * (MAX_FILE_SIZE_BYTES + 1))

        with pytest.raises(BusinessRuleViolation):
            service.upload_document(OPPORTUNITY_ID, upload, uploaded_by=USER_ID)

        mock_storage.upload.assert_not_called()
        repo.create.assert_not_called()

    @patch("app.domains.document.service.storage")
    def test_file_at_exactly_the_limit_is_accepted(self, mock_storage: MagicMock) -> None:
        repo = _make_repo()
        service = DocumentService(repo)
        content = b"x" * MAX_FILE_SIZE_BYTES
        upload = _make_upload_file(content=content)

        service.upload_document(OPPORTUNITY_ID, upload, uploaded_by=USER_ID)

        mock_storage.upload.assert_called_once()

    @patch("app.domains.document.service.storage")
    def test_accepts_every_confirmed_content_type(self, mock_storage: MagicMock) -> None:
        for content_type in ALLOWED_CONTENT_TYPES:
            repo = _make_repo()
            service = DocumentService(repo)
            upload = _make_upload_file(content_type=content_type)

            service.upload_document(OPPORTUNITY_ID, upload, uploaded_by=USER_ID)

        assert mock_storage.upload.call_count == len(ALLOWED_CONTENT_TYPES)

    @patch("app.domains.document.service.storage")
    def test_persists_correct_metadata_and_storage_path_shape(self, mock_storage: MagicMock) -> None:
        repo = _make_repo()
        repo.create.side_effect = lambda obj: obj
        service = DocumentService(repo)
        content = b"pdf-bytes"
        upload = _make_upload_file(filename="quote.pdf", content_type="application/pdf", content=content)

        document = service.upload_document(OPPORTUNITY_ID, upload, uploaded_by=USER_ID)

        assert document.opportunity_id == OPPORTUNITY_ID
        assert document.file_name == "quote.pdf"
        assert document.file_type == "application/pdf"
        assert document.file_size_bytes == len(content)
        assert document.uploaded_by_user_id == USER_ID
        assert document.storage_path.startswith(f"opportunity/{OPPORTUNITY_ID}/")
        assert document.storage_path.endswith("-quote.pdf")

        path_arg, content_arg, content_type_arg = mock_storage.upload.call_args[0]
        assert path_arg == document.storage_path
        assert content_arg == content
        assert content_type_arg == "application/pdf"


class TestGetDownloadUrl:
    def test_not_found_raises(self) -> None:
        repo = _make_repo()
        repo.get_by_id.return_value = None
        service = DocumentService(repo)

        with pytest.raises(NotFoundError):
            service.get_download_url(DOCUMENT_ID)

    @patch("app.domains.document.service.storage")
    def test_external_link_document_rejected(self, mock_storage: MagicMock) -> None:
        repo = _make_repo()
        repo.get_by_id.return_value = _make_document(storage_path="https://example.com/brochure.pdf")
        service = DocumentService(repo)

        with pytest.raises(BusinessRuleViolation):
            service.get_download_url(DOCUMENT_ID)

        mock_storage.create_signed_url.assert_not_called()

    @patch("app.domains.document.service.storage")
    def test_returns_signed_url_for_real_upload(self, mock_storage: MagicMock) -> None:
        mock_storage.create_signed_url.return_value = "https://supabase.example/signed?token=abc"
        repo = _make_repo()
        repo.get_by_id.return_value = _make_document(storage_path="opportunity/xyz/abc-po.pdf")
        service = DocumentService(repo)

        result = service.get_download_url(DOCUMENT_ID)

        mock_storage.create_signed_url.assert_called_once_with("opportunity/xyz/abc-po.pdf", 300)
        assert result.url == "https://supabase.example/signed?token=abc"
        assert result.expires_at > datetime.now(UTC)


class TestDeleteDocument:
    def test_not_found_raises(self) -> None:
        repo = _make_repo()
        repo.get_by_id.return_value = None
        service = DocumentService(repo)

        with pytest.raises(NotFoundError):
            service.delete_document(DOCUMENT_ID)

    @patch("app.domains.document.service.storage")
    def test_deletes_storage_object_before_db_row_for_real_upload(self, mock_storage: MagicMock) -> None:
        repo = _make_repo()
        document = _make_document(storage_path="opportunity/xyz/abc-po.pdf")
        repo.get_by_id.return_value = document
        call_order: list[str] = []
        mock_storage.delete.side_effect = lambda _path: call_order.append("storage")
        repo.delete.side_effect = lambda _doc: call_order.append("db")
        service = DocumentService(repo)

        service.delete_document(DOCUMENT_ID)

        mock_storage.delete.assert_called_once_with("opportunity/xyz/abc-po.pdf")
        repo.delete.assert_called_once_with(document)
        assert call_order == ["storage", "db"]

    @patch("app.domains.document.service.storage")
    def test_db_row_survives_if_storage_delete_fails(self, mock_storage: MagicMock) -> None:
        repo = _make_repo()
        repo.get_by_id.return_value = _make_document(storage_path="opportunity/xyz/abc-po.pdf")
        mock_storage.delete.side_effect = RuntimeError("storage unavailable")
        service = DocumentService(repo)

        with pytest.raises(RuntimeError):
            service.delete_document(DOCUMENT_ID)

        repo.delete.assert_not_called()

    @patch("app.domains.document.service.storage")
    def test_external_link_document_skips_storage_delete(self, mock_storage: MagicMock) -> None:
        repo = _make_repo()
        document = _make_document(storage_path="https://example.com/brochure.pdf")
        repo.get_by_id.return_value = document
        service = DocumentService(repo)

        service.delete_document(DOCUMENT_ID)

        mock_storage.delete.assert_not_called()
        repo.delete.assert_called_once_with(document)
