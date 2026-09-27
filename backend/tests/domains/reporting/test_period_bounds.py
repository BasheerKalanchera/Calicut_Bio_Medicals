"""Report period boundaries fall at midnight IST, not the DB session's UTC
(Backlog "Report periods cut over at 05:30 IST", fixed 2026-09-27)."""

from datetime import UTC, date, datetime

from app.domains.opportunity.router import _closed_bounds
from app.domains.reporting.router import _period_bounds


def _utc(dt: datetime) -> datetime:
    return dt.astimezone(UTC)


def test_quarter_bounds_are_ist_midnights():
    start, end = _period_bounds(date(2026, 7, 1), date(2026, 9, 30))
    assert start.isoformat() == "2026-07-01T00:00:00+05:30"
    assert end.isoformat() == "2026-10-01T00:00:00+05:30"
    # i.e. 18:30 UTC the evening before
    assert _utc(start) == datetime(2026, 6, 30, 18, 30, tzinfo=UTC)
    assert _utc(end) == datetime(2026, 9, 30, 18, 30, tzinfo=UTC)


def test_period_bounds_pass_none_through():
    assert _period_bounds(None, None) == (None, None)


def test_drill_list_uses_the_same_bounds_as_the_report():
    assert _closed_bounds(date(2026, 7, 1), date(2026, 9, 30)) == _period_bounds(
        date(2026, 7, 1), date(2026, 9, 30)
    )
    assert _closed_bounds(None, None) == (None, None)
