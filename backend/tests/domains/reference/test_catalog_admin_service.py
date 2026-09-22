import uuid
from unittest.mock import MagicMock

import pytest

from app.core.exceptions import AuthorizationError, BusinessRuleViolation, ConflictError, NotFoundError
from app.domains.reference.models import Brand, Category
from app.domains.reference.repository import BrandRepository, CategoryRepository, ModelRepository
from app.domains.reference.schemas import BrandCreate, CategoryCreate, ModelCreate
from app.domains.reference.service import CatalogAdminService

ADMIN = "Admin"
GM = "General Manager"
NON_ADMIN_ROLES = ["SBU Manager", "Area Manager", "Sales Staff"]

SBU_A = uuid.uuid4()
SBU_B = uuid.uuid4()


def _make_service() -> tuple[CatalogAdminService, MagicMock, MagicMock, MagicMock]:
    """Returns the service plus its three mocked repositories, so each test
    can override whichever repo behavior it needs directly (e.g.
    `brands.sbu_exists.return_value = False`)."""
    brands = MagicMock(spec=BrandRepository)
    brands.sbu_exists.return_value = True
    brands.exists_by_name.return_value = False
    brands.create.side_effect = lambda obj: obj

    categories = MagicMock(spec=CategoryRepository)
    categories.sbu_exists.return_value = True
    categories.exists_by_name.return_value = False
    categories.create.side_effect = lambda obj: obj

    models = MagicMock(spec=ModelRepository)
    models.exists_by_name.return_value = False
    models.create.side_effect = lambda obj: obj

    service = CatalogAdminService(brands=brands, categories=categories, models=models)
    return service, brands, categories, models


def _make_brand(**overrides) -> MagicMock:
    defaults = {"id": uuid.uuid4(), "sbu_id": SBU_A, "name": "EDAN", "is_active": True}
    defaults.update(overrides)
    brand = MagicMock(spec=Brand)
    for k, v in defaults.items():
        setattr(brand, k, v)
    return brand


def _make_category(**overrides) -> MagicMock:
    defaults = {"id": uuid.uuid4(), "sbu_id": SBU_A, "name": "Patient Monitor", "is_active": True}
    defaults.update(overrides)
    category = MagicMock(spec=Category)
    for k, v in defaults.items():
        setattr(category, k, v)
    return category


class TestAuthorizationGate:
    @pytest.mark.parametrize("role", NON_ADMIN_ROLES)
    def test_non_admin_rejected_on_every_create_method(self, role):
        service, brands, categories, _models = _make_service()

        with pytest.raises(AuthorizationError):
            service.create_brand(BrandCreate(sbu_id=SBU_A, name="X"), role_name=role)
        with pytest.raises(AuthorizationError):
            service.create_category(CategoryCreate(sbu_id=SBU_A, name="X"), role_name=role)
        with pytest.raises(AuthorizationError):
            service.create_model(ModelCreate(brand_id=uuid.uuid4(), category_id=uuid.uuid4(), name="X"), role_name=role)
        brands.create.assert_not_called()
        categories.create.assert_not_called()

    @pytest.mark.parametrize("role", [ADMIN, GM])
    def test_admin_and_gm_both_allowed(self, role):
        service, _brands, _categories, _models = _make_service()

        service.create_brand(BrandCreate(sbu_id=SBU_A, name="EDAN"), role_name=role)  # does not raise


class TestCreateBrand:
    def test_creates_when_sbu_exists_and_name_is_unique(self):
        service, brands, _categories, _models = _make_service()

        brand = service.create_brand(BrandCreate(sbu_id=SBU_A, name="EDAN"), role_name=ADMIN)

        assert brand.sbu_id == SBU_A
        assert brand.name == "EDAN"
        brands.create.assert_called_once()

    def test_rejects_nonexistent_sbu(self):
        """Found by /code-review, 2026-09-22: a made-up sbu_id used to fall
        through to a raw FK IntegrityError (500) instead of this clean 404."""
        service, brands, _categories, _models = _make_service()
        brands.sbu_exists.return_value = False

        with pytest.raises(NotFoundError, match="not found"):
            service.create_brand(BrandCreate(sbu_id=SBU_A, name="EDAN"), role_name=ADMIN)
        brands.create.assert_not_called()

    def test_rejects_duplicate_name_in_same_sbu(self):
        service, brands, _categories, _models = _make_service()
        brands.exists_by_name.return_value = True

        with pytest.raises(ConflictError, match="already exists"):
            service.create_brand(BrandCreate(sbu_id=SBU_A, name="EDAN"), role_name=ADMIN)
        brands.create.assert_not_called()


