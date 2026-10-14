"""Print the fiscal quarter for a date, using the app's own quarter code.

Usage: python scripts/quarter.py [YYYY-MM-DD | YYYY-Qn] ...
No argument means today (IST).

Why (2026-10-14, Process-Improvements P1): a quarter worked out from memory
was wrong ("2027-Q4 (Jan-Mar 2027)"; Progress-Archive-2026-10). This loads
backend/app/core/periods.py directly, so it always matches the app.
"""

import importlib.util
import sys
from datetime import date
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    "periods", Path(__file__).resolve().parents[1] / "backend" / "app" / "core" / "periods.py"
)
periods = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(periods)


def describe(arg: str) -> str:
    period = arg.upper() if "-Q" in arg.upper() else periods.quarter_of(date.fromisoformat(arg))
    start, end = periods.quarter_dates(period)
    label = period if period == arg.upper() else f"{arg}: {period}"
    return f"{label} = {start:%d %b %Y} to {end:%d %b %Y}"


if __name__ == "__main__":
    for a in sys.argv[1:] or [periods.today_ist().isoformat()]:
        print(describe(a))
