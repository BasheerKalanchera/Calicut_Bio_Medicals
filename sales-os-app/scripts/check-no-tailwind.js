// Fails if `className=` (Tailwind styling) appears anywhere under src/ outside the
// grandfathered list below. MUI is the sole UI framework (ADR-031) — see
// docs/Frontend-Implementation-Standards.md §6.4 for the required `sx`-prop pattern.
//
// This list must mirror docs/Frontend-Implementation-Standards.md §9 (Migration
// Tracking) exactly: every "pending" row there, plus the one "out of scope" row
// (App.jsx). When a file is migrated, remove it from BOTH this list and §9 in the
// same commit — otherwise this guard silently stops protecting that file.
const GRANDFATHERED = new Set([
  "screens/Customer360Screen.tsx",
  "screens/OpportunityDetailScreen.tsx",
  "screens/CustomerDirectoryScreen.jsx",
  "screens/ProductCatalogScreen.jsx",
  "screens/ProjectDirectoryScreen.jsx",
  "components/ErrorBoundary.jsx",
  "DemoApp.tsx",
  // Out of scope permanently — prototype only, never migrated. See §9.
  "App.jsx",
]);

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const SRC_DIR = join(fileURLToPath(new URL(".", import.meta.url)), "..", "src");
const CODE_EXTENSIONS = new Set([".tsx", ".ts", ".jsx", ".js"]);

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

  let hasClassName = false;
  lines.forEach((line, i) => {
    if (/\bclassName\s*=/.test(line)) {
      hasClassName = true;
      if (!isGrandfathered) {
        violations.push({ relPath, lineNo: i + 1, line: line.trim() });
      }
    }
  });

  if (isGrandfathered && !hasClassName) {
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
    "Note: the following grandfathered files have zero className usage already — " +
    "they may be fully migrated. If so, remove them from GRANDFATHERED here and from " +
    "the pending list in docs/Frontend-Implementation-Standards.md §9:\n" +
    cleanGrandfathered.map((f) => `  ${f}`).join("\n")
  );
}

console.log("No unexpected Tailwind className usage found.");
