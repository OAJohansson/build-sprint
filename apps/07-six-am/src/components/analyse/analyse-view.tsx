"use client";

// The Analyse view (Ears v1): prototype C "Deck" (L24, L25) built for real, with the round-5
// critic's fixes (L28). Every analysed track is one row; the selected one opens in a strip that
// follows the last row and pins to the bottom once the list is long.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { learn, lastSuggestion } from "@/components/mentor/learn";
import { MentorPanel } from "@/components/mentor/mentor-panel";
import { useMentorData } from "@/components/mentor/use-mentor-data";
import { Unlock } from "@/components/studio/unlock";
import { Logo } from "@/components/studio/logo";
import { SettingsLink, ViewsNav } from "@/components/views-nav";
import { bpmChoice } from "@/lib/ears/bpm-choice";
import { claudeText } from "@/lib/ears/claude-text";
import { saveFile, toCsv, toJson } from "@/lib/ears/export";
import { bpmRangeSet, filtersActive, matchesFilters, NO_FILTERS, NO_GENRE, parseBound, sanitiseFilters, type Filters } from "@/lib/ears/filters";
import { canonicalGenre, cleanGenre, genreKey, genreSuggestions, usedGenres, withMyGenre } from "@/lib/ears/my-genre";
import {
  bpmText, brightnessLabel, camelot, energyLabel, formatDuration, keyLabel, keyWord, namedStyles, pct, shownStyles, SHOWN_STYLE_MIN, tagDiffers, tempoMarker, tempoRelationWords,
} from "@/lib/ears/labels";
import { activeItem, queueCounts, type QueueItem } from "@/lib/ears/queue";
import type { EarsAnalysis } from "@/lib/ears/results";
import { styleDisplayName } from "@/lib/ears/styles";
import { clampBpm, DEFAULT_BPM, formatBpm, TEMPO_KEY } from "@/lib/tempo";
import { useEarsSync, type SyncState } from "@/lib/ears/use-ears-sync";
import { ApiError, mentorApi, useAccessCode } from "@/lib/mentor/client";
import { starterDoc, STUDIO_DRAFT_KEY, type StudioDraft } from "@/lib/mentor/studio";
import { useLocalStorage } from "@/lib/use-local-storage";
import { DEMO_RESULTS, DEMO_SOURCE, demoQueue } from "./demo";
import { buildRows, type Row } from "./rows";
import { useAnalyse, type AnalyseModel } from "./use-analyse";
import s from "./analyse.module.css";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const MODEL_MB = 18;
/** N5: no "model" or "download" (it can read as copying music). */
const EARS_READY = `Getting Six AM's ears ready · ${MODEL_MB} MB, once`;
/** Filters persist per device (F13); the demo keeps its own so it never hides real rows. */
const FILTERS_KEY = "six-am:ears-filters:v1";
const DEMO_FILTERS_KEY = "six-am:ears-demo-filters:v1";
/** Demo genres typed by a grader, over the seeds (so a reload can be checked without capture). */
const DEMO_GENRES_KEY = "six-am:ears-demo-genres:v1";
const NO_DEMO_GENRES: Record<string, string> = {};
const GENRE_INPUT_ID = "my-genre";

/** Dev only: the demo's rows are copied to the (in-memory) server so groups and taste sessions can
 *  be tried on them; the live view leaves those copies out. */
const DEMO_IDS: ReadonlySet<string> | undefined = process.env.NODE_ENV === "development" ? new Set(DEMO_RESULTS.map((r) => r.id)) : undefined;

export function LiveAnalyse() {
  const [code, setCode, ready] = useAccessCode();
  // N3: a browser without the access code gets the Studio's gate first; nothing is requested
  // before a code exists (F12).
  if (ready && !code) return <Unlock error={null} onUnlock={setCode} />;
  return <LiveScreen code={code} ready={ready} />;
}

function LiveScreen({ code, ready }: { code: string; ready: boolean }) {
  // M15: results and My genre mirrored to the server; localStorage stays the cache.
  const sync = useEarsSync(code, ready && !!code, DEMO_IDS);
  return <Screen m={useAnalyse()} sync={sync} />;
}

/** shortcut: ?demo=1 shows sample rows (demo.ts) without tab capture, for graders; remove with the prototypes. */
export function DemoAnalyse({ listening }: { listening: boolean }) {
  const [note, setNote] = useState<string | null>(null);
  const say = () => setNote("Demo data: open /analyse without ?demo to analyse for real.");
  const [genres, setGenres] = useLocalStorage<Record<string, string>>(DEMO_GENRES_KEY, NO_DEMO_GENRES);
  const results = useMemo(
    () => DEMO_RESULTS.map((r) => (r.id in (genres ?? {}) ? withMyGenre([r], r.id, genres[r.id])[0] : r)),
    [genres],
  );
  const m: AnalyseModel = {
    demo: true,
    results,
    queue: demoQueue(listening),
    source: DEMO_SOURCE,
    listening: listening ? "on" : "off",
    model: { state: "ready", fraction: null },
    busy: null,
    message: note ? { tone: "info", text: note } : null,
    dismiss: () => setNote(null),
    embedUrl: null,
    onIframe: () => {},
    load: say, enable: say, stopListening: say, analyse: say, cancel: say, retry: say, clearList: say,
    setMyGenre: (id, g) => setGenres((prev) => ({ ...(prev ?? {}), [id]: cleanGenre(g) ?? "" })),
  };
  useDemoServerCopy(results);
  return <Screen m={m} />;
}

