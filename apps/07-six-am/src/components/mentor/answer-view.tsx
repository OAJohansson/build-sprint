"use client";

// One turn of the chat: the question as a small line, then the answer as plain paragraphs (L90:
// no footnote markers), then one dim "From: …" line with the web pages as links. Sources are still
// required per sentence on the server; here they are only summed up. Job extras sit inline as
// quiet actions: the genre to accept, listen-next picks, teach sections, the Studio start.
import { useEffect, useRef, useState } from "react";
import type { EarsAnalysis } from "@/lib/ears/results";
import { SOURCES, type ListenNext, type MentorAnswer, type Sentence, type Source, type TeachSection } from "@/lib/mentor/answer";
import { studioStart, type StudioStart } from "@/lib/mentor/studio";
import { formatBpm } from "@/lib/tempo";
import { LOOPS, TRACKS } from "@/lib/timeline";
import s from "./mentor.module.css";

const FROM_WORD: Record<Source, string | null> = {
  ears: "Ears' measurements", uploader: "the uploader", web: "the web", profile: "your taste profile",
  library: "your library", memory: "memory", general: null,
};
/** Whether the prose already says where it comes from ("Ears measured…"): then no source line. */
const NAMED_IN_TEXT: Partial<Record<Source, RegExp>> = { ears: /\bEars\b/, uploader: /\buploader\b/i, library: /\byou(?:'ve)? (?:tagged|set)\b|\byour (?:library|tag|genre)\b/i };
/** Model text can carry no-break spaces; they make odd line breaks in a narrow column. */
const clean = (t: string) => t.replace(/[\u00a0\u202f]/g, " ");
/** Opens in a new tab: the arrow is decoration, the words are for screen readers. */
export const NewTab = () => <><span aria-hidden="true"> ↗</span><span className={s.sr}> (opens in new tab)</span></>;
const SECTION_TITLE: Record<TeachSection, string> = { what: "What it is", sound: "How it sounds", start: "Where to start" };

/** example.com, short. */
export function shortUrl(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
}

export type TurnProps = {
  ask?: string;
  answer: MentorAnswer;
  job: string;
  /** The track the answer is about (for the Studio start and the genre to accept). */
  track: EarsAnalysis | null;
  studio?: StudioStart;
  dropped?: string[];
  /** The current My genre of the track, to say "My genre is X" instead of offering the same. */
  myGenre?: string;
  onTellMore?: () => void;
  onAcceptGenre?: (name: string) => void;
  /** F6: put the previous My genre back ("" = none). */
  onUndoGenre?: (previous: string) => void;
  onFeedback?: (item: ListenNext, kind: "more_like_this" | "not_for_me") => void;
  /** N1: open a new, unsaved Studio track with these loops at this tempo. */
  onOpenStudio?: (start: StudioStart) => void;
  /** Rendered under the answer (the taste session or genre groups it opened). */
  children?: React.ReactNode;
};

/** Sentences as paragraphs: a new paragraph where the source changes after two sentences or more. */
function paragraphs(list: Sentence[]): Sentence[][] {
  const out: Sentence[][] = [];
  for (const x of list) {
    const cur = out.at(-1);
    if (cur && (cur.length < 2 || cur.at(-1)!.source === x.source) && cur.length < 3) cur.push(x);
    else out.push([x]);
  }
  return out;
}

function Paras({ list, lines }: { list: Sentence[]; lines?: boolean }) {
  const groups = lines ? list.map((x) => [x]) : paragraphs(list);
  return <>{groups.map((p, i) => <p key={i} className={lines ? s.line : s.voice}>{clean(p.map((x) => x.text).join(" "))}</p>)}</>;
}

/** One dim line of sources, no label (clutter review): "Ears' measurements · uploader tag · discogs.com ↗". */
function Sources({ answer, skip }: { answer: MentorAnswer; skip?: ReadonlySet<string> }) {
  // F7: only what this answer's sentences used; web pages by their own domain, once each.
  // Spoken as a person would ("from Ears' measurements · the uploader"); general knowledge is never listed.
  const used = SOURCES.filter((x) => x !== "web" && FROM_WORD[x] && answer.sentences.some((y) => y.source === x));
  const one = new Set(answer.sentences.map((x) => x.source));
  const only = one.size === 1 ? [...one][0] : null;
  if (only && NAMED_IN_TEXT[only] && answer.sentences.every((x) => NAMED_IN_TEXT[only]!.test(x.text)) && !answer.listenNext?.length) return null;
  const pages = answer.sentences.filter((x) => x.source === "web" && x.url && !skip?.has(x.url)).map((x) => x.url!);
  const byDomain = new Map<string, string>();
  for (const u of pages) if (!byDomain.has(shortUrl(u))) byDomain.set(shortUrl(u), u);
  const web = [...byDomain.values()];
  // Picks found on the web: their sites show as domains too (the links themselves are on the picks).
  const pickSites = [...new Set((answer.listenNext ?? []).filter((l) => l.kind !== "search").map((l) => shortUrl(l.url)))].filter((d) => !byDomain.has(d));
  if (!used.length && !web.length && !pickSites.length) return null;
  return (
    <p className={s.from}>
      from {used.map((x) => FROM_WORD[x]).join(" · ")}
      {web.map((u, i) => <span key={u}>{used.length || i ? " · " : ""}<a href={u} target="_blank" rel="noreferrer" title={u}>{shortUrl(u)}<NewTab /></a></span>)}
      {pickSites.map((d, i) => <span key={d}>{used.length || web.length || i ? " · " : ""}{d}</span>)}
    </p>
  );
}

export function Turn({ ask, answer, job, track, studio, dropped, myGenre, onTellMore, onAcceptGenre, onUndoGenre, onFeedback, onOpenStudio, children }: TurnProps) {
  const kind = answer.intent ?? job;
  const start = studio ?? (kind === "studio_start" && track && answer.loops?.length ? studioStart(track, answer.loops) : undefined);
  const teach = kind === "teach" && answer.sentences.some((x) => x.section);
  const help = kind === "help";
  // F6: accepting shows "Set to X · Undo"; Undo puts the previous My genre back. Focus follows.
  const [setFrom, setSetFrom] = useState<string | null>(null);
  const undoRef = useRef<HTMLButtonElement>(null), acceptRef = useRef<HTMLButtonElement>(null);
  const moved = useRef(false);
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    (setFrom !== null ? undoRef : acceptRef).current?.focus();
  }, [setFrom]);
  const genre = kind === "suggest_genre" ? answer.genre : undefined;
  const accept = !!genre && !!onAcceptGenre && setFrom === null && myGenre?.trim().toLowerCase() !== genre.name.trim().toLowerCase();
  const justSet = !!genre && setFrom !== null;
  const more = answer.tellMore && !!onTellMore;
  // Clutter: the key note is dropped when the answer already talks about the key.
  const saysKey = answer.sentences.some((x) => /\bkey\b|\b[A-G](?:#|b)?\s+(?:major|minor)\b/i.test(x.text));
  // Teach: links shown as picks aren't repeated in the source line.
  const shown = new Set((answer.listenNext ?? []).map((l) => l.url));
  const sections = (["what", "sound", "start"] as const).map((sec) => ({ sec, list: answer.sentences.filter((x) => (x.section ?? "what") === sec), pick: answer.listenNext?.find((l) => l.section === sec) }));

  return (
    <article className={s.turn}>
      {ask ? <h3 className={s.ask}>{ask}</h3> : null}
      {teach ? sections.filter((x) => x.list.length).map(({ sec, list, pick }) => (
        <section key={sec} className={s.teachSec}>
          <h4>{SECTION_TITLE[sec]}</h4>
          <Paras list={list} />
          {pick ? <PickLink it={pick} /> : null}
        </section>
      )) : <Paras list={answer.sentences} lines={help || kind === "ear_training"} />}

      {!teach && answer.listenNext?.length ? <Picks items={answer.listenNext} onFeedback={onFeedback} /> : null}
      {/* The computed key note is hidden only when the key is the crate's own and the answer says so. */}
      {start ? <StudioBlock start={start} onOpen={onOpenStudio} hideKeyNote={saysKey && start.key.relation === "same"} /> : null}
      {dropped?.length ? <p className={s.dropped}>Left out {dropped.length} pick{dropped.length > 1 ? "s" : ""}: no clean link found.</p> : null}
      {children}
      {/* One place for the answer's actions: under the answer, before the sources. A genre that is
          already My genre shows nothing (clutter review). */}
      {accept || justSet || more ? (
        <div className={s.actions}>
          {accept ? <button ref={acceptRef} className={s.btn} onClick={() => { moved.current = true; setSetFrom(myGenre ?? ""); onAcceptGenre!(genre!.name); }} title={myGenre ? `Replaces your “${myGenre}”` : undefined}>Use “{genre!.name}” as My genre</button> : null}
          {justSet ? (
            <span className={s.noted} role="status">
              Set to {genre!.name} ·
              <button ref={undoRef} className={s.textBtn} onClick={() => { moved.current = true; onUndoGenre?.(setFrom!); setSetFrom(null); }}>Undo</button>
            </span>
          ) : null}
          {more ? <button className={s.textBtn} onClick={onTellMore}>Tell me more</button> : null}
        </div>
      ) : null}
      {help ? null : <Sources answer={answer} skip={shown} />}
    </article>
  );
}

/** What the link opens when it isn't the track's own page (F4, N4), as a mono suffix after ↗. */
const KIND_WORD: Record<string, string> = { artist: "artist page", playlist: "playlist", chart: "chart", article: "article", search: "search" };
const kindTag = (it: ListenNext) => (it.kind && it.kind !== "track" ? <span className={s.kind}>{KIND_WORD[it.kind]}</span> : null);

function PickLink({ it }: { it: ListenNext }) {
  return (
    <p className={s.listen}>
      <a className={s.itemTitle} href={it.url} target="_blank" rel="noreferrer">Listen: {it.artist} – {it.title}<NewTab />{kindTag(it)}</a>
    </p>
  );
}

/** The reason as a plain sentence: no "because" label, capital first letter, full stop. */
function plain(because: string): string {
  const t = because.replace(/^because\s+/i, "").trim();
  const s1 = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?]$/.test(s1) ? s1 : `${s1}.`;
}

function Picks({ items, onFeedback }: { items: ListenNext[]; onFeedback?: TurnProps["onFeedback"] }) {
  const [fb, setFb] = useState<Record<number, string>>({});
  return (
    <ol className={s.list}>
      {items.map((it, i) => (
        <li key={`${i}-${it.url}`}>
          <span className={s.n}>{i + 1}</span>
          <div>
            <a className={s.itemTitle} href={it.url} target="_blank" rel="noreferrer">{it.artist} – {it.title}<NewTab />{kindTag(it)}</a>
            <p className={s.because}>{plain(it.because)}</p>
            {onFeedback ? (
              // The buttons stay mounted (disabled once used) so focus isn't lost; the note is announced.
              <div className={s.fb}>
                <button className={s.textBtn} disabled={!!fb[i]} aria-pressed={fb[i] === "more"} aria-label={`More like ${it.artist} – ${it.title}`} onClick={() => { onFeedback(it, "more_like_this"); setFb({ ...fb, [i]: "more" }); }}>More like this</button>
                <button className={s.textBtn} disabled={!!fb[i]} aria-pressed={fb[i] === "less"} aria-label={`${it.artist} – ${it.title} is not for me`} onClick={() => { onFeedback(it, "not_for_me"); setFb({ ...fb, [i]: "less" }); }}>Not for me</button>
                <span className={s.noted} role="status">{fb[i] === "more" ? "Noted" : fb[i] === "less" ? "Noted" : ""}</span>
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function StudioBlock({ start, onOpen, hideKeyNote }: { start: StudioStart; onOpen?: (start: StudioStart) => void; hideKeyNote?: boolean }) {
  const loops = start.loops.map((l) => ({ ...l, loop: LOOPS.find((x) => x.id === l.id) })).filter((l) => l.loop);
  return (
    <>
      <dl className={s.studio}>
        <dt>Tempo</dt>
        <dd><span className={s.gold}>{formatBpm(start.bpm)}</span> BPM</dd>
        <dt>Key</dt>
        <dd>{start.key.trackKey} · crate {start.key.crateKey}{hideKeyNote ? null : <><br /><span className={s.by}>{start.key.note}</span></>}</dd>
        <dt>Loops</dt>
        <dd>
          <ul className={s.loops}>
            {loops.map((l) => <li key={l.id}>{l.loop!.name} <span>· {TRACKS[l.loop!.track]}</span></li>)}
          </ul>
        </dd>
      </dl>
      {onOpen ? (
        <div className={s.actions}>
          <button className={s.btn} onClick={() => onOpen(start)} title="Opens a new, unsaved track in the Studio with these loops placed, at this tempo. Your saved tracks stay as they are.">Open as a new Studio track</button>
        </div>
      ) : null}
    </>
  );
}
