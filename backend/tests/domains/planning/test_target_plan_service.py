import uuid
from decimal import Decimal
from unittest.mock import MagicMock

import pytest

from app.core.exceptions import AuthorizationError, ConflictError, NotFoundError
from app.domains.organization.models import UserProfile
from app.domains.planning.models import TargetPlan
from app.domains.planning.repository import TargetPlanRepository
from app.domains.planning.schemas import TargetPlanCreate, TargetPlanUpdate
from app.domains.planning.service import TargetPlanService

SBU_ID = uuid.uuid4()


def _make_user(role_name: str, **overrides) -> MagicMock:
    defaults = {"id": uuid.uuid4(), "manager_id": None}
    defaults.update(overrides)
    user = MagicMock(spec=UserProfile)
    for k, v in defaults.items():
        setattr(user, k, v)
    role = MagicMock()
    role.role_name = role_name
    user.role = role
    return user


def _make_target_plan(**overrides) -> MagicMock:
    defaults = {
        "id": uuid.uuid4(),
        "user_id": uuid.uuid4(),
        "sbu_id": SBU_ID,
        "planning_period": "2026-Q3",
        "target_amount_lakhs": Decimal("50.00"),
        "status": "PENDING_APPROVAL",
        "approved_by": None,
        "approved_at": None,
    }
    defaults.update(overrides)
    target_plan = MagicMock(spec=TargetPlan)
    for k, v in defaults.items():
        setattr(target_plan, k, v)
    return target_plan


def _make_repo(**overrides) -> MagicMock:
    repo = MagicMock(spec=TargetPlanRepository)
    repo.db = MagicMock()
    repo.get_by_user_sbu_period.return_value = None
    repo.create.side_effect = lambda obj: obj
    repo.update.side_effect = lambda obj: obj
    for k, v in overrides.items():
        setattr(repo, k, v)
    return repo


class TestCreateTargetPlan:
    def test_creates_pending_approval_row(self):
        repo = _make_repo()
        service = TargetPlanService(repository=repo)
        current_user = _make_user("Sales Staff")
        data = TargetPlanCreate(sbu_id=SBU_ID, planning_period="2026-Q3", target_amount_lakhs=Decimal("50"))

        result = service.create_target_plan(data, current_user=current_user)

        assert result.status == "PENDING_APPROVAL"
        assert result.user_id == current_user.id

    def test_raises_conflict_when_already_set(self):
        repo = _make_repo(get_by_user_sbu_period=MagicMock(return_value=_make_target_plan()))
        service = TargetPlanService(repository=repo)
        current_user = _make_user("Sales Staff")
        data = TargetPlanCreate(sbu_id=SBU_ID, planning_period="2026-Q3", target_amount_lakhs=Decimal("50"))

        with pytest.raises(ConflictError, match="already have a target"):
            service.create_target_plan(data, current_user=current_user)


class TestUpdateTargetPlan:
    def test_owner_can_revise_own_target(self):
        owner = _make_user("Sales Staff")
        target_plan = _make_target_plan(user_id=owner.id, status="PENDING_APPROVAL")
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        service = TargetPlanService(repository=repo)

        result = service.update_target_plan(
            target_plan.id, TargetPlanUpdate(target_amount_lakhs=Decimal("75")), current_user=owner
        )

        assert result.target_amount_lakhs == Decimal("75")
        assert result.status == "PENDING_APPROVAL"

    def test_revising_an_approved_target_resets_to_pending(self):
        owner = _make_user("Sales Staff")
        target_plan = _make_target_plan(
            user_id=owner.id, status="APPROVED", approved_by=uuid.uuid4(), approved_at="2026-09-01"
        )
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        service = TargetPlanService(repository=repo)

        result = service.update_target_plan(
            target_plan.id, TargetPlanUpdate(target_amount_lakhs=Decimal("80")), current_user=owner
        )

        assert result.status == "PENDING_APPROVAL"
        assert result.approved_by is None
        assert result.approved_at is None

    def test_non_owner_cannot_revise(self):
        owner = _make_user("Sales Staff")
        other = _make_user("Sales Staff")
        target_plan = _make_target_plan(user_id=owner.id)
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        service = TargetPlanService(repository=repo)

        with pytest.raises(AuthorizationError, match="only revise your own"):
            service.update_target_plan(
                target_plan.id, TargetPlanUpdate(target_amount_lakhs=Decimal("99")), current_user=other
            )

    def test_raises_not_found(self):
        repo = _make_repo(get_by_id=MagicMock(return_value=None))
        service = TargetPlanService(repository=repo)

        with pytest.raises(NotFoundError, match="not found"):
            service.update_target_plan(
                uuid.uuid4(), TargetPlanUpdate(target_amount_lakhs=Decimal("1")), current_user=_make_user("Sales Staff")
            )


