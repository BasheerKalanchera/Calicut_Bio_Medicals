// Fails if a .tsx or .ts file staged for commit breaks the MUI standard
// (docs/Frontend-Implementation-Standards.md §6.11; Part 2 plan D9: only the
// commit's own files are checked, so an untouched screen never blocks one).
// Run by `npm run lint`, which the pre-commit hook runs. Helper .ts files are
// checked too (they hold colours screens use); the theme folder is not.
//
// Flags, outside comments:
//   - a typed colour (`#9ca3af`, `rgba(0, 0, 0, 0.05)`) — use a theme name
//     (`gray.400`) or statusColors
//   - a typed text size (`fontSize: "0.75rem"`, `fontSize: 12`) — use a
//     Typography variant; icon sizes `fontSize="small|medium|inherit"` are
//     fine, `"large"` is not
//   - `className=` or `style={…}` — style through `sx`
//   - MUI's 900 px tablet width (`breakpoints.down("md")`) — a phone is
//     below 600 px (`"sm"`)
//   - a plain MUI `<Table>`, MUI's table class names (`.MuiTableCell-root`)
//     or the old phone-table styling (`STACK_ON_PHONE`, `data-label`,
//     `phone-hidden`, `phone-chevron`) — every table goes through
//     components/TableOrCards, no exceptions (Basheer, 2026-10-26)
//
// `node scripts/check-mui-standard.js --all` lists every file's breaches (a
// report; never fails).

import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const APP_DIR = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const SRC_DIR = join(APP_DIR, "src");

// The theme folder is the one place colour values live; TableOrCards is the
// one place a plain MUI Table lives.
const EXEMPT_DIR = "src/theme/";
const EXEMPT = new Set(["src/components/TableOrCards.tsx"]);
const isChecked = (f) =>
  /\.tsx?$/.test(f) && !f.endsWith(".d.ts") && !f.startsWith(EXEMPT_DIR) && !EXEMPT.has(f);

const RULES = [
  { name: "typed colour", pattern: /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?(?:[0-9a-fA-F]{2})?\b|\brgba?\(/ },
  { name: "typed text size", pattern: /\bfontSize\s*[:=]\s*\{?\s*(?:["'`][^"'`]*\d|\d)|\bfontSize\s*=\s*\{?\s*["'`]large/ },
  { name: "className", pattern: /\bclassName\s*=/ },
  { name: "style prop", pattern: /\bstyle\s*=\s*\{/ },
  { name: "tablet width as phone", pattern: /\bbreakpoints\.(?:down|up|between|only)\(\s*["'`]md/ },
  { name: "plain table", pattern: /<Table[\s>]/ },
  { name: "MUI table class name", pattern: /\bMuiTable\w*-/ },
  { name: "old phone-table styling", pattern: /\bSTACK_ON_PHONE\b|\bdata-label\b|\bphone-hidden\b|\bphone-chevron\b/ },
];

function stagedFiles() {
  let out;
  try {
    out = execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "--relative"], { cwd: APP_DIR, encoding: "utf8" });
  } catch {
    return [];
  }
  return out.split("\n").map((f) => f.trim()).filter((f) => f.startsWith("src/"));
}

function allFiles(dir = SRC_DIR, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) allFiles(full, files);
    else if (/\.tsx?$/.test(entry)) files.push(relative(APP_DIR, full).split("\\").join("/"));
  }
  return files;
}

// Staged content, not the working copy, is what gets committed.
function readStaged(relPath) {
  try {
    return execFileSync("git", ["show", `:./${relPath}`], { cwd: APP_DIR, encoding: "utf8" });
  } catch {
    return existsSync(join(APP_DIR, relPath)) ? readFileSync(join(APP_DIR, relPath), "utf8") : "";
  }
}

function breaches(text) {
  const found = [];
  let inBlockComment = false;
  text.split("\n").forEach((raw, i) => {
    let line = raw;
    if (inBlockComment) {
      const end = line.indexOf("*/");
      if (end === -1) return;
      line = line.slice(end + 2);
      inBlockComment = false;
    }
    line = line.replace(/\/\*.*?\*\//g, "");
    const open = line.indexOf("/*");
    if (open !== -1) {
      inBlockComment = true;
      line = line.slice(0, open);
    }
    const lineComment = line.search(/(^|[^:])\/\//);
    if (lineComment !== -1) line = line.slice(0, lineComment + 1);
    for (const rule of RULES) {
      if (rule.pattern.test(line)) found.push({ lineNo: i + 1, rule: rule.name, line: raw.trim() });
    }
  });
  return found;
}

const reportAll = process.argv.includes("--all");
const files = (reportAll ? allFiles() : stagedFiles()).filter(isChecked);

const results = [];
for (const f of files) {
  const text = reportAll ? readFileSync(join(APP_DIR, f), "utf8") : readStaged(f);
  for (const b of breaches(text)) results.push({ file: f, ...b });
}

if (reportAll) {
  const byFile = new Map();
  for (const r of results) byFile.set(r.file, (byFile.get(r.file) ?? 0) + 1);
  for (const [f, n] of [...byFile].sort((a, b) => b[1] - a[1])) console.log(`${String(n).padStart(4)}  ${f}`);
  console.log(`\n${byFile.size} files, ${results.length} lines break the MUI standard (report only).`);
  process.exit(0);
}

// Urgent bug fixes are exempt until Sun 1 Nov 2026 (MUI plan D10a):
// `URGENT_FIX=1 git commit …`. After that date the variable does nothing.
const urgentExempt = process.env.URGENT_FIX === "1" && new Date() < new Date("2026-11-02T00:00:00+05:30");

if (results.length > 0 && urgentExempt) {
  console.warn(`MUI standard: ${results.length} line(s) break it — let through as an urgent fix (MUI plan D10a, until 1 Nov).`);
  process.exit(0);
}

if (results.length > 0) {
  console.error("These staged files break the MUI standard (docs/Frontend-Implementation-Standards.md §6.11):\n");
  for (const r of results) console.error(`  ${r.file}:${r.lineNo}  [${r.rule}]  ${r.line}`);
  console.error(
    "\nA changed screen must follow the whole standard before it is committed: colours from the theme" +
    "\n(e.g. \"gray.400\") or theme/statusColors, text sizes from a Typography variant, styling through" +
    "\n`sx`, a phone below 600 px (\"sm\"), and every table through components/TableOrCards."
  );
  process.exit(1);
}

console.log(files.length ? `MUI standard: ${files.length} staged .ts/.tsx file(s) pass.` : "MUI standard: no staged .ts/.tsx files.");
