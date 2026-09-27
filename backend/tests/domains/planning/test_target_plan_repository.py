"""Unit tests for TargetPlanRepository's query construction. Exercised
against a mocked DB (no real SQL execution) -- the generated statement is
compiled to a SQL string and asserted against, mirroring
tests/domains/reporting/test_reporting_repository.py's pattern.
"""

import uuid
from decimal import Decimal
from unittest.mock import MagicMock

from app.domains.planning.repository import BrandVendorTargetRepository, TargetPlanRepository

USER_ID = uuid.uuid4()
SBU_ID = uuid.uuid4()
APPROVER_ID = uuid.uuid4()
BRAND_ID = uuid.uuid4()


def _compiled(stmt) -> str:
    return str(stmt.compile(compile_kwargs={"literal_binds": True}))


def _uuid_literal(value: uuid.UUID) -> str:
    return value.hex


class TestListByUser:
    def test_filters_by_user_id(self):
        repo = TargetPlanRepository(db=MagicMock())
        repo.db.scalars.return_value.all.return_value = []

        repo.list_by_user(USER_ID)

        stmt = repo.db.scalars.call_args[0][0]
        sql = _compiled(stmt)
        assert f"target_plan.user_id = '{_uuid_literal(USER_ID)}'" in sql


class TestListPendingApprovalForApprover:
    def test_filters_by_manager_id_and_pending_status(self):
        repo = TargetPlanRepository(db=MagicMock())
        repo.db.scalars.return_value.all.return_value = []

        repo.list_pending_approval_for_approver(APPROVER_ID)

        stmt = repo.db.scalars.call_args[0][0]
        sql = _compiled(stmt)
        assert f"user_profile.manager_id = '{_uuid_literal(APPROVER_ID)}'" in sql
        assert "target_plan.status = 'PENDING_APPROVAL'" in sql
        assert "manager_id IS NULL" not in sql

    def test_include_orphaned_also_matches_managerless_owners(self):
        """The GM's own target (manager_id IS NULL) has to reach *someone's*
        approval queue -- Admin/GM's overlay-override queue is that someone,
        resolved 2026-09-17 (docs/Target-Planning-Code-Review-Findings-2026-
        09-17.md, finding discovered live: the button to approve it existed,
        but nothing ever listed it)."""
        repo = TargetPlanRepository(db=MagicMock())
        repo.db.scalars.return_value.all.return_value = []

        repo.list_pending_approval_for_approver(APPROVER_ID, include_orphaned=True)

        stmt = repo.db.scalars.call_args[0][0]
        sql = _compiled(stmt)
        assert f"user_profile.manager_id = '{_uuid_literal(APPROVER_ID)}'" in sql
        assert "user_profile.manager_id IS NULL" in sql
        assert f"target_plan.user_id != '{_uuid_literal(APPROVER_ID)}'" in sql


class TestListBySbuAndPeriod:
    def test_filters_by_sbu_and_period_and_hides_other_peoples_drafts(self):
        repo = TargetPlanRepository(db=MagicMock())
        repo.db.scalars.return_value.all.return_value = []

        repo.list_by_sbu_and_period(SBU_ID, "2026-Q3", viewer_id=USER_ID)

        stmt = repo.db.scalars.call_args[0][0]
        sql = _compiled(stmt)
        assert f"target_plan.sbu_id = '{_uuid_literal(SBU_ID)}'" in sql
        assert "target_plan.planning_period = '2026-Q3'" in sql
        assert (
            f"target_plan.status != 'DRAFT' OR target_plan.user_id = '{_uuid_literal(USER_ID)}'" in sql
        )


class TestGetByUserSbuPeriod:
    def test_filters_by_all_three(self):
        repo = TargetPlanRepository(db=MagicMock())
        repo.db.scalars.return_value.first.return_value = None

        repo.get_by_user_sbu_period(USER_ID, SBU_ID, "2026-Q3")

        stmt = repo.db.scalars.call_args[0][0]
        sql = _compiled(stmt)
        assert f"target_plan.user_id = '{_uuid_literal(USER_ID)}'" in sql
        assert f"target_plan.sbu_id = '{_uuid_literal(SBU_ID)}'" in sql
        assert "target_plan.planning_period = '2026-Q3'" in sql


