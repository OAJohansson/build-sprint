// Copies the sourced places and spans into the app (L32's When / Where lines). Re-runnable.
//   pnpm -F 11-meander places
// Reads  docs/products/11-meander/content/places.json  ({ "<school-id>": { places: [..], span: "1843–1949" | null, sources: [..] } })
// Writes src/content/places.json with only what the app shows ({ places, span }). With no source file it writes {},
// and the first page shows When from the school's dates and no Where line.
import fs from "node:fs";

const SRC = new URL("../../../docs/products/11-meander/content/places.json", import.meta.url);
const OUT = new URL("../src/content/places.json", import.meta.url);
const schools = new Set(JSON.parse(fs.readFileSync(new URL("../src/content/schools.json", import.meta.url), "utf8")).schools.map((s) => s.id));

if (!fs.existsSync(SRC)) {
  fs.writeFileSync(OUT, "{}\n");
  console.log("import-places: no places.json yet; wrote {}");
  process.exit(0);
}
const src = JSON.parse(fs.readFileSync(SRC, "utf8"));
const out = {}, problems = [];
for (const [id, v] of Object.entries(src)) {
  if (!schools.has(id)) { problems.push(`unknown school "${id}"`); continue; }
  const places = Array.isArray(v?.places) ? v.places.filter((p) => typeof p === "string" && p.trim()).map((p) => p.trim()) : [];
  const span = typeof v?.span === "string" && v.span.trim() ? v.span.trim() : null;
  if (v?.places != null && !Array.isArray(v.places)) problems.push(`${id}: places is not a list`);
  out[id] = { places, span };
}
if (problems.length) { console.error("import-places: cannot import\n  " + problems.join("\n  ")); process.exit(1); }
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
console.log(`import-places: ${Object.keys(out).length} schools`);
