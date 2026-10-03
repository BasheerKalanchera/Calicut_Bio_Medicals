"""Shared date helpers: IST midnights and the Indian fiscal quarter.

Fiscal year runs April-March; a period is "YYYY-Qn" where YYYY is the year the
FY starts in (Q1 = Apr-Jun, Q2 = Jul-Sep, Q3 = Oct-Dec, Q4 = Jan-Mar of the
next calendar year). Mirrors getFiscalQuarterBounds in the frontend's
utils/formatter.ts.
"""

from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

IST = ZoneInfo("Asia/Kolkata")

_QUARTER_START_MONTH = {1: 4, 2: 7, 3: 10, 4: 1}


def ist_midnight(d: date) -> datetime:
    return datetime(d.year, d.month, d.day, tzinfo=IST)


def today_ist() -> date:
    return datetime.now(IST).date()


def period_bounds(
    period_start: date | None, period_end: date | None
) -> tuple[datetime | None, datetime | None]:
    # period_end is inclusive (a calendar date the caller picked, e.g. "the
    # last day of this quarter") -- closed_at is a timestamp, so the upper
    # bound has to be the start of the *next* day, not midnight of
    # period_end itself, or that whole last day would be excluded.
    # Midnight in IST, not the DB session's UTC -- a naive bound put every
    # period boundary at 05:30 IST (Backlog, found 2026-09-27).
    start_dt = ist_midnight(period_start) if period_start else None
    end_dt = ist_midnight(period_end + timedelta(days=1)) if period_end else None
    return start_dt, end_dt


def quarter_dates(planning_period: str) -> tuple[date, date]:
    """First and last calendar day (inclusive) of a "YYYY-Qn" fiscal quarter."""
    year_part, q_part = planning_period.split("-Q")
    fy_year, quarter = int(year_part), int(q_part)
    month = _QUARTER_START_MONTH[quarter]
    start_year = fy_year + 1 if quarter == 4 else fy_year
    start = date(start_year, month, 1)
    next_year, next_month = (start_year + 1, 1) if month == 10 else (start_year, month + 3)
    return start, date(next_year, next_month, 1) - timedelta(days=1)


def quarter_of(d: date) -> str:
    """The "YYYY-Qn" fiscal quarter that contains `d`."""
    if d.month >= 10:
        return f"{d.year}-Q3"
    if d.month >= 7:
        return f"{d.year}-Q2"
    if d.month >= 4:
        return f"{d.year}-Q1"
    return f"{d.year - 1}-Q4"