// shortcut: dev only, the demo rows (illustrative numbers) go to the in-memory store so the
// server-side jobs (genre groups, taste sessions) can be tried with ?demo=1; never in production.
function useDemoServerCopy(results: EarsAnalysis[]) {
  const [code, , ready] = useAccessCode();
  const sent = useRef({ code: "", rows: new Map<string, string>() });
  useEffect(() => {
    if (!DEMO_IDS || !ready) return;
    // A new code (the first render has none yet) starts over, so rows refused with 401 go again.
    if (sent.current.code !== code) sent.current = { code, rows: new Map() };
    const rows = sent.current.rows;
    const api = mentorApi(code);
    for (const a of results) {
      const j = JSON.stringify(a);
      if (rows.get(a.id) === j) continue;
      rows.set(a.id, j);
      // A real (Supabase) store answers 409: the rows stay marked as sent, so it isn't retried.
      api.putDemoAnalysis(a).catch((e) => { if (!(e instanceof ApiError && e.status === 409)) rows.delete(a.id); });
    }
  }, [results, code, ready]);
}

const OPEN_KEY = "six-am:mentor-open:v1";

function Screen({ m, sync }: { m: AnalyseModel; sync?: SyncState }) {
  const router = useRouter();
  const mentor = useMentorData();
  const [open, setOpen] = useLocalStorage<boolean>(OPEN_KEY, false);
  const { main, rest } = useMemo(() => buildRows(m.results, m.queue, m.source), [m.results, m.queue, m.source]);
  const latest = useMemo(() => [...m.results].sort((a, b) => b.analysedAt.localeCompare(a.analysedAt))[0], [m.results]);
  const [selId, setSelId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; link?: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flash = (text: string, link?: boolean) => {
    setToast({ text, link });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };
  const [storedBpm, setStudioBpm] = useLocalStorage<number>(TEMPO_KEY, DEFAULT_BPM);
  const studioBpm = clampBpm(storedBpm);
  const empty = !main.length && !rest.length;

  const copy = async (a: EarsAnalysis) => {
    try {
      await navigator.clipboard.writeText(claudeText(a, mentor.unlock?.unlocked ? mentor.profile?.text : undefined));
      flash("Copied for Claude · paste it into a chat");
    } catch {
      flash("Couldn't copy: the browser blocked the clipboard");
    }
  };
  const setBpm = (bpm: number) => {
    const b = clampBpm(bpm);
    setStudioBpm(b);
    flash(`Studio set to ${formatBpm(b)} BPM`, true);
  };
  const [query, setQuery] = useState("");
  const [rawFilters, setRawFilters] = useLocalStorage<Filters>(m.demo ? DEMO_FILTERS_KEY : FILTERS_KEY, NO_FILTERS);
  const genres = useMemo(() => usedGenres(m.results), [m.results]);
  // A stored genre filter whose last track lost that genre falls back to All genres (F8).
  const filters = useMemo(() => {
    const f = sanitiseFilters(rawFilters);
    return f.genre && f.genre !== NO_GENRE && !genres.some((g) => genreKey(g) === genreKey(f.genre)) ? { ...f, genre: "" } : f;
  }, [rawFilters, genres]);
  const suggestions = useMemo(() => genreSuggestions(m.results, mentor.acceptedNames), [m.results, mentor.acceptedNames]);

  // Numbers stay those of the whole list while filtering.
  const q = query.trim();
  const keep = (r: Row) => matches(r, q) && matchesFilters(r.state === "done" ? r.result : undefined, filters);
  const shownMain = main.map((r, i) => ({ r, n: i + 1 })).filter((x) => keep(x.r));
  const shownRest = rest.map((r, i) => ({ r, n: main.length + i + 1 })).filter((x) => keep(x.r));
  const narrowed = !!q || filtersActive(filters);
  // The strip shows a visible track: the picked one (else the latest), and once filters hide it,
  // the first visible analysed row; none visible = an empty strip (F1).
  const visible = [...shownMain, ...shownRest].flatMap((x) => (x.r.result ? [x.r.result] : []));
  const wanted = m.results.find((r) => r.id === selId) ?? latest ?? null;
  const selected = !narrowed ? wanted : wanted && visible.some((r) => r.id === wanted.id) ? wanted : visible[0] ?? null;
  // A typed genre takes the spelling already in use (or a family's) when only case, spaces or
  // punctuation differ, so "deep  House" saves as "Deep house" (F2).
  const saveGenre = (id: string, typed: string) => {
    const others = usedGenres(m.results.filter((r) => r.id !== id));
    const g = canonicalGenre(typed, [...others, ...mentor.acceptedNames]) ?? "";
    m.setMyGenre(id, g);
    return g;
    // Untagging the last track of the filtered genre drops that filter for good (F8), so it can't
    // come back later when another track gets the genre.
    const k = filters.genre && filters.genre !== NO_GENRE ? genreKey(filters.genre) : "";
    if (k && genreKey(g) !== k && !others.some((o) => genreKey(o) === k)) setRawFilters({ ...filters, genre: "" });
  };
  // Learning from use (M11): a typed genre, or a correction of the Mentor's suggestion.
  // Demo rows never teach the real profile: in ?demo=1 learning only runs on the in-memory dev store.
  const canLearn = !m.demo || mentor.storeKind === "memory";
  const typeGenre = (id: string, typed: string) => {
    const before = m.results.find((r) => r.id === id)?.myGenre;
    const g = saveGenre(id, typed);
    if (!canLearn) return;
    const a = m.results.find((r) => r.id === id);
    // N1: clearing a genre is a fact the memory needs, so it doesn't repeat the old one.
    if (!g && a && before) learn(mentor.code, { type: "note", detail: `Cleared My genre "${before}" on "${a.title || id}".`, trackId: id });
    if (!g || !a) return;
    const sug = lastSuggestion(id);
    const label = `"${a.title || id}" by ${a.uploader || "unknown"}`;
    if (sug && genreKey(sug) !== genreKey(g)) learn(mentor.code, { type: "corrected_suggestion", detail: `The Mentor suggested "${sug}" for ${label}; I set My genre to "${g}".`, trackId: id });
    else if (!sug) learn(mentor.code, { type: "typed_genre", detail: `I set My genre to "${g}" for ${label}.`, trackId: id });
  };
  const clearFilters = () => { setQuery(""); setRawFilters(NO_FILTERS); };

  // Clicking a row's My genre cell selects it and puts the cursor in the strip's field.
  const [focusGenre, setFocusGenre] = useState(0);
  useEffect(() => {
    if (focusGenre) document.getElementById(GENRE_INPUT_ID)?.focus();
  }, [focusGenre]);
  const editGenre = (id: string) => { setSelId(id); setFocusGenre((n) => n + 1); };

  return (
    <div className={cx(s.shell, open && s.shellOpen)}>
    <div className={cx(s.root, open && s.narrow)}>
      <header className={s.appBar}>
        <div className={s.logo}><Logo className={s.mark} />Six AM</div>
        <ViewsNav current="analyse" />
        <div className={s.appRight}>
          {sync === "offline" ? <span className={s.side} title="Results are kept in this browser and saved to the server when it's reachable again">Offline · saved here</span> : null}
          <button className={s.btn} aria-pressed={open} aria-controls="mentor-panel" onClick={() => setOpen(!open)} title={open ? "Close the Mentor" : "Open the Mentor"}>Mentor</button>
          <ExportMenu results={m.results} />
          <SettingsLink />
        </div>
      </header>
      <Toolbar m={m} empty={empty} bannerEnables={noticeEnables(m, empty)} />
      <Notice m={m} empty={empty} />
      {empty ? <div /> : (
        <ListBar
          m={m} count={main.length + rest.length} shown={shownMain.length + shownRest.length} narrowed={narrowed}
          query={query} setQuery={setQuery} filters={filters} setFilters={setRawFilters} genres={genres} onClear={clearFilters}
        />
      )}
      <main className={s.main}>
        {empty ? <EmptySteps /> : (
          <Table m={m} main={shownMain} rest={shownRest} narrowed={narrowed} emptyText={noMatchText(m.results, main.length + rest.length, q, filters)} selectedId={selected?.id ?? null} onSelect={setSelId} onEditGenre={editGenre} />
        )}
        {empty ? null : selected ? (
          <Strip a={selected} studioBpm={studioBpm} onCopy={copy} onSetBpm={setBpm} suggestions={suggestions} onGenre={(g) => typeGenre(selected.id, g)} />
        ) : narrowed ? (
          <section className={cx(s.strip, s.stripEmpty)} aria-label="Selected track"><span>No track selected</span></section>
        ) : null}
      </main>
      {toast ? (
        <div className={s.toast} role="status">
          {toast.text}
          {toast.link ? <Link href="/">Open Studio</Link> : null}
        </div>
      ) : null}
    </div>
    {open ? (
      <div id="mentor-panel" className={s.panelSlot}>
        <MentorPanel
          data={mentor}
          // F1: only a row the person clicked this session goes along, never the default selection.
          track={selId ? selected : null}
          library={m.results}
          canLearn={canLearn}
          earsBusy={!m.demo && !!activeItem(m.queue)}
          onClose={() => setOpen(false)}
          onSetGenre={(id, g) => { saveGenre(id, g); flash(g ? `My genre set to ${g}` : "My genre cleared"); }}
          onOpenStudio={(start, title) => {
            // N1: a new, unsaved Studio track with the loops placed, at its own tempo; the device
            // tempo and the saved tracks are left alone.
            const draft: StudioDraft = { name: `Start from ${title || "the Mentor"}`.slice(0, 80), bpm: start.bpm, doc: starterDoc(start.loops.map((l) => l.id)), at: new Date().toISOString() };
            try { localStorage.setItem(STUDIO_DRAFT_KEY, JSON.stringify(draft)); } catch { /* storage blocked */ }
            router.push("/");
          }}
        />
      </div>
    ) : null}
    </div>
  );
}

/** What an empty filtered table says (F5): why nothing matches, and the tracks a filter leaves out
 *  because they have no result yet. */
function noMatchText(results: EarsAnalysis[], rows: number, q: string, f: Filters): string {
  const n = results.length;
  const notYet = rows - n;
  const tail = notYet > 0 && filtersActive(f) ? ` · ${notYet} not analysed yet` : "";
  if (!q && f.genre === NO_GENRE && !bpmRangeSet(f) && n > 0 && results.every((r) => cleanGenre(r.myGenre))) {
    return `${n === 1 ? "The analysed track has" : `All ${n} analysed tracks have`} a genre${tail}`;
  }
  return `No tracks match these filters${tail}`;
}

/** The line under the toolbar carries an Enable listening button (then the toolbar doesn't repeat it). */
function noticeEnables(m: AnalyseModel, empty: boolean): boolean {
  if (m.message?.action) return m.message.action.label === "Enable listening";
  if (m.message?.tone === "error") return false;
  return !empty && m.listening === "off";
}

/** One line under the toolbar: news (with its action), else what's needed to go on. */
function Notice({ m, empty }: { m: AnalyseModel; empty: boolean }) {
  const queued = queueCounts(m.queue).queued;
  if (m.message) {
    const err = m.message.tone === "error";
    // News without its own action keeps the next step in view while listening is off (N2).
    const next = !err && !m.message.action && !empty && m.listening === "off";
    return (
      <div className={cx(s.msg, err && s.msgError)} role={err ? "alert" : "status"}>
        <span title={m.message.detail}>{m.message.text}{next ? " · next: Enable listening" : ""}</span>
        {m.message.action ? <button className={s.btn} onClick={m.message.action.run}>{m.message.action.label}</button>
          : next ? <button className={s.btn} onClick={m.enable}>Enable listening</button> : null}
        <button className={s.textBtn} onClick={m.dismiss}>Dismiss</button>
      </div>
    );
  }
  if (empty || m.listening !== "off") return <div />;
  if (queued) {
    return (
      <div className={cx(s.msg, s.msgWait)} role="status">
        <span><b>Not listening</b> · {queued} track{queued > 1 ? "s" : ""} waiting</span>
        <button className={s.btn} onClick={m.enable}>Enable listening</button>
      </div>
    );
  }
  // Step 2 of the empty state stays in view until listening is on.
  return (
    <div className={s.msg} role="status">
      <span>Next: press Enable listening. In Chrome&apos;s dialog pick this tab, leave <q>Also share tab audio</q> on and click <q>Share</q>, once per session.</span>
      <button className={s.btn} onClick={m.enable}>Enable listening</button>
    </div>
  );
}

type ListBarProps = {
  m: AnalyseModel; count: number; shown: number; narrowed: boolean; query: string; setQuery: (q: string) => void;
  filters: Filters; setFilters: (f: Filters) => void; genres: string[]; onClear: () => void;
};

/** Above the table: type to filter, BPM range and my genre (F13), and Clear list (asks once, inline). */
function ListBar({ m, count, shown, narrowed, query, setQuery, filters, setFilters, genres, onClear }: ListBarProps) {
  const [confirm, setConfirm] = useState(false);
  const analysed = m.results.length;
  // The picked genre's option, in the spelling in use (the stored one may differ in case).
  const picked = filters.genre === NO_GENRE ? NO_GENRE : genres.find((g) => genreKey(g) === genreKey(filters.genre)) ?? "";
  return (
    <div className={s.listBar}>
      <input
        className={s.filter}
        type="search"
        aria-label="Filter tracks"
        placeholder="Filter title, uploader, style"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Escape") setQuery(""); }}
      />
      <span className={s.range} role="group" aria-label="BPM range" title="A track matches if its BPM is in the range; when half/double time is unclear, either reading counts. Tracks not analysed yet are hidden while a range is set.">
        <span className={s.label}>BPM</span>
        <BpmBound label="Lowest BPM" ghost="min" value={filters.bpmMin} onChange={(v) => setFilters({ ...filters, bpmMin: v })} />
        <span aria-hidden="true">–</span>
        <BpmBound label="Highest BPM" ghost="max" value={filters.bpmMax} onChange={(v) => setFilters({ ...filters, bpmMax: v })} />
      </span>
      <select className={cx(s.select, !filters.genre && s.selectIdle)} aria-label="Filter by my genre" value={picked} onChange={(e) => setFilters({ ...filters, genre: e.target.value })}>
        <option value="">All genres</option>
        {genres.map((g) => <option key={g} value={g}>{g}</option>)}
        <option value={NO_GENRE}>No genre yet</option>
      </select>
      <span className={s.listCount}>
        {narrowed ? `${shown} of ${count} tracks` : `${count} track${count === 1 ? "" : "s"}`} · {analysed} analysed
      </span>
      {narrowed ? <button className={s.textBtn} onClick={onClear}>Clear filters</button> : null}
      {confirm ? (
        <span className={s.confirm} role="group" aria-label="Clear the list?">
          <span>Clear all {count}{analysed ? `, with ${analysed} result${analysed > 1 ? "s" : ""} (export first to keep them)` : ""}?</span>
          <button className={s.actBtn} onClick={() => { m.clearList(); setConfirm(false); setQuery(""); }}>Clear</button>
          <button className={s.actBtn} onClick={() => setConfirm(false)}>Keep</button>
        </span>
      ) : (
        <button className={cx(s.actBtn, s.clear)} onClick={() => setConfirm(true)} title="Empty the list: pasted tracks, the queue and the results in this browser">Clear list</button>
      )}
    </div>
  );
}

/** One end of the BPM range: typed freely, applied as you type; empty = open-ended. */
function BpmBound({ label, ghost, value, onChange }: { label: string; ghost: string; value: number | null; onChange: (v: number | null) => void }) {
  const [text, setText] = useState(value == null ? "" : String(value));
  // Follow outside changes (Clear filters) without fighting the typing.
  const [seen, setSeen] = useState(value);
  if (value !== seen) { setSeen(value); if (parseBound(text) !== value) setText(value == null ? "" : String(value)); }
  return (
    <input
      className={s.bound}
      type="text"
      inputMode="decimal"
      aria-label={label}
      placeholder={ghost}
      maxLength={6}
      value={text}
      // Numbers only (F6): anything but digits and one decimal mark is dropped as it's typed.
      onChange={(e) => { const v = e.target.value.replace(/[^\d.,]/g, "").replace(/([.,].*)[.,]/g, "$1"); setText(v); onChange(parseBound(v)); }}
      onKeyDown={(e) => { if (e.key === "Escape") { setText(""); onChange(null); } }}
    />
  );
}

function ExportMenu({ results }: { results: EarsAnalysis[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", close);
    return () => { window.removeEventListener("pointerdown", close); window.removeEventListener("keydown", close); };
  }, [open]);
  const stamp = () => new Date().toISOString().slice(0, 10);
  return (
    <div ref={ref}>
      <button className={s.btn} aria-haspopup="menu" aria-expanded={open} disabled={!results.length} onClick={() => setOpen((v) => !v)} title={results.length ? `Export ${results.length} analysed tracks` : "Nothing analysed yet"}>
        Export ▾
      </button>
      {open ? (
        <div className={s.menu} role="menu">
          <button role="menuitem" onClick={() => { saveFile(`six-am-ears-${stamp()}.csv`, toCsv(results), "text/csv"); setOpen(false); }}>CSV</button>
          <button role="menuitem" onClick={() => { saveFile(`six-am-ears-${stamp()}.json`, toJson(results), "application/json"); setOpen(false); }}>JSON</button>
        </div>
      ) : null}
    </div>
  );
}

function Toolbar({ m, empty, bannerEnables }: { m: AnalyseModel; empty: boolean; bannerEnables: boolean }) {
  const [text, setText] = useState("");
  const submit = (value: string) => { if (value.trim()) m.load(value); };
  return (
    <div className={s.bar}>
      <input
        className={s.url}
        aria-label="SoundCloud link"
        placeholder="Paste a SoundCloud track or playlist link"
        spellCheck={false}
        value={text}
        disabled={!!m.busy}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(text); }}
        onPaste={(e) => { const v = e.clipboardData.getData("text"); if (v.trim()) { e.preventDefault(); setText(v.trim()); submit(v); } }}
      />
      <Embed url={m.embedUrl} attach={m.onIframe} demo={m.demo} />
      <Listen m={m} empty={empty} bannerEnables={bannerEnables} />
    </div>
  );
}

