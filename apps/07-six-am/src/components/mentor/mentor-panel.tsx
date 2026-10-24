"use client";

// The Mentor panel (L86–L90): one chat, docked right. The Mentor works out the job and the
// track(s) from the question; the row selected in the table goes along as light context only.
// Under the input there is only "What can you help me with?". Every answer comes from the server
// (the key stays there); the browser sends ids and the person's words, never audio.
import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Unlock } from "@/components/studio/unlock";
import type { EarsAnalysis } from "@/lib/ears/results";
import type { ListenNext } from "@/lib/mentor/answer";
import { ApiError, money, type AskReply, type ThreadMessage } from "@/lib/mentor/client";
import { DAILY_WARNING_AT, type UsageSummary } from "@/lib/mentor/periods";
import type { StudioStart } from "@/lib/mentor/studio";
import { useLocalStorage } from "@/lib/use-local-storage";
import { Turn } from "./answer-view";
import { GroupsView } from "./groups-view";
import { learn, rememberSuggestion } from "./learn";
import { TasteView } from "./taste-view";
import type { MentorData } from "./use-mentor-data";
import s from "./mentor.module.css";

export const HELP_QUESTION = "What can you help me with?";
/** F5: answered here, free and instantly, and not stored. Only things you can ask by typing. */
const HELP_ANSWER: AskReply["answer"] = {
  intent: "help", tellMore: false,
  sentences: [
    { text: "Name a track and ask what it is, which genre fits, what to listen for or what to play next.", source: "general" },
    { text: "Or ask me to teach a genre, start a Studio track, run a taste session or group your tracks.", source: "general" },
  ],
};

type Item = { id: string; ask?: string; answer: AskReply["answer"]; studio?: StudioStart; dropped?: string[]; genreTrackId?: string; live?: boolean };

const localDay = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

function itemsFrom(messages: ThreadMessage[]): Item[] {
  const out: Item[] = [];
  let ask: string | undefined;
  for (const m of messages) {
    if (m.role === "user") { ask = m.text; continue; }
    out.push({ id: m.id, ask, answer: m.answer });
    ask = undefined;
  }
  return out;
}

export type PanelProps = {
  data: MentorData;
  /** The row selected in the table: light context for the question (L86). */
  track: EarsAnalysis | null;
  library: EarsAnalysis[];
  /** Ears is analysing a track: snippet previews would mix into what it hears. */
  earsBusy: boolean;
  /** False in ?demo=1 against a real store: demo actions don't teach the real profile. */
  canLearn: boolean;
  onClose: () => void;
  onSetGenre: (id: string, genre: string) => void;
  onOpenStudio: (start: StudioStart, title: string) => void;
};

