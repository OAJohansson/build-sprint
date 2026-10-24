"use client";

// One turn of the thread: the question as a small heading, then the answer's sentences with
// footnote markers. Sources have one fixed numbering for the whole panel (1 Ears, 2 Uploader,
// 3 Web, 4 Taste, 5 Library, 6 General; the key sits once at the top of the thread). A marker shows
// its source on hover and, for the web, opens the page; an answer lists only its web pages, under
// marker 3. Job extras: the genre to accept, listen-next picks, teach sections, the Studio start.
import Link from "next/link";
import { useState } from "react";
import type { EarsAnalysis } from "@/lib/ears/results";
import { SOURCES, type ListenNext, type MentorAnswer, type Sentence, type Source, type TeachSection } from "@/lib/mentor/answer";
import { moneyFine } from "@/lib/mentor/client";
import { studioStart, type StudioStart } from "@/lib/mentor/studio";
import { formatBpm } from "@/lib/tempo";
import { LOOPS, TRACKS } from "@/lib/timeline";
import s from "./mentor.module.css";

export const SOURCE_WORD: Record<Source, string> = { ears: "Ears", uploader: "Uploader", web: "Web", profile: "Taste", library: "Library", general: "General" };
const SOURCE_TIP: Record<Source, string> = {
  ears: "Ears: measured in your browser",
  uploader: "Uploader: SoundCloud title and tags",
  web: "Web",
  profile: "Taste: your taste profile",
  library: "Library: your genres and groups in Six AM",
  general: "General knowledge",
};
const ONLY_WORD: Record<Source, string> = { ears: "Ears' measurements", uploader: "the uploader's title and tags", web: "the web", profile: "your taste profile", library: "your genres and groups", general: "general knowledge" };
export const sourceNumber = (x: Source) => SOURCES.indexOf(x) + 1;
const SECTION_TITLE: Record<TeachSection, string> = { what: "What it is", sound: "How it sounds", start: "Where to start" };

/** example.com/path, short. */
export function shortUrl(u: string): string {
  try {
    const url = new URL(u);
    const path = url.pathname.replace(/\/+$/, "");
    return `${url.hostname.replace(/^www\./, "")}${path.length > 24 ? `${path.slice(0, 23)}…` : path}`;
  } catch {
    return u;
  }
}

export type TurnProps = {
  ask?: string;
  answer: MentorAnswer;
  job: string;
  costUsd?: number;
  track: EarsAnalysis | null;
  studio?: StudioStart;
  updatedNote?: string;
  dropped?: string[];
  /** The current My genre of the track, to say "My genre is X" instead of offering the same. */
  myGenre?: string;
  onTellMore?: () => void;
  onAcceptGenre?: (name: string) => void;
  onFeedback?: (item: ListenNext, kind: "more_like_this" | "not_for_me") => void;
  /** N1: open a new, unsaved Studio track with these loops at this tempo. */
  onOpenStudio?: (start: StudioStart) => void;
};

function Marker({ x }: { x: Sentence }) {
  const n = sourceNumber(x.source);
  if (x.source === "web" && x.url) {
    return <sup className={s.sup}><a href={x.url} target="_blank" rel="noreferrer" title={`Web: ${shortUrl(x.url)}`} aria-label={`source ${n}, web: ${shortUrl(x.url)}`}>{n}</a></sup>;
  }
  return <sup className={s.sup} title={SOURCE_TIP[x.source]} aria-label={`source ${n}, ${SOURCE_TIP[x.source]}`}>{n}</sup>;
}

/** `quiet`: every sentence has the same source, shown once at the answer's foot instead. */
function Para({ list, quiet }: { list: Sentence[]; quiet?: boolean }) {
  return <p className={s.voice}>{list.map((x, j) => <span key={j}>{x.text}{quiet ? null : <Marker x={x} />}{j < list.length - 1 ? " " : ""}</span>)}</p>;
}