class TestCreateCategory:
    def test_creates_when_sbu_exists_and_name_is_unique(self):
        service, _brands, categories, _models = _make_service()

        category = service.create_category(CategoryCreate(sbu_id=SBU_A, name="Patient Monitor"), role_name=ADMIN)

        assert category.sbu_id == SBU_A
        categories.create.assert_called_once()

    def test_rejects_nonexistent_sbu(self):
        service, _brands, categories, _models = _make_service()
        categories.sbu_exists.return_value = False

        with pytest.raises(NotFoundError, match="not found"):
            service.create_category(CategoryCreate(sbu_id=SBU_A, name="Patient Monitor"), role_name=ADMIN)
        categories.create.assert_not_called()

    def test_rejects_duplicate_name_in_same_sbu(self):
        service, _brands, categories, _models = _make_service()
        categories.exists_by_name.return_value = True

        with pytest.raises(ConflictError, match="already exists"):
            service.create_category(CategoryCreate(sbu_id=SBU_A, name="Patient Monitor"), role_name=ADMIN)
        categories.create.assert_not_called()


class TestCreateModel:
    def test_creates_and_derives_sbu_from_brand(self):
        brand = _make_brand(sbu_id=SBU_A)
        category = _make_category(sbu_id=SBU_A)
        service, brands, categories, models = _make_service()
        brands.get_by_id.return_value = brand
        categories.get_by_id.return_value = category

        model = service.create_model(
            ModelCreate(brand_id=brand.id, category_id=category.id, name="iM70"), role_name=ADMIN
        )

        assert model.sbu_id == SBU_A
        models.create.assert_called_once()

    def test_rejects_nonexistent_brand(self):
        service, brands, _categories, models = _make_service()
        brands.get_by_id.return_value = None

        with pytest.raises(NotFoundError, match="Brand"):
            service.create_model(
                ModelCreate(brand_id=uuid.uuid4(), category_id=uuid.uuid4(), name="iM70"), role_name=ADMIN
            )
        models.create.assert_not_called()

    def test_rejects_nonexistent_category(self):
        service, brands, categories, models = _make_service()
        brands.get_by_id.return_value = _make_brand()
        categories.get_by_id.return_value = None

        with pytest.raises(NotFoundError, match="Category"):
            service.create_model(
                ModelCreate(brand_id=uuid.uuid4(), category_id=uuid.uuid4(), name="iM70"), role_name=ADMIN
            )
        models.create.assert_not_called()

    def test_rejects_category_from_a_different_sbu_than_brand(self):
        """The exact gap found by the full /code-review pass, 2026-09-22:
        create_model checked that Brand and Category each existed, but never
        that they belonged to the same SBU -- a Critical Care brand could be
        paired with an Imaging category with no rejection at all."""
        brand = _make_brand(sbu_id=SBU_A)
        category = _make_category(sbu_id=SBU_B)
        service, brands, categories, models = _make_service()
        brands.get_by_id.return_value = brand
        categories.get_by_id.return_value = category

        with pytest.raises(BusinessRuleViolation, match="same SBU"):
            service.create_model(
                ModelCreate(brand_id=brand.id, category_id=category.id, name="iM70"), role_name=ADMIN
            )
        models.create.assert_not_called()

    def test_rejects_duplicate_name_for_same_brand(self):
        service, brands, categories, models = _make_service()
        brands.get_by_id.return_value = _make_brand()
        categories.get_by_id.return_value = _make_category()
        models.exists_by_name.return_value = True

        with pytest.raises(ConflictError, match="already exists"):
            service.create_model(
                ModelCreate(brand_id=uuid.uuid4(), category_id=uuid.uuid4(), name="iM70"), role_name=ADMIN
            )
        models.create.assert_not_called()
