"use client";

// One turn of the thread: the question as a plain mono line, then the answer's sentences with
// footnote markers tight to the word and a legend (number · source word · link). Job extras:
// the genre to accept, listen-next picks (1 2 3, "because…", feedback), the Studio start.
import Link from "next/link";
import { useMemo, useState } from "react";
import type { EarsAnalysis } from "@/lib/ears/results";
import type { ListenNext, MentorAnswer, Sentence, Source } from "@/lib/mentor/answer";
import { moneyFine } from "@/lib/mentor/client";
import { studioStart, type StudioStart } from "@/lib/mentor/studio";
import { formatBpm } from "@/lib/tempo";
import { LOOPS, TRACKS } from "@/lib/timeline";
import s from "./mentor.module.css";

const SOURCE_WORD: Record<Source, string> = { ears: "Ears", uploader: "Uploader", web: "Web", profile: "Taste", general: "General" };
const SOURCE_REF: Record<Exclude<Source, "web">, string> = {
  ears: "measured in your browser",
  uploader: "SoundCloud title and tags",
  profile: "your taste profile",
  general: "general knowledge",
};
const keyOf = (x: Sentence) => (x.source === "web" && x.url ? `web:${x.url}` : x.source);

/** example.com/path, short, for the legend. */
function shortUrl(u: string): string {
  try {
    const url = new URL(u);
    const path = url.pathname.replace(/\/+$/, "");
    return `${url.hostname.replace(/^www\./, "")}${path.length > 28 ? `${path.slice(0, 27)}…` : path}`;
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
  /** The current My genre of the track, to say "already set" instead of offering the same. */
  myGenre?: string;
  onTellMore?: () => void;
  onAcceptGenre?: (name: string) => void;
  onFeedback?: (item: ListenNext, kind: "more_like_this" | "not_for_me") => void;
  onOpenStudio?: (bpm: number) => void;
};

export function Turn({ ask, answer, job, costUsd, track, studio, updatedNote, dropped, myGenre, onTellMore, onAcceptGenre, onFeedback, onOpenStudio }: TurnProps) {
  const notes = useMemo(() => {
    const order: Sentence[] = [];
    for (const x of answer.sentences) if (!order.some((o) => keyOf(o) === keyOf(x))) order.push(x);
    return order;
  }, [answer]);
  const n = (x: Sentence) => notes.findIndex((o) => keyOf(o) === keyOf(x)) + 1;
  // Teach answers are longer: a paragraph every three sentences.
  const paras: Sentence[][] = [];
  answer.sentences.forEach((x, i) => { if (i % 3 === 0) paras.push([]); paras[paras.length - 1].push(x); });
  const start = studio ?? (job === "studio_start" && track && answer.loops?.length ? studioStart(track, answer.loops) : undefined);

  return (
    <article className={s.turn}>
      {ask ? <p className={s.ask}>{ask}</p> : null}
      {paras.map((p, i) => (
        <p key={i} className={s.voice}>
          {p.map((x, j) => (
            <span key={j}>{x.text}<sup className={s.sup} aria-label={`source ${n(x)}`}>{n(x)}</sup>{j < p.length - 1 ? " " : ""}</span>
          ))}
        </p>
      ))}

      {answer.listenNext?.length ? <Picks items={answer.listenNext} onFeedback={onFeedback} /> : null}
      {start ? <StudioBlock start={start} onOpen={onOpenStudio} /> : null}
      {dropped?.length ? <p className={s.dropped}>Left out {dropped.length} suggestion{dropped.length > 1 ? "s" : ""} whose link didn&apos;t check out.</p> : null}

      <div className={s.actions}>
        {job === "suggest_genre" && answer.genre && onAcceptGenre ? <AcceptGenre name={answer.genre.name} current={myGenre} onAccept={onAcceptGenre} /> : null}
        {answer.tellMore && onTellMore ? <button className={s.textBtn} onClick={onTellMore}>Tell me more</button> : null}
        {costUsd != null ? <span className={s.cost} title="Estimate from the tokens and web searches this answer used, at published prices">est. {moneyFine(costUsd)}</span> : null}
      </div>

      <ol className={s.notes} aria-label="Sources">
        {notes.map((x, i) => (
          <li key={keyOf(x)}>
            <span className={s.noteN}>{i + 1}</span>
            <span className={s.noteSrc}>{SOURCE_WORD[x.source]}</span>
            <span className={s.noteRef}>
              {x.source === "web" && x.url ? <a href={x.url} target="_blank" rel="noreferrer" title={x.url}>{shortUrl(x.url)} ↗</a>
                : x.source === "profile" ? <Link href="/settings">{SOURCE_REF.profile}</Link>
                : SOURCE_REF[x.source as Exclude<Source, "web">] ?? ""}
            </span>
          </li>
        ))}
      </ol>
      {updatedNote ? <p className={s.updated}>{updatedNote} · <Link href="/settings">See My taste</Link></p> : null}
    </article>
  );
}

function AcceptGenre({ name, current, onAccept }: { name: string; current?: string; onAccept: (name: string) => void }) {
  const [done, setDone] = useState(false);
  if (done || current?.trim().toLowerCase() === name.trim().toLowerCase()) return <span className={s.noted}>My genre is {name}</span>;
  return <button className={s.btn} onClick={() => { onAccept(name); setDone(true); }} title={current ? `Replaces your “${current}”` : undefined}>Use “{name}” as My genre</button>;
}

function Picks({ items, onFeedback }: { items: ListenNext[]; onFeedback?: TurnProps["onFeedback"] }) {
  const [fb, setFb] = useState<Record<number, string>>({});
  return (
    <ol className={s.list}>
      {items.map((it, i) => (
        <li key={it.url}>
          <span className={s.n}>{i + 1}</span>
          <div>
            <a className={s.itemTitle} href={it.url} target="_blank" rel="noreferrer">{it.artist} – {it.title} <span className={s.arrow}>↗</span></a>
            <p className={s.because}><span>because </span>{it.because.replace(/^because\s+/i, "")}</p>
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

function StudioBlock({ start, onOpen }: { start: StudioStart; onOpen?: (bpm: number) => void }) {
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
          <button className={s.btn} onClick={() => onOpen(start.bpm)} title="Sets the Studio's tempo and opens it; drag the loops in from the crate">Open in Studio at {formatBpm(start.bpm)} BPM</button>
        </div>
      ) : null}
    </>
  );
}
