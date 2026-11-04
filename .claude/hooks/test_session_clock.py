"""Tests for session_clock.py. Run: python -I -X utf8 .claude/hooks/test_session_clock.py
All transcripts here are made up. Dates are old on purpose, so the time since
the last entry is idle and adds nothing to time worked."""

import json
import os
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from session_clock import due_on_message, session_facts  # noqa: E402

SCRIPT = os.path.join(HERE, "session_clock.py")
START = datetime(2026, 1, 5, 9, 0, tzinfo=timezone.utc)


def at(minutes):
    return (START + timedelta(minutes=minutes)).isoformat().replace("+00:00", "Z")


def typed(minutes, text):
    return {"type": "user", "timestamp": at(minutes), "message": {"content": text}}


def reply(minutes):
    return {"type": "assistant", "timestamp": at(minutes), "message": {"content": []}}


def session(messages, worked):
    """`messages` typed messages, then replies every 10 minutes up to `worked`."""
    entries = [typed(i, f"message {i + 1}") for i in range(messages)]
    entries += [reply(m) for m in range(messages, worked + 1, 10)]
    entries.append(reply(worked))
    return entries


class Base(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.dir.cleanup)
        self.path = os.path.join(self.dir.name, "t.jsonl")

    def write(self, entries):
        with open(self.path, "w", encoding="utf-8") as fh:
            fh.write("\n".join(json.dumps(e) for e in entries))

    def run_hook(self, **payload):
        payload.setdefault("transcript_path", self.path)
        out = subprocess.run(
            [sys.executable, "-I", "-X", "utf8", SCRIPT],
            input=json.dumps(payload), capture_output=True, text=True, encoding="utf-8", check=True,
        ).stdout.strip()
        return json.loads(out)["hookSpecificOutput"]["additionalContext"] if out else ""


class Facts(Base):
    def test_idle_gaps_are_left_out(self):
        self.write([typed(0, "a"), reply(20), reply(49), typed(79, "b"), reply(89), typed(389, "c")])
        minutes, count, last = session_facts(self.path)
        self.assertEqual(minutes, 49 + 10)  # 30 and 300 minute gaps dropped
        self.assertEqual((count, last), (3, "c"))

    def test_only_typed_messages_count(self):
        self.write([
            typed(0, "real"),
            typed(1, "<task-notification>\n<task-id>x</task-id>"),
            typed(2, "This session is being continued from a previous conversation"),
            typed(3, "[Request interrupted by user]"),
            {"type": "user", "isMeta": True, "timestamp": at(4), "message": {"content": "skill text"}},
            {"type": "user", "timestamp": at(5), "message": {"content": [{"type": "tool_result", "content": "x"}]}},
        ])
        self.assertEqual(session_facts(self.path)[1], 1)


class MessageRule(unittest.TestCase):
    def test_rule(self):
        cases = [
            (24, 300, False),  # before message 25
            (25, 120, False),  # exactly 2 hours is not over
            (25, 121, True),
            (26, 300, False),  # between checks
            (30, 119, False),
            (30, 121, True),
            (35, 300, True),   # reminds again if he carries on
        ]
        for count, minutes, expected in cases:
            with self.subTest(count=count, minutes=minutes):
                self.assertEqual(due_on_message(minutes, count), expected)


class Hook(Base):
    def message(self, prompt):
        return self.run_hook(hook_event_name="UserPromptSubmit", prompt=prompt)

    def push(self, command="git push", response="ok"):
        return self.run_hook(hook_event_name="PostToolUse", tool_input={"command": command}, tool_response=response)

    def test_message_when_prompt_already_saved(self):
        self.write(session(25, 130))
        self.assertIn("25 messages", self.message("message 25"))

    def test_message_when_prompt_not_saved_yet(self):
        self.write(session(24, 130))
        self.assertIn("25 messages", self.message("a new message"))

    def test_message_silent_under_two_hours(self):
        self.write(session(25, 110))
        self.assertEqual(self.message("message 25"), "")

    def test_message_silent_between_checks(self):
        self.write(session(26, 130))
        self.assertEqual(self.message("message 26"), "")

    def test_push_over_two_hours_with_few_messages(self):
        self.write(session(4, 130))
        self.assertIn("checkpoint reached", self.push())

    def test_push_under_two_hours_despite_idle_time(self):
        self.write(session(4, 60) + [reply(60 + 300)])
        self.assertIn("checkpoint not reached", self.push())

    def test_push_under_two_hours_with_many_messages(self):
        self.write(session(40, 100))
        self.assertIn("checkpoint not reached", self.push())

    def test_failed_push_and_other_commands_are_silent(self):
        self.write(session(4, 130))
        self.assertEqual(self.push(response="error: failed to push some refs"), "")
        self.assertEqual(self.push(command="git status"), "")

    def test_bad_input_is_silent(self):
        self.assertEqual(self.run_hook(hook_event_name="UserPromptSubmit", transcript_path="missing.jsonl"), "")
        self.assertEqual(self.run_hook(hook_event_name="SessionStart"), "")


if __name__ == "__main__":
    unittest.main()
