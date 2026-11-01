"""Session clock after a push (PostToolUse, Bash + PowerShell tools).

P98 (Harness Engineering review, 2026-11-01): the 2-hour / ~25-message
checkpoint after a push (`cabio-post-commit` skill) was called on a guess
twice -- 24 Oct ("several hours" at ~1 hour and 19 messages; Basheer: "We
just restarted. How long has the session run?") and 26 Oct ("has the
session too long already?"). After a successful `git push`, this prints the
session's real running time and Basheer's message count, read from the
session's own transcript, so the checkpoint is called on facts.

A restarted session has a new transcript, so the clock starts again there.
Counts as Basheer's messages: user entries that are typed text -- not tool
results, skill text (isMeta), interruptions or the context-summary note.
Reads the hook JSON on stdin; prints the facts as additional context, or
nothing. Never blocks; fails silent.
"""

import json
import re
import sys
from datetime import datetime

PUSH_RE = re.compile(r"\bgit\b(?:\s+-C\s+\S+)?\s+push\b")
FAILED_RE = re.compile(r"\b(?:rejected|fatal:|error: failed to push)", re.I)
NOT_TYPED = ("[Request interrupted", "This session is being continued")
HOURS, MESSAGES = 2, 25  # cabio-post-commit skill, "Natural Transition Checkpoint"


def typed_text(entry: dict) -> str:
    if entry.get("type") != "user" or entry.get("isMeta"):
        return ""
    content = (entry.get("message") or {}).get("content")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        if any(isinstance(b, dict) and b.get("type") == "tool_result" for b in content):
            return ""
        return " ".join(b.get("text", "") for b in content if isinstance(b, dict) and b.get("type") == "text")
    return ""


def session_facts(path: str):
    """(minutes since the first entry, Basheer's message count), or None."""
    first, count = None, 0
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            try:
                entry = json.loads(line)
            except ValueError:
                continue
            stamp = entry.get("timestamp")
            if stamp:
                when = datetime.fromisoformat(stamp.replace("Z", "+00:00"))
                first = when if first is None or when < first else first
            text = typed_text(entry).strip()
            if text and not text.startswith(NOT_TYPED):
                count += 1
    if first is None:
        return None
    minutes = int((datetime.now(first.tzinfo) - first).total_seconds() // 60)
    return minutes, count


def main() -> None:
    try:
        data = json.load(sys.stdin)
        command = str((data.get("tool_input") or {}).get("command", ""))
        if not PUSH_RE.search(command):
            return
        if FAILED_RE.search(json.dumps(data.get("tool_response", ""), ensure_ascii=False)):
            return
        facts = session_facts(data.get("transcript_path") or "")
    except (OSError, ValueError, TypeError):
        return
    if not facts:
        return
    minutes, count = facts
    due = minutes >= HOURS * 60 or count >= MESSAGES
    verdict = ("checkpoint reached: pause and do not start the next task"
               if due else "checkpoint not reached: carry on")
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": (
                f"P98 session clock: this session has run {minutes // 60} h {minutes % 60} min, "
                f"with {count} messages from Basheer (limit {HOURS} h or {MESSAGES} messages) -- "
                f"{verdict}. Quote these figures when you mention the checkpoint; never guess them."
            ),
        }
    }))


if __name__ == "__main__":
    main()
