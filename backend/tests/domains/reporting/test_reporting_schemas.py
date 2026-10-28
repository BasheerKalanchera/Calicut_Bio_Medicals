"""
Row shapes the reporting queries hand to the response models -- the repository
tests only compile SQL, so a type the model refuses (Stagnant Opportunities,
28 Oct 2026) never showed up there.
"""

import uuid
from datetime import UTC, date, datetime

from app.domains.reporting.schemas import StagnantDealRow


def _row(last_activity_date) -> dict:
    return {
        "opportunity_id": uuid.uuid4(),
        "opportunity_name": "USG M/c",
        "account_name": "Aster MIMS Calicut",
        "owner_name": "Fahad",
        "stage_name": "Demo",
        "last_activity_date": last_activity_date,
        "days_stagnant": 56,
    }


class TestStagnantDealRow:
    def test_timestamp_with_a_time_of_day_becomes_its_india_day(self):
        # 22:30 UTC on 27 Jul is 04:00 on 28 Jul in India.
        row = StagnantDealRow.model_validate(_row(datetime(2026, 7, 27, 22, 30, tzinfo=UTC)))
        assert row.last_activity_date == date(2026, 7, 28)

    def test_no_contact_date_stays_empty(self):
        assert StagnantDealRow.model_validate(_row(None)).last_activity_date is None