export function MentorPanel({ data, track, library, earsBusy, canLearn, onClose, onSetGenre, onOpenStudio }: PanelProps) {
  const { api, ready, locked, onError } = data;
  const [items, setItems] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<{ text: string; message: string } | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [continued, setContinued] = useLocalStorage("six-am:mentor-continue", "");
  const [stopped, setStopped] = useLocalStorage("six-am:mentor-stop", "");
  const threadRef = useRef<HTMLDivElement>(null);
  /** The input: focus comes back here when the control that had it goes away (a11y review). */
  const fieldRef = useRef<{ focus: () => void }>(null);
  const focusField = () => fieldRef.current?.focus();
  /** The newest answer, read out once by screen readers. */
  const [announce, setAnnounce] = useState("");

  // shortcut: ?mentorWarnAt=N lowers the 50/day check-in in development, to test it without 50
  // real questions; the server's own flag is used everywhere else.
  const [warnAt] = useState(() => {
    if (process.env.NODE_ENV !== "development" || typeof window === "undefined") return DAILY_WARNING_AT;
    const n = Number(new URLSearchParams(location.search).get("mentorWarnAt"));
    return Number.isFinite(n) && n > 0 ? n : DAILY_WARNING_AT;
  });
  const today = localDay();
  const overToday = !!usage && (warnAt === DAILY_WARNING_AT ? usage.warning : usage.questionsToday >= warnAt);
  const isStopped = stopped === today;
  const warning = overToday && continued !== today && !isStopped;

  // The one chat and today's usage, once the code is known.
  useEffect(() => {
    if (!ready || locked || !data.code) return;
    let live = true;
    api.thread("main").then((m) => { if (live) { setItems(itemsFrom(m)); setLoaded(true); } }, (e) => { if (live) { setLoaded(true); onError(e); } });
    api.usage().then((u) => { if (live) setUsage(u); }, onError);
    return () => { live = false; };
  }, [api, ready, locked, onError, data.code]);

  // New answer: bring its top into view (an answer is read from its start).
  useEffect(() => {
    const el = threadRef.current;
    const last = el?.querySelector("article:last-of-type, [data-status]:last-of-type") as HTMLElement | null;
    if (el && last) el.scrollTop = Math.max(0, last.offsetTop - 8);
  }, [items.length, pending]);

  const send = useCallback(async (message: string) => {
    setError(null);
    setPending(message);
    try {
      const r = await api.ask({ job: "chat", track, message });
      console.info(`[mentor] ${r.answer.intent ?? "chat"}: ${r.latencyMs} ms at Claude, est. $${r.message.costUsd}`);
      setItems((list) => [...list.map((x) => ({ ...x, live: false })), { id: r.message.id, ask: message, answer: r.answer, studio: r.studio, dropped: r.dropped, genreTrackId: r.genreTrackId, live: true }]);
      setAnnounce(`The Mentor answered: ${r.answer.sentences.map((x) => x.text).join(" ")}`);
      setUsage(r.usage);
      if (r.answer.genre && r.genreTrackId) rememberSuggestion(r.genreTrackId, r.answer.genre.name);
      if (canLearn && message !== "Tell me more." && message !== HELP_QUESTION) learn(data.code, { type: "asked_about", detail: message.slice(0, 300), ...(track ? { trackId: track.id } : {}) });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) onError(e);
      else setError({ text: e instanceof Error ? e.message : "Something went wrong.", message });
    } finally {
      setPending(null);
    }
  }, [api, track, canLearn, data.code, onError]);

  const byId = (id?: string) => (id ? library.find((a) => a.id === id) ?? null : null);
  const onFeedback = (it: ListenNext, kind: "more_like_this" | "not_for_me") =>
    canLearn && learn(data.code, { type: kind, detail: `${it.artist} – ${it.title} (${it.because})`.slice(0, 480) });
  // N1: an undo goes into the memory too, so it never repeats the undone genre as fact.
  const undoGenre = (a: EarsAnalysis) => (previous: string) => {
    const was = a.myGenre;
    onSetGenre(a.id, previous);
    if (canLearn) learn(data.code, { type: "note", detail: previous ? `Undid the Mentor's genre "${was}" on "${a.title}"; My genre is back to "${previous}".` : `Undid the Mentor's genre "${was}" on "${a.title}"; My genre is empty again.`, trackId: a.id });
  };
  const acceptGenre = (a: EarsAnalysis) => (name: string) => {
    onSetGenre(a.id, name);
    if (canLearn) learn(data.code, { type: "note", detail: `Accepted the Mentor's suggested genre "${name}" as My genre for "${a.title}".`, trackId: a.id });
  };
  const [closedViews, setClosedViews] = useState<Set<string>>(new Set());
  const closeView = (id: string) => setClosedViews((x) => new Set(x).add(id));

  return (
    <aside className={s.panel} aria-label="Mentor">
      <header className={s.head}>
        <h2 className={s.name}>Mentor</h2>
        <button className={s.icon} onClick={onClose} aria-label="Close Mentor" title="Close"><X size={16} strokeWidth={1.5} aria-hidden /></button>
      </header>

      {locked ? (
        <div className={s.gateWrap} style={{ gridRow: "2 / -1" }}>
          <Unlock error={data.lockError} onUnlock={data.setCode} />
        </div>
      ) : (
        <>
          <div className={s.thread} ref={threadRef} aria-busy={!!pending}>
            {items.map((it) => {
              const about = byId(it.genreTrackId ?? it.answer.trackIds?.[0]) ?? (it.live ? track : null);
              const intent = it.answer.intent;
              const view = it.live && !closedViews.has(it.id) && (intent === "taste_session" || intent === "propose_groups");
              return (
                <Turn
                  key={it.id} ask={it.ask} job={intent ?? "chat"} answer={it.answer} studio={it.studio} dropped={it.dropped}
                  track={about} myGenre={about?.myGenre}
                  onTellMore={pending || it !== items.at(-1) ? undefined : () => { focusField(); void send("Tell me more."); }}
                  onAcceptGenre={about ? acceptGenre(about) : undefined}
                  onUndoGenre={about ? undoGenre(about) : undefined}
                  onFeedback={onFeedback}
                  onOpenStudio={(start) => onOpenStudio(start, about?.title ?? "")}
                >
                  {view && intent === "taste_session" ? <TasteView data={data} library={library} earsBusy={earsBusy} onClose={() => closeView(it.id)} onUsage={setUsage} /> : null}
                  {view && intent === "propose_groups" ? <GroupsView data={data} library={library} auto onClose={() => closeView(it.id)} onUsage={setUsage} /> : null}
                </Turn>
              );
            })}
            {!loaded && !items.length ? <p className={s.status} data-status>Loading…</p> : null}
            {pending ? <Thinking ask={pending} /> : null}
            {error ? (
              <p className={s.error} role="alert" data-status>
                <span>{error.text}</span>
                <button className={s.btn} onClick={() => { focusField(); void send(error.message); }}>Retry</button>
                <button className={s.textBtn} onClick={() => { setError(null); focusField(); }}>Dismiss</button>
              </p>
            ) : null}
          </div>
          <p className={s.sr} role="status" aria-live="polite">{announce}</p>

          <Foot
            field={fieldRef}
            replied={items.length > 0}
            busy={!!pending}
            warning={warning}
            stopped={isStopped}
            usage={usage}
            onContinue={() => { setContinued(today); setStopped(""); }}
            onStop={() => setStopped(today)}
            onSend={(t) => void send(t)}
            onHelp={() => {
              setItems((list) => [...list.map((x) => ({ ...x, live: false })), { id: `help-${Date.now()}`, ask: HELP_QUESTION, answer: HELP_ANSWER, live: true }]);
              setAnnounce(HELP_ANSWER.sentences.map((x) => x.text).join(" "));
            }}
          />
        </>
      )}
    </aside>
  );
}

