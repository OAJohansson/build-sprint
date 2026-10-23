// Usage: pnpm ship <NN-slug> [--dry-run] [--preview] [--name <project-name>] [--scope <team>]
//
// First deploy of a product in one command (to-do #8, process change from 03 Scribble):
//   1. creates the Vercel project: named after the product, Root Directory apps/NN-slug, Next.js,
//      connected to the GitHub repo, with the env vars from apps/NN-slug/.env.local
//      (Production and Preview); if the project exists, it updates the Root Directory and env vars
//   2. deploys `main` to production and waits until it's live
//   3. writes the .vercel.app URL into the product's card and refreshes the README
//
// --preview: one preview deployment of the current, pushed branch for the owner's big checks
// (decision 0026); needs the project to exist, changes nothing else and prints the link.
//
// Ops, so Claude runs it (decision 0026), after the owner's one-time `vercel login`. It first fills
// .env.local from the root .env.secrets.local (pnpm env-bootstrap). Env values go straight from the
// files to Vercel on stdin and are never printed.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { ROOT, APPS_DIR, PRODUCTS_DIR, secretsPath } from "./products.mjs";
import { syncReadme } from "./sync-readme.mjs";

const REPO = "OAJohansson/build-sprint";
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const dryRun = args.includes("--dry-run");
const preview = args.includes("--preview");
const slug = args.find((a) => /^\d{2}-[a-z0-9-]+$/.test(a));
const scope = flag("--scope");

function fail(message) {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}
const step = (message) => console.log(`\n→ ${message}`);

if (!slug) fail("Usage: pnpm ship <NN-slug> [--dry-run] [--name <project-name>]   e.g. pnpm ship 04-montu");
const appDir = path.join(APPS_DIR, slug);
if (!fs.existsSync(appDir)) fail(`apps/${slug} doesn't exist.`);
const name = flag("--name") ?? slug.replace(/^\d{2}-/, "");
const rootDirectory = `apps/${slug}`;

/**
 * Calls the Vercel API through the CLI (uses your `vercel login`). Body goes on stdin and must be
 * a plain object: the CLI (54.x) only JSON-encodes objects and sends an array as
 * "[object Object]", which the API rejects as "Invalid JSON". Send lists one item at a time.
 */
function vercelApi(endpoint, { method = "GET", body } = {}) {
  if (Array.isArray(body)) fail(`vercelApi(${endpoint}): send one object per call, not an array.`);
  const cliArgs = ["api", endpoint, "--raw", "-X", method];
  if (body !== undefined) cliArgs.push("--input", "-");
  if (scope) cliArgs.push("--scope", scope);
  const r = spawnSync("vercel", cliArgs, {
    cwd: ROOT,
    input: body === undefined ? undefined : JSON.stringify(body),
    encoding: "utf8",
  });
  if (r.error) fail(`Couldn't run the Vercel CLI (${r.error.message}). Is it installed?`);
  let data = null;
  try {
    data = JSON.parse(r.stdout);
  } catch {}
  return { ok: r.status === 0 && !data?.error, data, stderr: r.stderr.trim() };
}

// 1. Logged in?
step("Checking your Vercel login");
const who = spawnSync("vercel", ["whoami", ...(scope ? ["--scope", scope] : [])], { encoding: "utf8" });
if (who.status !== 0) fail("Not logged in to Vercel. Run `vercel login` once, then try again.");
console.log(`  logged in as ${who.stdout.trim().split("\n").pop()}`);

if (preview) await shipPreview();

// 2. The app must be on GitHub's main, because Vercel builds from there.
step(`Checking that ${rootDirectory} is on GitHub's main`);
spawnSync("git", ["fetch", "-q", "origin", "main"], { cwd: ROOT });
const onMain = spawnSync("git", ["ls-tree", "-d", "origin/main", rootDirectory], { cwd: ROOT, encoding: "utf8" });
if (!onMain.stdout.trim()) fail(`${rootDirectory} isn't on origin/main yet. Merge the scaffold first, then ship.`);
console.log("  yes");

