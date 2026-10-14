"""Figures-and-sources guard rail (PreToolUse, Write + Edit tools). 2026-10-14.

Numbers, names and examples were written into plans and test plans without
checking them (Process-Improvements P1, seen 29 times by 2026-10-14). Both
templates in docs/templates/ now carry a `## Figures and sources` section:
one line per figure or example, with where it came from.

Refuses the save of a `*-Implementation-Plan.md` or `*E2E-Test-Plan.md` when:
- the file is new and the section is missing, or has no filled-in line
  (only the `<placeholder>` line, or nothing);
- the file already has the section and the save would leave it missing or
  empty.
Older documents without the section are left alone.

Fails open like the other guards: if this script errors, the save goes
through.
"""

import json
import re
import sys
from pathlib import Path

SECTION_RE = re.compile(r"^## Figures and sources\s*$(.*?)(?=^## |\Z)", re.M | re.S | re.I)
LINE_RE = re.compile(r"^\s*-\s+(\S.*)$", re.M)


def is_guarded(path: str) -> bool:
    p = path.replace("\\", "/").lower()
    return p.endswith("-implementation-plan.md") or p.endswith("e2e-test-plan.md")


def filled(text: str) -> bool | None:
    """None if the section is absent; else whether it has a real line."""
    m = SECTION_RE.search(text)
    if not m:
        return None
    return any(not line.startswith("<") for line in LINE_RE.findall(m.group(1)))


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


def problem(before: str | None, after: str) -> str | None:
    if before is not None and filled(before) is None:
        return None  # older document without the section
    if filled(after):
        return None
    return ("Not saved: the '## Figures and sources' section is missing or has no "
            "filled-in line. List each number, name and example with where it came "
            "from (Dev query + date, file, Basheer, or made-up example). See the "
            "templates in docs/templates/.")


def main() -> None:
    data = json.loads(sys.stdin.buffer.read().decode("utf-8", "replace"))
    tool_input = data.get("tool_input") or {}
    raw_path = tool_input.get("file_path") or ""
    if not is_guarded(raw_path):
        return
    path = Path(raw_path)
    after = text_after(data.get("tool_name") or "", tool_input, path)
    if after is None:
        return
    before = path.read_text(encoding="utf-8") if path.is_file() else None
    reason = problem(before, after)
    if reason:
        print(json.dumps({"hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }}))


if __name__ == "__main__":
    main()
