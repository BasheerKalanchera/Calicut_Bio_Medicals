"""Find the latest past Plan & Chore, Build & Test, parallel Build (/build)
or Test (/test) session and write its last messages to a file. Read-only.
Usage: last_session.py plan|build|parallel|test OUT"""
import glob, json, os, re, sys

DIR = os.path.expanduser(r"~\.claude\projects\C--Users-Basheer-GitHub-Calicut-Bio-Medicals")
KIND, OUT = sys.argv[1], sys.argv[2]
# The typed command decides the kind (2026-10-17): each skill's text names
# the other sessions, so a text match alone can pick the wrong one.
CMD = re.compile(r"command-name>/(plan-and-chore|build-and-test|build|test)<")
CMD_KIND = {"plan-and-chore": "plan", "build-and-test": "build", "build": "parallel", "test": "test"}
PAT = {
    "plan": re.compile(r"plan-and-chore|plan\s*(&|and)\s*chore|planning\s*(&|and)\s*chore", re.I),
    "build": re.compile(r"build-and-test|build\s*(&|and)\s*test", re.I),
    "parallel": re.compile(r"^/build(\s|$)|parallel\s+build", re.I),
    # Typed command only: "test session" also matches "Build & Test session".
    "test": re.compile(r"^/test(\s|$)", re.I),
}[KIND]

def kind_of(users):
    for t in users:
        m = CMD.search(t)
        if m:
            return CMD_KIND[m.group(1)] == KIND
    return any(PAT.search(t) for t in users)

def text(d):
    c = d.get("message", {}).get("content")
    if isinstance(c, str):
        return c
    if isinstance(c, list):
        return "\n".join(p.get("text", "") for p in c if isinstance(p, dict) and p.get("type") == "text")
    return ""

def load(path):
    out = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            try:
                d = json.loads(line)
            except ValueError:
                continue
            if d.get("type") in ("user", "assistant") and not d.get("isMeta"):
                t = text(d).strip()
                if t:
                    out.append((d.get("timestamp", ""), d["type"], t))
    return out

# A session that moves into a worktree (/build) has its history saved under
# the worktree's own project folder, e.g. "...--claude-worktrees-build"
# (found 2026-10-17), so look there too.
files = sorted(glob.glob(os.path.join(DIR, "*.jsonl")) + glob.glob(os.path.join(DIR + "--claude-worktrees-*", "*.jsonl")),
               key=os.path.getmtime, reverse=True)
for path in files:
    msgs = load(path)
    users = [t for _, who, t in msgs if who == "user"][:3]
    if len([1 for _, who, _ in msgs if who == "user"]) < 2:
        continue  # the session just started (this one)
    if kind_of(users):
        with open(OUT, "w", encoding="utf-8") as o:
            o.write(f"Session {os.path.basename(path)}, {msgs[0][0][:16]} to {msgs[-1][0][:16]}\n\n")
            for ts, who, t in msgs[-30:]:
                o.write(f"--- {ts[:16]} {who}\n{t[:1500]}\n\n")
        print(f"written: {os.path.basename(path)}")
        break
else:
    print(f"no earlier {KIND} session found")
