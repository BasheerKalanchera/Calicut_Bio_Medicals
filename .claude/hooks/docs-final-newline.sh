#!/bin/sh
# Guard rail (2026-11-20, P108): a docs/*.md file never loses its last line
# break. After any Write/Edit/MultiEdit on such a file, add the final newline
# if it is missing. Fast path: other files skip Python. Fails open on errors.
input=$(cat)
case "$input" in
  *.md*) ;;
  *) exit 0 ;;
esac
printf '%s' "$input" | python -I -c '
import json, os, re, sys
try:
    path = json.load(sys.stdin).get("tool_input", {}).get("file_path", "")
except Exception:
    sys.exit(0)
norm = path.replace("\\", "/")
if not re.search(r"/docs/[^/]+\.md$", norm) or not os.path.isfile(path):
    sys.exit(0)
with open(path, "rb") as f:
    data = f.read()
if data and not data.endswith(b"\n"):
    # Match the file own style: CRLF if the file already uses it, else LF.
    nl = b"\r\n" if b"\r\n" in data else b"\n"
    with open(path, "ab") as f:
        f.write(nl)
    print("docs-final-newline: added the missing last line break to " + norm.split("/docs/")[-1])
' 2>/dev/null
exit 0
