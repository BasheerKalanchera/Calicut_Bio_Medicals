"""Plan-decisions guard rail (PreToolUse, Write + Edit tools). 2026-09-29.

Twice (2026-09-27, 2026-09-28) a design choice Basheer never made was
written into an implementation plan as if decided, then built. Plans now
carry a `## Decisions` list (see docs/templates/Implementation-Plan-Template.md)
where each line ends in either `— proposed` or `— Basheer, YYYY-MM-DD`.

This refuses a save of a `*-Implementation-Plan.md` file when, after the
save, its **Status:** line says Approved (or "ready to build") while any
Decisions line still ends in `— proposed`. Everything else passes silently.

Fails open: if this script errors, the sh wrapper lets the save through, so
a bug here can never block plan editing. The daily doc tidy-up runs the same
check over all plans (`--scan`) as the backstop, which also covers edits
made outside Claude's Write/Edit tools.
"""

import json
import re
import sys
from pathlib import Path

PLAN_SUFFIX = "-implementation-plan.md"
STATUS_RE = re.compile(r"^\*\*Status:\*\*(.*)$", re.I | re.M)
APPROVED_RE = re.compile(r"(?<!not )(?<!not yet )\bapproved\b|\bready to build\b", re.I)
PROPOSED_RE = re.compile(r"^\s*[-*]\s+(.*?)\s*(?:—|–|--?)\s*proposed\s*\.?\s*$", re.I)


def is_plan(path: str) -> bool:
    return path.replace("\\", "/").lower().endswith(PLAN_SUFFIX)


def proposed_decisions(text: str) -> list[str]:
    """Decision lines still marked proposed, inside the `## Decisions` section."""
    found, in_section = [], False
    for line in text.splitlines():
        if line.startswith("## "):
            in_section = line[3:].strip().lower().lstrip("0123456789. ").startswith("decisions")
            continue
        if in_section:
            m = PROPOSED_RE.match(line)
            if m:
                found.append(m.group(1))
    return found


def problem(text: str) -> str | None:
    status = STATUS_RE.search(text)
    if not status or not APPROVED_RE.search(status.group(1)):
        return None
    pending = proposed_decisions(text)
    if not pending:
        return None
    listed = "; ".join(p[:80] for p in pending[:5])
    return (
        f"This plan's Status says Approved, but {len(pending)} decision(s) are still "
        f"marked 'proposed': {listed}. Ask Basheer to decide each one (then mark it "
        "'— Basheer, <date>'), or keep the Status as Draft."
    )


def text_after(tool: str, tool_input: dict) -> str | None:
    path = Path(tool_input.get("file_path") or "")
    if tool == "Write":
        return tool_input.get("content") or ""
    text = path.read_text(encoding="utf-8") if path.is_file() else ""
    edits = tool_input.get("edits") or [tool_input]  # MultiEdit or Edit
    for e in edits:
        old, new = e.get("old_string") or "", e.get("new_string") or ""
        if not old:
            return None
        text = text.replace(old, new) if e.get("replace_all") else text.replace(old, new, 1)
    return text


def hook() -> None:
    data = json.loads(sys.stdin.buffer.read().decode("utf-8", "replace"))
    tool_input = data.get("tool_input") or {}
    if not is_plan(tool_input.get("file_path") or ""):
        return
    text = text_after(data.get("tool_name") or "", tool_input)
    reason = problem(text) if text is not None else None
    if reason:
        print(
            json.dumps(
                {
                    "hookSpecificOutput": {
                        "hookEventName": "PreToolUse",
                        "permissionDecision": "deny",
                        "permissionDecisionReason": reason,
                    }
                }
            )
        )


def scan(root: Path) -> int:
    """For the doc tidy-up: list every plan that fails the check."""
    bad = 0
    for plan in sorted((root / "docs").glob("*-Implementation-Plan.md")):
        reason = problem(plan.read_text(encoding="utf-8"))
        if reason:
            bad += 1
            print(f"{plan.name}: {reason}")
    print(f"plans failing the decisions check: {bad}")
    return 1 if bad else 0


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--scan":
        sys.exit(scan(Path(__file__).resolve().parents[2]))
    hook()
