// Imports the researched music content (phase 4) into the app's schema. Re-runnable: edit the source, not the output.
//   pnpm -F 11-meander music
// Reads  docs/products/11-meander/content/music/full.json  (one object per genre; schema in the phase 4 brief), or,
//        until that file exists, scripts/music-sample.json (4 placeholder genres, every item marked sample: true).
// Writes src/content/music/schools.json, thinkers.json, links.json, places.json, eras.json, then places any genre that
// has no globe position yet (scripts/embed-positions.mjs music). Fails loudly on anything the app can't resolve.
// The app's names are philosophy's (L49): genres are "schools", listen_for are "questions", hallmarks are "themes",
// artists are "thinkers" and their contributions are "ideas"; grew_out_of → built, reacted_against → against,
// fused_with → fused.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { parseSpan } from "../src/lib/years.ts";

const REAL = new URL("../../../docs/products/11-meander/content/music/full.json", import.meta.url);
const SAMPLE = new URL("./music-sample.json", import.meta.url);
const SRC = process.env.MUSIC_SRC ? new URL(`file://${process.env.MUSIC_SRC}`) : fs.existsSync(REAL) ? REAL : SAMPLE;
const OUT = new URL("../src/content/music/", import.meta.url);
const sample = SRC === SAMPLE;
const full = JSON.parse(fs.readFileSync(SRC, "utf8"));
if (!Array.isArray(full)) { console.error("import-music: the source must be a list of genres"); process.exit(1); }

const problems = [], warnings = [];
const FAMILIES = new Set(["roots", "pop", "rock", "soul", "caribbean-latin", "african", "hiphop", "electronic"]);
const KIND = { grew_out_of: "built", reacted_against: "against", fused_with: "fused" };
// Years read from a range by hand, where parseSpan reads it wrong: { "<genre-id>": { from, to } }.
const SPAN_BY_HAND = {};

const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const src = (list) => (list ?? []).map((s) => ({ url: s.url, ...(s.section ? { section: s.section } : {}), ...(s.quote ? { quote: s.quote } : {}) }));
const text = (x) => (typeof x === "string" ? x : x?.text ?? "");
const recording = (r) => ({ ...(r.artist ? { artist: r.artist } : {}), ...(r.by ? { by: r.by } : {}), title: r.title, year: Number(r.year) || null, kind: r.kind === "album" ? "album" : "song" });

