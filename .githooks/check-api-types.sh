#!/usr/bin/env sh
# Pre-commit guard: api.ts matches the backend being committed.
# A commit that changes backend/app/ Python must carry a
# sales-os-app/src/types/api.ts built from that same backend. The check
# builds it from the commit's staged copy (not the working folder), so
# another session's uncommitted changes never count. Basheer, 2026-10-20:
# refuse, not warn; staged copy, not working folder (Progress-Archive-2026-10).
#
# Fix a refusal with: sh .githooks/check-api-types.sh --write
# (writes and stages the api.ts built from the staged backend). Plain
# `npm run generate:types` builds from the working folder instead, which may
# hold another session's uncommitted backend changes.
#
# Called from .githooks/pre-commit (switched on 2026-10-20).

REPO_ROOT=$(git rev-parse --show-toplevel) || exit 1
API_TS=sales-os-app/src/types/api.ts
# The generator next to this hook, not $REPO_ROOT's: every worktree (e.g.
# the /build session's) runs the main folder's .githooks, and a worktree
# may not have the generator yet. It still builds from the worktree's
# staged backend.
GENERATOR="$(cd "$(dirname "$0")/.." && pwd)/sales-os-app/scripts/generate-types.js"
SELF="$(cd "$(dirname "$0")" && pwd)/check-api-types.sh"

if [ "$1" != "--write" ] && ! git diff --cached --name-only --diff-filter=ACMRD | grep -q '^backend/app/.*\.py$'; then
  exit 0
fi

TMP=$(mktemp -d) || exit 1
trap 'rm -rf "$TMP"' EXIT

git ls-files -z -- backend/app | xargs -0 git checkout-index --prefix="$TMP/" -- || exit 1
git show ":$API_TS" > "$TMP/staged-api.ts" 2>/dev/null || : > "$TMP/staged-api.ts"

if ! node "$GENERATOR" --backend "$TMP/backend" --out "$TMP/expected-api.ts" > /dev/null; then
  echo "Commit refused: could not build api.ts from the staged backend (see the error above)."
  exit 1
fi

if [ "$1" = "--write" ]; then
  cp "$TMP/expected-api.ts" "$REPO_ROOT/$API_TS" && git add -- "$REPO_ROOT/$API_TS" || exit 1
  echo "Wrote and staged $API_TS, built from the staged backend."
  exit 0
fi

if ! diff -q --strip-trailing-cr "$TMP/expected-api.ts" "$TMP/staged-api.ts" > /dev/null; then
  echo "Commit refused: this commit changes the backend, but $API_TS"
  echo "doesn't match it. Run: sh \"$SELF\" --write"
  echo "(builds it from the staged backend and stages it), then commit again."
  exit 1
fi
exit 0
