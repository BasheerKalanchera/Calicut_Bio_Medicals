import uuid
from unittest.mock import MagicMock

from app.domains.opportunity.models import Opportunity
from app.domains.opportunity.repository import OpportunityRepository


def _make_opportunity(**overrides) -> MagicMock:
    defaults = {"id": uuid.uuid4(), "name": "Test Opportunity"}
    defaults.update(overrides)
    opp = MagicMock(spec=Opportunity)
    for k, v in defaults.items():
        setattr(opp, k, v)
    return opp


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
