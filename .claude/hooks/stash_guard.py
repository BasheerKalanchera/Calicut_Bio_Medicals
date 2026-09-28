"""Ask-before-stash guard rail (PreToolUse, Bash + PowerShell tools).

Parallel Claude sessions share this working folder, so anything that sets
uncommitted work aside (and puts it back later) can sweep up another
session's unsaved edits. This asks Basheer before any command that actually
does that, and stays silent for everything else.

Rewritten 2026-09-28: the first version matched the words "git stash"
anywhere in the command text, so it prompted for harmless things (listing
stashes, a commit message or grep that merely mentioned the word) and missed
the real risk -- `git pull --rebase --autostash`, which stashes without ever
saying "git stash".

Asks for:
  - git stash (bare, push/save/pop/apply/drop/clear/create/store/branch, or
    any option such as -u) -- but not `git stash list` / `git stash show`
  - --autostash on pull / rebase / merge
  - turning rebase.autoStash / merge.autoStash on (git config or -c)

Reads the hook JSON on stdin; prints an "ask" decision or nothing. The
sh wrapper (ask-before-git-stash.sh) falls back to asking if this script
can't run, so a broken guard never silently lets things through.
"""

import json
import re
import shlex
import sys

READ_ONLY_STASH = {"list", "show"}
AUTOSTASH_COMMANDS = {"pull", "rebase", "merge"}
AUTOSTASH_KEYS = {"rebase.autostash", "merge.autostash"}
FALSEY = {"false", "no", "off", "0"}
# Global git options that take a separate value argument.
GIT_OPTS_WITH_VALUE = {"-C", "-c", "--git-dir", "--work-tree", "--namespace", "--exec-path"}
# Words that can precede the real command in a segment.
PREFIX_WORDS = {"command", "sudo", "time", "env", "nohup", "&", "exec"}
# A quoted string after one of these is itself a command to check.
NESTED_COMMAND_FLAGS = {"-c", "-command", "eval", "iex", "invoke-expression"}

HEREDOC_RE = re.compile(r"<<-?\s*(['\"]?)([A-Za-z_][A-Za-z0-9_]*)\1[^\n]*\n.*?\n[ \t]*\2[ \t]*(?=\n|$)", re.S)
PS_HERESTRING_RE = re.compile(r"@(['\"])\r?\n.*?\r?\n\1@", re.S)
QUOTED_RE = re.compile(r"'[^']*'|\"(?:\\.|[^\"\\])*\"")
SEPARATOR_RE = re.compile(r"&&|\|\||[;|\n(){}]|\$\(|`")


def _strip_text(command: str, nested: list[str]) -> str:
    """Remove heredoc bodies, here-strings and quoted strings (commit
    messages, grep patterns, echoed text). A quoted string that is itself a
    command (`sh -c "..."`, `powershell -Command '...'`, `eval "..."`) is
    collected into `nested` to be checked on its own."""
    command = HEREDOC_RE.sub(" ", command)
    command = PS_HERESTRING_RE.sub(" ", command)

    out = []
    pos = 0
    for m in QUOTED_RE.finditer(command):
        before = command[pos : m.start()]
        out.append(before)
        prev_word = before.split()[-1].lower() if before.split() else ""
        inner = m.group(0)[1:-1]
        if prev_word in NESTED_COMMAND_FLAGS:
            nested.append(inner)
        # A quoted path to git itself (`& "C:\Program Files\Git\cmd\git.exe" ...`)
        # is the command, not text -- keep it.
        out.append(" git " if _is_git(inner) else " _ ")
        pos = m.end()
    out.append(command[pos:])
    return "".join(out)


def _tokens(segment: str) -> list[str]:
    try:
        return shlex.split(segment, posix=True)
    except ValueError:
        return segment.split()


def _is_git(word: str) -> bool:
    name = word.replace("\\", "/").rsplit("/", 1)[-1].lower()
    return name in {"git", "git.exe"}


def _check_segment(tokens: list[str]) -> str | None:
    i = 0
    while i < len(tokens) and (tokens[i] in PREFIX_WORDS or re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", tokens[i])):
        i += 1
    if i >= len(tokens) or not _is_git(tokens[i]):
        return None
    i += 1

    # Global options before the subcommand.
    while i < len(tokens) and tokens[i].startswith("-"):
        opt = tokens[i]
        if opt == "-c" and i + 1 < len(tokens):
            key, _, value = tokens[i + 1].partition("=")
            if key.lower() in AUTOSTASH_KEYS and value.lower() not in FALSEY:
                return f"git -c {tokens[i + 1]} turns on automatic stashing."
        i += 2 if opt in GIT_OPTS_WITH_VALUE else 1
    if i >= len(tokens):
        return None

    sub, args = tokens[i].lower(), tokens[i + 1 :]

    if sub == "stash":
        first = args[0].lower() if args else ""
        if first in READ_ONLY_STASH:
            return None
        return "git stash sets uncommitted work aside."

    if sub in AUTOSTASH_COMMANDS and "--autostash" in args:
        return f"git {sub} --autostash sets uncommitted work aside while it runs."

    if sub == "config":
        lowered = [a.lower() for a in args]
        if any(a in ("--unset", "--unset-all", "--get", "--get-all", "--list", "-l") for a in lowered):
            return None
        for j, a in enumerate(lowered):
            key, eq, value = a.partition("=")
            if key in AUTOSTASH_KEYS:
                next_arg = lowered[j + 1] if j + 1 < len(lowered) else None
                val = value if eq else next_arg
                if val is not None and val not in FALSEY:
                    return f"git config turns on {args[j].split('=')[0]} (automatic stashing)."
    return None


def check(command: str, depth: int = 0) -> str | None:
    nested: list[str] = []
    stripped = _strip_text(command, nested)
    for segment in SEPARATOR_RE.split(stripped):
        reason = _check_segment(_tokens(segment))
        if reason:
            return reason
    if depth < 3:
        for inner in nested:
            reason = check(inner, depth + 1)
            if reason:
                return reason
    return None


def main() -> None:
    raw = sys.stdin.buffer.read().decode("utf-8", "replace")
    data = json.loads(raw)
    command = (data.get("tool_input") or {}).get("command") or ""
    reason = check(command)
    if reason:
        print(
            json.dumps(
                {
                    "hookSpecificOutput": {
                        "hookEventName": "PreToolUse",
                        "permissionDecision": "ask",
                        "permissionDecisionReason": (
                            f"{reason} Another session may have unsaved work in this folder "
                            "that would be swept up. Allow only if you're sure it doesn't."
                        ),
                    }
                }
            )
        )


if __name__ == "__main__":
    main()
