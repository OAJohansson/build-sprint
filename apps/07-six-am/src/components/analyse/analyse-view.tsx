"use client";

// The Analyse view (Ears v1): prototype C "Deck" (L24, L25) built for real, with the round-5
// critic's fixes (L28). Every analysed track is one row; the selected one opens in a strip that
// follows the last row and pins to the bottom once the list is long.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/studio/logo";
import { ViewsNav } from "@/components/views-nav";
import { bpmChoice } from "@/lib/ears/bpm-choice";
import { claudeText } from "@/lib/ears/claude-text";
import { saveFile, toCsv, toJson } from "@/lib/ears/export";
import {
  bpmText, brightnessLabel, camelot, energyLabel, formatDuration, keyLabel, keyWord, namedStyles, pct, tagDiffers, tempoMarker, tempoRelationWords,
} from "@/lib/ears/labels";
import { activeItem, queueCounts, type QueueItem } from "@/lib/ears/queue";
import type { EarsAnalysis } from "@/lib/ears/results";
import { styleDisplayName } from "@/lib/ears/styles";
import { clampBpm, DEFAULT_BPM, formatBpm, TEMPO_KEY } from "@/lib/tempo";
import { useLocalStorage } from "@/lib/use-local-storage";
import { DEMO_RESULTS, DEMO_SOURCE, demoQueue } from "./demo";
import { buildRows, type Row } from "./rows";
import { useAnalyse, type AnalyseModel } from "./use-analyse";
import s from "./analyse.module.css";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const MODEL_MB = 18;

export function LiveAnalyse() {
  return <Screen m={useAnalyse()} />;
}

/** shortcut: ?demo=1 shows sample rows (demo.ts) without tab capture, for graders; remove with the prototypes. */
export function DemoAnalyse({ listening }: { listening: boolean }) {
  const [note, setNote] = useState<string | null>(null);
  const say = () => setNote("Demo data: open /analyse without ?demo to analyse for real.");
  const m: AnalyseModel = {
    demo: true,
    results: DEMO_RESULTS,
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
  };
  return <Screen m={m} />;
}