// 3. Env vars from .env.local, filled first from the root secrets file; names only are ever printed.
if (fs.existsSync(secretsPath()) && fs.existsSync(path.join(appDir, ".env.example"))) {
  step("Filling .env.local from .env.secrets.local");
  const filled = spawnSync("node", [path.join(ROOT, "scripts/env-bootstrap.mjs"), slug, ...(dryRun ? ["--dry-run"] : [])], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (filled.status !== 0) fail("pnpm env-bootstrap failed (see above).");
}
const envFile = path.join(appDir, ".env.local");
const env = [];
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!m || m[2] === "") continue;
    env.push({ key: m[1], value: m[2].replace(/^(['"])(.*)\1$/, "$2") });
  }
}
const expected = fs.existsSync(path.join(appDir, ".env.example"))
  ? [...fs.readFileSync(path.join(appDir, ".env.example"), "utf8").matchAll(/^([A-Z0-9_]+)=/gm)].map((m) => m[1])
  : [];
const missing = expected.filter((k) => !env.some((e) => e.key === k));
step("Environment variables");
console.log(env.length ? `  from .env.local: ${env.map((e) => e.key).join(", ")}` : "  none (no .env.local, or it's empty)");
if (missing.length) console.log(`  ⚠ in .env.example but not set: ${missing.join(", ")}`);
// "sensitive": Vercel never shows the value again, not even to me ("Needs Attention" otherwise).
// Everything in .env.local is a key or code, so all of it is sensitive.
const envBody = env.map((e) => ({ key: e.key, value: e.value, target: ["production", "preview"], type: "sensitive" }));

if (dryRun) {
  console.log(`\nDry run. Would create or update project "${name}" (Root Directory ${rootDirectory}, Next.js,`);
  console.log(`github.com/${REPO}), set ${env.length} env vars, deploy main and write the URL into the card.`);
  process.exit(0);
}

// 4. Create the project, or update it if it exists.
step(`Project "${name}"`);
const existing = vercelApi(`/v9/projects/${name}`);
let projectId;
if (existing.ok) {
  projectId = existing.data.id;
  if (existing.data.rootDirectory !== rootDirectory) {
    const patched = vercelApi(`/v9/projects/${projectId}`, { method: "PATCH", body: { rootDirectory, framework: "nextjs" } });
    if (!patched.ok) fail(`Couldn't set the Root Directory: ${patched.data?.error?.message ?? patched.stderr}`);
  }
  for (const envVar of envBody) {
    const up = vercelApi(`/v10/projects/${projectId}/env?upsert=true`, { method: "POST", body: envVar });
    if (!up.ok) fail(`Couldn't update ${envVar.key}: ${up.data?.error?.message ?? up.stderr}`);
  }
  console.log("  already existed: Root Directory and env vars brought up to date");
} else {
  const created = vercelApi("/v11/projects", {
    method: "POST",
    body: {
      name,
      framework: "nextjs",
      rootDirectory,
      gitRepository: { type: "github", repo: REPO },
      environmentVariables: envBody,
    },
  });
  if (!created.ok) fail(`Couldn't create the project: ${created.data?.error?.message ?? created.stderr}`);
  projectId = created.data.id;
  console.log("  created, connected to GitHub, env vars set");
}

// 5. Deploy main and wait.
step("Deploying main to production (a minute or two)");
const { state } = await deployAndWait(projectId, "main", "production");
// shortcut: a key-only change is cancelled by the skip rule (decision 0016), and the API can't skip
// it, so this prints the dashboard steps; automate it if key-only changes become frequent.
if (state === "CANCELED") {
  fail(
    `The deployment was cancelled, most likely by the skip rule: nothing in ${rootDirectory} changed since the last deploy.\n` +
      "  The live site still runs the old build. If you changed keys, rebuild it by hand:\n" +
      `  Vercel dashboard → project ${name} → Deployments → … on the latest production deploy → Redeploy,\n` +
      "  untick \"Use project's Ignore Build Step\", then Redeploy.",
  );
}
if (state !== "READY") fail(`The deployment ended as ${state}. See the build log in the Vercel dashboard (project ${name}).`);

// 6. The .vercel.app address, into the card.
const domains = vercelApi(`/v9/projects/${projectId}/domains`).data?.domains ?? [];
const domain = domains.map((d) => d.name).filter((d) => d.endsWith(".vercel.app")).sort((a, b) => a.length - b.length)[0];
const url = domain ? `https://${domain}` : null;
step(url ? `Live at ${url}` : "Live (couldn't read the domain; check the project's Domains page)");

const card = path.join(PRODUCTS_DIR, `${slug}.md`);
if (url && fs.existsSync(card)) {
  const text = fs.readFileSync(card, "utf8");
  if (/^url: ""$/m.test(text)) {
    fs.writeFileSync(card, text.replace(/^url: ""$/m, `url: "${url}"`));
    syncReadme();
    console.log(`  URL written into docs/products/${slug}.md and the README. Commit it.`);
  }
}
console.log("\nDone. Pushes to main now deploy this app; other apps skip builds via their vercel.json.\n");

/** Starts a deployment of a GitHub ref (production when `target` is set, else a preview) and waits. */
async function deployAndWait(projectId, ref, target) {
  const [org, repo] = REPO.split("/");
  const deploy = vercelApi("/v13/deployments", {
    method: "POST",
    body: { name, project: projectId, ...(target ? { target } : {}), gitSource: { type: "github", org, repo, ref } },
  });
  if (!deploy.ok) fail(`Couldn't start the deployment: ${deploy.data?.error?.message ?? deploy.stderr}`);
  let state = deploy.data.readyState;
  for (let i = 0; i < 90 && !["READY", "ERROR", "CANCELED"].includes(state); i++) {
    await new Promise((r) => setTimeout(r, 5000));
    state = vercelApi(`/v13/deployments/${deploy.data.id}`).data?.readyState ?? state;
    process.stdout.write(".");
  }
  console.log(` ${state}`);
  return { state, url: deploy.data.url };
}

/** --preview: one preview of the pushed product branch for the owner's big checks, then stop. */
async function shipPreview() {
  const git = (...a) => spawnSync("git", a, { cwd: ROOT, encoding: "utf8" }).stdout.trim();
  const branch = git("branch", "--show-current");
  if (!branch || branch === "main") fail("--preview deploys a product branch: switch to it first (main deploys by itself).");
  step(`Checking that ${branch} is pushed`);
  git("fetch", "-q", "origin", branch);
  if (git("rev-parse", "HEAD") !== git("rev-parse", `origin/${branch}`)) fail(`Push ${branch} first: the preview builds what's on GitHub.`);
  console.log("  yes");
  const project = vercelApi(`/v9/projects/${name}`);
  if (!project.ok) fail(`No Vercel project "${name}" yet: run pnpm ship ${slug} once after merging the scaffold.`);
  if (dryRun) {
    console.log(`\nDry run. Would deploy ${branch} once as a preview of "${name}".`);
    process.exit(0);
  }
  step(`Deploying ${branch} as a preview (a minute or two; one of the day's 100 deployments)`);
  const { state, url } = await deployAndWait(project.data.id, branch);
  if (state !== "READY") {
    const why = state === "CANCELED" ? ` (the skip rule: nothing in ${rootDirectory} changed on this branch)` : "";
    fail(`The preview ended as ${state}${why}. See the Vercel dashboard (project ${name}).`);
  }
  console.log(`\nPreview: https://${url}\n`);
  process.exit(0);
}
