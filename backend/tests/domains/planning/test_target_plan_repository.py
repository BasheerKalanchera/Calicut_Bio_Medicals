"""Unit tests for TargetPlanRepository's query construction. Exercised
against a mocked DB (no real SQL execution) -- the generated statement is
compiled to a SQL string and asserted against, mirroring
tests/domains/reporting/test_reporting_repository.py's pattern.
"""

import uuid
from unittest.mock import MagicMock

from app.domains.planning.repository import TargetPlanRepository

USER_ID = uuid.uuid4()
SBU_ID = uuid.uuid4()
APPROVER_ID = uuid.uuid4()


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
