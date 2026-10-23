// Usage: pnpm env-bootstrap <NN-slug> [--force] [--dry-run]
//
// Fills apps/NN-slug/.env.local from one secrets file at the repo root, .env.secrets.local
// (git-ignored by the `.env*.local` rule), using the app's .env.example as the list of keys
// (decision 0026: keys stop being copied by hand from the previous app).
//
// The secrets file is KEY=value lines. Values meant for one app only (e.g. ACCESS_CODE) go under
// a section header with the app's slug; they win over the shared value for that app:
//
//   ANTHROPIC_API_KEY=sk-…
//   [08-selvedge]
//   ACCESS_CODE=…
//
// Keys already set in .env.local are kept unless --force. Only key names are ever printed.
import fs from "node:fs";
import path from "node:path";
import { APPS_DIR, secretsPath as findSecrets } from "./products.mjs";

const SECRETS_FILE = ".env.secrets.local";
const args = process.argv.slice(2);
const force = args.includes("--force");
const dryRun = args.includes("--dry-run");
const slug = args.find((a) => /^[a-z0-9][a-z0-9-]*$/.test(a));

function fail(message) {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

if (!slug) fail("Usage: pnpm env-bootstrap <NN-slug> [--force] [--dry-run]   e.g. pnpm env-bootstrap 08-selvedge");
const appDir = path.join(APPS_DIR, slug);
if (!fs.existsSync(appDir)) fail(`apps/${slug} doesn't exist.`);

const examplePath = path.join(appDir, ".env.example");
if (!fs.existsSync(examplePath)) fail(`apps/${slug}/.env.example doesn't exist: nothing to fill.`);
const wanted = [...fs.readFileSync(examplePath, "utf8").matchAll(/^([A-Z0-9_]+)=/gm)].map((m) => m[1]);

const secretsPath = findSecrets();
if (!fs.existsSync(secretsPath)) fail(`${SECRETS_FILE} doesn't exist at the repo root (${secretsPath}). Create it with KEY=value lines.`);

// Same line rule as ship.mjs: KEY=value, optional matching quotes, empty values skipped.
const LINE = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/;
const unquote = (v) => v.replace(/^(['"])(.*)\1$/, "$2");

const shared = new Map();
const own = new Map();
let section = null;
for (const line of fs.readFileSync(secretsPath, "utf8").split("\n")) {
  const header = /^\s*\[([^\]]+)\]\s*$/.exec(line);
  if (header) {
    section = header[1].trim();
    continue;
  }
  const m = LINE.exec(line);
  if (!m || m[2] === "") continue;
  if (section === null) shared.set(m[1], unquote(m[2]));
  else if (section === slug) own.set(m[1], unquote(m[2]));
}

const localPath = path.join(appDir, ".env.local");
const lines = fs.existsSync(localPath) ? fs.readFileSync(localPath, "utf8").split("\n") : [];
if (lines.length && lines.at(-1) === "") lines.pop();
const current = new Map();
lines.forEach((line, i) => {
  const m = LINE.exec(line);
  if (m) current.set(m[1], { i, value: m[2] });
});

const added = [];
const replaced = [];
const kept = [];
const missing = [];
for (const key of wanted) {
  const value = own.get(key) ?? shared.get(key);
  const existing = current.get(key);
  if (value === undefined) {
    if (!existing || existing.value === "") missing.push(key);
    continue;
  }
  // Quote only when needed, so the file stays readable by ship.mjs and Next.
  const entry = `${key}=${/[\s#"']/.test(value) ? JSON.stringify(value) : value}`;
  if (!existing) {
    lines.push(entry);
    added.push(key);
  } else if (existing.value === "") {
    lines[existing.i] = entry;
    added.push(key);
  } else if (force) {
    if (unquote(existing.value) !== value) {
      lines[existing.i] = entry;
      replaced.push(key);
    }
  } else {
    kept.push(key);
  }
}

console.log(`apps/${slug}/.env.local${dryRun ? " (dry run, nothing written)" : ""}`);
if (added.length) console.log(`  filled:   ${added.join(", ")}`);
if (replaced.length) console.log(`  replaced: ${replaced.join(", ")}`);
if (kept.length) console.log(`  kept (already set; --force to replace): ${kept.join(", ")}`);
if (missing.length) console.log(`  ⚠ not in ${SECRETS_FILE}: ${missing.join(", ")}`);
if (!added.length && !replaced.length) console.log("  nothing to change");

if (!dryRun && (added.length || replaced.length)) {
  fs.writeFileSync(localPath, lines.join("\n") + "\n", { mode: 0o600 });
}