export function Turn({ ask, answer, job, costUsd, track, studio, updatedNote, dropped, myGenre, onTellMore, onAcceptGenre, onFeedback, onOpenStudio }: TurnProps) {
  const web = [...new Set(answer.sentences.filter((x) => x.source === "web" && x.url).map((x) => x.url!))];
  const start = studio ?? (job === "studio_start" && track && answer.loops?.length ? studioStart(track, answer.loops) : undefined);
  const teach = job === "teach" && answer.sentences.some((x) => x.section);
  // One source for the whole answer (e.g. teach all general): say it once, at the foot.
  const only = new Set(answer.sentences.map((x) => x.source)).size === 1 && answer.sentences[0].source !== "web" ? answer.sentences[0].source : null;
  const sections = (["what", "sound", "start"] as const).map((sec) => ({ sec, list: answer.sentences.filter((x) => (x.section ?? "what") === sec), pick: answer.listenNext?.find((l) => l.section === sec) }));

  return (
    <article className={s.turn}>
      {ask ? <h3 className={s.ask}>{ask}</h3> : null}
      {teach ? sections.filter((x) => x.list.length).map(({ sec, list, pick }) => (
        <section key={sec} className={s.teachSec}>
          <h4>{SECTION_TITLE[sec]}</h4>
          <Para list={list} quiet={!!only} />
          {pick ? <PickLink it={pick} /> : null}
        </section>
      )) : <Para list={answer.sentences} quiet={!!only} />}
      {only ? <p className={s.allFrom}><span className={s.noteN}>{sourceNumber(only)}</span> All from {ONLY_WORD[only]}</p> : null}

      {!teach && answer.listenNext?.length ? <Picks items={answer.listenNext} onFeedback={onFeedback} /> : null}
      {start ? <StudioBlock start={start} onOpen={onOpenStudio} /> : null}
      {dropped?.length ? <p className={s.dropped}>Left out {dropped.length} pick{dropped.length > 1 ? "s" : ""}: no clean link found.</p> : null}

      {web.length ? (
        <p className={s.webRefs}>
          <span className={s.noteN}>{sourceNumber("web")}</span>
          {web.map((u) => <a key={u} href={u} target="_blank" rel="noreferrer" title={u}>{shortUrl(u)} ↗</a>)}
        </p>
      ) : null}
      <div className={s.actions}>
        {job === "suggest_genre" && answer.genre && onAcceptGenre ? <AcceptGenre name={answer.genre.name} current={myGenre} onAccept={onAcceptGenre} /> : null}
        {answer.tellMore && onTellMore ? <button className={s.textBtn} onClick={onTellMore}>Tell me more</button> : null}
        {costUsd != null ? <span className={s.cost} title="Estimate from the tokens and web searches this answer used, at published prices">est. {moneyFine(costUsd)}</span> : null}
      </div>
      {updatedNote ? <p className={s.updated}>{updatedNote} · <Link href="/settings">See My taste</Link></p> : null}
    </article>
  );
}

function AcceptGenre({ name, current, onAccept }: { name: string; current?: string; onAccept: (name: string) => void }) {
  const [done, setDone] = useState(false);
  if (done || current?.trim().toLowerCase() === name.trim().toLowerCase()) return <span className={s.noted}>My genre is {name}</span>;
  return <button className={s.btn} onClick={() => { onAccept(name); setDone(true); }} title={current ? `Replaces your “${current}”` : undefined}>Use “{name}” as My genre</button>;
}

/** What the link opens when it isn't the track's own page (F4, N4), as a mono suffix after ↗. */
const KIND_WORD: Record<string, string> = { artist: "artist page", playlist: "playlist", article: "article" };
const kindTag = (it: ListenNext) => (it.kind && it.kind !== "track" ? <span className={s.kind}>{KIND_WORD[it.kind]}</span> : null);

function PickLink({ it }: { it: ListenNext }) {
  return (
    <p className={s.listen}>
      <a className={s.itemTitle} href={it.url} target="_blank" rel="noreferrer">Listen: {it.artist} – {it.title} <span className={s.arrow}>↗{kindTag(it)}</span></a>
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
            <a className={s.itemTitle} href={it.url} target="_blank" rel="noreferrer">{it.artist} – {it.title} <span className={s.arrow}>↗{kindTag(it)}</span></a>
            <p className={s.because}>{plain(it.because)}</p>
            {onFeedback ? (
              <div className={s.fb}>
                {fb[i] ? <span className={s.noted}>{fb[i]}</span> : (
                  <>
                    <button className={s.textBtn} onClick={() => { onFeedback(it, "more_like_this"); setFb({ ...fb, [i]: "Noted: more like this" }); }}>More like this</button>
                    <button className={s.textBtn} onClick={() => { onFeedback(it, "not_for_me"); setFb({ ...fb, [i]: "Noted: not for you" }); }}>Not for me</button>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function StudioBlock({ start, onOpen }: { start: StudioStart; onOpen?: (start: StudioStart) => void }) {
  const loops = start.loops.map((l) => ({ ...l, loop: LOOPS.find((x) => x.id === l.id) })).filter((l) => l.loop);
  return (
    <>
      <dl className={s.studio}>
        <dt>Tempo</dt>
        <dd><span className={s.gold}>{formatBpm(start.bpm)}</span> BPM</dd>
        <dt>Key</dt>
        <dd>{start.key.trackKey} · crate {start.key.crateKey}<br /><span className={s.by}>{start.key.note}</span></dd>
        <dt>Loops</dt>
        <dd>
          <ul className={s.loops}>
            {loops.map((l) => <li key={l.id}>{l.loop!.name} <span>· {TRACKS[l.loop!.track]}{l.why ? ` · ${l.why}` : ""}</span></li>)}
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
