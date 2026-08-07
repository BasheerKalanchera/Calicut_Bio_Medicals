// Fails if a Tailwind-shaped `className=` value appears anywhere under src/ outside
// the grandfathered list below. MUI is the sole UI framework (ADR-031) — see
// docs/Frontend-Implementation-Standards.md §6.4 for the required `sx`-prop pattern.
//
// This list must mirror docs/Frontend-Implementation-Standards.md §9 (Migration
// Tracking) exactly: every "pending" row there, plus the one "out of scope" row
// (App.jsx). When a file is migrated, remove it from BOTH this list and §9 in the
// same commit — otherwise this guard silently stops protecting that file.
const GRANDFATHERED = new Set([
  "screens/CustomerDirectoryScreen.jsx",
  "screens/ProjectDirectoryScreen.jsx",
  // Out of scope permanently — prototype only, never migrated. See §9.
  "App.jsx",
]);

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const SRC_DIR = join(fileURLToPath(new URL(".", import.meta.url)), "..", "src");
const CODE_EXTENSIONS = new Set([".tsx", ".ts", ".jsx", ".js"]);

// `className=` alone isn't a violation — a plain CSS-selector hook (e.g.
// `className="deal-avatar"`, used only as an `sx` nested-selector target) has zero
// Tailwind in it and is legitimate MUI-era code. Only flag values that actually
// contain a Tailwind utility token. Not an exhaustive list of every Tailwind
// class — covers every prefix/keyword shape seen in this codebase's pre-migration
// source, which is what this guard needs to protect against in practice.
const TAILWIND_DASH_PREFIXES = [
  "bg", "text", "font", "border", "rounded", "shadow", "ring", "outline", "divide",
  "p", "px", "py", "pt", "pb", "pl", "pr",
  "m", "mx", "my", "mt", "mb", "ml", "mr",
  "w", "h", "min-w", "min-h", "max-w", "max-h",
  "gap", "z", "top", "bottom", "left", "right", "inset",
  "opacity", "scale", "translate", "rotate", "duration", "ease", "animate",
  "cursor", "select", "pointer-events", "tracking", "leading",
  "space-x", "space-y", "col-span", "row-span", "grid-cols", "grid-rows",
  "overflow-x", "overflow-y", "whitespace", "object",
  "items", "justify", "content", "self", "flex", "shrink", "grow",
];
const TAILWIND_KEYWORDS = [
  "flex", "grid", "hidden", "block", "inline-block", "inline", "table",
  "absolute", "relative", "fixed", "sticky", "static",
  "uppercase", "lowercase", "capitalize", "truncate", "italic", "underline", "line-through",
  "transition", "overflow-hidden", "overflow-auto",
];
const VARIANT_PREFIX = "(?:hover|focus|active|disabled|group-hover|focus-within|dark|sm|md|lg|xl|2xl):";
const TAILWIND_CLASS_PATTERN = new RegExp(
  `(?:${VARIANT_PREFIX})?(?:\\b(?:${TAILWIND_DASH_PREFIXES.join("|")})-[\\w./%[\\]]+|\\b(?:${TAILWIND_KEYWORDS.join("|")})\\b)`
);
const CLASSNAME_ATTR = /\bclassName\s*=/;

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, files);
    } else if (CODE_EXTENSIONS.has(extname(entry))) {
      files.push(fullPath);
    }
  }
  return files;
}

const violations = [];
const cleanGrandfathered = [];

for (const fullPath of walk(SRC_DIR)) {
  const relPath = relative(SRC_DIR, fullPath).split("\\").join("/");
  const isGrandfathered = GRANDFATHERED.has(relPath);
  const lines = readFileSync(fullPath, "utf8").split("\n");

  let hasTailwindClassName = false;
  lines.forEach((line, i) => {
    const match = CLASSNAME_ATTR.exec(line);
    if (!match) return;
    const valueSlice = line.slice(match.index);
    if (TAILWIND_CLASS_PATTERN.test(valueSlice)) {
      hasTailwindClassName = true;
      if (!isGrandfathered) {
        violations.push({ relPath, lineNo: i + 1, line: line.trim() });
      }
    }
  });

  if (isGrandfathered && !hasTailwindClassName) {
    cleanGrandfathered.push(relPath);
  }
}

if (violations.length > 0) {
  console.error("Tailwind className usage found outside the grandfathered list (ADR-031 — MUI is the sole UI framework):\n");
  for (const v of violations) {
    console.error(`  ${v.relPath}:${v.lineNo}  ${v.line}`);
  }
  console.error(
    "\nUse the MUI `sx` prop instead (see docs/Frontend-Implementation-Standards.md §6.4)." +
    "\nIf this file is a known pending migration, add it to GRANDFATHERED in" +
    "\nsales-os-app/scripts/check-no-tailwind.js AND to §9 of the Standards doc in the same commit."
  );
  process.exit(1);
}

if (cleanGrandfathered.length > 0) {
  console.warn(
    "Note: the following grandfathered files have zero Tailwind className usage already — " +
    "they may be fully migrated. If so, remove them from GRANDFATHERED here and from " +
    "the pending list in docs/Frontend-Implementation-Standards.md §9:\n" +
    cleanGrandfathered.map((f) => `  ${f}`).join("\n")
  );
}

console.log("No unexpected Tailwind className usage found.");
