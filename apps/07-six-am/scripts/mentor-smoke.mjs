// One real Mentor call, end to end through the running app (POST /api/mentor, job "explain"), on
// the first result of the committed validation export. Prints the answer with its sources, the
// latency and the estimated cost. Never prints a key.
//
//   pnpm dev                     (in one terminal; ANTHROPIC_API_KEY in .env.local)
//   pnpm smoke:mentor            (in another; BASE_URL=… to point at a preview)
//
// Costs about one cent. Reads ACCESS_CODE from the environment or .env.local.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const envFile = here("../.env.local");
const fromFile = (name) => {
  if (!existsSync(envFile)) return "";
  const line = readFileSync(envFile, "utf8").split("\n").find((l) => l.startsWith(`${name}=`));
  return line ? line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "") : "";
};
const code = process.env.ACCESS_CODE ?? fromFile("ACCESS_CODE");
const base = process.env.BASE_URL ?? "http://localhost:3007";
const exportPath = here("../../../docs/products/07-six-am/evals-runs/2026-10-23-validation-export.json");
const analysis = JSON.parse(readFileSync(exportPath, "utf8")).analyses[0];

console.log(`Explaining: ${analysis.title} (${analysis.uploader}) via ${base}/api/mentor`);
const t0 = Date.now();
const res = await fetch(`${base}/api/mentor`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-access-code": code },
  body: JSON.stringify({ job: "explain", trackId: analysis.id, analysis, tz: new Date().getTimezoneOffset() }),
});
const data = await res.json().catch(() => ({}));
const wall = Date.now() - t0;
if (!res.ok) {
  console.error(`Failed: HTTP ${res.status} ${data.error ?? ""} ${data.kind ? `(${data.kind})` : ""}`);
  process.exit(1);
}
for (const s of data.answer.sentences) console.log(`  [${s.source}] ${s.text}${s.url ? ` <${s.url}>` : ""}`);
if (data.answer.tellMore) console.log("  … Tell me more");
console.log(`Sources: ${[...new Set(data.answer.sentences.map((s) => s.source))].join(", ")}`);
console.log(`Latency: ${data.latencyMs} ms in the route, ${wall} ms wall`);
console.log(`Estimated cost: $${data.message.costUsd.toFixed(4)} · today $${data.usage.todayUsd.toFixed(4)} · ${data.usage.month} $${data.usage.monthUsd.toFixed(4)} · questions today ${data.usage.questionsToday}${data.usage.warning ? " (50/day warning)" : ""}`);
const t = data.message.tokens;
console.log(`Tokens: ${t.input_tokens} in, ${t.output_tokens} out, cache write ${t.cache_creation_input_tokens}, cache read ${t.cache_read_input_tokens}, web searches ${t.server_tool_use.web_search_requests}, calls ${t.calls}, model ${t.model}`);
if (data.dropped?.length) console.log(`Dropped by validation: ${data.dropped.join("; ")}`);
