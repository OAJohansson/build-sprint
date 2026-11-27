"use client";

// Compare with the original (Phase 7 slice 4, R7, L270): one Mine / Original switch on a rebuild.
// Original: the Studio pauses and the Deck window (which plays the song on SoundCloud) seeks to the
// same bar on the map's grid and plays. Mine: the Deck pauses and the Studio plays from the bar the
// Deck reached. Only commands and numbers cross the Deck channel, never audio (C2, W13).
import { useCallback, useEffect, useRef, useState } from "react";
import { DeckRemote, type DeckState } from "@/lib/lab/deck-protocol";
import { mentorApi } from "@/lib/mentor/client";
import { originalMsAt, rebuildBarAt, type Grid, type Rebuild } from "@/lib/rebuild";
import type { Timeline } from "./use-timeline";

export type CompareMode = "mine" | "orig";
/** W10: one switch to Original. deckMsAfter / errMs come from the Deck's landing report (the
 *  position the player gave the moment the seek landed); errFirstPlayMs is the older measure (the
 *  first regular "playing" report, which includes up to ~100 ms of play). */
export type LastSwitch = {
  targetBar: number; targetMs: number; sentAt: number;
  deckMsAfter: number | null; errMs: number | null; reportAfterMs: number | null;
  errFirstPlayMs: number | null; firstPlayAfterMs: number | null;
};
export type Compare = {
  on: true;
  mode: CompareMode;
  /** A Deck playing this song has reported within DECK_GONE_MS. */
  ready: boolean;
  deck: { open: boolean; url: string | null; posMs: number | null; playing: boolean; last: () => DeckState | null };
  lastSwitch: LastSwitch | null;
  /** The bar the original was started from (for "Playing the original from bar N"). */
  fromBar: number | null;
  toOriginal: () => void;
  toMine: () => void;
  /** Move to a bar: on Original the Deck seeks there; on Mine the Studio's playhead moves. */
  seek: (bar: number) => void;
  openDeck: () => void;
};
export type MaybeCompare = Compare | { on: false };
/** What the dev hook shows (window.__sixamRebuild.compare). */
export type CompareHook = Pick<Compare, "mode" | "ready" | "lastSwitch"> & { deck: { open: boolean; url: string | null; posMs: number | null; playing: boolean } };

/** How often "is the Deck still there" is re-checked without a report (it reports every ~100 ms). */
const CHECK_MS = 500;

