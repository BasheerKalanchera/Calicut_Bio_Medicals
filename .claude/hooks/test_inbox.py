"""Tests for inbox.py. Run: python -I -X utf8 .claude/hooks/test_inbox.py
All transcripts and messages here are made up."""

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from inbox import main_folder, session_of  # noqa: E402

SCRIPT = os.path.join(HERE, "inbox.py")


def typed(text):
    return {"type": "user", "timestamp": "2026-01-05T09:00:00Z", "message": {"content": text}}


class Session(unittest.TestCase):
    def test_start_commands(self):
        self.assertEqual(session_of("/plan-and-chore"), "plan-and-chore")
        self.assertEqual(session_of("/plan-and-chore restarted"), "plan-and-chore")
        self.assertEqual(session_of("C:/Program Files/Git/build-and-test"), "build-and-test")
        self.assertEqual(session_of("C:/Program Files/Git/build restarted"), "build")
        self.assertEqual(session_of("/build"), "build")

    def test_other_text_is_no_session(self):
        for text in ("hello /plan-and-chore", "/builder", "/test", ""):
            self.assertIsNone(session_of(text))


class Hook(unittest.TestCase):
    def setUp(self):
        d = tempfile.TemporaryDirectory()
        self.addCleanup(d.cleanup)
        self.root = Path(d.name)
        (self.root / ".git").mkdir()
        self.box = self.root / ".claude" / "inbox"
        self.box.mkdir(parents=True)
        self.transcript = self.root / "t.jsonl"

    def run_hook(self, first=None, prompt="next message", cwd=None):
        if first is not None:
            self.transcript.write_text(json.dumps(typed(first)) + "\n" + json.dumps(typed("later")), encoding="utf-8")
        payload = {"transcript_path": str(self.transcript), "prompt": prompt, "cwd": str(cwd or self.root)}
        env = {k: v for k, v in os.environ.items() if k != "CLAUDE_PROJECT_DIR"}
        out = subprocess.run(
            [sys.executable, "-I", "-X", "utf8", SCRIPT], input=json.dumps(payload),
            capture_output=True, text=True, encoding="utf-8", check=True, env=env,
        ).stdout.strip()
        return json.loads(out)["hookSpecificOutput"]["additionalContext"] if out else ""

    def test_shows_own_mailbox_only(self):
        (self.box / "to-plan-and-chore.md").write_text("## From Build & Test\nWrite the move plan.", encoding="utf-8")
        shown = self.run_hook(first="C:/Program Files/Git/plan-and-chore")
        self.assertIn("Mailbox for Plan & Chore", shown)
        self.assertIn("Write the move plan.", shown)
        self.assertEqual(self.run_hook(first="/build-and-test"), "")

    def test_first_message_of_session_uses_prompt(self):
        (self.box / "to-build.md").write_text("Hello", encoding="utf-8")
        self.assertIn("Hello", self.run_hook(prompt="/build restarted"))

    def test_empty_or_missing_mailbox_is_silent(self):
        self.assertEqual(self.run_hook(first="/plan-and-chore"), "")
        (self.box / "to-plan-and-chore.md").write_text("  \n", encoding="utf-8")
        self.assertEqual(self.run_hook(first="/plan-and-chore"), "")

    def test_unknown_session_is_silent(self):
        (self.box / "to-plan-and-chore.md").write_text("Hello", encoding="utf-8")
        self.assertEqual(self.run_hook(first="what changed yesterday?"), "")

    def test_worktree_uses_main_mailboxes(self):
        main_git = self.root / ".git" / "worktrees" / "build"
        main_git.mkdir(parents=True)
        wt = self.root / ".claude" / "worktrees" / "build"
        wt.mkdir(parents=True)
        (wt / ".git").write_text(f"gitdir: {main_git.as_posix()}\n", encoding="utf-8")
        self.assertEqual(main_folder(wt).resolve(), self.root.resolve())
        (self.box / "to-build.md").write_text("From Plan & Chore", encoding="utf-8")
        self.assertIn("From Plan & Chore", self.run_hook(first="/build", cwd=wt))

    def test_bad_input_is_silent(self):
        out = subprocess.run([sys.executable, "-I", SCRIPT], input="not json",
                             capture_output=True, text=True, check=True).stdout
        self.assertEqual(out, "")


if __name__ == "__main__":
    unittest.main()
