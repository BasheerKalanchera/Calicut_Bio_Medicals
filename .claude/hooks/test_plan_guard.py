"""Test-plan guard rail (PreToolUse, Write + Edit tools). 2026-10-03.

Manual E2E test plans were written several times (18-30 Sep, 1 Oct 2026)
without checking the assumed data against the live records, or without
tagging each step Simple/Complex, although CLAUDE.md "Manual E2E testing"
required both. Per CLAUDE.md (a repeat gets a structural fix), this checks
the plan on save.

Applies to `*E2E-Test-Plan.md` files that are new, or that carry the
template marker (`<!-- e2e-template v1`, see
docs/templates/Manual-E2E-Test-Plan-Template.md). Older plans without the
marker are left alone, so recording Pass/Fail in them still works.

Refuses the save when, after it:
- a new plan has no template marker (start from the template);
- the `## Checked against live data` section is missing, or one of its four
  lines (Who sees / Who can approve / Who can save / Existing values) is
  missing, empty or still a `<placeholder>`;
- a step (`1.` or `- P1.`) doesn't start with `[Simple]` or
  `[Complex: <reason>]` (a bare `[Complex]` is refused).

Fails open like plan_decisions_guard.py: if this script errors, the save
goes through. Scripted edits via Bash are refused by shell_guard.py only
for code files, so edit test plans with Write/Edit.
"""

import json
import re
import sys
from pathlib import Path

MARKER = "<!-- e2e-template v1"
LIVE_LINES = ("Who sees", "Who can approve", "Who can save", "Existing values")
STEP_RE = re.compile(r"^(?:\d+\.|- P\d+\.)\s+(.*)$")
TAG_RE = re.compile(r"^\[(?:Simple|Complex:\s*[^\]\s<][^\]]*)\]")


def is_test_plan(path: str) -> bool:
    return path.replace("\\", "/").lower().endswith("e2e-test-plan.md")


def live_data_problems(text: str) -> list[str]:
    m = re.search(r"^## Checked against live data\s*$(.*?)(?=^## |\Z)", text, re.M | re.S | re.I)
    if not m:
        return ["the '## Checked against live data' section is missing"]
    out = []
    for label in LIVE_LINES:
        line = re.search(rf"^\s*-\s*\*\*{label}:\*\*(.*)$", m.group(1), re.M | re.I)
        value = line.group(1).strip() if line else ""
        if not value or value.startswith("<"):
            out.append(f"'{label}' is not filled in from the live data")
    return out


def untagged_steps(text: str) -> list[str]:
    bad = []
    for line in text.splitlines():
        m = STEP_RE.match(line)
        if m and not TAG_RE.match(m.group(1)):
            bad.append(line.strip()[:60])
    return bad


def problem(text: str, is_new: bool) -> str | None:
    if MARKER not in text:
        if is_new:
            return ("New test plans start from docs/templates/Manual-E2E-Test-Plan-Template.md "
                    "(keep its first-line marker).")
        return None
    issues = live_data_problems(text)
    steps = untagged_steps(text)
    if steps:
        issues.append(f"{len(steps)} step(s) lack a [Simple] or [Complex: <reason>] tag, e.g. "
                      + "; ".join(steps[:3]))
    if not issues:
        return None
    return "Test plan not saved: " + "; ".join(issues) + ". See the template's instructions."


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
    if not is_test_plan(raw_path):
        return
    path = Path(raw_path)
    text = text_after(data.get("tool_name") or "", tool_input, path)
    reason = problem(text, not path.is_file()) if text is not None else None
    if reason:
        print(json.dumps({"hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }}))


if __name__ == "__main__":
    main()
