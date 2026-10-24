"use client";

// The setup step (M10, L56): paste playlists → titles, artists and tags read through the
// SoundCloud widget (nothing listened to) → the Mentor drafts My taste and asks 3–5 tap questions
// (with short previews for "which of these is most you?") → optional notes → saved as learn
// events. Skippable at every step; running it again adds to the profile.
import { Pause, Play, X } from "lucide-react";
import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import { parseSoundCloudList } from "@/lib/ears/soundcloud-url";
import { oembedTitle, Player, widgetSrc, type ScSound } from "@/lib/ears/widget";
import type { Question } from "@/lib/mentor/answer";
import { ApiError, type AskReply } from "@/lib/mentor/client";
import type { PlaylistLike } from "@/lib/mentor/playlist";
import type { LearnEvent } from "@/lib/mentor/prompt";
import { useLocalStorage } from "@/lib/use-local-storage";
import { useSnippetPlayer } from "./use-snippet-player";
import type { MentorData } from "./use-mentor-data";
import s from "./setup.module.css";

const STEPS = ["Playlists", "First draft", "Questions", "Anything else"] as const;
export const SOURCES_KEY = "six-am:mentor-setup-sources:v1";
export type SetupSource = { at: string; playlists: string[]; tracks: number };
const NO_SOURCES: SetupSource[] = [];

type Answer = { pick: number | null; more: string };

/** mode "import" (user test F8): one step, paste links → Read → done, no Claude call. The draft and
 *  questions ("setup") only once the taste profile is unlocked. */
