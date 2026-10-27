"use client";

// The crate along the bottom (S5, 168 px): tabs (My sounds first, then the seven families) and a
// 40 px still disc with what's playing in one header row; 300 px cards. Click a card to hear it;
// drag it onto a lane that takes it.
import { LOOPS, loopById } from "@/lib/timeline";
import { FAMILIES, colorOf, crateLaneType, laneType } from "@/lib/studio-lanes";
import { PART_LANE } from "@/lib/make/lib-loop";
import type { LibrarySound } from "@/lib/make/library";
import type { Timeline } from "./use-timeline";
import { cx } from "./lanes";
import v from "./lanes.module.css";

export type MySounds = { is: "loading" } | { is: "error" } | { is: "ready"; sounds: LibrarySound[] };

/** My sounds by the track they came from, in the order the newest sound of each was saved. */
function bySource(sounds: LibrarySound[]) {
  const groups: { key: string; label: string; title: string; sounds: LibrarySound[] }[] = [];
  for (const x of sounds) {
    const key = x.source?.url ?? "", g = groups.find((y) => y.key === key);
    if (g) g.sounds.push(x);
    else groups.push({ key, label: x.source?.title ? x.source.title.replace(/\s*\[feat\.?\]\s*/i, " feat. ") : "Made in the Lab", title: x.source?.title ?? "", sounds: [x] });
  }
  return groups;
}

export function Crate({ t, mine }: { t: Timeline; mine: MySounds }) {
  const sounds = mine.is === "ready" ? mine.sounds : [];
  const listening = t.previewSound?.id.startsWith("listen-") ? sounds.find((x) => `listen-${x.id}` === t.previewSound!.id) : undefined;
  const loop = t.preview ? loopById(t.preview) : null;
  const deck = loop ? { name: loop.name, bars: loop.bars, color: colorOf(crateLaneType(loop)) }
    : listening ? { name: listening.name, bars: listening.pattern.bars, color: colorOf(PART_LANE[listening.part]) } : null;
  return (
    <aside className={v.crate}>
      <div className={v.crateHead}>
        <div className={v.tabs} role="tablist">
          <button role="tab" aria-selected={t.group === "mine"} className={cx(v.tab, t.group === "mine" && v.tabOn)} onClick={() => t.setGroup("mine")}>
            My sounds{mine.is === "ready" ? <span className={v.tabCount}>{sounds.length}</span> : null}
          </button>
          {FAMILIES.map((f) => <button key={f.id} role="tab" aria-selected={t.group === f.id} className={cx(v.tab, t.group === f.id && v.tabOn)} onClick={() => t.setGroup(f.id)}>{f.name}</button>)}
        </div>
        <div className={v.nowPlaying} style={{ ["--c" as string]: deck?.color }} aria-live="polite">
          <span className={cx(v.disc, deck && v.discOn)} aria-hidden><i /></span>
          {deck ? <span><b>{deck.name}</b> · {deck.bars} {deck.bars === 1 ? "bar" : "bars"}</span> : <span className={v.faint}>Click a sound to hear it</span>}
        </div>
      </div>
      {t.group === "mine" ? (
        mine.is === "loading" ? <p className={v.empty}>Loading your sounds…</p>
          : mine.is === "error" ? <p className={v.empty}>Your sounds couldn&apos;t load. The crate&apos;s own sounds are in the other tabs.</p>
          : !sounds.length ? <p className={v.empty}>No sounds of your own yet. In the Lab, make a sound in the Make room and save it to your library; it shows up here to drag onto a lane.</p>
          : (
            // T110: one header line per source track, then its sounds (name, and part · key · BPM small).
            <div className={cx(v.cards, v.cardsMine)}>
              {bySource(sounds).map((g) => [
                <h3 key={`h-${g.key}`} className={v.groupHead} title={g.title}>{g.label}<span className={v.tabCount}>{g.sounds.length}</span></h3>,
                ...g.sounds.map((x) => (
                  <div key={x.id} className={cx(v.card, v.cardMine, listening?.id === x.id && v.cardOn)} style={{ ["--c" as string]: colorOf(PART_LANE[x.part]) }} title={x.source ? `${x.name}, from ${x.source.title}` : x.name} {...t.crateItem({ kind: "lib", sound: x })}>
                    <div className={v.cardMeta}>
                      <b>{x.name}</b>
                      <span>{laneType(PART_LANE[x.part]).name} · {x.key} {x.scale} · {Math.round(x.bpm)} BPM</span>
                    </div>
                  </div>
                )),
              ])}
            </div>
          )
      ) : (
        <div className={v.cards}>
          {LOOPS.filter((l) => laneType(crateLaneType(l)).family === t.group).map((l) => (
            <div key={l.id} className={cx(v.card, t.preview === l.id && v.cardOn)} style={{ ["--c" as string]: colorOf(crateLaneType(l)) }} {...t.crateItem({ kind: "loop", loop: l })}>
              <div className={v.cardMeta}>
                <b>{l.name}</b>
                <em>{l.vibe}</em>
                <span>{laneType(crateLaneType(l)).name} · {l.bars} {l.bars === 1 ? "bar" : "bars"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
