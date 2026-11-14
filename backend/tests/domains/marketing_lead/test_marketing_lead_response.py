"""
The lead list response names whoever converted or discarded the lead
(reviewed_by_user), so the cards can show "Converted by / Discarded by <name>".
"""

import uuid
from datetime import UTC, datetime
from unittest.mock import MagicMock

from app.api.routers.marketing_leads import _to_response


def _lead(status: str, reviewer: MagicMock | None) -> MagicMock:
    lead = MagicMock()
    lead.id = uuid.uuid4()
    lead.account_id = None
    lead.sbu_id = uuid.uuid4()
    lead.lead_source_id = uuid.uuid4()
    lead.event_name = None
    lead.raw_interest_note = None
    lead.product_id = None
    lead.assigned_to_user_id = uuid.uuid4()
    lead.assigned_to_user = MagicMock(id=lead.assigned_to_user_id, display_name="Fazal")
    lead.status = status
    lead.discard_reason = None
    lead.discard_note = "Not a real enquiry" if status == "DISCARDED" else None
    lead.converted_opportunity_id = None
    lead.created_by = uuid.uuid4()
    lead.created_at = datetime(2026, 11, 13, tzinfo=UTC)
    lead.first_viewed_at = None
    lead.reviewed_by = reviewer.id if reviewer is not None else None
    lead.reviewed_by_user = reviewer
    lead.reviewed_at = datetime(2026, 11, 14, tzinfo=UTC) if reviewer is not None else None
    return lead


def _reviewer(name: str) -> MagicMock:
    return MagicMock(id=uuid.uuid4(), display_name=name)


class TestEnrichedReRead:
    def test_re_read_refreshes_the_copy_the_session_already_holds(self) -> None:
        # Discard/Convert change the lead in this session, then re-read it for
        # the response; without populate_existing reviewed_by_user stays None.
        from app.domains.marketing_lead.repository import MarketingLeadRepository

        db = MagicMock()
        MarketingLeadRepository(db).get_enriched_by_id(uuid.uuid4())
        stmt = db.execute.call_args[0][0]
        assert stmt.get_execution_options().get("populate_existing") is True


class TestReviewedByUser:
    def test_discarded_lead_names_who_discarded_it(self) -> None:
        reviewer = _reviewer("Haroon Sidheeq")
        response = _to_response((_lead("DISCARDED", reviewer), None, "INDIAMART", None, 0))
        assert response.reviewed_by_user is not None
        assert response.reviewed_by_user.display_name == "Haroon Sidheeq"
        # The assigned rep is a different person and stays separate.
        assert response.assigned_to_user.display_name == "Fazal"

    def test_converted_lead_names_who_converted_it(self) -> None:
        reviewer = _reviewer("Fazal")
        response = _to_response((_lead("CONVERTED", reviewer), None, "INDIAMART", None, 0))
        assert response.reviewed_by_user is not None
        assert response.reviewed_by_user.display_name == "Fazal"

    def test_new_lead_has_no_reviewer(self) -> None:
        response = _to_response((_lead("NEW", None), None, "INDIAMART", None, 0))
        assert response.reviewed_by_user is None