export function SetupDialog({ data, onClose, mode = "setup" }: { data: MentorData; onClose: (saved: boolean) => void; mode?: "setup" | "import" }) {
  const importOnly = mode === "import";
  const [imported, setImported] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [links, setLinks] = useState("");
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState<AskReply | null>(null);
  const [read, setRead] = useState<{ playlists: string[]; tracks: number } | null>(null);
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [notes, setNotes] = useState("");
  /** The draft as the person edits it; it becomes My taste on Save (F11: nothing saved before). */
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [, setSources] = useLocalStorage<SetupSource[]>(SOURCES_KEY, NO_SOURCES);
  const reader = useReader();
  const preview = useSnippetPlayer(8);
  const dialog = useRef<HTMLDivElement>(null);
  const questions: Question[] = reply?.answer.questions ?? [];
  const reached = reply ? 3 : 0;

  /** Set on close, so a read in progress stops and never sends the setup request. */
  const closed = useRef(false);
  const close = (saved: boolean) => { closed.current = true; preview.stop(); reader.cancel(); onClose(saved); };
  const onEscape = useEffectEvent(() => { if (!progress && !saving) close(false); });
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    (dialog.current?.querySelector<HTMLElement>("textarea") ?? dialog.current?.querySelector<HTMLElement>("button"))?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onEscape();
      // Focus stays inside the dialog: Tab from the last control goes to the first, and back.
      if (e.key !== "Tab" || !dialog.current) return;
      const items = [...dialog.current.querySelectorAll<HTMLElement>("button:not(:disabled), textarea:not(:disabled), input:not(:disabled), [href]")];
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      const inside = dialog.current.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || !inside)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !inside)) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, []);

  const readPlaylists = async () => {
    const { valid, invalid } = parseSoundCloudList(links);
    const sets = valid.filter((v) => v.kind === "set");
    if (!sets.length) {
      setError(invalid[0]?.message ?? (valid.length ? "Those are track links. Paste playlist (set) links here." : "Paste one or more SoundCloud playlist links."));
      return;
    }
    setError(null);
    const lists: PlaylistLike[] = [];
    const problems: string[] = [];
    try {
      for (const [i, set] of sets.entries()) {
        const where = sets.length > 1 ? `playlist ${i + 1} of ${sets.length}` : "the playlist";
        setProgress(`Reading ${where}…`);
        const sounds = await reader.read(set.url, (done, of) => setProgress(`Reading ${where} · ${done}/${of}`));
        if (closed.current) return;
        if (!sounds) { problems.push(`${set.slug ?? set.url}: didn't load (private, removed or a wrong link)`); continue; }
        if (!sounds.length) { problems.push(`${set.slug ?? set.url}: empty or private`); continue; }
        const meta = await oembedTitle(set.url);
        lists.push({ title: meta?.title ?? set.slug ?? null, url: set.url, sounds });
      }
      if (closed.current) return;
      if (!lists.length) throw new Error(problems.join(" · ") || "None of those playlists could be read.");
      if (importOnly) {
        const r = await data.api.importPlaylists(lists);
        const tracks = lists.reduce((n, l) => n + l.sounds.length, 0);
        setImported(`Read ${tracks} track${tracks === 1 ? "" : "s"} from ${lists.length} playlist${lists.length === 1 ? "" : "s"}${r.added < tracks ? ` (${r.added} new)` : ""}.`);
        if (problems.length) setError(`Skipped: ${problems.join(" · ")}`);
        return;
      }
      setProgress("Drafting your taste from what was read…");
      const r = await data.api.ask({ job: "setup", playlists: lists });
      const tracks = lists.reduce((n, l) => n + l.sounds.length, 0);
      const names = lists.map((l) => l.title ?? "untitled");
      setRead({ playlists: names, tracks });
      setReply(r);
      setDraft(r.answer.profileUpdate?.text ?? data.profile?.text ?? "");
      setStep(1);
      if (problems.length) setError(`Skipped: ${problems.join(" · ")}`);
    } catch (e) {
      if (closed.current) return;
      if (e instanceof ApiError && e.status === 401) { data.onError(e); close(false); return; }
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setProgress(null);
    }
  };

  const save = async () => {
    setSaving(true); setError(null);
    try {
      // The draft first (labelled "From setup"), then the answers refine it.
      if (draft.trim()) data.setProfile(await data.api.saveProfile(draft.trim(), "setup"));
      if (read) setSources((x) => [...(Array.isArray(x) ? x : []), { at: new Date().toISOString(), ...read }].slice(-10));
    } catch (e) {
      setSaving(false);
      setError(e instanceof Error ? e.message : "Your draft wasn't saved. Try again.");
      return;
    }
    const events: LearnEvent[] = [];
    questions.forEach((q, i) => {
      const a = answers[i];
      if (!a || (a.pick == null && !a.more.trim())) return;
      const label = a.pick != null ? q.options[a.pick]?.label : "";
      events.push({ type: "setup_answer", detail: `${q.question} → ${label || "(no pick)"}${a.more.trim() ? ` · ${a.more.trim()}` : ""}`.slice(0, 480) });
    });
    if (notes.trim()) events.push({ type: "note", detail: `Anything else I should know: ${notes.trim()}`.slice(0, 480) });
    if (!events.length) { data.reload(); setSaving(false); return close(true); }
    try {
      await data.api.ask({ job: "learn", events, source: "setup" });
      data.reload();
      close(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your answers weren't saved. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (step === 0) return void readPlaylists();
    if (step === 1) return setStep(2);
    if (step === 2) { preview.stop(); if (qi < questions.length - 1) setQi(qi + 1); else setStep(3); return; }
    void save();
  };
  const back = () => {
    preview.stop();
    if (step === 2 && qi > 0) return setQi(qi - 1);
    setStep(Math.max(0, step - 1));
  };
  const skip = () => {
    if (step === 0) return close(false);
    if (step === 2) { setAnswers((a) => { const c = { ...a }; delete c[qi]; return c; }); }
    next();
  };

  const q = questions[qi];
  const ans = answers[qi] ?? { pick: null, more: "" };
  const setAns = (a: Partial<Answer>) => setAnswers((x) => ({ ...x, [qi]: { ...ans, ...a } }));
  const busy = !!progress || saving;

  return (
    <div className={s.scrim} onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) close(false); }}>
      {reader.frame}
      {preview.frame}
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="setup-title" className={s.dialog}>
        <header className={s.head}>
          <h2 id="setup-title" className={s.title}>{importOnly ? "Import playlists" : "Set up your taste"}</h2>
          <button className={s.icon} onClick={() => close(!!imported)} aria-label="Close"><X size={16} strokeWidth={1.5} aria-hidden /></button>
        </header>
        {importOnly ? null : <div className={s.tabs} role="tablist" aria-label="Setup steps">
          {STEPS.map((name, i) => (
            <button key={name} role="tab" aria-selected={step === i} className={s.tab} disabled={busy || (i > 0 && i > reached) || (i === 0 && !!reply)} onClick={() => { preview.stop(); setStep(i); }}>{name}</button>
          ))}
        </div>}
        <p className={s.privacy}>Titles, artists and tags only. Nothing is listened to.</p>

        <div className={s.body}>
          {step === 0 ? (
            <>
              <label className={s.label} htmlFor="setup-links">SoundCloud playlist links, one per line</label>
              <textarea id="setup-links" className={s.area} rows={4} spellCheck={false} disabled={busy} value={links} onChange={(e) => setLinks(e.target.value)}
                placeholder="https://soundcloud.com/you/sets/a-playlist" />
              {progress ? <p className={s.progress} role="status">{progress}</p> : imported ? <p className={s.progress} role="status">{imported}</p> : <p className={s.hint}>Public playlists only.</p>}
            </>
          ) : step === 1 && reply ? (
            <>
              <label className={s.label} htmlFor="setup-draft">
                First draft of your music taste profile <span>· read {read && read.playlists.length > 1 ? `${read.playlists.length} playlists` : "one playlist"}; change anything</span>
              </label>
              <textarea id="setup-draft" className={s.area} rows={8} value={draft} onChange={(e) => setDraft(e.target.value)} />
              <p className={s.hint}>Saved as your music taste profile when you press Save at the end.</p>
            </>
          ) : step === 2 && q ? (
            <>
              <h3 className={s.q}>{q.question}</h3>
              {q.options.some((o) => o.url) ? <p className={s.hint}>Play a few seconds of each if you like.</p> : null}
              <ul className={s.options} role="radiogroup" aria-label={q.question}>
                {q.options.map((o, i) => {
                  const playing = !!o.url && preview.state.url === o.url;
                  return (
                    <li key={o.label} className={s.option} data-picked={ans.pick === i || undefined}>
                      {o.url ? (
                        <button className={s.play} aria-label={`${playing ? "Stop" : "Play"} a few seconds of ${o.label}`} onClick={() => (playing ? preview.stop() : void preview.play(o.url!))}>
                          {playing ? <Pause size={14} strokeWidth={1.5} /> : <Play size={14} strokeWidth={1.5} />}
                        </button>
                      ) : <span />}
                      <button role="radio" aria-checked={ans.pick === i} className={s.optBody} onClick={() => setAns({ pick: i })}>
                        {o.label}{playing && preview.state.status === "loading" ? <span className={s.by}> · loading…</span> : null}
                      </button>
                      <span className={s.radio} aria-hidden="true" />
                    </li>
                  );
                })}
              </ul>
              {preview.state.error ? <p className={s.error}>{preview.state.error}</p> : null}
              <label className={s.label} htmlFor="say-more" style={{ marginTop: 16 }}>Say more <span>(optional)</span></label>
              <input id="say-more" className={s.input} value={ans.more} onChange={(e) => setAns({ more: e.target.value })} placeholder="What makes it you?" />
            </>
          ) : step === 3 ? (
            <>
              <label className={s.label} htmlFor="setup-notes">Anything else I should know? <span>(optional)</span></label>
              <textarea id="setup-notes" className={s.area} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Where you listen, what you never want to hear, artists you love…" />
            </>
          ) : null}
          {error ? <p className={s.error} role="alert">{error}</p> : null}
        </div>

        {importOnly ? (
          <footer className={s.foot}>
            {imported ? (
              <button className={s.btn} onClick={() => close(true)} style={{ marginLeft: "auto" }}>Done</button>
            ) : (
              <>
                <button className={s.textBtn} onClick={() => close(false)} disabled={busy} style={{ marginLeft: "auto" }}>Cancel</button>
                <button className={s.btn} onClick={() => void readPlaylists()} disabled={busy || !links.trim()}>{progress ? "Reading…" : "Read"}</button>
              </>
            )}
          </footer>
        ) : <footer className={s.foot}>
          {step > 0 ? <button className={s.textBtn} onClick={back} disabled={busy || (step === 1)}>Back</button> : <span />}
          <button className={s.textBtn} onClick={skip} disabled={busy} style={{ marginLeft: "auto" }}>{step === 0 ? "Skip setup" : "Skip"}</button>
          <button className={s.btn} onClick={next} disabled={busy || (step === 0 && !links.trim())}>
            {step === 0 ? (progress ? "Reading…" : "Read playlists") : step === 3 ? (saving ? "Saving…" : "Save") : "Next"}
          </button>
        </footer>}
      </div>
    </div>
  );
}

