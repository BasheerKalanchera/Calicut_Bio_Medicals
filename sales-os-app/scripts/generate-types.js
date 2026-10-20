// Builds src/types/api.ts from the backend code on disk (no running server
// needed): scripts/export_openapi.py writes the OpenAPI document, then
// openapi-typescript turns it into types. `npm run generate:types` runs this;
// .githooks/check-api-types.sh runs it against a commit's staged copy.
//
// Usage: node scripts/generate-types.js [--backend DIR] [--out FILE]
// Defaults: this repo's backend/ and src/types/api.ts. The Python used is
// backend/.venv's in this checkout (override with CABIO_PYTHON).
//
// Why (2026-10-20, Progress-Archive-2026-10): building from the running
// server was skipped when it was down and once copied another session's
// unfinished change — api.ts drifted for two weeks.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const APP_DIR = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const REPO_DIR = resolve(APP_DIR, "..");

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i === -1 ? fallback : resolve(process.argv[i + 1]);
}

const backend = arg("--backend", join(REPO_DIR, "backend"));
const out = arg("--out", join(APP_DIR, "src", "types", "api.ts"));
// A git worktree (e.g. the /build session's) has no .venv of its own, so
// also look in the main checkout's backend/.
const mainRepoDir = resolve(
  spawnSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: REPO_DIR, encoding: "utf8" })
    .stdout.trim() || join(REPO_DIR, ".git"),
  "..",
);
const python =
  process.env.CABIO_PYTHON ??
  [REPO_DIR, mainRepoDir]
    .flatMap((dir) => [join(dir, "backend", ".venv", "Scripts", "python.exe"), join(dir, "backend", ".venv", "bin", "python")])
    .find(existsSync);

if (!python) {
  console.error("generate-types: no backend/.venv python found (set CABIO_PYTHON).");
  process.exit(1);
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: ["ignore", "ignore", "inherit"], shell: false });
  if (result.status !== 0) {
    console.error(`generate-types: ${cmd} failed (exit ${result.status ?? result.error?.message}).`);
    process.exit(1);
  }
}

const workDir = mkdtempSync(join(tmpdir(), "cabio-openapi-"));
try {
  const spec = join(workDir, "openapi.json");
  run(python, ["-I", "-X", "utf8", join(REPO_DIR, "scripts", "export_openapi.py"), spec, backend]);
  const cli = [APP_DIR, join(mainRepoDir, "sales-os-app")]
    .map((dir) => join(dir, "node_modules", "openapi-typescript", "bin", "cli.js"))
    .find(existsSync);
  if (!cli) {
    console.error("generate-types: openapi-typescript not installed (run npm install in sales-os-app).");
    process.exit(1);
  }
  run(process.execPath, [cli, spec, "-o", out]);
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
console.log(`generate-types: wrote ${out}`);
