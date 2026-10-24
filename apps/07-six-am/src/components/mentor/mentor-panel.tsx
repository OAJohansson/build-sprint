"use client";

// The Mentor panel (M1, L47, L66): docked right, pushes the table, follows the selected track. One
// thread per track plus a general one (GET /api/mentor?thread=). The jobs that fit sit as plain
// links under the input; "/" lists them all. Every answer comes from the server (the key stays
// there); the browser sends ids and the person's words, never audio.
import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import { Unlock } from "@/components/studio/unlock";
import { bpmChoice } from "@/lib/ears/bpm-choice";
import { bpmText } from "@/lib/ears/labels";
import type { EarsAnalysis } from "@/lib/ears/results";
import type { Job, ListenNext } from "@/lib/mentor/answer";
import { ApiError, money, type AskReply, type ThreadMessage } from "@/lib/mentor/client";
import { DAILY_WARNING_AT, type UsageSummary } from "@/lib/mentor/periods";
import { useLocalStorage } from "@/lib/use-local-storage";
import { SOURCE_WORD, Turn } from "./answer-view";
import { SOURCES } from "@/lib/mentor/answer";
import { GroupsView } from "./groups-view";
import { learn, onLearned, rememberSuggestion } from "./learn";
import { TasteView } from "./taste-view";
import type { MentorData } from "./use-mentor-data";
import type { StudioStart } from "@/lib/mentor/studio";
import s from "./mentor.module.css";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type PanelJob = { id: Job | "groups"; label: string; hint: string; needsTrack: boolean; web?: boolean };
const ALL_JOBS: PanelJob[] = [
  { id: "explain", label: "Explain", hint: "what Ears measured, in plain words", needsTrack: true },
  { id: "suggest_genre", label: "Suggest genre", hint: "a name for My genre, one click to use it", needsTrack: true },
  { id: "teach", label: "Teach me a genre", hint: "roots, what defines it, key artists", needsTrack: false, web: true },
  { id: "ear_training", label: "Ear training", hint: "what to listen for in this track", needsTrack: true },
  { id: "studio_start", label: "Studio start", hint: "tempo, key and loops from the crate", needsTrack: true },
  { id: "listen_next", label: "Listen next", hint: "music like this, and why", needsTrack: false, web: true },
  { id: "taste_session", label: "Taste session", hint: "two snippets: which, and why?", needsTrack: false },
  { id: "groups", label: "Genre groups", hint: "groups among your tagged tracks", needsTrack: false },
];
const job = (id: PanelJob["id"]) => ALL_JOBS.find((j) => j.id === id)!;
const ASK_LABEL: Partial<Record<Job, string>> = {
  explain: "Explain", suggest_genre: "Suggest genre", teach: "Teach me a genre", ear_training: "Ear training",
  studio_start: "Studio start", listen_next: "Listen next",
};

type Item = { id: string; job: string; ask?: string; reply?: Pick<AskReply, "answer" | "studio" | "dropped"> & { costUsd: number; updatedNote?: string } };
type Pending = { job: Job; ask: string; thread: string; web: boolean; at: number };

const localDay = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

function itemsFrom(messages: ThreadMessage[]): Item[] {
  const out: Item[] = [];
  let ask: string | undefined;
  for (const m of messages) {
    if (m.role === "user") { ask = m.text; continue; }
    out.push({ id: m.id, job: m.job, ask, reply: { answer: m.answer, costUsd: m.costUsd, dropped: [] } });
    ask = undefined;
  }
  return out;
}

export type PanelProps = {
  data: MentorData;
  track: EarsAnalysis | null;
  library: EarsAnalysis[];
  /** Ears is analysing a track: snippet previews would mix into what it hears. */
  earsBusy: boolean;
  /** False in ?demo=1 against a real store: demo actions don't teach the real profile. */
  canLearn: boolean;
  onClose: () => void;
  onSetGenre: (id: string, genre: string) => void;
  onOpenStudio: (start: StudioStart, title: string) => void;
  onOpenSetup: () => void;
};

