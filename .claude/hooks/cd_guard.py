"""No-cd guard rail (PreToolUse, Bash + PowerShell tools).

Claude's shell keeps its working folder between commands, so a `cd` in one
command silently moves every later one -- a save or git step can then act
on the wrong folder. Claude's instructions already say to use absolute
paths instead, but that written rule failed on 27, 29 and 30 Sep 2026, so
per the 27 Sep agreement (a repeat gets a guard rail, not another rule)
this refuses the command outright and says how to redo it.

Refuses when any command segment starts with cd / pushd / popd /
Set-Location / sl / chdir. Text inside quotes and heredocs (commit
messages, echoed text, grep patterns) is ignored, so a command that merely
mentions "cd" is let through. `git -C <dir>` and absolute paths are the
alternatives.

Reads the hook JSON on stdin; prints a "deny" decision or nothing. The sh
wrapper (no-cd-guard.sh) falls back to a plain text check if this script
can't run.
"""

import json
import re
import sys

BLOCKED = {"cd", "pushd", "popd", "set-location", "sl", "chdir"}

HEREDOC_RE = re.compile(r"<<-?\s*(['\"]?)([A-Za-z_][A-Za-z0-9_]*)\1[^\n]*\n.*?\n[ \t]*\2[ \t]*(?=\n|$)", re.S)
PS_HERESTRING_RE = re.compile(r"@(['\"])\r?\n.*?\r?\n\1@", re.S)
QUOTED_RE = re.compile(r"'[^']*'|\"(?:\\.|[^\"\\])*\"")
SEPARATOR_RE = re.compile(r"&&|\|\||[;|\n(){}]|\$\(|`")


def check(command: str) -> str | None:
    text = HEREDOC_RE.sub(" ", command)
    text = PS_HERESTRING_RE.sub(" ", text)
    text = QUOTED_RE.sub(" _ ", text)
    for segment in SEPARATOR_RE.split(text):
        words = segment.split()
        if words and words[0].lower() in BLOCKED:
            return words[0]
    return None


def main() -> None:
    raw = sys.stdin.buffer.read().decode("utf-8", "replace")
    data = json.loads(raw)
    command = (data.get("tool_input") or {}).get("command") or ""
    word = check(command)
    if word:
        print(
            json.dumps(
                {
                    "hookSpecificOutput": {
                        "hookEventName": "PreToolUse",
                        "permissionDecision": "deny",
                        "permissionDecisionReason": (
                            f"Blocked by the no-cd guard rail: this command changes folder with `{word}`, "
                            "which carries over to later commands. Redo it with absolute paths "
                            "(or `git -C <dir>` for git) and no folder change."
                        ),
                    }
                }
            )
        )


if __name__ == "__main__":
    main()
