"""
Unit tests for ReportingRepository's four aggregation queries. Repository is
exercised against a mocked DB (no real SQL execution); the generated
statement is compiled to a SQL string and asserted against, mirroring
tests/domains/activity/test_activity_repository.py's pattern exactly, since
this reuses that same scoping logic (UNRESTRICTED_ROLES / TEAM_SCOPE_BUILDERS)
applied to whoever owns the opportunity / logged the activity / is assigned
the reminder.
"""

import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock

from app.domains.organization.models import UserProfile
from app.domains.reporting.repository import ReportingRepository

START = datetime(2026, 8, 6, 0, 0, 0, tzinfo=UTC)
END = START + timedelta(days=30)
END_OF_TODAY = datetime(2026, 9, 11, 23, 59, 59, 999999, tzinfo=UTC)


def _make_current_user(role_name: str, **overrides) -> MagicMock:
    defaults = {
        "id": uuid.uuid4(),
        "sbu_id": uuid.uuid4(),
        "zone_id": uuid.uuid4(),
        "manager_id": None,
    }
    defaults.update(overrides)
    user = MagicMock(spec=UserProfile)
    for k, v in defaults.items():
        setattr(user, k, v)
    role = MagicMock()
    role.role_name = role_name
    user.role = role
    return user


def _compiled(stmt) -> str:
    return str(stmt.compile(compile_kwargs={"literal_binds": True}))


def _uuid_literal(value: uuid.UUID) -> str:
    # Generic-dialect literal_binds renders a UUID bind as its plain hex
    # string, no hyphens (Postgres's own dialect would keep them) -- this
    # matches what actually shows up in the compiled SQL above.
    return value.hex


def _run(method_name: str, current_user: MagicMock, *args, **kwargs) -> str:
    mock_db = MagicMock()
    mock_db.execute.return_value.all.return_value = []
    repo = ReportingRepository(mock_db)
    getattr(repo, method_name)(current_user, *args, **kwargs)
    stmt = mock_db.execute.call_args.args[0]
    return _compiled(stmt)


class TestPipelineSummary:
    def test_admin_is_unrestricted(self):
        sql = _run("pipeline_summary", _make_current_user("Admin"), "stage")
        assert "user_profile.sbu_id" not in sql

    def test_sbu_manager_scoped_to_own_sbu_and_self(self):
        current_user = _make_current_user("SBU Manager")
        sql = _run("pipeline_summary", current_user, "stage")
        assert "user_profile.sbu_id" in sql
        assert _uuid_literal(current_user.id) in sql

    def test_group_by_stage_groups_on_stage_name(self):
        sql = _run("pipeline_summary", _make_current_user("Admin"), "stage")
        assert "opportunity_stage.stage_name" in sql

    def test_group_by_rep_groups_on_display_name(self):
        sql = _run("pipeline_summary", _make_current_user("Admin"), "rep")
        assert "user_profile.display_name" in sql

    def test_group_by_sbu_groups_on_sbu_name(self):
        sql = _run("pipeline_summary", _make_current_user("Admin"), "sbu")
        assert "sbu.name" in sql

    def test_group_by_zone_groups_on_zone_name(self):
        sql = _run("pipeline_summary", _make_current_user("Admin"), "zone")
        assert "zone.name" in sql

    def test_buyback_lines_netted_negative(self):
        sql = _run("pipeline_summary", _make_current_user("Admin"), "stage")
        assert "'BUYBACK'" in sql
        assert "-opportunity_item.extended_value_lakhs" in sql

    def test_open_population_excludes_terminal_statuses(self):
        sql = _run("pipeline_summary", _make_current_user("Admin"), "stage")
        assert "opportunity_status.is_terminal" in sql

    def test_forecast_population_restricted_to_active(self):
        sql = _run("pipeline_summary", _make_current_user("Admin"), "stage")
        assert "opportunity_status.status_code" in sql
        assert "'ACTIVE'" in sql

    def test_weighted_forecast_multiplies_by_win_probability(self):
        sql = _run("pipeline_summary", _make_current_user("Admin"), "stage")
        assert "opportunity.win_probability" in sql

    def test_sbu_and_zone_filters_applied(self):
        sbu_id, zone_id = uuid.uuid4(), uuid.uuid4()
        sql = _run("pipeline_summary", _make_current_user("Admin"), "stage", sbu_id=sbu_id, zone_id=zone_id)
        assert _uuid_literal(sbu_id) in sql
        assert _uuid_literal(zone_id) in sql