export function MentorPanel({ data, track, library, earsBusy, canLearn, onClose, onSetGenre, onOpenStudio, onOpenSetup }: PanelProps) {
  const { api } = data;
  const [scope, setScope] = useState<"track" | "general">("track");
  const inTrack = scope === "track" && !!track;
  const threadId = inTrack ? track!.id : "general";
  const [view, setView] = useState<"thread" | "groups" | "taste">("thread");
  const [threads, setThreads] = useState<Record<string, Item[]>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [error, setError] = useState<{ text: string; job: Job; message: string; askText?: string } | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [continued, setContinued] = useLocalStorage("six-am:mentor-continue", "");
  const [stopped, setStopped] = useLocalStorage("six-am:mentor-stop", "");
  const [setupSkipped, setSetupSkipped] = useLocalStorage("six-am:mentor-setup-skipped", false);
  const [learned, setLearned] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  // shortcut: ?mentorWarnAt=N lowers the 50/day warning in development, to test the strip without
  // 50 real questions; the server's own flag is used everywhere else.
  const [warnAt] = useState(() => {
    if (process.env.NODE_ENV !== "development" || typeof window === "undefined") return DAILY_WARNING_AT;
    const n = Number(new URLSearchParams(location.search).get("mentorWarnAt"));
    return Number.isFinite(n) && n > 0 ? n : DAILY_WARNING_AT;
  });
  const today = localDay();
  const overToday = !!usage && (warnAt === DAILY_WARNING_AT ? usage.warning : usage.questionsToday >= warnAt);
  const isStopped = stopped === today;
  const warning = overToday && continued !== today && !isStopped;

  // Usage on open and after an unlock.
  const { ready } = data;
  useEffect(() => {
    if (!ready || !data.code) return;
    let live = true;
    api.usage().then((u) => { if (live) setUsage(u); }, data.onError);
    return () => { live = false; };
  }, [api, data.onError, ready, data.code]);

  // The thread for the current scope, once per session (answers added here are appended).
  const requested = useRef(new Map<string, typeof api>());
  const { onError, locked } = data;
  useEffect(() => {
    if (!ready || locked || !data.code || requested.current.get(threadId) === api) return;
    requested.current.set(threadId, api);
    setLoading(threadId);
    api.thread(threadId).then(
      (m) => setThreads((t) => ({ ...t, [threadId]: itemsFrom(m) })),
      (e) => { requested.current.delete(threadId); onError(e); },
    ).finally(() => setLoading((l) => (l === threadId ? null : l)));
  }, [api, threadId, locked, onError, ready, data.code]);

  const { reload } = data;
  useEffect(() => onLearned((note) => { setLearned(note); reload(); }), [reload]);

  const items = threads[threadId] ?? [];
  // New answer: bring its top into view (not the bottom: the answer is read from its start).
  useEffect(() => {
    const el = threadRef.current;
    const last = el?.querySelector("article:last-of-type, [data-status]:last-of-type") as HTMLElement | null;
    if (el && last) el.scrollTop = Math.max(0, last.offsetTop - 8);
  }, [items.length, pending, threadId]);

  const send = useCallback(async (j: Job, message = "", askText?: string) => {
    const spec = ALL_JOBS.find((x) => x.id === j);
    if (spec?.needsTrack && !inTrack) return;
    const sendTrack = inTrack ? track : null;
    // "Explain · Work (Edit)": the track named once, as the server stores it.
    const base = j === "chat" ? message : message ? `${ASK_LABEL[j] ?? j}: ${message}` : ASK_LABEL[j] ?? j;
    const ask = askText ?? (sendTrack && j !== "chat" ? `${base} · ${sendTrack.title || "this track"}` : base);
    setError(null);
    setView("thread");
    const p: Pending = { job: j, ask, thread: threadId, web: !!spec?.web || j === "chat", at: performance.now() };
    setPending(p);
    try {
      const r = await api.ask({ job: j, track: sendTrack, message: message || undefined });
      const ms = Math.round(performance.now() - p.at);
      // The 15 s target (E7): logged in the console for the dev, not shown in the product.
      console.info(`[mentor] ${j}: ${ms} ms in the browser, ${r.latencyMs} ms at Claude (target ≤ 15000)`);
      const item: Item = { id: r.message.id, job: j, ask, reply: { answer: r.answer, studio: r.studio, dropped: r.dropped, costUsd: r.message.costUsd, updatedNote: r.profileUpdated?.note } };
      setThreads((t) => ({ ...t, [r.threadId]: [...(t[r.threadId] ?? []), item] }));
      setUsage(r.usage);
      if (r.profileUpdated) data.reload();
      if (j === "suggest_genre" && r.answer.genre && sendTrack) rememberSuggestion(sendTrack.id, r.answer.genre.name);
      if (canLearn && (j === "chat" || j === "teach") && message && message !== "Tell me more.") learn(data.code, { type: "asked_about", detail: message.slice(0, 300), ...(sendTrack ? { trackId: sendTrack.id } : {}) });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) data.onError(e);
      else setError({ text: e instanceof Error ? e.message : "Something went wrong.", job: j, message, askText });
    } finally {
      setPending((cur) => (cur === p ? null : cur));
    }
  }, [api, data, inTrack, threadId, track, canLearn]);

  const onFeedback = (it: ListenNext, kind: "more_like_this" | "not_for_me") =>
    canLearn && learn(data.code, { type: kind, detail: `${it.artist} – ${it.title} (${it.because})`.slice(0, 480), ...(inTrack ? { trackId: track!.id } : {}) });
  const onAcceptGenre = (name: string) => {
    if (!track) return;
    onSetGenre(track.id, name);
    if (canLearn) learn(data.code, { type: "note", detail: `Accepted the Mentor's suggested genre "${name}" as My genre for "${track.title}".`, trackId: track.id });
  };

  const showOffer = !!data.profile && !data.profile.text.trim() && !setupSkipped && view === "thread";
  const usageText = usage ? `est. Today ${money(usage.todayUsd)} · ${usage.month.slice(0, 3)} ${money(usage.monthUsd)}` : "est. Today –";

  return (
    <aside className={s.panel} aria-label="Mentor">
      <header className={s.head}>
        <h2 className={s.name}>Mentor</h2>
        <button className={s.icon} onClick={onClose} aria-label="Close Mentor" title="Close"><X size={16} strokeWidth={1.5} /></button>
      </header>

      {data.locked ? (
        <div className={s.gateWrap} style={{ gridRow: "2 / -1" }}>
          <Unlock error={data.lockError} onUnlock={data.setCode} />
        </div>
      ) : (
        <>
          <div className={s.context}>
            <div className={s.scope} role="tablist" aria-label="What to ask about">
              <button role="tab" aria-selected={inTrack} className={s.tab} disabled={!track} onClick={() => setScope("track")} title={track ? undefined : "Select a track in the table"}>This track</button>
              <button role="tab" aria-selected={!inTrack} className={s.tab} onClick={() => setScope("general")}>General</button>
            </div>
            {inTrack ? (
              <p className={s.on}><b>{track!.title || "Untitled"}</b><span className={s.bpm}>{bpmText(bpmChoice(track!).lead)}</span></p>
            ) : <p className={s.on}><span className={s.by}>Questions not about one track</span></p>}
          </div>

          <div className={s.thread} ref={threadRef} style={{ position: "relative" }}>

            {showOffer ? (
              <div className={s.offer}>
                <p>Six AM doesn&apos;t know your taste yet.</p>
                <p>Paste a few SoundCloud playlists and answer 3–5 quick questions (about 5 minutes). It reads titles, artists and tags only.</p>
                <div className={s.offerActions}>
                  <button className={s.btn} onClick={onOpenSetup}>Set up my taste</button>
                  <button className={s.textBtn} onClick={() => setSetupSkipped(true)}>Not now</button>
                </div>
              </div>
            ) : null}

            {view === "groups" ? (
              <GroupsView data={data} library={library} onClose={() => setView("thread")} onUsage={setUsage} />
            ) : view === "taste" ? (
              <TasteView data={data} library={library} earsBusy={earsBusy} onClose={() => setView("thread")} onUsage={setUsage} />
            ) : (
              <>
                {items.map((it) => it.reply ? (
                  <Turn
                    key={it.id} ask={it.ask} job={it.job} answer={it.reply.answer} costUsd={it.reply.costUsd} studio={it.reply.studio}
                    dropped={it.reply.dropped} updatedNote={it.reply.updatedNote} track={inTrack ? track : null} myGenre={inTrack ? track!.myGenre : undefined}
                    onTellMore={pending ? undefined : () => void send("chat", "Tell me more.", "Tell me more")}
                    onAcceptGenre={inTrack ? onAcceptGenre : undefined}
                    onFeedback={onFeedback}
                    onOpenStudio={(start) => onOpenStudio(start, inTrack ? track!.title : "")}
                  />
                ) : null)}
                {!items.length && !pending && loading !== threadId && !showOffer ? (
                  <p className={s.empty}>
                    {inTrack ? <>Ask about <i>{track!.title || "this track"}</i>, pick a job below, or type / to see everything.</> : "Ask anything about music or making it, pick a job below, or type / to see everything."}
                  </p>
                ) : null}
                {loading === threadId && !items.length ? <p className={s.status} data-status>Loading this thread…</p> : null}
                {pending && pending.thread === threadId ? <Thinking p={pending} /> : null}
                {error ? (
                  <p className={s.error} role="alert" data-status>
                    <span>{error.text}</span>
                    <button className={s.btn} onClick={() => void send(error.job, error.message, error.askText)}>Retry</button>
                    <button className={s.textBtn} onClick={() => setError(null)}>Dismiss</button>
                  </p>
                ) : null}
                {learned ? <p className={s.updated} data-status>{learned} · <Link href="/settings">See My taste</Link></p> : null}
              </>
            )}
          </div>

          <Foot
            usageText={usageText}
            used={new Set(items.at(-1)?.reply?.answer.sentences.map((x) => x.source) ?? [])}
            track={inTrack ? track : null}
            busy={!!pending}
            warning={warning}
            stopped={isStopped}
            usage={usage}
            onContinue={() => { setContinued(today); setStopped(""); }}
            onStop={() => setStopped(today)}
            onJob={(id) => {
              if (id === "groups") { setView("groups"); setError(null); return; }
              if (id === "taste_session") { setView("taste"); setError(null); return; }
              void send(id);
            }}
            onSend={(text, mode) => void send(mode ?? "chat", text)}
          />
        </>
      )}
    </aside>
  );
}