class TestGetSbuRollup:
    def test_sums_every_submitted_status_but_not_drafts(self):
        """Resolved 2026-09-16: pending targets count in the rollup too.
        DRAFT rows don't (Hospital-Wise Target Planning, 2026-09-27) --
        they're unsubmitted and private to their owner."""
        repo = TargetPlanRepository(db=MagicMock())
        repo.db.execute.return_value.one.return_value = (150, 4)

        total, count = repo.get_sbu_rollup(SBU_ID, "2026-Q3")

        stmt = repo.db.execute.call_args[0][0]
        sql = _compiled(stmt)
        assert f"target_plan.sbu_id = '{_uuid_literal(SBU_ID)}'" in sql
        assert "target_plan.planning_period = '2026-Q3'" in sql
        assert "target_plan.status != 'DRAFT'" in sql
        assert "PENDING_APPROVAL" not in sql
        assert total == 150
        assert count == 4


class TestReplaceBrandSplits:
    def test_deletes_existing_then_inserts_each_split(self):
        target_plan_id = uuid.uuid4()
        brand_a, brand_b = uuid.uuid4(), uuid.uuid4()
        repo = TargetPlanRepository(db=MagicMock())

        repo.replace_brand_splits(
            target_plan_id, [(brand_a, Decimal("30")), (brand_b, Decimal("20"))]
        )

        delete_stmt = repo.db.execute.call_args_list[0][0][0]
        sql = _compiled(delete_stmt)
        assert f"target_plan_brand_split.target_plan_id = '{_uuid_literal(target_plan_id)}'" in sql
        assert repo.db.add.call_count == 2
        repo.db.flush.assert_called_once()


class TestGetBrandRollups:
    def test_sums_splits_per_brand_for_period_in_one_query(self):
        """One GROUP BY for every brand at once -- not a query per brand
        (/code-review 2026-09-23)."""
        other_brand_id = uuid.uuid4()
        repo = TargetPlanRepository(db=MagicMock())
        repo.db.execute.return_value.all.return_value = [(BRAND_ID, Decimal("50"))]

        totals = repo.get_brand_rollups([BRAND_ID, other_brand_id], "2026-Q3")

        stmt = repo.db.execute.call_args[0][0]
        sql = _compiled(stmt)
        expected_in_clause = f"brand_id IN ('{_uuid_literal(BRAND_ID)}', '{_uuid_literal(other_brand_id)}')"
        assert expected_in_clause in sql
        assert "target_plan.planning_period = '2026-Q3'" in sql
        assert "target_plan.status != 'DRAFT'" in sql
        assert totals == {BRAND_ID: Decimal("50")}

    def test_brand_with_no_splits_is_absent_from_the_result(self):
        repo = TargetPlanRepository(db=MagicMock())
        repo.db.execute.return_value.all.return_value = []

        totals = repo.get_brand_rollups([BRAND_ID], "2026-Q3")

        assert totals == {}


class TestBrandVendorTargetRepository:
    def test_get_by_brand_period_filters_by_both(self):
        repo = BrandVendorTargetRepository(db=MagicMock())
        repo.db.scalars.return_value.first.return_value = None

        repo.get_by_brand_period(BRAND_ID, "2026-Q3")

        stmt = repo.db.scalars.call_args[0][0]
        sql = _compiled(stmt)
        assert f"brand_vendor_target.brand_id = '{_uuid_literal(BRAND_ID)}'" in sql
        assert "brand_vendor_target.planning_period = '2026-Q3'" in sql

    def test_list_by_period_filters_by_period_only(self):
        repo = BrandVendorTargetRepository(db=MagicMock())
        repo.db.scalars.return_value.all.return_value = []

        repo.list_by_period("2026-Q3")

        stmt = repo.db.scalars.call_args[0][0]
        sql = _compiled(stmt)
        assert "brand_vendor_target.planning_period = '2026-Q3'" in sql


