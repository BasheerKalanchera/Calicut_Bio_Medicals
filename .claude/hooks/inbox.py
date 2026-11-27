"""Session mailbox (UserPromptSubmit). Harness review item 4, Basheer 2026-11-27.

Basheer used to carry messages between sessions by copy and paste ("Paste this
into Plan & Chore"); a gap in that hand-off gave the 23 Nov double E2E plan.
Now a session writes a message (shown to Basheer first) into the other
session's mailbox, `<main folder>/.claude/inbox/to-<session>.md`. On each of
Basheer's messages this shows Claude its own session's mailbox while it holds
anything. Claude empties it once Basheer has answered (session-messages skill).

The session is the command that started it: the first typed message in the
transcript, or this prompt, beginning /plan-and-chore, /build-and-test or
/build (also the "C:/Program Files/Git/" form Git Bash made of it until
27 Nov 2026). The main folder is found from `.git`, so /build's worktree
shares the same mailboxes. Never blocks; fails silent.
"""

import json
import os
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from session_clock import NOT_TYPED, typed_text  # noqa: E402

START_RE = re.compile(r"^\s*(?:[A-Za-z]:/Program Files/Git)?/(plan-and-chore|build-and-test|build)(?:\s|$)")
NAMES = {"plan-and-chore": "Plan & Chore", "build-and-test": "Build & Test", "build": "Build"}
LIMIT = 6000


def session_of(text: str):
    m = START_RE.match(text or "")
    return m.group(1) if m else None


def find_session(transcript: str, prompt: str):
    try:
        with open(transcript, encoding="utf-8") as fh:
            for line in fh:
                try:
                    text = typed_text(json.loads(line)).strip()
                except (ValueError, AttributeError):
                    continue
                if text and not text.startswith(NOT_TYPED):
                    return session_of(text)  # only the first typed message counts
    except OSError:
        pass
    return session_of(prompt)


def main_folder(start: Path):
    """The main checkout, also when `start` is inside a git worktree."""
    for folder in [start, *start.parents]:
        git = folder / ".git"
        if git.is_dir():
            return folder
        if git.is_file():  # worktree: "gitdir: <main>/.git/worktrees/<name>"
            target = git.read_text(encoding="utf-8").partition("gitdir:")[2].strip()
            return Path(target).parents[2]
    return None


def mailbox(data: dict):
    session = find_session(data.get("transcript_path") or "", str(data.get("prompt") or ""))
    root = main_folder(Path(os.environ.get("CLAUDE_PROJECT_DIR") or data.get("cwd") or "."))
    if not session or root is None:
        return None, None
    return session, root / ".claude" / "inbox" / f"to-{session}.md"


def main() -> None:
    try:
        data = json.load(sys.stdin)
        session, path = mailbox(data)
        if path is None or not path.is_file():
            return
        text = path.read_text(encoding="utf-8").strip()
    except (OSError, ValueError, TypeError, AttributeError, IndexError):
        return
    if not text:
        return
    if len(text) > LIMIT:
        text = text[:LIMIT] + "\n[… cut here; read the rest in the file]"
    message = (
        f"Mailbox for {NAMES[session]} ({path}): message(s) from another session, each approved "
        "by Basheer. Open this reply with each one (sender, time, text) and ask Basheer whether to "
        "take it up now or after the current work. Once he has answered, write one Progress-Archive "
        "line per message (what it asked, his answer) and empty the file (session-messages skill).\n\n"
        + text
    )
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "UserPromptSubmit", "additionalContext": message}}))


if __name__ == "__main__":
    main()