/** The official SoundCloud widget, compact (its own look is SoundCloud's). Its src never changes once set. */
function Embed({ url, attach, demo }: { url: string | null; attach: (el: HTMLIFrameElement | null) => void; demo: boolean }) {
  if (!url) return <div className={s.embedEmpty}>{demo ? "Demo data · no player" : "The SoundCloud player appears here"}</div>;
  return (
    <iframe
      ref={attach}
      className={s.embed}
      title="SoundCloud player"
      allow="autoplay"
      src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23f2b134&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`}
    />
  );
}

function Listen({ m, empty, bannerEnables }: { m: AnalyseModel; empty: boolean; bannerEnables: boolean }) {
  const active = activeItem(m.queue);
  const counts = queueCounts(m.queue);
  const queued = counts.queued;
  const prog = progressOf(m, active);

  if (m.listening === "unsupported") {
    return (
      <div className={s.listen}>
        <button className={s.btn} disabled>Enable listening</button>
        <span className={s.offNote}>Needs desktop Chrome to hear this tab</span>
      </div>
    );
  }
  const block = prog ? (
    <div className={s.prog} role="progressbar" aria-label={prog.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={prog.fraction == null ? undefined : Math.round(prog.fraction * 100)}>
      <div className={s.progText}><span>{prog.left}</span><span>{prog.right}</span></div>
      <div className={s.progBar}><i style={{ width: `${(prog.fraction ?? 0) * 100}%` }} /></div>
    </div>
  ) : null;
  if (m.listening !== "on") {
    // The banner under the toolbar has the button and the share reminder: here, status only.
    // Before the first paste the reminder lives in step 2 of the instructions, not here.
    const remind = !bannerEnables && !empty && !queued;
    return (
      <div className={s.listen}>
        {bannerEnables ? null : <button className={s.btn} onClick={m.enable} disabled={m.listening === "unknown" || !!m.busy}>Enable listening</button>}
        {block ?? <span className={s.offNote} title="Chrome asks which tab to share: pick this tab, keep “Also share tab audio” on, then press Share. Once per session.">
          {queued ? `Off · ${queued} waiting` : remind ? <>Off · keep <q>Also share tab audio</q> on</> : "Not listening"}
        </span>}
      </div>
    );
  }
  return (
    <div className={s.listen}>
      {block ?? <span className={s.side}>Listening on</span>}
      {queued ? <span className={s.side}>{queued} queued</span> : null}
      {active ? <button className={s.textBtn} onClick={m.cancel}>Cancel</button>
        : m.listening === "on" && !m.busy ? <button className={s.textBtn} onClick={m.stopListening} title="Stop sharing this tab's audio">Stop</button> : null}
    </div>
  );
}

/** The one progress block: playlist reading, model download, or the track being heard. */
function progressOf(m: AnalyseModel, active: QueueItem | undefined): { left: string; right: string; fraction: number | null; label: string } | null {
  if (m.busy) return { left: m.busy.text, right: m.busy.fraction != null ? `${Math.round(m.busy.fraction * 100)}%` : "", fraction: m.busy.fraction, label: m.busy.text };
  if (m.model.state === "downloading") {
    const f = m.model.fraction;
    return { left: EARS_READY, right: f == null ? "" : `${Math.round(f * 100)}%`, fraction: f, label: `${EARS_READY}: first time only` };
  }
  if (m.model.state === "loading") {
    // Shown from the first second, before the download reports progress (or when it comes from the cache).
    return { left: EARS_READY, right: "", fraction: null, label: `${EARS_READY}: first time only` };
  }
  if (!active) return null;
  if (active.status === "loading") return { left: "Loading the track…", right: "", fraction: 0, label: "Loading the track" };
  if (active.status === "analysing") return { left: "Working out the result…", right: "", fraction: 1, label: "Working out the result" };
  const p = active.progress;
  if (!p) return { left: "Listening…", right: "", fraction: 0, label: "Listening" };
  const heard = (p.snippet - 1) * p.snippetSeconds + p.seconds;
  const total = p.of * p.snippetSeconds;
  return { left: `Listening ${p.snippet}/${p.of}`, right: `${Math.round(heard)} s`, fraction: Math.min(1, heard / total), label: `Listening, snippet ${p.snippet} of ${p.of}, ${Math.round(heard)} of ${Math.round(total)} seconds` };
}

function EmptySteps() {
  return (
    <>
      <ol className={s.steps}>
        <li>Paste a SoundCloud track or playlist link above. A playlist lists all its tracks here.</li>
        <li><span>Press Enable listening. In Chrome&apos;s dialog pick this tab, leave <q>Also share tab audio</q> on and click <q>Share</q>, once per session.</span></li>
        <li>Press Analyse on a track, or Analyse all. Six AM listens to 4 snippets of 30 s; about 2 minutes later its row fills in. It keeps the measurements only, never the audio.</li>
      </ol>
      <p className={s.fine}>Styles are likelihoods, not one answer. Results are kept in this browser and saved to your Six AM.</p>
      <div className={s.ghost} aria-hidden="true">
        <HeadRow />
      </div>
    </>
  );
}

function HeadRow() {
  return (
    <div className={cx(s.cols, s.head)} role="row">
      <span className={cx(s.th, s.right)} role="columnheader">#</span>
      <span className={s.th} role="columnheader">Track</span>
      <span className={cx(s.th, s.thSplit)} role="columnheader" title="The style heard most strongly, and how strongly (%)"><span>Style</span><span>%</span></span>
      <span className={cx(s.th, s.thSplit, s.lo)} role="columnheader" title="The next style heard, and how strongly (%)"><span>Also</span><span>%</span></span>
      <span className={cx(s.th, s.right)} role="columnheader">BPM</span>
      <span className={cx(s.th, s.keyCell)} role="columnheader" title={KEY_TITLE}>Key</span>
      <span className={s.th} role="columnheader">Energy</span>
      <span className={cx(s.th, s.lo)} role="columnheader">Tone</span>
      <span className={cx(s.th, s.right, s.lo)} role="columnheader">Time</span>
      <span className={cx(s.th, s.lo)} role="columnheader" title="The genre the uploader set on SoundCloud">Uploader tag</span>
      <span className={s.th} role="columnheader" title="Your own genre for the track: click a cell to type it">My genre</span>
    </div>
  );
}

/** Type-to-filter: title, uploader, the styles heard and the uploader's tag. */
function matches(r: Row, q: string): boolean {
  if (!q) return true;
  const hay = [r.title, r.uploader, r.result?.uploaderGenreTag ?? "", r.result?.myGenre ?? "", ...(r.result ? namedStyles(r.result).slice(0, 3).map((x) => x.name) : [])].join(" ").toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
}

type Numbered = { r: Row; n: number };
type TableProps = {
  m: AnalyseModel; main: Numbered[]; rest: Numbered[]; narrowed: boolean; emptyText: string; selectedId: string | null;
  onSelect: (id: string) => void; onEditGenre: (id: string) => void;
};

function Table({ m, main, rest, narrowed, emptyText, selectedId, onSelect, onEditGenre }: TableProps) {
  const ref = useRef<HTMLDivElement>(null);
  const analysable = rest.map((x) => x.r).filter((r) => r.state === "new");
  const blocked = rest.length - analysable.length;
  const firstKey = main[0]?.r.key ?? rest[0]?.r.key;
  const tabKey = main.find((x) => selectedId && x.r.result?.id === selectedId)?.r.key ?? firstKey;

  // Arrow keys move between rows (one tab stop for the table); landing on an analysed row selects it.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const rows = Array.from(ref.current?.querySelectorAll<HTMLElement>("[data-row]") ?? []);
    const i = rows.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    e.preventDefault();
    const next = rows[Math.max(0, Math.min(rows.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)))];
    next.focus();
    if (next.dataset.result) onSelect(next.dataset.result);
  };

  return (
    <div className={s.grid} role="grid" aria-label="Analysed tracks" ref={ref} onKeyDown={onKeyDown}>
      <HeadRow />
      {main.map(({ r, n }) => (
        <TableRow key={r.key} r={r} n={n} m={m} selected={!!r.result && r.result.id === selectedId} tabbable={r.key === tabKey} onSelect={onSelect} onEditGenre={onEditGenre} />
      ))}
      {narrowed && !main.length && !rest.length ? (
        <div className={s.divider} role="row"><span role="gridcell">{emptyText}</span></div>
      ) : null}
      {rest.length ? (
        <>
          <div className={s.divider} role="row">
            <span role="gridcell">
              {main.length ? `${rest.length} not analysed` : `${rest.length} track${rest.length > 1 ? "s" : ""} · not analysed`}
              {blocked ? ` · ${blocked} not available in your region` : ""}
            </span>
            {analysable.length > 1 ? (
              <button className={s.actBtn} onClick={() => m.analyse(analysable)} title={m.listening === "on" ? "Queue them all; they're analysed one after another" : "Queue them all; they start once listening is on"}>
                Analyse all {analysable.length}
              </button>
            ) : null}
          </div>
          {rest.map(({ r, n }) => (
            <TableRow key={r.key} r={r} n={n} m={m} selected={false} tabbable={r.key === tabKey} onSelect={onSelect} onEditGenre={onEditGenre} />
          ))}
        </>
      ) : null}
    </div>
  );
}

const FAIL_TEXT: Record<string, string> = {
  "geo-blocked": "Not available in your region",
  unavailable: "Not available on SoundCloud",
  "no-audio": "Nothing heard · tab muted?",
  cancelled: "Cancelled",
  error: "Couldn't analyse",
};

function TableRow({ r, n, m, selected, tabbable, onSelect, onEditGenre }: { r: Row; n: number; m: AnalyseModel; selected: boolean; tabbable: boolean; onSelect: (id: string) => void; onEditGenre: (id: string) => void }) {
  const a = r.state === "done" ? r.result : undefined;
  const isRest = r.state === "new" || r.state === "blocked";
  const dash = isRest ? "" : "–";
  const select = () => { if (r.result) onSelect(r.result.id); };
  const styles = a ? namedStyles(a) : [];
  const title = r.title || r.url.replace(/^https?:\/\/(www\.)?soundcloud\.com\//, "");
  const bpm = a ? bpmChoice(a) : null;

  let status: React.ReactNode = null;
  if (!a) {
    if (r.state === "new") {
      status = (
        <button className={s.actBtn} onClick={(e) => { e.stopPropagation(); m.analyse([r]); }} title={m.listening === "on" ? "Listen to 4 snippets of 30 s (about 2 min)" : "Queue it; it starts once listening is on"}>
          Analyse
        </button>
      );
    } else if (r.state === "blocked") status = <span className={s.dim}>Not available in your region</span>;
    else if (r.state === "queued") status = <span className={s.muted}>Queued · {r.queuePos}</span>;
    else if (r.state === "loading") status = <span className={s.status}>Loading…</span>;
    else if (r.state === "listening") status = <span className={s.status}>Listening {r.item?.progress ? `${r.item.progress.snippet}/${r.item.progress.of}` : ""}…</span>;
    else if (r.state === "analysing") status = <span className={s.status}>Working it out…</span>;
    else if (r.state === "failed") {
      const reason = r.item?.reason ?? "error";
      status = (
        <span title={r.item?.message}>
          <span className={reason === "geo-blocked" ? s.dim : s.failed}>{FAIL_TEXT[reason] ?? FAIL_TEXT.error}</span>
          {reason !== "geo-blocked" ? <> <button className={s.actBtn} onClick={(e) => { e.stopPropagation(); m.retry(r.item!.id); }}>Retry</button></> : null}
        </span>
      );
    }
  }

  return (
    <div
      className={cx(s.cols, s.row, isRest && s.rest, r.result && s.pick, selected && s.sel)}
      role="row"
      aria-selected={r.result ? selected : undefined}
      tabIndex={tabbable ? 0 : -1}
      data-row=""
      data-result={r.result?.id}
      onClick={select}
      onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) { e.preventDefault(); select(); } }}
    >
      <span className={cx(s.num, s.idx)} role="gridcell">{n}</span>
      <span className={s.track} role="gridcell" title={r.uploader ? `${title} · ${r.uploader}` : title}><b>{title}</b>{r.uploader ? <span className={s.by}>· {r.uploader}</span> : null}</span>
      {a && bpm ? (
        <>
          <StyleCell x={styles[0]} />
          <StyleCell x={styles[1]} also lo />
          <span className={s.bpm} role="gridcell">
            {bpmText(bpm.lead)}
            {bpm.unclear && bpm.other != null ? (
              <span className={s.mark2} title={`Could be ${bpmText(bpm.other)} BPM (${tempoRelationWords(bpm.otherRelation!)}); Set Studio uses ${bpmText(bpm.studio)}`}>{tempoMarker(bpm.otherRelation!)}</span>
            ) : null}
          </span>
          <span role="gridcell" className={s.keyCell} title={KEY_TITLE}>{keyLabel(a.key, a.scale)}</span>
          <span role="gridcell"><Energy value={a.energy} /></span>
          <span role="gridcell" className={cx(s.muted, s.lo)}>{brightnessLabel(a.brightness)}</span>
          <span className={cx(s.time, s.lo)} role="gridcell">
            {formatDuration(a.durationMs)}
            {a.preview ? <span className={s.mark2} title="30 s preview: SoundCloud only plays a preview of this track">30s</span> : null}
          </span>
          <span role="gridcell" className={cx(s.muted, s.tagCell, s.lo)} title={a.uploaderGenreTag ? `Uploader tag: ${a.uploaderGenreTag}${tagDiffers(a) ? " · differs: not among the top 3 styles Six AM heard" : ""}` : "The uploader set no genre tag"}>
            {a.uploaderGenreTag ? <span className={s.sName}>{a.uploaderGenreTag}</span> : <span className={s.dim}>none</span>}
            {tagDiffers(a) ? <span className={s.differs}>differs</span> : null}
          </span>
          <span
            role="gridcell"
            className={cx(s.genreCell, a.myGenre ? s.own : s.dim)}
            title={a.myGenre ? `My genre: ${a.myGenre} · click to edit` : "No genre yet · click to type one"}
            onClick={(e) => { e.stopPropagation(); onEditGenre(a.id); }}
          >
            <span>{a.myGenre ?? "–"}</span>
          </span>
        </>
      ) : (
        <>
          <span className={s.span2} role="gridcell">{status}</span>
          <span className={s.bpm} role="gridcell"><span className={s.dim}>{dash}</span></span>
          <span className={s.dim} role="gridcell">{dash}</span>
          <span className={s.dim} role="gridcell">{dash}</span>
          <span className={cx(s.dim, s.lo)} role="gridcell">{dash}</span>
          <span className={cx(s.time, s.lo)} role="gridcell">{formatDuration(r.durationMs)}</span>
          <span className={cx(s.dim, s.lo)} role="gridcell">{dash}</span>
          <span className={s.dim} role="gridcell">{r.result?.myGenre ?? dash}</span>
        </>
      )}
    </div>
  );
}

function StyleCell({ x, also, lo }: { x?: { name: string; p: number }; also?: boolean; lo?: boolean }) {
  if (!x) return <span role="gridcell" className={cx(s.dim, lo && s.lo)}>{also ? "" : "–"}</span>;
  return (
    <span role="gridcell" className={cx(s.styleCell, lo && s.lo)} title={`${x.name} · ${pct(x.p)} % likely`}>
      <span className={s.sName}>{x.name}</span><span className={s.pct}>{pct(x.p)}</span>
    </span>
  );
}

/** The Key column's header and cells share one tooltip (N6). */
const KEY_TITLE = "Camelot key: DJs mix keys with neighbouring numbers";
const camelotTitle = (key: string, scale: string) =>
  camelot(key, scale) ? `Camelot key ${camelot(key, scale)}: DJs mix keys with neighbouring numbers` : undefined;

/** Five steps lit up to the energy. A still meter, never a live level. */
function Energy({ value }: { value: number }) {
  const lit = Math.max(1, Math.round(value * 5));
  return (
    <span className={s.meter} role="img" aria-label={`Energy ${energyLabel(value)}, ${Math.round(value * 100)} of 100`} title={`Energy ${energyLabel(value)}`}>
      {[0, 1, 2, 3, 4].map((i) => <i key={i} className={i < lit ? s.on : undefined} />)}
    </span>
  );
}

type StripProps = {
  a: EarsAnalysis; studioBpm: number; onCopy: (a: EarsAnalysis) => void; onSetBpm: (bpm: number) => void;
  suggestions: string[]; onGenre: (genre: string) => void;
};

/** My genre (F12): free text with suggestions (used genres first, then accepted group names, L55).
 *  Saved on blur or Enter, trimmed; empty clears it; Escape puts back what was saved. */
function GenreField({ value, suggestions, onSave }: { value: string; suggestions: string[]; onSave: (genre: string) => void }) {
  const [text, setText] = useState(value);
  const [seen, setSeen] = useState(value);
  if (value !== seen) { setSeen(value); setText(value); }
  // The saved spelling may differ from the typed one (an existing genre's): show what was saved.
  const save = () => { if (text.trim() !== value) onSave(text); setText(value); };
  return (
    <label className={s.genre}>
      <span className={s.label}>My genre</span>
      <input
        id={GENRE_INPUT_ID}
        className={s.genreInput}
        list="my-genre-suggestions"
        placeholder="Type or pick a genre"
        spellCheck={false}
        autoComplete="off"
        value={text}
        title={text || undefined}
        onChange={(e) => setText(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } // blur saves
          else if (e.key === "Escape") { setText(value); }
        }}
      />
      <datalist id="my-genre-suggestions">
        {suggestions.map((g) => <option key={g} value={g} />)}
      </datalist>
    </label>
  );
}

function Strip({ a, studioBpm, onCopy, onSetBpm, suggestions, onGenre }: StripProps) {
  const styles = namedStyles(a);
  const above = styles.filter((x) => x.p > SHOWN_STYLE_MIN);
  const bars = shownStyles(a);
  const bpm = bpmChoice(a);
  const target = clampBpm(bpm.studio);
  const other = bpm.studioOther != null ? clampBpm(bpm.studioOther) : null;
  const ru = a.keyRunnerUp;
  // The genre tag once, then the other tags (case-insensitive, no repeats).
  const genre = a.uploaderGenreTag?.trim() || null;
  const seen = new Set(genre ? [genre.toLowerCase()] : []);
  const otherTags = a.uploaderTags.filter((t) => { const k = t.trim().toLowerCase(); if (!k || seen.has(k)) return false; seen.add(k); return true; });
  return (
    <section className={s.strip} aria-label="Selected track">
      <div className={s.headLine}>
        <b>{a.title || "Untitled"}</b>
        <span className={s.by}>{a.uploader}</span>
        <span className={s.lcd}>{bpmText(bpm.lead)}<span className={s.lcdUnit}>BPM</span></span>
        {bpm.other != null ? (
          <span className={s.lcdAlt}>or {bpmText(bpm.other)} <span className={bpm.unclear ? s.doubt : undefined}>· {tempoRelationWords(bpm.otherRelation!)}{bpm.unclear ? ", unsure" : ", less likely"}</span></span>
        ) : <span className={s.lcdAlt}>steady</span>}
        <GenreField key={a.id} value={a.myGenre ?? ""} suggestions={suggestions} onSave={onGenre} />
        <span className={s.actions}>
          <button className={s.btn} onClick={() => onCopy(a)} title="Copies the results and a question for Claude to the clipboard">Copy for Claude</button>
          <button className={s.btn} onClick={() => onSetBpm(target)} disabled={target === studioBpm} title={target === studioBpm ? "The Studio is already at this tempo" : `The Studio is at ${formatBpm(studioBpm)} BPM`}>
            {target === studioBpm ? `Studio is at ${formatBpm(target)} BPM` : `Set Studio to ${formatBpm(target)} BPM`}
          </button>
          {other != null ? (
            <button className={s.actBtn} onClick={() => onSetBpm(other)} disabled={other === studioBpm} title={`Half/double time is unclear: use ${formatBpm(other)} BPM instead`}>
              or {formatBpm(other)}
            </button>
          ) : null}
        </span>
      </div>
      <div className={s.facts}>
        <div className={s.bars} aria-label="Styles heard, as likelihoods">
          <span className={s.label} title="Each style's own likelihood; they don't add up to 100">{above.length ? "Styles above 5 % · each its own likelihood" : "Top styles · each its own likelihood"}</span>
          {bars.map((x) => (
            <div key={x.name} className={s.prob}><b>{x.name}</b><span className={s.probTrack}><i style={{ width: `${Math.min(100, pct(x.p))}%` }} /></span><span>{pct(x.p)}%</span></div>
          ))}
        </div>
        <dl className={s.dl}>
          <dt>Key</dt>
          <dd title={camelotTitle(a.key, a.scale)}>{keyLabel(a.key, a.scale)} <span className={s.muted} title={`Key strength ${a.keyStrength.toFixed(2)} (0 to 1)`}>· {keyWord(a.keyStrength)}</span></dd>
          <dt>Runner-up</dt>
          <dd>{ru ? keyLabel(ru.key, ru.scale) : <span className={s.dim}>–</span>}</dd>
          <dt>Energy</dt>
          <dd>{energyLabel(a.energy)} <span className={s.muted}>· tone {brightnessLabel(a.brightness)}</span></dd>
          <dt>Uploader</dt>
          <dd title={[genre ? `Genre tag ${genre}` : "No genre tag", otherTags.length ? `tags ${otherTags.join(", ")}` : ""].filter(Boolean).join(" · ")}>
            <span className={s.muted}>tag </span>{genre ?? <span className={s.dim}>none</span>}
            {tagDiffers(a) ? <span className={s.differs} title="Not among the top 3 styles Six AM heard">differs</span> : null}
            {otherTags.length ? <span className={s.muted}> · tags {otherTags.join(", ")}</span> : null}
          </dd>
        </dl>
        <div className={s.snipBlock}>
          <span className={s.label}>
            {a.preview ? "Heard · 30 s preview only (SoundCloud plays no more here)" : `Heard · ${a.snippets.length} × 30 s across the track`}
          </span>
          <div className={s.snips} aria-label="What each snippet heard">
            {a.snippets.map((x) => (
              <div key={x.startMs} className={s.snip}>
                <span className={s.label}>{formatDuration(x.startMs) === "–" ? "0:00" : formatDuration(x.startMs)}</span>
                {x.topStyle ? (
                  <>
                    <span>{styleDisplayName(x.topStyle)}</span>
                    <span className={s.snipSub}>{x.p != null ? `${pct(x.p)}%` : ""}{x.bpm ? ` · ${x.bpm.toFixed(1)}` : ""}</span>
                  </>
                ) : <span className={s.dim}>nothing heard</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
