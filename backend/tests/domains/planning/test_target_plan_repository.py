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
    def test_filters_by_sbu_and_period(self):
        repo = TargetPlanRepository(db=MagicMock())
        repo.db.scalars.return_value.all.return_value = []

        repo.list_by_sbu_and_period(SBU_ID, "2026-Q3")

        stmt = repo.db.scalars.call_args[0][0]
        sql = _compiled(stmt)
        assert f"target_plan.sbu_id = '{_uuid_literal(SBU_ID)}'" in sql
        assert "target_plan.planning_period = '2026-Q3'" in sql


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
    def test_sums_regardless_of_status(self):
        """Resolved 2026-09-16: pending targets count in the rollup too --
        this query has no status filter at all, unlike the pending-approval
        query above which deliberately does."""
        repo = TargetPlanRepository(db=MagicMock())
        repo.db.execute.return_value.one.return_value = (150, 4)

        total, count = repo.get_sbu_rollup(SBU_ID, "2026-Q3")

        stmt = repo.db.execute.call_args[0][0]
        sql = _compiled(stmt)
        assert f"target_plan.sbu_id = '{_uuid_literal(SBU_ID)}'" in sql
        assert "target_plan.planning_period = '2026-Q3'" in sql
        assert "status" not in sql
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


class TestGetBrandRollup:
    def test_sums_splits_for_brand_and_period_across_target_plans(self):
        repo = TargetPlanRepository(db=MagicMock())
        repo.db.scalar.return_value = 50

        total = repo.get_brand_rollup(BRAND_ID, "2026-Q3")

        stmt = repo.db.scalar.call_args[0][0]
        sql = _compiled(stmt)
        assert f"target_plan_brand_split.brand_id = '{_uuid_literal(BRAND_ID)}'" in sql
        assert "target_plan.planning_period = '2026-Q3'" in sql
        assert total == Decimal("50")

    def test_returns_zero_when_no_splits_exist(self):
        repo = TargetPlanRepository(db=MagicMock())
        repo.db.scalar.return_value = None

        total = repo.get_brand_rollup(BRAND_ID, "2026-Q3")

        assert total == Decimal("0")


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