class TestReplaceAccounts:
    def test_deletes_existing_inserts_each_and_expires_the_collection(self):
        target_plan = MagicMock()
        target_plan.id = uuid.uuid4()
        acc_a, acc_b = uuid.uuid4(), uuid.uuid4()
        repo = TargetPlanRepository(db=MagicMock())

        repo.replace_accounts(
            target_plan,
            [(acc_a, Decimal("30"), "WEEKLY", None), (acc_b, Decimal("0"), "MONTHLY", "Visits only")],
            user_id=USER_ID,
        )

        delete_stmt = repo.db.execute.call_args_list[0][0][0]
        sql = _compiled(delete_stmt)
        assert f"target_plan_account.target_plan_id = '{_uuid_literal(target_plan.id)}'" in sql
        assert repo.db.add.call_count == 2
        repo.db.flush.assert_called_once()
        repo.db.expire.assert_called_once_with(target_plan, ["accounts"])


class TestAccountIdsOutsideZones:
    def test_returns_ids_not_under_any_zone(self):
        inside, outside = uuid.uuid4(), uuid.uuid4()
        zone_id = uuid.uuid4()
        repo = TargetPlanRepository(db=MagicMock())
        repo.db.scalars.return_value.all.return_value = [inside]

        result = repo.account_ids_outside_zones([inside, outside], [zone_id])

        stmt = repo.db.scalars.call_args[0][0]
        sql = _compiled(stmt)
        assert "zone_closure.ancestor_zone_id IN" in sql
        assert zone_id.hex in sql
        assert result == {outside}


class TestListEligibleAccounts:
    def test_empty_territory_returns_nothing_without_querying(self):
        repo = TargetPlanRepository(db=MagicMock())

        assert repo.list_eligible_accounts(search=None, zone_ids=[]) == []
        repo.db.scalars.assert_not_called()

    def test_unrestricted_has_no_zone_filter(self):
        repo = TargetPlanRepository(db=MagicMock())
        repo.db.scalars.return_value.unique.return_value.all.return_value = []

        repo.list_eligible_accounts(search="shifa", zone_ids=None)

        sql = _compiled(repo.db.scalars.call_args[0][0])
        assert "zone_closure" not in sql
        assert "lower(account.name) LIKE lower('%shifa%')" in sql

    def test_restricted_filters_by_zone_closure(self):
        zone_id = uuid.uuid4()
        repo = TargetPlanRepository(db=MagicMock())
        repo.db.scalars.return_value.unique.return_value.all.return_value = []

        repo.list_eligible_accounts(search=None, zone_ids=[zone_id])

        sql = _compiled(repo.db.scalars.call_args[0][0])
        assert "zone_closure.ancestor_zone_id IN" in sql
        assert zone_id.hex in sql


class TestFindOverlaps:
    def test_no_accounts_skips_the_query(self):
        repo = TargetPlanRepository(db=MagicMock())

        assert repo.find_overlaps([], SBU_ID, "2026-Q3") == []
        repo.db.execute.assert_not_called()

    def test_calls_the_security_definer_function(self):
        account_id = uuid.uuid4()
        row = MagicMock(account_id=account_id, display_name="Anil")
        repo = TargetPlanRepository(db=MagicMock())
        repo.db.execute.return_value.all.return_value = [row]

        result = repo.find_overlaps([account_id], SBU_ID, "2026-Q3")

        sql_text, params = repo.db.execute.call_args[0]
        assert "cabio_app_plan_overlap" in str(sql_text)
        assert params == {"ids": [str(account_id)], "sbu_id": str(SBU_ID), "period": "2026-Q3"}
        assert result == [(account_id, "Anil")]


class TestGetZoneRollup:
    def test_groups_submitted_plans_by_zone_level_ancestor(self):
        zone_id = uuid.uuid4()
        repo = TargetPlanRepository(db=MagicMock())
        repo.db.execute.return_value.all.return_value = [(zone_id, "North Kerala", 120, 5, 2)]

        rows = repo.get_zone_rollup(SBU_ID, "2026-Q3")

        sql = _compiled(repo.db.execute.call_args[0][0])
        assert "zone_1.zone_level = 'ZONE'" in sql or "zone_level = 'ZONE'" in sql
        assert "LEFT OUTER JOIN" in sql
        assert "target_plan.status != 'DRAFT'" in sql
        assert f"target_plan.sbu_id = '{_uuid_literal(SBU_ID)}'" in sql
        assert rows == [(zone_id, "North Kerala", Decimal("120"), 5, 2)]
