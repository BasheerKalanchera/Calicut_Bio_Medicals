from pathlib import Path


def test_base_and_mixins_importable():
    from app.db.base import AuditMixin, Base, CreatedAtMixin

    assert Base is not None
    assert Base.metadata is not None
    assert AuditMixin is not None
    assert CreatedAtMixin is not None


def test_model_registry_imports_without_circular_errors():
    import app.db.registry  # noqa: F401
    from app.db.base import Base

    assert Base.metadata is not None


def test_base_repository_importable():
    from app.db.base import BaseRepository

    assert BaseRepository is not None


def test_reference_repository_importable():
    from app.db.base import ReferenceRepository

    assert ReferenceRepository is not None


def test_reference_repository_extends_base():
    from app.db.base import BaseRepository, ReferenceRepository

    assert issubclass(ReferenceRepository, BaseRepository)


def test_alembic_ini_exists_and_parseable():
    from alembic.config import Config

    ini_path = Path(__file__).parent.parent / "alembic.ini"
    assert ini_path.exists(), "alembic.ini not found at project root"
    config = Config(str(ini_path))
    assert config.get_main_option("script_location") == "alembic"


def test_alembic_versions_directory_exists():
    versions_path = Path(__file__).parent.parent / "alembic" / "versions"
    assert versions_path.is_dir(), "alembic/versions/ directory not found"


def test_metadata_contains_no_tables_before_entity_models():
    """Registry imports succeed but no tables exist yet (entity models not defined)."""
    import app.db.registry  # noqa: F401
    from app.db.base import Base

    table_count = len(Base.metadata.tables)
    assert table_count == 0, f"Expected 0 tables before entity models, found {table_count}"
