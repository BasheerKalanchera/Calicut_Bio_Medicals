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

3. Inline edit scripts (P77, 2026-10-19). Edit scripts typed into the
   command line (python heredocs, `python -c`) kept being used on docs,
   skills and hooks, and failed ("unexpected EOF", 6 times by 2026-10-19).
   Refuses inline python that writes a file (write_text, open(..., "w"/"a"),
   ...) and `sed -i` / `perl -i` on anything outside the Temp folder (the
   scratchpad lives there). A saved script file run with python is fine;
   so is printing and redirecting with `>`.

4. UTF-8 in isolated Python (P72, 2026-10-19). `python -I` ignores every
   PYTHON* variable, so the settings.json UTF-8 env block never reached
   those runs and printing ₹ or → failed. Adds `-X utf8` (which `-I` keeps)
   by rewriting the command rather than refusing it.

Reads the hook JSON on stdin; prints a "deny" decision, an "updatedInput"
rewrite, or nothing. Fails open: the sh wrapper lets the command through if
this script errors.
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
PY = r"\bpython(?:3(?:\.\d+)?)?(?:\.exe)?['\"]?"
INLINE_PY_RE = re.compile(PY + r"(?:\s+-[A-Za-z]+(?:\s+utf8)?)*?\s+(?:-c\b|-(?=\s|$)|<<)")
PY_WRITE_RE = re.compile(
    r"\.write_(?:text|bytes)\(|\bopen\([^)]*,\s*(?:mode\s*=\s*)?['\"][wax]"
    r"|\.open\(\s*(?:mode\s*=\s*)?['\"][wax]|\bshutil\.(?:copy\w*|move)\(|\bos\.(?:replace|rename)\(")
INPLACE_RE = re.compile(r"\b(?:sed|perl)\b[^|;&\n]*\s-[a-zA-Z]*i")
TEMP_RE = re.compile(r"AppData[\\/]+Local[\\/]+Temp|\$TEMP\b|\$env:TEMP\b", re.I)
# Only python run as a command: at the start of a line or after ; & | ( ,
# optionally behind VAR=value prefixes and a path. A mention inside a quoted
# argument (grep "python -I", a -m message) does not match.
ISOLATED_PY_RE = re.compile(
    r"(?m)((?:^|[;&|(])\s*(?:[A-Za-z_]\w*=\S*\s+)*['\"]?[^\s'\";&|()]*?" + PY
    + r"(?:\s+-[A-HJ-Za-z]+)*\s+-I)\b(?!\s+-X\s*utf8)")


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


def inline_edit_script(cmd: str) -> bool:
    if INLINE_PY_RE.search(cmd) and PY_WRITE_RE.search(cmd):
        return True
    # Text only mentioned -- a heredoc body (e.g. `cat >> doc <<EOF`) or a
    # -m commit message -- is not a sed/perl command being run.
    run = MSG_RE.sub("", HEREDOC_RE.sub("", cmd))
    return bool(INPLACE_RE.search(run)) and not TEMP_RE.search(run)


def add_utf8(cmd: str) -> str:
    """Adds -X utf8 to isolated python runs, leaving heredoc bodies (text
    being written, e.g. an archive entry that mentions `python -I`) as is."""
    out, pos = [], 0
    for m in HEREDOC_RE.finditer(cmd):
        body = m.start(3)
        out.append(ISOLATED_PY_RE.sub(r"\1 -X utf8", cmd[pos:body]))
        out.append(cmd[body:m.end(3)])
        pos = m.end(3)
    out.append(ISOLATED_PY_RE.sub(r"\1 -X utf8", cmd[pos:]))
    return "".join(out)


def main() -> None:
    data = json.loads(sys.stdin.buffer.read().decode("utf-8", "replace"))
    tool_input = data.get("tool_input") or {}
    cmd = tool_input.get("command") or ""
    reason = None
    if inline_edit_script(cmd):
        reason = ("Blocked by the shell guard rail (P77): an edit script typed into the command line "
                  "(inline python that writes a file, or sed/perl -i outside the Temp folder). Use the "
                  "Edit or Write tool, or save the script as a file in the scratchpad with the Write tool "
                  "and run that file. Printing and redirecting with > is fine.")
    elif scripted_code_edit(cmd):
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
        return
    fixed = add_utf8(cmd)
    if fixed != cmd:
        print(json.dumps({"hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "updatedInput": {**tool_input, "command": fixed},
        }}))


if __name__ == "__main__":
    main()
