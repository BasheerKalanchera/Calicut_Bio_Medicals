import uuid
from datetime import date
from unittest.mock import MagicMock

import pytest

from app.core.exceptions import NotFoundError
from app.domains.account.models import Account
from app.domains.account.repository import AccountRepository
from app.domains.account.workspace_service import WorkspaceService

TEST_ACCOUNT_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
TEST_ZONE_ID = uuid.UUID("33333333-3333-3333-3333-333333333333")


def _mock_zone() -> MagicMock:
    zone = MagicMock()
    zone.id = TEST_ZONE_ID
    zone.name = "South Zone"
    return zone


def _mock_status() -> MagicMock:
    status = MagicMock()
    status.id = uuid.uuid4()
    status.status_code = "ACTIVE"
    status.status_name = "Active"
    return status


def _mock_owner() -> MagicMock:
    owner = MagicMock()
    owner.id = uuid.uuid4()
    owner.display_name = "Basheer"
    return owner


def _mock_product() -> MagicMock:
    product = MagicMock()
    product.id = uuid.uuid4()
    product.name = "SonoScape S50"
    product.oem_name = "SonoScape"
    product.model_number = "S50"
    return product


def _mock_stakeholder() -> MagicMock:
    obj = MagicMock()
    obj.id = uuid.uuid4()
    obj.name = "Dr. Test"
    obj.designation = "Chief Radiologist"
    obj.email = "dr.test@hospital.com"
    obj.phone = "+91-9876543210"
    obj.nps_score = 80
    obj.sentiment = "Positive"
    return obj


def _mock_project() -> MagicMock:
    obj = MagicMock()
    obj.id = uuid.uuid4()
    obj.name = "Hospital Expansion"
    obj.status = _mock_status()
    obj.owner = _mock_owner()
    obj.bid_submission_date = date(2026, 9, 15)
    return obj


def _mock_installed_asset() -> MagicMock:
    obj = MagicMock()
    obj.id = uuid.uuid4()
    obj.product = _mock_product()
    obj.is_competitor_equipment = False
    obj.competitor_product_name = None
    obj.installation_date = date(2025, 3, 10)
    obj.department = "Radiology"
    return obj


def _mock_account(
    stakeholders=None, projects=None, installed_assets=None
) -> MagicMock:
    account = MagicMock(spec=Account)
    account.id = TEST_ACCOUNT_ID
    account.name = "Test Hospital"
    account.parent_account_id = None
    account.zone_id = TEST_ZONE_ID
    account.payer_behavior = "GOOD"
    account.zone = _mock_zone()
    account.stakeholders = stakeholders or []
    account.projects = projects or []
    account.installed_assets = installed_assets or []
    return account


class TestGetWorkspace:
    def test_returns_full_workspace(self):
        stakeholder = _mock_stakeholder()
        project = _mock_project()
        asset = _mock_installed_asset()
        account = _mock_account(
            stakeholders=[stakeholder],
            projects=[project],
            installed_assets=[asset],
        )

        repo = MagicMock(spec=AccountRepository)
        repo.get_for_workspace.return_value = account

        service = WorkspaceService(repository=repo)
        result = service.get_workspace(TEST_ACCOUNT_ID)

        assert result.account.name == "Test Hospital"
        assert result.account.zone.name == "South Zone"
        assert len(result.stakeholders) == 1
        assert result.stakeholders[0].name == "Dr. Test"
        assert result.stakeholders[0].nps_score == 80
        assert len(result.projects) == 1
        assert result.projects[0].name == "Hospital Expansion"
        assert result.projects[0].status.status_name == "Active"
        assert result.projects[0].owner.display_name == "Basheer"
        assert len(result.installed_assets) == 1
        assert result.installed_assets[0].product.name == "SonoScape S50"
        assert result.installed_assets[0].department == "Radiology"

    def test_returns_empty_collections(self):
        account = _mock_account()
        repo = MagicMock(spec=AccountRepository)
        repo.get_for_workspace.return_value = account

        service = WorkspaceService(repository=repo)
        result = service.get_workspace(TEST_ACCOUNT_ID)

        assert result.account.name == "Test Hospital"
        assert result.stakeholders == []
        assert result.projects == []
        assert result.installed_assets == []

    def test_raises_not_found(self):
        repo = MagicMock(spec=AccountRepository)
        repo.get_for_workspace.return_value = None

        service = WorkspaceService(repository=repo)
        with pytest.raises(NotFoundError, match="Account"):
            service.get_workspace(uuid.uuid4())

    def test_competitor_equipment_without_product(self):
        asset = MagicMock()
        asset.id = uuid.uuid4()
        asset.product = None
        asset.is_competitor_equipment = True
        asset.competitor_product_name = "GE Logiq"
        asset.installation_date = None
        asset.department = "Cardiology"

        account = _mock_account(installed_assets=[asset])
        repo = MagicMock(spec=AccountRepository)
        repo.get_for_workspace.return_value = account

        service = WorkspaceService(repository=repo)
        result = service.get_workspace(TEST_ACCOUNT_ID)

        assert len(result.installed_assets) == 1
        assert result.installed_assets[0].product is None
        assert result.installed_assets[0].is_competitor_equipment is True
        assert result.installed_assets[0].competitor_product_name == "GE Logiq"
