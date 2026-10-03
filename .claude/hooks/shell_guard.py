"""Shell guard rail (PreToolUse, Bash + PowerShell tools). 2026-10-03.

Two repeat mistakes, each now refused instead of written up again
(CLAUDE.md: a repeat gets a structural fix):

1. Scripted edits to code files. A shell/python one-off that patched a
   source file turned the two characters `\\n` into a real line break
   (2026-09-27, 2026-10-01), breaking the code. Refuses a command that
   names a code file under backend/ or sales-os-app/ (.py .ts .tsx .js .jsx)
   together with a write: sed -i, perl -i, a `>`/`>>` redirect or `tee`
   into it, or python `write_text`/`open(..., "w"/"a")`. Use the Edit/Write
   tools instead. Docs, scratchpad files and git commands are unaffected.

2. "deal" in commit messages. CLAUDE.md says "Opportunity", never "deal"
   (2026-10-01); commit messages kept using it. Refuses `git commit` whose
   message (-m text, or the -F file) contains the word deal/deals.

Reads the hook JSON on stdin; prints a "deny" decision or nothing. Fails
open: the sh wrapper lets the command through if this script errors.
"""

import json
import re
import sys
from pathlib import Path

CODE_FILE = r"(?:backend|sales-os-app)/[\w./-]*\.(?:py|tsx?|jsx?)\b"
CODE_RE = re.compile(CODE_FILE)
WRITE_RES = [
    re.compile(r"\bsed\b[^|;&\n]*\s-i"),
    re.compile(r"\bperl\b[^|;&\n]*\s-[a-z]*i"),
    re.compile(r">>?\s*['\"]?[^\s'\"]*" + CODE_FILE),
    re.compile(r"\btee\b[^|;&\n]*" + CODE_FILE),
    re.compile(r"\.write_text\(|\bopen\([^)]*,\s*['\"][wa]"),
    re.compile(r"\b(?:Set-Content|Out-File|Add-Content)\b", re.I),
]
COMMIT_RE = re.compile(r"\bgit\b(?:\s+-C\s+\S+)?\s+commit\b")
DEAL_RE = re.compile(r"\bdeals?\b", re.I)
FILE_FLAG_RE = re.compile(r"(?:-F|--file)[ =]['\"]?([^\s'\"-][^\s'\"]*)")
MSG_RE = re.compile(r"(?:-m|--message)[ =](\"(?:\\.|[^\"\\])*\"|'[^']*')")
HEREDOC_RE = re.compile(r"<<-?\s*(['\"]?)([A-Za-z_]\w*)\1[^\n]*\n(.*?)\n[ \t]*\2[ \t]*(?=\n|$)", re.S)


def scripted_code_edit(cmd: str) -> bool:
    if not CODE_RE.search(cmd.replace("\\", "/")):
        return False
    norm = cmd.replace("\\", "/")
    return any(r.search(norm) for r in WRITE_RES)


def commit_says_deal(cmd: str, cwd: str) -> bool:
    """Checks only the message (-m text, heredoc, -F file), not file paths:
    committing e.g. Opportunity-Edit-Via-Deal-Page-Hotfix-Plan.md is fine."""
    if not COMMIT_RE.search(cmd):
        return False
    text = "\n".join(MSG_RE.findall(cmd) + [b for _, _, b in HEREDOC_RE.findall(cmd)])
    for name in FILE_FLAG_RE.findall(cmd):
        p = Path(name) if Path(name).is_absolute() else Path(cwd) / name
        if p.is_file():
            text += "\n" + p.read_text(encoding="utf-8", errors="replace")
    return bool(DEAL_RE.search(text))


def main() -> None:
    data = json.loads(sys.stdin.buffer.read().decode("utf-8", "replace"))
    cmd = (data.get("tool_input") or {}).get("command") or ""
    reason = None
    if scripted_code_edit(cmd):
        reason = ("Blocked by the shell guard rail: this command writes to a code file from the shell "
                  "(scripted edits have broken code before, e.g. turning \\n into a line break). "
                  "Make the change with the Edit or Write tool instead.")
    elif commit_says_deal(cmd, data.get("cwd") or "."):
        reason = ("Blocked by the shell guard rail: the commit message says 'deal'. CLAUDE.md "
                  "terminology: say 'Opportunity'. Reword the message and commit again.")
    if reason:
        print(json.dumps({"hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }}))


if __name__ == "__main__":
    main()