/** A hidden SoundCloud widget that reads a playlist's tracks (the Ears skip-walk), muted. */
function useReader() {
  const [src, setSrc] = useState<string | null>(null);
  const player = useRef<Player | null>(null);
  const waiting = useRef<((p: Player | null) => void)[]>([]);
  const abort = useRef<AbortController | null>(null);
  const onIframe = useCallback((el: HTMLIFrameElement | null) => {
    if (!el) return;
    Player.attach(el).then(
      (p) => { player.current = p; waiting.current.splice(0).forEach((w) => w(p)); },
      () => waiting.current.splice(0).forEach((w) => w(null)),
    );
  }, []);
  const read = async (url: string, onProgress: (done: number, of: number) => void): Promise<ScSound[] | null> => {
    let p = player.current;
    if (!p) p = await new Promise<Player | null>((resolve) => { waiting.current.push(resolve); setSrc((x) => x ?? url); });
    if (!p) return null;
    try {
      await p.load(url);
    } catch {
      return null;
    }
    abort.current = new AbortController();
    const sounds = await p.loadSetDetails(onProgress, abort.current.signal);
    for (const x of sounds.filter((y) => !y.title)) {
      const u = x.permalink_url;
      const o = u ? await oembedTitle(u) : null;
      if (o) { x.title = o.title; x.user = { username: o.uploader }; }
    }
    return sounds.filter((x) => x.title);
  };
  // The iframe goes with the dialog; drop the player so nothing talks to a removed widget.
  useEffect(() => () => { abort.current?.abort(); player.current = null; }, []);
  const frame = src ? (
    <iframe ref={onIframe} title="SoundCloud player for reading playlists" aria-hidden="true" tabIndex={-1} allow="autoplay" src={widgetSrc(src)}
      style={{ position: "fixed", left: -9999, top: 0, width: 300, height: 20, border: 0, opacity: 0, pointerEvents: "none" }} />
  ) : null;
  return { read, frame, cancel: () => abort.current?.abort() };
}
