#!/usr/bin/env sh
# Lists backticked repo paths in Markdown docs that don't exist on disk.
# Used by the daily documentation tidy-up (.claude/skills/doc-integrity-sweep).
# Output: one "file:line -> missing/path" per line, then a total.
#
# Skipped on purpose (they record the past, so old paths are true to their
# time): docs/Progress-Archive-*, docs/Process-Rules-History.md, docs/ARCHIVE/,
# docs/Doc-Integrity-Sweep-Log.md (its entries quote the paths they found),
# .claude/worktrees/ (temporary copies of the repo, not separate docs).
# Also skipped: templates/placeholders (<...>, *, {...}, 00XX, …).
# Line-number suffixes (file.py:14-18) and anchors (#section) are ignored.

cd "$(git rev-parse --show-toplevel)" || exit 1

grep -oHnE '`(docs|scripts|\.claude|backend|sales-os-app)/[^` ]+`' --include='*.md' -r docs .claude CLAUDE.md 2>/dev/null \
  | grep -vE '^docs/Progress-Archive-|^docs/Process-Rules-History|^docs/ARCHIVE/|^docs/Doc-Integrity-Sweep-Log|^\.claude/worktrees/' \
  | tr -d '`' \
  | grep -vE '[<>*{}…]|00XX' \
  | while IFS=: read -r f n p; do
      p=${p%%:*}; p=${p%%#*}; p=${p%[.,;)]}
      [ -e "$p" ] || echo "$f:$n -> $p"
    done \
  | sort -u > /tmp/broken_doc_links.$$

cat /tmp/broken_doc_links.$$
echo "TOTAL: $(wc -l < /tmp/broken_doc_links.$$)"
rm -f /tmp/broken_doc_links.$$
