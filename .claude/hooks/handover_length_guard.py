"""Handover note length guard (Write + Edit tools). P24, 2026-10-19.

The 75-line limit on session handover notes (CLAUDE.md "Session handoff")
was only checked by the SessionStart hook, so an over-long note was noticed
hours later, after a restart or a context summary (seen 6 times by
2026-10-19). Basheer, Harness Engineering review 2026-10-19: warn at once
above 75 lines, refuse the save only above 100 -- a refusal mid-build would
stop the note being updated before a restart, which costs more (P16).

- PreToolUse: refuses a save that would leave the note above 100 lines,
  unless it makes the note shorter (trimming must always be possible).
- PostToolUse: above 75 lines, tells Claude to trim at the next pause.

Lines are counted like `wc -l` in session-start.sh (newline characters).
Covers .claude/session-handover-*.md, worktree copies included. Fails open
like the other guards: if this script errors, the save goes through.
"""

import json
import re
import sys
from pathlib import Path

NOTE_RE = re.compile(r"(?:^|/)\.claude/session-handover-[\w-]+\.md$", re.I)
WARN_ABOVE = 75
REFUSE_ABOVE = 100


def text_after(tool: str, tool_input: dict, path: Path) -> str | None:
    if tool == "Write":
        return tool_input.get("content") or ""
    text = path.read_text(encoding="utf-8") if path.is_file() else ""
    for e in tool_input.get("edits") or [tool_input]:
        old, new = e.get("old_string") or "", e.get("new_string") or ""
        if not old:
            return None
        text = text.replace(old, new) if e.get("replace_all") else text.replace(old, new, 1)
    return text


def main() -> None:
    data = json.loads(sys.stdin.buffer.read().decode("utf-8", "replace"))
    tool_input = data.get("tool_input") or {}
    raw_path = tool_input.get("file_path") or ""
    if not NOTE_RE.search(raw_path.replace("\\", "/")):
        return
    path = Path(raw_path)
    if data.get("hook_event_name") == "PostToolUse":
        if not path.is_file():
            return
        n = path.read_text(encoding="utf-8").count("\n")
        if n > WARN_ABOVE:
            print(json.dumps({"hookSpecificOutput": {
                "hookEventName": "PostToolUse",
                "additionalContext": (
                    f"P24: {path.name} is now {n} lines (limit {WARN_ABOVE}; saves are "
                    f"refused above {REFUSE_ABOVE}). At the next pause, move finished "
                    "threads to docs/Progress-Archive-<year>-<month>.md and waiting or "
                    "unstarted items to their homes, then tell Basheer."
                ),
            }}))
        return
    after = text_after(data.get("tool_name") or "", tool_input, path)
    if after is None:
        return
    n = after.count("\n")
    before = path.read_text(encoding="utf-8").count("\n") if path.is_file() else 0
    if n > REFUSE_ABOVE and n > before:  # a save that shortens the note is always allowed
        print(json.dumps({"hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": (
                f"Not saved: {path.name} would be {n} lines; saves are refused above "
                f"{REFUSE_ABOVE} (limit {WARN_ABOVE}, CLAUDE.md Session handoff). Trim "
                "first: move finished threads to Progress-Archive, waiting or unstarted "
                "items to their homes, then save this change."
            ),
        }}))


if __name__ == "__main__":
    main()
