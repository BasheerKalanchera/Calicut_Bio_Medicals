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


def test_all_28_tables_registered():
    import app.db.registry  # noqa: F401
    from app.db.base import Base

    # 26, not 25: Milestone 1 added user_zone (0018_add_user_zone_and_rewrite_area_manager_rls.py).
    # 27, not 26: Zone Hierarchy added zone_closure (0019_zone_hierarchy_tree_and_closure.py).
    # 28, not 27: Opportunity-Assignment Notifications added notification (0024_add_notification_table.py).
    # 29, not 28: Manager-Attested Gate Override added gate_override_reason
    # (0027_add_gate_override.py).
    # 30, not 29: Audit Trail added audit_log (0030_add_audit_log.py).
    table_count = len(Base.metadata.tables)
    assert table_count == 30, f"Expected 30 tables, found {table_count}"


def test_mapper_configuration_succeeds():
    from sqlalchemy.orm import configure_mappers

    import app.db.registry  # noqa: F401

    configure_mappers()


def test_all_relationships_resolve():
    from sqlalchemy.orm import configure_mappers

    import app.db.registry  # noqa: F401
    from app.db.base import Base

    configure_mappers()
    rel_count = sum(len(m.relationships) for m in Base.registry.mappers)
    # 89, not 88: BR-ACT-05 added Reminder.closing_activity (0013_reminder_closing_activity.py).
    # 93, not 89: Milestone 1 added UserProfile.zones, UserZone.user, UserZone.zone, Zone.user_zones.
    # 95, not 93: Zone Hierarchy added Zone.parent, Zone.children (self-referencing tree,
    # 0019_zone_hierarchy_tree_and_closure.py). ZoneClosure itself has no relationship()s --
    # plain FK columns only, deliberately not ORM-navigable (it's a derived/computed index,
    # not a domain object -- see its own model docstring).
    # 96, not 95: BR-FIN-07 added Opportunity.referred_by (0023_add_referral_credit.py).
    # 97, not 96: Opportunity-Assignment Notifications added Notification.actor
    # (0024_add_notification_table.py).
    # 101, not 97: BR-OP-14 added GateOverrideReason.opportunities,
    # Opportunity.gate_override_approver, Opportunity.gate_override_set_by_user,
    # Opportunity.gate_override_reason (0027_add_gate_override.py).
    # Still 101 after Audit Trail (0030_add_audit_log.py) -- AuditLog has zero
    # relationship()s, plain FK columns only (like ZoneClosure), not a domain
    # object with its own navigable relationships.
    assert rel_count == 101, f"Expected 101 relationships, found {rel_count}"


def test_reference_models_importable():
    from app.domains.reference.models import (
        SBU,
        HoldReason,
        LeadSource,
        LossReason,
        OpportunityStage,
        OpportunityStatus,
        ProjectStatus,
        Role,
        Zone,
    )

    assert all(
        [Role, SBU, Zone, LeadSource, OpportunityStage, OpportunityStatus, ProjectStatus, LossReason, HoldReason]
    )


def test_organization_models_importable():
    from app.domains.organization.models import UserProfile

    assert UserProfile.__tablename__ == "user_profile"


def test_opportunity_models_importable():
    from app.domains.opportunity.models import Opportunity, OpportunityItem, OpportunityStakeholder, Split

    assert Opportunity.__tablename__ == "opportunity"
    assert OpportunityStakeholder.__tablename__ == "opportunity_stakeholder"
    assert Split.__tablename__ == "split"
    assert OpportunityItem.__tablename__ == "opportunity_item"


def test_activity_uses_created_at_mixin():
    from app.db.base import CreatedAtMixin
    from app.domains.activity.models import Activity

    assert issubclass(Activity, CreatedAtMixin)
    assert hasattr(Activity, "created_at")
    assert hasattr(Activity, "created_by")
    assert not hasattr(Activity, "updated_at")


def test_document_has_no_audit_mixin():
    from app.db.base import AuditMixin
    from app.domains.document.models import Document

    assert not issubclass(Document, AuditMixin)
    assert hasattr(Document, "uploaded_at")
    assert hasattr(Document, "uploaded_by_user_id")