/** A visible text state, never a spinner alone. */
function Thinking({ p }: { p: Pending }) {
  const [late, setLate] = useState(false);
  useEffect(() => {
    // shortcut: the answer isn't streamed, so "Searching the web" is shown after 3 s for jobs that
    // search; stream the API's events to show the real step if this misleads.
    const t = setTimeout(() => setLate(true), 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={s.turn} data-status>
      <p className={s.ask}>{p.ask}</p>
      <p className={s.voice} role="status"><span className={s.dots}>{late && p.web ? "Searching the web" : "Thinking"}</span></p>
    </div>
  );
}

type FootProps = {
  usageText: string;
  /** Sources the latest answer used: the pinned key dims the others. */
  used: ReadonlySet<string>;
  track: EarsAnalysis | null; busy: boolean; warning: boolean; stopped: boolean; usage: UsageSummary | null;
  onContinue: () => void; onStop: () => void; onJob: (id: PanelJob["id"]) => void; onSend: (text: string, mode?: "teach") => void;
};

function Foot({ usageText, used, track, busy, warning, stopped, usage, onContinue, onStop, onJob, onSend }: FootProps) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"teach" | null>(null);
  const [hi, setHi] = useState(0);
  const field = useRef<HTMLInputElement>(null);
  const slash = text.startsWith("/");
  const q = slash ? text.slice(1).trim().toLowerCase() : "";
  // Labels that start with what's typed come first ("/genre" → Genre groups before Suggest genre).
  const list = slash
    ? ALL_JOBS.filter((j) => j.label.toLowerCase().includes(q)).sort((a, b) => Number(b.label.toLowerCase().startsWith(q)) - Number(a.label.toLowerCase().startsWith(q)))
    : [];
  const links: PanelJob[] = track ? [job("explain"), job("suggest_genre"), job("listen_next")] : [job("teach"), job("listen_next")];
  // F3: every job reachable without "/": the rest on a second row behind "All jobs".
  const [more, setMore] = useState(false);
  const rest = ALL_JOBS.filter((j) => !links.includes(j));
  const blocked = busy || warning || stopped;

  const pick = (j: PanelJob | undefined) => {
    if (!j || (j.needsTrack && !track) || blocked) return;
    setText("");
    if (j.id === "teach") { setMode("teach"); field.current?.focus(); return; }
    onJob(j.id);
  };
  const submit = () => {
    if (slash) return pick(list[hi]);
    const t = text.trim();
    if (blocked) return;
    if (mode === "teach") {
      if (!t && !track) return;
      onSend(t, "teach");
    } else {
      if (!t) return;
      onSend(t);
    }
    setText("");
    setMode(null);
  };

  return (
    <div className={s.foot}>
      {warning ? (
        <div className={s.warn} role="alert">
          <span><b>{usage?.questionsToday ?? DAILY_WARNING_AT} questions today</b>, about {money(usage?.todayUsd ?? 0)} so far (estimate). A check-in, not a limit.</span>
          <button className={s.btn} onClick={onContinue}>Continue anyway</button>
          <button className={s.textBtn} onClick={onStop}>Stop for today</button>
        </div>
      ) : stopped ? (
        <div className={s.warn} role="status">
          <span>Stopped for today.</span>
          <button className={s.textBtn} onClick={onContinue}>Continue anyway</button>
        </div>
      ) : null}
      {slash && list.length ? (
        <ul className={s.all} role="listbox" aria-label="Everything the Mentor can do">
          {list.map((j, i) => (
            <li key={j.id} role="option" aria-selected={i === hi}>
              <button type="button" className={cx(s.allRow, i === hi && s.allHi)} disabled={j.needsTrack && !track} onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setHi(i)} onClick={() => pick(j)}>
                <span>{j.label}</span><span>{j.needsTrack && !track ? "pick a track first" : j.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {mode === "teach" ? (
        <p className={s.mode}>Teach me a genre<button className={s.textBtn} onClick={() => setMode(null)}>Cancel</button></p>
      ) : null}
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <input
          ref={field}
          className={s.field}
          value={text}
          disabled={warning || stopped}
          aria-label={mode === "teach" ? "Which genre?" : "Ask the Mentor, or type / for everything it can do"}
          placeholder={mode === "teach" ? (track ? "Name a genre, or Enter for this track's" : "Which genre? e.g. Chicago house") : track ? "Ask about this track, or / for everything" : "Ask anything, or / for everything"}
          spellCheck
          onChange={(e) => { setText(e.target.value); setHi(0); }}
          onKeyDown={(e) => {
            if (e.key === "Escape") { setText(""); setMode(null); return; }
            if (!slash || !list.length) return;
            if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => (h + 1) % list.length); }
            if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => (h - 1 + list.length) % list.length); }
          }}
        />
      </form>
      <div className={s.jobs}>
        {links.map((j) => <button key={j.id} className={s.link} disabled={blocked} onClick={() => pick(j)}>{j.label}</button>)}
        {!track ? <button className={s.link} disabled={blocked} onClick={() => field.current?.focus()}>Ask anything</button> : null}
        <button className={cx(s.link, s.moreBtn)} aria-expanded={more} aria-controls="mentor-more-jobs" onClick={() => setMore(!more)}>All jobs {more ? "▴" : "▾"}</button>
      </div>
      {more ? (
        <div className={s.jobs} id="mentor-more-jobs">
          {rest.map((j) => (
            <button key={j.id} className={s.link} disabled={blocked || (j.needsTrack && !track)} title={j.needsTrack && !track ? "Pick a track first" : j.hint} onClick={() => pick(j)}>{j.label}</button>
          ))}
        </div>
      ) : null}
      <p className={s.key} aria-label="Source numbers">
        {SOURCES.map((x, i) => <span key={x} className={used.size && !used.has(x) ? s.keyDim : undefined}><b>{i + 1}</b> {SOURCE_WORD[x]}</span>)}
      </p>
      <p className={s.usage} title="An estimate from each answer's tokens and web searches at published prices, in your local day and month">{usageText}</p>
    </div>
  );
}
