"""Status line: time worked, start time and message count (Harness review item 6,
Basheer 2026-11-27). Basheer never sees the session clock's hook output, only
Claude does; this shows the same figures at the bottom of his screen.

Uses session_clock.py's own counting, so the line and the refresh advice agree:
idle gaps of 30 minutes or more left out; only Basheer's typed messages count.
Over the clock's 2-hour limit it adds "refresh due". Reads the status-line JSON
on stdin; prints one line, or nothing if anything fails.
"""

import json
import os
import sys
from datetime import datetime, timedelta, timezone

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from session_clock import over_limit, session_facts  # noqa: E402

IST = timezone(timedelta(hours=5, minutes=30))


def started(path: str):
    """The session's first transcript timestamp, in IST, or None."""
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            try:
                stamp = json.loads(line).get("timestamp")
            except (ValueError, AttributeError):
                continue
            if stamp:
                return datetime.fromisoformat(stamp.replace("Z", "+00:00")).astimezone(IST)
    return None


def line(minutes: int, count: int, start) -> str:
    text = f"⏱ {minutes // 60} h {minutes % 60} min worked · started {start:%H:%M} · {count} messages"
    return text + (" · refresh due" if over_limit(minutes) else "")


def main() -> None:
    try:
        path = json.load(sys.stdin).get("transcript_path") or ""
        facts, start = session_facts(path), started(path)
    except (OSError, ValueError, TypeError, AttributeError):
        return
    if facts and start:
        minutes, count, _ = facts
        print(line(minutes, count, start))


if __name__ == "__main__":
    main()
