"""Handover reminder after a commit (PostToolUse, Bash + PowerShell tools).

P16 (Harness Engineering review, 2026-10-17): the written rule "update the
handover note at every checkpoint" was missed 10 times, most often after a
commit -- the note still said "Next: step 3" after step 3 was committed, so
the next session started from the wrong place. After every successful
`git commit`, this tells Claude to update its session's handover note with
the new hash now (no extra approval: the note rides in the next docs batch,
CLAUDE.md "Show before you act", 2026-10-17).

Success is read from git's own output line, e.g. "[main 6e7d6a6] docs: ...",
so a refused or failed commit says nothing. Reads the hook JSON on stdin;
prints the reminder as additional context, or nothing.
"""

import json
import re
import sys

COMMIT_RE = re.compile(r"\bgit\b(?:\s+-C\s+\S+)?\s+commit\b")
RESULT_RE = re.compile(r"\[([\w./-]+)(?: \(root-commit\))? ([0-9a-f]{7,40})\]")


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except ValueError:
        return
    command = str((data.get("tool_input") or {}).get("command", ""))
    if not COMMIT_RE.search(command):
        return
    match = RESULT_RE.search(json.dumps(data.get("tool_response", ""), ensure_ascii=False))
    if not match:
        return
    branch, sha = match.group(1), match.group(2)[:7]
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": (
                f"Commit {sha} is on {branch}. P16: update this session's handover "
                "note now (.claude/session-handover-plan.md, "
                ".claude/session-handover-build.md, or for /build "
                ".claude/session-handover-build-parallel.md in its worktree): what this commit finished, its "
                "hash, whether it is pushed, and the real next step. No approval "
                "needed; it goes in the next docs batch."
            ),
        }
    }))


if __name__ == "__main__":
    main()
