// Usage: pnpm ship <NN-slug> [--dry-run] [--name <project-name>] [--scope <team>]
//
// First deploy of a product in one command (to-do #8, process change from 03 Scribble):
//   1. creates the Vercel project: named after the product, Root Directory apps/NN-slug, Next.js,
//      connected to the GitHub repo, with the env vars from apps/NN-slug/.env.local
//      (Production and Preview); if the project exists, it updates the Root Directory and env vars
//   2. deploys `main` to production and waits until it's live; it always builds, even when the app's
//      folder is unchanged and only keys changed (SHIP_BUILD_SHA, see decision 0025)
//   3. writes the .vercel.app URL into the product's card and refreshes the README
//
// Run it yourself after a one-time `vercel login`. Env values go straight from the file to Vercel
// on stdin and are never printed, so keys don't pass through anyone else.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { ROOT, APPS_DIR, PRODUCTS_DIR } from "./products.mjs";
import { syncReadme } from "./sync-readme.mjs";

const REPO = "OAJohansson/build-sprint";
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const dryRun = args.includes("--dry-run");
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

// 2. The app must be on GitHub's main, because Vercel builds from there.
step(`Checking that ${rootDirectory} is on GitHub's main`);
spawnSync("git", ["fetch", "-q", "origin", "main"], { cwd: ROOT });
const onMain = spawnSync("git", ["ls-tree", "-d", "origin/main", rootDirectory], { cwd: ROOT, encoding: "utf8" });
if (!onMain.stdout.trim()) fail(`${rootDirectory} isn't on origin/main yet. Merge the scaffold first, then ship.`);
const sha = spawnSync("git", ["rev-parse", "origin/main"], { cwd: ROOT, encoding: "utf8" }).stdout.trim();
console.log(`  yes (main is at ${sha.slice(0, 7)})`);

// 3. Env vars from .env.local; names only are ever printed.
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
// The skip rule in each vercel.json (decision 0016) cancels a build when the app's folder hasn't
// changed, which also cancels a ship that only changed keys. Its first check builds anyway when the
// commit is the one named here, so ship always builds and ordinary pushes still skip. A later push
// is a new commit, so a leftover value forces nothing (decision 0025).
envBody.push({ key: "SHIP_BUILD_SHA", value: sha, target: ["production"], type: "plain" });

if (dryRun) {
  console.log(`\nDry run. Would create or update project "${name}" (Root Directory ${rootDirectory}, Next.js,`);
  console.log(`github.com/${REPO}), set ${env.length} env vars, deploy main (${sha.slice(0, 7)}, forced build) and write the URL into the card.`);
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
const [org, repo] = REPO.split("/");
const deploy = vercelApi("/v13/deployments", {
  method: "POST",
  body: { name, project: projectId, target: "production", gitSource: { type: "github", org, repo, ref: "main", sha } },
});
if (!deploy.ok) fail(`Couldn't start the deployment: ${deploy.data?.error?.message ?? deploy.stderr}`);
let state = deploy.data.readyState;
for (let i = 0; i < 90 && !["READY", "ERROR", "CANCELED"].includes(state); i++) {
  await new Promise((r) => setTimeout(r, 5000));
  state = vercelApi(`/v13/deployments/${deploy.data.id}`).data?.readyState ?? state;
  process.stdout.write(".");
}
console.log(` ${state}`);
if (state === "CANCELED") {
  const events = vercelApi(`/v3/deployments/${deploy.data.id}/events?limit=-1`).data;
  const skipped = Array.isArray(events) && events.some((e) => /ignored build step/i.test(e.text ?? e.payload?.text ?? ""));
  const onMainJson = spawnSync("git", ["show", `${sha}:${rootDirectory}/vercel.json`], { cwd: ROOT, encoding: "utf8" }).stdout;
  fail(
    `The deployment was CANCELED${skipped ? " by the skip rule (the ignoreCommand in vercel.json)" : ", most likely by the skip rule (the ignoreCommand in vercel.json)"}: ` +
      (onMainJson.includes("SHIP_BUILD_SHA")
        ? "it should have built because SHIP_BUILD_SHA matched. Check the build log in the Vercel dashboard."
        : `${rootDirectory}/vercel.json on main doesn't know SHIP_BUILD_SHA yet. Copy the ignoreCommand from templates/next-starter/vercel.json, merge, and ship again.`) +
      " The live site still runs the previous build, without the new keys.",
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