const schools = [], thinkers = [], links = [], places = {}, eras = {};
const ids = new Set(full.map((g) => g.id));
const seenLink = new Set();
for (const g of full) {
  const at = `genre "${g.id ?? g.name}"`;
  if (!g.id || !g.name) { problems.push(`${at}: needs id and name`); continue; }
  if (!FAMILIES.has(g.family)) problems.push(`${at}: unknown family "${g.family}"`);
  const artists = g.artists ?? [];
  const tid = (name) => `${g.id}/${slug(name)}`;
  const names = new Set(artists.map((a) => a.name));
  // The content bar (M2): counts are warnings here, so a draft still imports; the content eval checks them.
  const count = (what, n, ok) => { if (!ok(n)) warnings.push(`${g.id}: ${n} ${what}`); };
  count("listen-for lines (want 3)", (g.listen_for ?? []).length, (n) => n === 3);
  count("hallmarks (want 5)", (g.hallmarks ?? []).length, (n) => n === 5);
  count("artists (want 3–5)", artists.length, (n) => n >= 3 && n <= 5);
  count("recordings (want 3)", (g.recordings ?? []).length, (n) => n === 3);
  for (const a of artists) {
    if (!a.recording?.title) warnings.push(`${g.id}: artist "${a.name}" has no recording`);
    thinkers.push({
      id: tid(a.name), name: a.name, short: a.name, dates: a.dates ?? "", school: g.id,
      summary: a.summary ?? "", ideas: (a.contributions ?? []).map(text),
      ideaSources: (a.contributions ?? []).map((c) => src(c.sources)),
      ...(a.study_prompt?.text ? { prompt: a.study_prompt.text, promptSources: src(a.study_prompt.sources) } : {}),
      ...(a.recording?.title ? { recording: { artist: a.name, ...recording(a.recording) }, recordingSources: src(a.recording.sources) } : {}),
      sources: src(a.sources), sample,
    });
  }
  const dateRange = g.date_range ?? "";
  schools.push({
    id: g.id, name: g.name, family: g.family, dates: dateRange.replace(/\s*\([^)]*\)/g, "").split(";")[0].trim(),
    dateRange, description: g.description ?? "", debatable: g.debatable ?? null,
    ...(g.tagline ? { tagline: text(g.tagline), taglineSources: src(g.tagline.sources) } : {}),
    questions: (g.listen_for ?? []).map(text),
    questionSources: (g.listen_for ?? []).map((q) => src(q.sources)),
    themes: (g.hallmarks ?? []).map((h) => ({
      name: h.title, text: h.text ?? "",
      thinkers: (h.artists ?? []).filter((n) => {
        if (!names.has(n)) warnings.push(`${g.id}: hallmark "${h.title}" names "${n}", who is not one of its artists (left out)`);
        return names.has(n);
      }).map(tid),
      sources: src(h.sources),
    })),
    reactedAgainst: g.reacted_against ? { text: g.reacted_against.text, sources: src(g.reacted_against.sources) } : null,
    thinkers: artists.map((a) => tid(a.name)),
    recordings: (g.recordings ?? []).map(recording),
    recordingSources: (g.recordings ?? []).map((r) => src(r.sources)),
    reading: (g.further_reading ?? []).filter((r) => r?.url).map((r) => ({ url: r.url, title: r.title ?? "" })),
    sources: src(g.sources), sample,
  });
  places[g.id] = { places: g.place ? [text(g.place)].filter(Boolean) : [], span: dateRange || null };
  const parsed = SPAN_BY_HAND[g.id] ?? parseSpan(dateRange);
  // shortcut: the music axis starts in 1900, so a genre that began earlier (blues in the 1860s, jazz and gospel in the
  // late 19th century) starts at the axis edge; its card keeps the real range. Draw a lead-in if the axis ever starts earlier.
  const span = parsed && parsed.from < 1900 ? { ...parsed, from: 1900 } : parsed;
  if (span) eras[g.id] = span;
  else warnings.push(`${g.id}: no years in "${dateRange}", so it is left off the timeline (add it to SPAN_BY_HAND)`);

  // Each link may appear at both ends. "out" reads "this genre grew out of / reacted against / fused with the
  // neighbour", so the neighbour is the older end (from) and this genre the newer (to); "in" is the same link seen
  // from the older end. Both are taken, once each, so a link written at only one end still counts.
  for (const l of g.links ?? []) {
    if (!ids.has(l.neighbour)) { problems.push(`${g.id}: link to unknown genre "${l.neighbour}"`); continue; }
    const type = KIND[l.kind];
    if (!type) { problems.push(`${g.id} → ${l.neighbour}: unknown link kind "${l.kind}"`); continue; }
    // Explicit from/to (the older and newer genre, as in the research's links.json) win over direction.
    const [from, to] = l.from && l.to ? [l.from, l.to] : l.direction === "in" ? [g.id, l.neighbour] : [l.neighbour, g.id];
    const key = `${from}>${to}`;
    if (seenLink.has(key)) {
      // The same pair with "grew out of" and "reacted against" (disco → hip-hop) is one link, as philosophy's
      // "built on, then pushed against".
      const prev = links.find((x) => `${x.from}>${x.to}` === key);
      if (prev && prev.type !== type && [prev.type, type].every((t) => t === "built" || t === "against")) {
        if (prev.type === "against") { prev.label = l.label ?? prev.label; }
        prev.type = "built-then-against";
        prev.reason = [prev.reason, l.reason].filter(Boolean).join(" ");
        prev.sources = [...prev.sources, ...src(l.sources)];
      }
      continue;
    }
    seenLink.add(key);
    links.push({ from, to, type, label: l.label ?? "", reason: l.reason ?? "", sources: src(l.sources), sample });
  }
}
const tids = thinkers.map((t) => t.id);
for (const id of tids) if (tids.indexOf(id) !== tids.lastIndexOf(id)) problems.push(`duplicate artist id ${id}`);
if (problems.length) { console.error("import-music: cannot import\n  " + problems.join("\n  ")); process.exit(1); }
if (warnings.length) console.warn("import-music: check\n  " + warnings.join("\n  "));

fs.mkdirSync(OUT, { recursive: true });
const from = sample ? "scripts/music-sample.json (placeholder; every item is marked sample)" : "docs/products/11-meander/content/music/full.json";
const note = `Generated by scripts/import-music.mjs from ${from}. Do not edit by hand; fix the source and re-run \`pnpm -F 11-meander music\`.`;
const write = (file, body) => fs.writeFileSync(new URL(file, OUT), JSON.stringify(body, null, 2) + "\n");

// The sample's four genres were placed on their own; the real content gets a fresh layout instead of being built
// round them. Real genres, once placed, are kept (re-running never moves a placed globe).
const posFile = new URL("positions.json", OUT);
let wasSample = false;
try { wasSample = !!JSON.parse(fs.readFileSync(new URL("schools.json", OUT), "utf8")).sample; } catch {}
if (!sample && wasSample && fs.existsSync(posFile)) { fs.rmSync(posFile); console.log("import-music: sample positions dropped for a fresh layout"); }

write("schools.json", { sample, note, schools });
write("thinkers.json", { sample, note, thinkers });
write("links.json", { sample, note, links });
write("places.json", places);
write("eras.json", { note, eras });
const counts = { genres: schools.length, artists: thinkers.length, links: links.length, recordings: schools.reduce((n, s) => n + s.recordings.length, 0) };
console.log(`import-music: ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(", ")}${sample ? " (SAMPLE)" : ""}; ${Object.keys(eras).length} on the timeline`);
if (!fs.existsSync(posFile)) write("positions.json", {});
execFileSync(process.execPath, [new URL("./embed-positions.mjs", import.meta.url).pathname, "music"], { stdio: "inherit" });
