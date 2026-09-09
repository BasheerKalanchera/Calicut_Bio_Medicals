import uuid
from unittest.mock import MagicMock

from app.domains.opportunity.models import Opportunity, OpportunityItem, Split
from app.domains.opportunity.repository import OpportunityRepository


def _make_opportunity(**overrides) -> MagicMock:
    defaults = {"id": uuid.uuid4(), "name": "Test Opportunity"}
    defaults.update(overrides)
    opp = MagicMock(spec=Opportunity)
    for k, v in defaults.items():
        setattr(opp, k, v)
    return opp


def _make_item(**overrides) -> MagicMock:
    defaults = {
        "id": uuid.uuid4(),
        "product_id": uuid.uuid4(),
        "description": None,
        "quantity": 1,
        "unit_price_lakhs": 1,
        "discount_lakhs": 0,
        "line_type": "PRODUCT",
        "updated_by": uuid.uuid4(),
    }
    defaults.update(overrides)
    item = MagicMock(spec=OpportunityItem)
    for k, v in defaults.items():
        setattr(item, k, v)
    return item


def _make_split(**overrides) -> MagicMock:
    defaults = {"user_id": uuid.uuid4(), "split_percentage": 50, "updated_by": uuid.uuid4()}
    defaults.update(overrides)
    split = MagicMock(spec=Split)
    for k, v in defaults.items():
        setattr(split, k, v)
    return split


class TestListOpportunitiesForStakeholder:
    def test_returns_opportunities(self):
        opp = _make_opportunity()
        mock_db = MagicMock()
        mock_db.scalars.return_value.unique.return_value.all.return_value = [opp]

        repo = OpportunityRepository(mock_db)
        results = repo.list_opportunities_for_stakeholder(uuid.uuid4())

        assert results == [opp]

    def test_returns_empty_when_no_links(self):
        mock_db = MagicMock()
        mock_db.scalars.return_value.unique.return_value.all.return_value = []

        repo = OpportunityRepository(mock_db)
        results = repo.list_opportunities_for_stakeholder(uuid.uuid4())

        assert results == []


class TestCountOpportunitiesGroupedByStakeholderIds:
    def test_returns_empty_dict_for_empty_input(self):
        mock_db = MagicMock()
        repo = OpportunityRepository(mock_db)

        result = repo.count_opportunities_grouped_by_stakeholder_ids([])

        assert result == {}
        mock_db.execute.assert_not_called()

    def test_returns_grouped_counts(self):
        sid1, sid2 = uuid.uuid4(), uuid.uuid4()
        row1 = MagicMock(stakeholder_id=sid1, cnt=2)
        row2 = MagicMock(stakeholder_id=sid2, cnt=1)
        mock_db = MagicMock()
        mock_db.execute.return_value.all.return_value = [row1, row2]

        repo = OpportunityRepository(mock_db)
        result = repo.count_opportunities_grouped_by_stakeholder_ids([sid1, sid2])

        assert result == {sid1: 2, sid2: 1}