/** A visible text state, never a spinner alone. */
function Thinking({ ask }: { ask: string }) {
  return (
    <div className={s.turn} data-status>
      <p className={s.ask}>{ask}</p>
      <p className={s.voice} role="status"><span className={s.dots}>Thinking</span></p>
    </div>
  );
}

type FootProps = {
  field: React.RefObject<{ focus: () => void } | null>;
  replied: boolean; busy: boolean; warning: boolean; stopped: boolean; usage: UsageSummary | null;
  onContinue: () => void; onStop: () => void; onSend: (text: string) => void; onHelp: () => void;
};

/** About six lines, then the field scrolls (L89). */
const MAX_FIELD_PX = 6 * 21 + 18;

function Foot({ field, replied, busy, warning, stopped, usage, onContinue, onStop, onSend, onHelp }: FootProps) {
  const [text, setText] = useState("");
  const own = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(field, () => ({ focus: () => own.current?.focus() }), []);
  const blocked = busy || warning || stopped;
  // The check-in takes focus when it appears; the field stays focusable (read-only), never disabled.
  const continueRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (warning || stopped) continueRef.current?.focus(); }, [warning, stopped]);

  // Grows with what's typed (field-sizing where supported; this as the fallback).
  useLayoutEffect(() => {
    const el = own.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight + 2, MAX_FIELD_PX)}px`;
    el.style.overflowY = el.scrollHeight + 2 > MAX_FIELD_PX ? "auto" : "hidden";
  }, [text]);

  const submit = () => {
    const t = text.trim();
    if (!t || blocked) return;
    onSend(t);
    setText("");
  };

  return (
    <div className={s.foot}>
      {warning ? (
        <div className={s.warn} role="alert">
          <span><b>{usage?.questionsToday ?? DAILY_WARNING_AT} questions today</b>, about {money(usage?.todayUsd ?? 0)} so far (estimate). A check-in, not a limit.</span>
          <button ref={continueRef} className={s.btn} onClick={() => { onContinue(); field.current?.focus(); }}>Continue anyway</button>
          <button className={s.textBtn} onClick={onStop}>Stop for today</button>
        </div>
      ) : stopped ? (
        <div className={s.warn} role="status">
          <span>Stopped for today.</span>
          <button ref={continueRef} className={s.textBtn} onClick={() => { onContinue(); field.current?.focus(); }}>Continue anyway</button>
        </div>
      ) : null}
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <textarea
          ref={own}
          className={s.field}
          rows={1}
          value={text}
          readOnly={warning || stopped}
          aria-disabled={warning || stopped || undefined}
          aria-label="Ask the Mentor"
          placeholder={replied ? "Reply…" : "Type your question…"}
          spellCheck
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends; Shift+Enter is a new line (IME composition is left alone).
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); }
          }}
        />
      </form>
      {/* aria-disabled, not disabled: a disabled button drops keyboard focus while the answer loads. */}
      <button className={s.help} aria-disabled={blocked || undefined} onClick={() => { if (!blocked) onHelp(); }}>{HELP_QUESTION}</button>
    </div>
  );
}
