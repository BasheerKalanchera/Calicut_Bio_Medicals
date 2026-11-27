"""Session clock: when to recommend a refresh (UserPromptSubmit and PostToolUse).

P98 (Harness Engineering review, 2026-11-01): the checkpoint was called on a
guess twice -- 24 Oct ("several hours" at ~1 hour and 19 messages; Basheer: "We
just restarted. How long has the session run?") and 26 Oct ("has the session
too long already?"). So the figures are read from the session's own transcript.

Rule (Basheer, 2026-11-04), after a session ran 7 h 42 min unchecked because
nothing checked it before its first push, and three sessions were told to
pause on idle time alone:
- On Basheer's message: from message 25, every 5 messages, recommend a refresh
  if time worked is over 2 hours. Otherwise say nothing.
- After a successful `git push`: recommend a refresh if time worked is over 2
  hours, however few messages there have been.

Time worked adds up only the gaps of under 30 minutes between transcript
entries, so a window left open and idle doesn't count. A restarted session has
a new transcript, so the clock starts again there. Counts as Basheer's
messages: user entries that are typed text -- not tool results, skill text
(isMeta), interruptions, background-task notices or the context-summary note.
Reads the hook JSON on stdin; prints the facts as additional context, or
nothing. Never blocks; fails silent.
"""

import json
import re
import sys
from datetime import datetime, timedelta

PUSH_RE = re.compile(r"\bgit\b(?:\s+-C\s+\S+)?\s+push\b")
FAILED_RE = re.compile(r"\b(?:rejected|fatal:|error: failed to push)", re.I)
NOT_TYPED = ("[Request interrupted", "This session is being continued", "<task-notification>")
HOURS, FIRST_CHECK, EVERY = 2, 25, 5  # Basheer, 2026-11-04
IDLE = timedelta(minutes=30)
WHAT_TO_DO = (
    "Open this reply by recommending a refresh, with these figures: finish the current step, "
    "write this session's end-of-session retro to Progress-Archive (an addendum if one is already "
    "written this session), save this session's handover note, start nothing new, and ask Basheer "
    "to type /exit. If he says to carry on, carry on."
)
# Retro before the docs batch or refresh (Harness review, Basheer 2026-11-27): the retro
# came after the docs batch or the refresh on 20, 23 and 26 Nov. These phrases mean the
# session is ending; a bare "refresh" doesn't count ("refresh the E2E plan").
END_RE = re.compile(
    r"wind(?:ing)? up|wrap(?:ping)? up|call it a day|end (?:the|this) session|docs? batch"
    r"|session refresh|refresh (?:the |this )?session|time for (?:a )?(?:session )?refresh",
    re.I,
)
RETRO_MARK = "corrections from basheer"
RETRO_FIRST = (
    "Session retro: Basheer's message points to the end of the session. Before anything else "
    "in this reply, write this session's end-of-session retro to Progress-Archive "
    "(harness-engineering skill), so it goes into the docs batch."
)
RETRO_ADDENDUM = (
    "Session retro: a retro is already written this session. Before anything else in this "
    "reply, add a short addendum with the corrections since it (or \"no further corrections\")."
)


def typed_text(entry: dict) -> str:
    if entry.get("type") != "user" or entry.get("isMeta"):
        return ""
    content = (entry.get("message") or {}).get("content")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        if any(isinstance(b, dict) and b.get("type") == "tool_result" for b in content):
            return ""
        return " ".join(b.get("text", "") for b in content if isinstance(b, dict) and b.get("type") == "text")
    return ""