class TestReplaceItems:
    """Audit-Trail-Extension-Implementation-Plan.md: replace_items partitions
    the resubmitted list into UPDATE/DELETE/INSERT instead of delete-all-then-
    reinsert, so the audit trigger sees a clean diff for an edited line
    (trigger-level diff behavior itself is verified live against Dev, not
    here -- this covers the partitioning logic that makes it possible)."""

    def _repo_with_existing(self, existing: list[MagicMock]) -> tuple[OpportunityRepository, MagicMock]:
        mock_db = MagicMock()
        mock_db.scalars.return_value.unique.return_value.all.return_value = existing
        return OpportunityRepository(mock_db), mock_db

    def test_editing_existing_line_updates_in_place_not_delete_insert(self):
        opportunity_id = uuid.uuid4()
        existing_item = _make_item(quantity=1)
        repo, mock_db = self._repo_with_existing([existing_item])

        edited = _make_item(id=existing_item.id, quantity=5, updated_by=uuid.uuid4())
        repo.replace_items(opportunity_id, [edited])

        assert existing_item.quantity == 5
        assert existing_item.updated_by == edited.updated_by
        mock_db.delete.assert_not_called()
        mock_db.add.assert_not_called()

    def test_line_missing_from_resubmitted_list_is_deleted(self):
        opportunity_id = uuid.uuid4()
        existing_item = _make_item()
        repo, mock_db = self._repo_with_existing([existing_item])

        repo.replace_items(opportunity_id, [])

        mock_db.delete.assert_called_once_with(existing_item)
        mock_db.add.assert_not_called()

    def test_new_line_with_no_id_is_inserted(self):
        opportunity_id = uuid.uuid4()
        repo, mock_db = self._repo_with_existing([])

        new_item = _make_item(id=None)
        repo.replace_items(opportunity_id, [new_item])

        mock_db.add.assert_called_once_with(new_item)
        mock_db.delete.assert_not_called()

    def test_id_not_matching_any_existing_row_is_treated_as_new(self):
        """A stale/foreign id (not on this opportunity) is never trusted as
        an update target -- falls through to insert, with its id cleared
        rather than handed straight to the DB."""
        opportunity_id = uuid.uuid4()
        repo, mock_db = self._repo_with_existing([])

        foreign_item = _make_item(id=uuid.uuid4())
        repo.replace_items(opportunity_id, [foreign_item])

        assert foreign_item.id is None
        mock_db.add.assert_called_once_with(foreign_item)

    def test_mixed_batch_produces_exactly_expected_operations(self):
        opportunity_id = uuid.uuid4()
        kept_item = _make_item(quantity=1)
        removed_item = _make_item()
        repo, mock_db = self._repo_with_existing([kept_item, removed_item])

        edited = _make_item(id=kept_item.id, quantity=9)
        added = _make_item(id=None)
        repo.replace_items(opportunity_id, [edited, added])

        assert kept_item.quantity == 9
        mock_db.delete.assert_called_once_with(removed_item)
        mock_db.add.assert_called_once_with(added)

    def test_unchanged_resave_touches_nothing(self):
        opportunity_id = uuid.uuid4()
        existing_item = _make_item(quantity=3)
        repo, mock_db = self._repo_with_existing([existing_item])

        resubmitted = _make_item(id=existing_item.id, quantity=3, updated_by=existing_item.updated_by)
        repo.replace_items(opportunity_id, [resubmitted])

        mock_db.delete.assert_not_called()
        mock_db.add.assert_not_called()

    def test_unchanged_resave_by_a_different_actor_does_not_bump_updated_by(self):
        """Found live 2026-09-09: a resubmitted list always carries the
        current actor's id on every line (service.py sets it uniformly),
        so blindly reassigning updated_by on an untouched line marked it
        dirty -- and produced a spurious audit row -- whenever the actor
        differed from whoever last saved it. Only the field values
        actually changing should trigger any write at all."""
        opportunity_id = uuid.uuid4()
        original_actor = uuid.uuid4()
        different_actor = uuid.uuid4()
        shared_product_id = uuid.uuid4()
        existing_item = _make_item(product_id=shared_product_id, quantity=3, updated_by=original_actor)
        repo, _ = self._repo_with_existing([existing_item])

        resubmitted = _make_item(
            id=existing_item.id, product_id=shared_product_id, quantity=3, updated_by=different_actor
        )
        repo.replace_items(opportunity_id, [resubmitted])

        assert existing_item.updated_by == original_actor


class TestReplaceSplits:
    """Upserts by (opportunity_id, user_id) instead of delete-all-then-
    reinsert -- same reasoning as TestReplaceItems above."""

    def _repo_with_existing(self, existing: list[MagicMock]) -> tuple[OpportunityRepository, MagicMock]:
        mock_db = MagicMock()
        mock_db.scalars.return_value.all.return_value = existing
        return OpportunityRepository(mock_db), mock_db

    def test_editing_existing_split_updates_in_place(self):
        opportunity_id = uuid.uuid4()
        existing_split = _make_split(split_percentage=50)
        repo, mock_db = self._repo_with_existing([existing_split])

        edited = _make_split(user_id=existing_split.user_id, split_percentage=70)
        repo.replace_splits(opportunity_id, [edited])

        assert existing_split.split_percentage == 70
        mock_db.delete.assert_not_called()
        mock_db.add.assert_not_called()

    def test_participant_missing_from_resubmitted_list_is_deleted(self):
        opportunity_id = uuid.uuid4()
        existing_split = _make_split()
        repo, mock_db = self._repo_with_existing([existing_split])

        repo.replace_splits(opportunity_id, [])

        mock_db.delete.assert_called_once_with(existing_split)

    def test_new_participant_is_inserted(self):
        opportunity_id = uuid.uuid4()
        repo, mock_db = self._repo_with_existing([])

        new_split = _make_split()
        repo.replace_splits(opportunity_id, [new_split])

        mock_db.add.assert_called_once_with(new_split)

    def test_unchanged_resave_by_a_different_actor_does_not_bump_updated_by(self):
        """Same class of bug as TestReplaceItems' equivalent test, found
        live 2026-09-09 -- editing one participant's split resubmits every
        participant, so an unchanged one must not get its updated_by
        bumped (and a spurious audit row fired) just because the actor
        differs from whoever last saved it."""
        opportunity_id = uuid.uuid4()
        original_actor = uuid.uuid4()
        different_actor = uuid.uuid4()
        existing_split = _make_split(split_percentage=50, updated_by=original_actor)
        repo, _ = self._repo_with_existing([existing_split])

        resubmitted = _make_split(
            user_id=existing_split.user_id, split_percentage=50, updated_by=different_actor
        )
        repo.replace_splits(opportunity_id, [resubmitted])

        assert existing_split.updated_by == original_actor