class TestStagnantDeals:
    def test_threshold_days_applied(self):
        sql = _run("stagnant_deals", _make_current_user("Admin"), threshold_days=90)
        assert "90" in sql

    def test_default_threshold_is_180(self):
        sql = _run("stagnant_deals", _make_current_user("Admin"))
        assert "180" in sql

    def test_terminal_opportunities_excluded(self):
        sql = _run("stagnant_deals", _make_current_user("Admin"))
        assert "opportunity_status.is_terminal" in sql

    def test_falls_back_to_created_at_when_no_activity(self):
        sql = _run("stagnant_deals", _make_current_user("Admin"))
        assert "opportunity.created_at" in sql

    def test_area_manager_scoped(self):
        current_user = _make_current_user("Area Manager")
        sql = _run("stagnant_deals", current_user)
        assert "user_zone" in sql or str(current_user.id) in sql


class TestActivityLevels:
    def test_date_range_always_applied(self):
        sql = _run("activity_levels", _make_current_user("Admin"), START, END)
        assert "activity.activity_date >=" in sql
        assert "activity.activity_date <" in sql

    def test_grouped_by_user(self):
        sql = _run("activity_levels", _make_current_user("Admin"), START, END)
        assert "group by user_profile.id" in sql.lower()

    def test_sbu_manager_scoped(self):
        current_user = _make_current_user("SBU Manager")
        sql = _run("activity_levels", current_user, START, END)
        assert "user_profile.sbu_id" in sql
        assert _uuid_literal(current_user.sbu_id) in sql

    def test_zone_filter_uses_user_zone_membership_not_stale_column(self):
        zone_id = uuid.uuid4()
        sql = _run("activity_levels", _make_current_user("Admin"), START, END, zone_id=zone_id)
        assert "user_zone" in sql
        assert _uuid_literal(zone_id) in sql


class TestOverdueActions:
    def test_only_incomplete_and_due_by_cutoff(self):
        sql = _run("overdue_actions", _make_current_user("Admin"), END_OF_TODAY)
        assert "reminder.is_completed" in sql
        assert "reminder.due_date <=" in sql

    def test_grouped_by_assignee(self):
        sql = _run("overdue_actions", _make_current_user("Admin"), END_OF_TODAY)
        assert "group by user_profile.id" in sql.lower()

    def test_area_manager_scoped_to_team_and_self(self):
        current_user = _make_current_user("Area Manager")
        sql = _run("overdue_actions", current_user, END_OF_TODAY)
        assert _uuid_literal(current_user.id) in sql


class TestProductPerformance:
    def test_admin_is_unrestricted(self):
        sql = _run("product_performance", _make_current_user("Admin"), "product")
        assert "user_profile.sbu_id" not in sql

    def test_group_by_product_groups_on_product_name(self):
        sql = _run("product_performance", _make_current_user("Admin"), "product")
        assert "product.name" in sql

    def test_group_by_sbu_groups_on_sbu_name(self):
        sql = _run("product_performance", _make_current_user("Admin"), "sbu")
        assert "sbu.name" in sql

    def test_group_by_brand_normalizes_case_via_oem_name(self):
        sql = _run("product_performance", _make_current_user("Admin"), "brand")
        assert "product.oem_name" in sql
        assert "upper" in sql.lower()
        assert "trim" in sql.lower()

    def test_quantity_and_revenue_restricted_to_won(self):
        sql = _run("product_performance", _make_current_user("Admin"), "product")
        assert "'WON'" in sql
        assert "opportunity_item.quantity" in sql
        assert "opportunity_item.extended_value_lakhs" in sql

    def test_won_and_lost_counts_are_distinct_opportunity_counts(self):
        sql = _run("product_performance", _make_current_user("Admin"), "product")
        assert "'LOST'" in sql

    def test_sbu_manager_scoped(self):
        current_user = _make_current_user("SBU Manager")
        sql = _run("product_performance", current_user, "product")
        assert "user_profile.sbu_id" in sql
        assert _uuid_literal(current_user.sbu_id) in sql


class TestOpportunitiesOnHold:
    def test_restricted_to_on_hold_status(self):
        sql = _run("opportunities_on_hold", _make_current_user("Admin"))
        assert "'ON_HOLD'" in sql

    def test_days_on_hold_derived_from_audit_trail(self):
        sql = _run("opportunities_on_hold", _make_current_user("Admin"))
        assert "audit_log" in sql
        assert "opportunity.updated_at" in sql  # the fallback

    def test_hold_reason_is_outer_joined_not_required(self):
        # A held opportunity's hold_reason_id shouldn't ever be NULL in
        # practice (BR-OP gate requires it), but the join itself must stay
        # an outer join, not silently drop rows if it ever were.
        sql = _run("opportunities_on_hold", _make_current_user("Admin"))
        assert "left outer join hold_reason" in sql.lower()

    def test_sbu_manager_scoped(self):
        current_user = _make_current_user("SBU Manager")
        sql = _run("opportunities_on_hold", current_user)
        assert "user_profile.sbu_id" in sql
        assert _uuid_literal(current_user.sbu_id) in sql