def session_facts(path: str):
    """(minutes worked, Basheer's message count, his last message), or None."""
    previous, worked, count, last = None, timedelta(), 0, ""
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            try:
                entry = json.loads(line)
            except ValueError:
                continue
            stamp = entry.get("timestamp")
            if stamp:
                when = datetime.fromisoformat(stamp.replace("Z", "+00:00"))
                if previous is not None and timedelta() < when - previous < IDLE:
                    worked += when - previous
                previous = when
            text = typed_text(entry).strip()
            if text and not text.startswith(NOT_TYPED):
                count += 1
                last = text
    if previous is None:
        return None
    since_last = datetime.now(previous.tzinfo) - previous
    if timedelta() < since_last < IDLE:
        worked += since_last
    return int(worked.total_seconds() // 60), count, last


def retro_written(path: str) -> bool:
    """True when this session has already written a retro line to Progress-Archive
    (an Edit/Write to it, or a shell append to it, carrying "Corrections from Basheer")."""
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            if RETRO_MARK not in line.lower():
                continue  # cheap skip for most lines
            try:
                entry = json.loads(line)
            except ValueError:
                continue
            if entry.get("type") != "assistant":
                continue
            for block in (entry.get("message") or {}).get("content") or []:
                if not isinstance(block, dict) or block.get("type") != "tool_use":
                    continue
                inp = block.get("input") or {}
                if block.get("name") in ("Edit", "Write"):
                    text = str(inp.get("new_string") or inp.get("content") or "")
                    if "Progress-Archive" in str(inp.get("file_path", "")) and RETRO_MARK in text.lower():
                        return True
                elif block.get("name") in ("Bash", "PowerShell"):
                    cmd = str(inp.get("command", ""))
                    if "Progress-Archive" in cmd and ">>" in cmd and RETRO_MARK in cmd.lower():
                        return True
    return False


def over_limit(minutes: int) -> bool:
    return minutes > HOURS * 60


def due_on_message(minutes: int, count: int) -> bool:
    return count >= FIRST_CHECK and (count - FIRST_CHECK) % EVERY == 0 and over_limit(minutes)


def figures(minutes: int, count: int) -> str:
    return (f"P98 session clock: this session has worked {minutes // 60} h {minutes % 60} min "
            f"(idle gaps of 30 minutes or more left out), with {count} messages from Basheer")


def on_message(data: dict, facts: tuple):
    minutes, count, last = facts
    # The hook may run before the message reaches the transcript.
    prompt = str(data.get("prompt") or "").strip()
    if prompt and prompt != last:
        count += 1
    if due_on_message(minutes, count):
        return (f"{figures(minutes, count)} -- over the {HOURS}-hour limit. {WHAT_TO_DO} "
                f"Next check in {EVERY} messages. Never guess these figures.")
    if END_RE.search(prompt):
        return RETRO_ADDENDUM if retro_written(data.get("transcript_path") or "") else RETRO_FIRST
    return None


def on_push(data: dict, facts: tuple):
    command = str((data.get("tool_input") or {}).get("command", ""))
    if not PUSH_RE.search(command):
        return None
    if FAILED_RE.search(json.dumps(data.get("tool_response", ""), ensure_ascii=False)):
        return None
    minutes, count, _ = facts
    if over_limit(minutes):
        return (f"{figures(minutes, count)} -- checkpoint reached, over the {HOURS}-hour limit. "
                f"{WHAT_TO_DO} Never guess these figures.")
    return (f"{figures(minutes, count)} -- checkpoint not reached, under the {HOURS}-hour limit: "
            f"carry on. Never guess these figures.")


def main() -> None:
    try:
        data = json.load(sys.stdin)
        event = data.get("hook_event_name")
        handler = {"UserPromptSubmit": on_message, "PostToolUse": on_push}.get(event)
        if handler is None:
            return
        if event == "PostToolUse" and not PUSH_RE.search(str((data.get("tool_input") or {}).get("command", ""))):
            return  # every shell command lands here; don't read the transcript for these
        facts = session_facts(data.get("transcript_path") or "")
        message = handler(data, facts) if facts else None
    except (OSError, ValueError, TypeError, AttributeError):
        return
    if message:
        print(json.dumps({"hookSpecificOutput": {"hookEventName": event, "additionalContext": message}}))


if __name__ == "__main__":
    main()