class TestApproveOrRejectTargetPlan:
    def test_resolved_manager_can_approve(self):
        manager = _make_user("Area Manager")
        subordinate = _make_user("Sales Staff", manager_id=manager.id)
        target_plan = _make_target_plan(user_id=subordinate.id, status="PENDING_APPROVAL")
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        repo.db.get.return_value = subordinate  # get_approver_id looks up subordinate.manager_id
        service = TargetPlanService(repository=repo)

        result = service.approve_or_reject_target_plan(
            target_plan.id, status="APPROVED", current_user=manager
        )

        assert result.status == "APPROVED"
        assert result.approved_by == manager.id

    def test_unrelated_peer_cannot_approve(self):
        subordinate = _make_user("Sales Staff", manager_id=uuid.uuid4())
        peer = _make_user("Area Manager")  # a different manager, not subordinate's own
        target_plan = _make_target_plan(user_id=subordinate.id, status="PENDING_APPROVAL")
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        repo.db.get.return_value = subordinate
        service = TargetPlanService(repository=repo)

        with pytest.raises(AuthorizationError, match="authorized"):
            service.approve_or_reject_target_plan(target_plan.id, status="APPROVED", current_user=peer)

    def test_sales_staff_cannot_approve_a_peer(self):
        subordinate = _make_user("Sales Staff", manager_id=uuid.uuid4())
        another_staff = _make_user("Sales Staff")
        target_plan = _make_target_plan(user_id=subordinate.id, status="PENDING_APPROVAL")
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        repo.db.get.return_value = subordinate
        service = TargetPlanService(repository=repo)

        with pytest.raises(AuthorizationError, match="authorized"):
            service.approve_or_reject_target_plan(
                target_plan.id, status="APPROVED", current_user=another_staff
            )

    def test_admin_can_approve_a_subordinate_target(self):
        subordinate = _make_user("Area Manager", manager_id=uuid.uuid4())
        admin = _make_user("Admin")
        target_plan = _make_target_plan(user_id=subordinate.id, status="PENDING_APPROVAL")
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        repo.db.get.return_value = subordinate
        service = TargetPlanService(repository=repo)

        result = service.approve_or_reject_target_plan(target_plan.id, status="APPROVED", current_user=admin)

        assert result.status == "APPROVED"
        assert result.approved_by == admin.id

    def test_gm_cannot_approve_their_own_target(self):
        """Top-of-chain case: GM has no manager_id, so get_approver_id returns
        None -- and the Admin/GM overlay override must not let GM approve
        themselves either (resolved 2026-09-16: nobody approves their own row)."""
        gm = _make_user("General Manager", manager_id=None)
        target_plan = _make_target_plan(user_id=gm.id, status="PENDING_APPROVAL")
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        repo.db.get.return_value = gm  # get_approver_id(gm.id) -> gm.manager_id -> None
        service = TargetPlanService(repository=repo)

        with pytest.raises(AuthorizationError, match="authorized"):
            service.approve_or_reject_target_plan(target_plan.id, status="APPROVED", current_user=gm)

    def test_admin_can_approve_the_gms_own_target(self):
        """The other half of the top-of-chain case: since GM can't approve
        themselves, the only path left is another Admin/GM user who isn't
        the row's own owner -- in practice, the separate Admin account."""
        gm = _make_user("General Manager", manager_id=None)
        admin = _make_user("Admin")
        target_plan = _make_target_plan(user_id=gm.id, status="PENDING_APPROVAL")
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        repo.db.get.return_value = gm
        service = TargetPlanService(repository=repo)

        result = service.approve_or_reject_target_plan(target_plan.id, status="APPROVED", current_user=admin)

        assert result.status == "APPROVED"
        assert result.approved_by == admin.id

    def test_reject_sets_status_rejected(self):
        manager = _make_user("Area Manager")
        subordinate = _make_user("Sales Staff", manager_id=manager.id)
        target_plan = _make_target_plan(user_id=subordinate.id, status="PENDING_APPROVAL")
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        repo.db.get.return_value = subordinate
        service = TargetPlanService(repository=repo)

        result = service.approve_or_reject_target_plan(
            target_plan.id, status="REJECTED", current_user=manager
        )

        assert result.status == "REJECTED"


class TestGetSbuRollup:
    def test_delegates_to_repository_and_includes_pending(self):
        repo = _make_repo(get_sbu_rollup=MagicMock(return_value=(Decimal("120.00"), 3)))
        service = TargetPlanService(repository=repo)

        total, count = service.get_sbu_rollup(SBU_ID, "2026-Q3")

        assert total == Decimal("120.00")
        assert count == 3
        repo.get_sbu_rollup.assert_called_once_with(SBU_ID, "2026-Q3")


class TestListTeamTargets:
    def test_delegates_to_repository(self):
        rows = [_make_target_plan(), _make_target_plan()]
        repo = _make_repo(list_by_sbu_and_period=MagicMock(return_value=rows))
        service = TargetPlanService(repository=repo)

        result = service.list_team_targets(SBU_ID, "2026-Q3")

        assert result == rows
        repo.list_by_sbu_and_period.assert_called_once_with(SBU_ID, "2026-Q3")


class TestDeleteTargetPlan:
    def test_owner_can_delete_own(self):
        owner = _make_user("Sales Staff")
        target_plan = _make_target_plan(user_id=owner.id)
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        service = TargetPlanService(repository=repo)

        service.delete_target_plan(target_plan.id, current_user=owner)

        repo.delete.assert_called_once_with(target_plan)

    def test_non_owner_non_overlay_cannot_delete(self):
        owner = _make_user("Sales Staff")
        other = _make_user("Sales Staff")
        target_plan = _make_target_plan(user_id=owner.id)
        repo = _make_repo(get_by_id=MagicMock(return_value=target_plan))
        service = TargetPlanService(repository=repo)

        with pytest.raises(AuthorizationError, match="only delete your own"):
            service.delete_target_plan(target_plan.id, current_user=other)
