"""Find the latest past Plan & Chore or Build & Test session and write its
last messages to a file. Read-only. Usage: last_session.py plan|build OUT"""
import glob, json, os, re, sys

DIR = os.path.expanduser(r"~\.claude\projects\C--Users-Basheer-GitHub-Calicut-Bio-Medicals")
KIND, OUT = sys.argv[1], sys.argv[2]
PAT = {
    "plan": re.compile(r"plan-and-chore|plan\s*(&|and)\s*chore|planning\s*(&|and)\s*chore", re.I),
    "build": re.compile(r"build-and-test|build\s*(&|and)\s*test", re.I),
}[KIND]

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

files = sorted(glob.glob(os.path.join(DIR, "*.jsonl")), key=os.path.getmtime, reverse=True)
for path in files:
    msgs = load(path)
    users = [t for _, who, t in msgs if who == "user"][:3]
    if len([1 for _, who, _ in msgs if who == "user"]) < 2:
        continue  # the session just started (this one)
    if any(PAT.search(t) for t in users):
        with open(OUT, "w", encoding="utf-8") as o:
            o.write(f"Session {os.path.basename(path)}, {msgs[0][0][:16]} to {msgs[-1][0][:16]}\n\n")
            for ts, who, t in msgs[-30:]:
                o.write(f"--- {ts[:16]} {who}\n{t[:1500]}\n\n")
        print(f"written: {os.path.basename(path)}")
        break
else:
    print(f"no earlier {KIND} session found")