function Screen({ m }: { m: AnalyseModel }) {
  const { main, rest } = useMemo(() => buildRows(m.results, m.queue, m.source), [m.results, m.queue, m.source]);
  const latest = useMemo(() => [...m.results].sort((a, b) => b.analysedAt.localeCompare(a.analysedAt))[0], [m.results]);
  const [selId, setSelId] = useState<string | null>(null);
  const selected = m.results.find((r) => r.id === selId) ?? latest ?? null;
  const [toast, setToast] = useState<{ text: string; link?: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flash = (text: string, link?: boolean) => {
    setToast({ text, link });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };
  const [storedBpm, setStudioBpm] = useLocalStorage<number>(TEMPO_KEY, DEFAULT_BPM);
  const studioBpm = clampBpm(storedBpm);
  const empty = !main.length && !rest.length;

  const copy = async (a: EarsAnalysis) => {
    try {
      await navigator.clipboard.writeText(claudeText(a));
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

  return (
    <div className={s.root}>
      <header className={s.appBar}>
        <div className={s.logo}><Logo className={s.mark} />Six AM</div>
        <ViewsNav current="analyse" />
        <div className={s.appRight}>
          <ExportMenu results={m.results} />
        </div>
      </header>
      <Toolbar m={m} />
      <Notice m={m} empty={empty} />
      {empty ? <div /> : <ListBar m={m} count={main.length + rest.length} query={query} setQuery={setQuery} />}
      <main className={s.main}>
        {empty ? <EmptySteps /> : (
          <Table m={m} main={main} rest={rest} query={query} selectedId={selected?.id ?? null} onSelect={setSelId} />
        )}
        {selected && !empty ? <Strip a={selected} studioBpm={studioBpm} onCopy={copy} onSetBpm={setBpm} /> : null}
      </main>
      {toast ? (
        <div className={s.toast} role="status">
          {toast.text}
          {toast.link ? <Link href="/">Open Studio</Link> : null}
        </div>
      ) : null}
    </div>
  );
}

/** One line under the toolbar: news (with its action), else what's needed to go on. */
function Notice({ m, empty }: { m: AnalyseModel; empty: boolean }) {
  const queued = queueCounts(m.queue).queued;
  if (m.message) {
    const err = m.message.tone === "error";
    return (
      <div className={cx(s.msg, err && s.msgError)} role={err ? "alert" : "status"}>
        <span title={m.message.detail}>{m.message.text}</span>
        {m.message.action ? <button className={s.btn} onClick={m.message.action.run}>{m.message.action.label}</button> : null}
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

/** Above the table: type to filter, and Clear list (asks once, inline). */
function ListBar({ m, count, query, setQuery }: { m: AnalyseModel; count: number; query: string; setQuery: (q: string) => void }) {
  const [confirm, setConfirm] = useState(false);
  const analysed = m.results.length;
  return (
    <div className={s.listBar}>
      <input
        className={s.filter}
        type="search"
        aria-label="Filter tracks"
        placeholder="Filter by title, uploader or style"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Escape") setQuery(""); }}
      />
      <span className={s.listCount}>{count} track{count === 1 ? "" : "s"} · {analysed} analysed</span>
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

function Toolbar({ m }: { m: AnalyseModel }) {
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
      <Listen m={m} />
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

function Listen({ m }: { m: AnalyseModel }) {
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
    return (
      <div className={s.listen}>
        <button className={s.btn} onClick={m.enable} disabled={m.listening === "unknown" || !!m.busy}>Enable listening</button>
        {block ?? <span className={s.offNote} title="Chrome asks which tab to share: pick this tab, keep “Also share tab audio” on, then press Share. Once per session.">
          {queued ? `Off · ${queued} waiting` : <>Off · keep <q>Also share tab audio</q> on</>}
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
    return { left: `Downloading the listening model · ${MODEL_MB} MB`, right: f == null ? "" : `${Math.round(f * 100)}%`, fraction: f, label: "Downloading the listening model, first time only" };
  }
  if (m.model.state === "loading") {
    // Shown from the first second, before the download reports progress (or when it comes from the cache).
    return { left: `Getting the listening model · ${MODEL_MB} MB`, right: "", fraction: null, label: `Getting the listening model, ${MODEL_MB} MB the first time` };
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
      <p className={s.fine}>Styles are likelihoods, not one answer. Results stay in this browser.</p>
      <div className={s.ghost} aria-hidden="true">
        <HeadRow />
        <div className={s.ghostRow} /><div className={s.ghostRow} /><div className={s.ghostRow} />
      </div>
    </>
  );
}

function HeadRow() {
  return (
    <div className={cx(s.cols, s.head)} role="row">
      <span className={cx(s.th, s.right)} role="columnheader">#</span>
      <span className={s.th} role="columnheader">Track</span>
      <span className={s.th} role="columnheader" title="The style heard most strongly, and how strongly">Style · %</span>
      <span className={s.th} role="columnheader" title="The next style heard">Also · %</span>
      <span className={cx(s.th, s.right)} role="columnheader">BPM</span>
      <span className={s.th} role="columnheader" title="Camelot key: DJs mix keys with neighbouring numbers">Key</span>
      <span className={s.th} role="columnheader">Energy</span>
      <span className={s.th} role="columnheader">Tone</span>
      <span className={cx(s.th, s.right)} role="columnheader">Time</span>
      <span className={s.th} role="columnheader" title="The genre the uploader set on SoundCloud">Uploader tag</span>
    </div>
  );
}

/** Type-to-filter: title, uploader, the styles heard and the uploader's tag. */
function matches(r: Row, q: string): boolean {
  if (!q) return true;
  const hay = [r.title, r.uploader, r.result?.uploaderGenreTag ?? "", ...(r.result ? namedStyles(r.result).slice(0, 3).map((x) => x.name) : [])].join(" ").toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
}

function Table({ m, main: allMain, rest: allRest, query, selectedId, onSelect }: { m: AnalyseModel; main: Row[]; rest: Row[]; query: string; selectedId: string | null; onSelect: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  // Numbers stay those of the whole list while filtering.
  const q = query.trim();
  const main = allMain.map((r, i) => ({ r, n: i + 1 })).filter((x) => matches(x.r, q));
  const rest = allRest.map((r, i) => ({ r, n: allMain.length + i + 1 })).filter((x) => matches(x.r, q));
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
        <TableRow key={r.key} r={r} n={n} m={m} selected={!!r.result && r.result.id === selectedId} tabbable={r.key === tabKey} onSelect={onSelect} />
      ))}
      {q && !main.length && !rest.length ? (
        <div className={s.divider} role="row"><span role="gridcell">No tracks match “{q}”</span></div>
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
            <TableRow key={r.key} r={r} n={n} m={m} selected={false} tabbable={r.key === tabKey} onSelect={onSelect} />
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

function TableRow({ r, n, m, selected, tabbable, onSelect }: { r: Row; n: number; m: AnalyseModel; selected: boolean; tabbable: boolean; onSelect: (id: string) => void }) {
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
          <StyleCell x={styles[1]} also />
          <span className={s.bpm} role="gridcell">
            {bpmText(bpm.main)}
            {bpm.unclear && bpm.alt != null ? (
              <span className={s.mark2} title={`Could be ${bpmText(bpm.alt)} BPM (${tempoRelationWords(bpm.relation!)}); Set Studio uses ${bpmText(bpm.studio)}`}>{tempoMarker(bpm.relation!)}</span>
            ) : null}
          </span>
          <span role="gridcell" title={camelotTitle(a.key, a.scale)}>{keyLabel(a.key, a.scale)}</span>
          <span role="gridcell"><Energy value={a.energy} /></span>
          <span role="gridcell" className={s.muted}>{brightnessLabel(a.brightness)}</span>
          <span className={s.time} role="gridcell">
            {formatDuration(a.durationMs)}
            {a.preview ? <span className={s.mark2} title="30 s preview: SoundCloud only plays a preview of this track">30s</span> : null}
          </span>
          <span role="gridcell" className={cx(s.muted, s.tagCell)} title={a.uploaderGenreTag ? `Uploader tag: ${a.uploaderGenreTag}${tagDiffers(a) ? " · differs: not among the top 3 styles Six AM heard" : ""}` : "The uploader set no genre tag"}>
            {a.uploaderGenreTag ? <span className={s.sName}>{a.uploaderGenreTag}</span> : <span className={s.dim}>none</span>}
            {tagDiffers(a) ? <span className={s.differs}>differs</span> : null}
          </span>
        </>
      ) : (
        <>
          <span className={s.span2} role="gridcell">{status}</span>
          <span className={s.bpm} role="gridcell"><span className={s.dim}>{dash}</span></span>
          <span className={s.dim} role="gridcell">{dash}</span>
          <span className={s.dim} role="gridcell">{dash}</span>
          <span className={s.dim} role="gridcell">{dash}</span>
          <span className={s.time} role="gridcell">{formatDuration(r.durationMs)}</span>
          <span className={s.dim} role="gridcell">{dash}</span>
        </>
      )}
    </div>
  );
}

function StyleCell({ x, also }: { x?: { name: string; p: number }; also?: boolean }) {
  if (!x) return <span role="gridcell" className={s.dim}>{also ? "" : "–"}</span>;
  return (
    <span role="gridcell" className={cx(s.styleCell, also && s.also)} title={`${x.name} · ${pct(x.p)} % likely`}>
      <span className={s.sName}>{x.name}</span><span className={s.pct}>{pct(x.p)}</span>
    </span>
  );
}

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

function Strip({ a, studioBpm, onCopy, onSetBpm }: { a: EarsAnalysis; studioBpm: number; onCopy: (a: EarsAnalysis) => void; onSetBpm: (bpm: number) => void }) {
  const styles = namedStyles(a);
  const above = styles.filter((x) => x.p > 0.05);
  const bars = above.length ? above : styles.slice(0, 3);
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
        <span className={s.lcd}>{bpmText(bpm.main)}<span className={s.lcdUnit}>BPM</span></span>
        {bpm.alt != null ? (
          <span className={s.lcdAlt}>or {bpmText(bpm.alt)} <span className={bpm.unclear ? s.doubt : undefined}>· {tempoRelationWords(bpm.relation!)}{bpm.unclear ? ", unsure" : ", less likely"}</span></span>
        ) : <span className={s.lcdAlt}>steady</span>}
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