export function useCompare(t: Timeline, rb: Rebuild | undefined, code: string): MaybeCompare {
  const mapId = rb?.mapId ?? null;
  const bars = t.bars;
  // The map's grid: stored with the rebuild; rebuilds made before slice 4 read it from the map once.
  const [fetched, setFetched] = useState<{ id: string; grid: Grid } | null>(null);
  const grid = rb?.grid ?? (fetched && fetched.id === mapId ? fetched.grid : null);
  useEffect(() => {
    if (!mapId || rb?.grid || !code) return;
    let live = true;
    mentorApi(code).map(mapId).then((m) => { if (live) setFetched({ id: mapId, grid: { bpm: m.bpm, originSec: m.originSec } }); }, () => { /* no grid: Original stays off */ });
    return () => { live = false; };
  }, [mapId, rb?.grid, code]);

  const remote = useRef<DeckRemote | null>(null);
  const [state, setState] = useState<DeckState | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CompareMode>("mine");
  const [fromBar, setFromBar] = useState<number | null>(null);
  const [lastSwitch, setLastSwitch] = useState<LastSwitch | null>(null);
  const pendingSwitch = useRef<LastSwitch | null>(null);
  const lastRef = useRef<DeckState | null>(null);
  const modeRef = useRef<CompareMode>("mine");
  useEffect(() => { modeRef.current = mode; }, [mode]);

  useEffect(() => {
    if (!mapId) return;
    // Reports from a Deck playing another song are ignored (DeckRemote filters by url).
    const r = new DeckRemote(mapId, (s) => {
      // Re-render on a report only while it matters (on Original, or a switch landing), not 10×/s on Mine.
      lastRef.current = s;
      if (modeRef.current === "orig" || pendingSwitch.current) setState(s);
      setOpen(true);
      const p = pendingSwitch.current;
      if (!p) return;
      const after = Math.round(performance.now() - p.sentAt);
      if (s.landed !== undefined) {
        // W10: the landing report answering this switch's seek.
        if (s.landed !== p.targetMs) return;
        const done = { ...p, deckMsAfter: s.pos, errMs: Math.round(s.pos - p.targetMs), reportAfterMs: after };
        pendingSwitch.current = done.errFirstPlayMs === null ? done : null;
        setLastSwitch(done);
      } else if (p.errFirstPlayMs === null && s.playing && after > 150 && Math.abs(s.pos - p.targetMs) < 3000) {
        // The older measure: the first regular report once it plays (a report from before the seek doesn't count).
        const done = { ...p, errFirstPlayMs: Math.round(s.pos - p.targetMs), firstPlayAfterMs: after };
        pendingSwitch.current = done.errMs === null ? done : null;
        setLastSwitch(done);
      }
    });
    remote.current = r;
    const h = setInterval(() => setOpen(r.open), CHECK_MS);
    return () => { clearInterval(h); r.close(); remote.current = null; };
  }, [mapId]);

  const ready = open && !!grid;
  // While Original plays, the playhead follows the Deck's reported position.
  const { jumpTo, setPlaying, playing } = t;
  useEffect(() => {
    if (mode !== "orig" || !state || !grid) return;
    jumpTo(rebuildBarAt(state.pos, grid, bars));
  }, [mode, state, grid, bars, jumpTo]);
  // The Deck went away while on Original: back to Mine, paused (nothing plays by surprise).
  // Pressing the Studio's Play while on Original means Mine: the Deck pauses. (Next tick: no
  // state set inside the effect itself.)
  useEffect(() => {
    if (mode !== "orig" || (open && !playing)) return;
    if (playing) remote.current?.pause();
    const h = setTimeout(() => { setMode("mine"); setFromBar(null); }, 0);
    return () => clearTimeout(h);
  }, [mode, open, playing]);

  const sendSeek = useCallback((bar: number) => {
    if (!grid || !remote.current) return;
    const targetMs = originalMsAt(bar, grid, bars);
    remote.current.seek(targetMs);
    const sw: LastSwitch = { targetBar: Math.round(bar * 1000) / 1000, targetMs, sentAt: performance.now(), deckMsAfter: null, errMs: null, reportAfterMs: null, errFirstPlayMs: null, firstPlayAfterMs: null };
    pendingSwitch.current = sw;
    // A Deck that never answers (an older Deck page) stops being waited for after 10 s.
    setTimeout(() => { if (pendingSwitch.current?.sentAt === sw.sentAt) pendingSwitch.current = null; }, 10_000);
    setLastSwitch(sw);
    setFromBar(Math.floor(bar));
  }, [grid, bars]);

  const toOriginal = useCallback(() => {
    if (!ready || mode === "orig") return;
    const bar = t.playhead;
    setPlaying(false);
    setMode("orig");
    sendSeek(bar);
  }, [ready, mode, t.playhead, setPlaying, sendSeek]);

  const toMine = useCallback(() => {
    if (mode !== "orig") return;
    remote.current?.pause();
    const at = lastRef.current ?? state;
    const bar = at && grid ? rebuildBarAt(at.pos, grid, bars) : t.playhead;
    setMode("mine");
    setFromBar(null);
    jumpTo(bar);
    setPlaying(true);
  }, [mode, state, grid, bars, t.playhead, jumpTo, setPlaying]);

  const seek = useCallback((bar: number) => {
    if (mode === "orig" && ready) { sendSeek(bar); jumpTo(bar); return; }
    jumpTo(bar);
  }, [mode, ready, sendSeek, jumpTo]);

  const openDeck = useCallback(() => { if (mapId) remote.current?.openWindow(mapId); }, [mapId]);

  if (!mapId) return { on: false };
  return {
    on: true, mode, ready, lastSwitch, fromBar,
    // posMs: the last report React saw (live on Original); the dev hook reads the freshest below.
    deck: { open, url: state?.url ?? null, posMs: state ? Math.round(state.pos) : null, playing: !!state?.playing, last: () => lastRef.current },
    toOriginal, toMine, seek, openDeck,
  };
}
