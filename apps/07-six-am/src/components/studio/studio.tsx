"use client";

// The main screen (design session, 18 Oct): a dark warehouse with Chicago house and disco
// colour. Control bar on top, the timeline in the middle, the crate along the bottom.
// Studio loads my tracks (decision 0020) and autosaves; Session is one open track.
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { demoDoc, TRACKS, type Doc } from "@/lib/timeline";
import type { Track, TrackSummary } from "@/lib/tracks";
import { useLocalStorage } from "@/lib/use-local-storage";
import { useTimeline } from "./use-timeline";
import { TimelineView, cx } from "./timeline";
import { Crate } from "./crate";
import { Library } from "./library";
import { Logo } from "./logo";
import { Notice, Unlock } from "./unlock";
import s from "./studio.module.css";

const COLORS = ["#f2b134", "#ef5b37", "#23b3a5", "#a9c95a"]; // drums, bass, chords, top/FX
const SAVE_AFTER_MS = 700;
const emptyDoc = (): Doc => ({ regions: [], muted: TRACKS.map(() => false) });
const summary = (t: Track): TrackSummary => ({ id: t.id, name: t.name, updatedAt: t.updatedAt });

type Phase = { is: "loading" } | { is: "locked"; error: string | null } | { is: "problem"; text: string } | { is: "ready" };
export type SaveStatus = "saved" | "saving" | "error";

export function Studio() {
  const [code, setCode] = useLocalStorage("07-six-am:code", "");
  const [lastId, setLastId] = useLocalStorage("07-six-am:last", "");
  const client = useMemo(() => api(code), [code]);
  const [phase, setPhase] = useState<Phase>({ is: "loading" });
  const [tracks, setTracks] = useState<TrackSummary[]>([]);
  const [track, setTrack] = useState<Track | null>(null);
  const [status, setStatus] = useState<SaveStatus>("saved");

  // What's waiting to be saved for the open track; flushed shortly after the last change.
  const pending = useRef<{ id: string; name: string; doc: Doc } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const p = pending.current;
    if (!p) return;
    try {
      const saved = await client.save(p.id, p.name, p.doc);
      if (pending.current === p) { pending.current = null; setStatus("saved"); }
      setTracks((list) => [summary(saved), ...list.filter((x) => x.id !== saved.id)]);
    } catch {
      setStatus("error");
    }
  }, [client]);

  const queue = useCallback((name: string, doc: Doc) => {
    if (!track) return;
    pending.current = { id: track.id, name, doc };
    setStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_AFTER_MS);
  }, [track, flush]);

  // Load my tracks; a first visit gets the demo track to start from. The latest call wins.
  const run = useRef(0);
  useEffect(() => {
    const me = ++run.current;
    (async () => {
      try {
        let list = await client.list();
        let open: Track;
        if (!list.length) {
          open = await client.save(crypto.randomUUID(), "My first track", demoDoc());
          list = [summary(open)];
        } else {
          open = await client.get((list.find((x) => x.id === lastId) ?? list[0]).id);
        }
        if (me !== run.current) return;
        setTracks(list);
        setTrack(open);
        setPhase({ is: "ready" });
      } catch (e) {
        if (me !== run.current) return;
        if (e instanceof ApiError && e.status === 401) setPhase({ is: "locked", error: code ? "That code didn't work." : null });
        else setPhase({ is: "problem", text: e instanceof Error ? e.message : "Something went wrong." });
      }
    })();
    // lastId is read once per load on purpose: opening a track shouldn't reload the list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  const openTrack = async (id: string) => {
    if (id === track?.id) return;
    await flush();
    try {
      const next = await client.get(id);
      setTrack(next);
      setLastId(id);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  };

  const newTrack = async () => {
    await flush();
    const n = tracks.filter((x) => /^Untitled track/.test(x.name)).length + 1;
    try {
      const created = await client.save(crypto.randomUUID(), `Untitled track ${n}`, emptyDoc());
      setTracks((list) => [summary(created), ...list]);
      setTrack(created);
      setLastId(created.id);
    } catch {
      setStatus("error");
    }
  };

  const deleteTrack = async (id: string) => {
    try {
      await client.remove(id);
      const rest = tracks.filter((x) => x.id !== id);
      setTracks(rest);
      if (id === track?.id && rest[0]) {
        pending.current = null;
        const next = await client.get(rest[0].id);
        setTrack(next);
        setLastId(next.id);
      }
    } catch {
      setStatus("error");
    }
  };

  if (phase.is === "loading") return <Notice text="Loading your tracks…" />;
  if (phase.is === "locked") return <Unlock error={phase.error} onUnlock={(c) => { setPhase({ is: "loading" }); setCode(c); }} />;
  if (phase.is === "problem" || !track) {
    return <Notice text={phase.is === "problem" ? phase.text : "Something went wrong."} action={{ label: "Try again", onClick: () => location.reload() }} />;
  }
  return (
    <Session
      key={track.id}
      track={track}
      tracks={tracks}
      status={status}
      onChange={queue}
      onRetry={flush}
      onOpen={openTrack}
      onNew={newTrack}
      onDelete={deleteTrack}
    />
  );
}

const Icon = {
  start: <svg viewBox="0 0 16 16" aria-hidden><path d="M3 2h2v12H3zM14 2v12L6 8z" fill="currentColor" /></svg>,
  play: <svg viewBox="0 0 16 16" aria-hidden><path d="M4 2l10 6-10 6z" fill="currentColor" /></svg>,
  pause: <svg viewBox="0 0 16 16" aria-hidden><path d="M3 2h4v12H3zM9 2h4v12H9z" fill="currentColor" /></svg>,
  undo: <svg viewBox="0 0 16 16" aria-hidden><path d="M6 3 2 7l4 4V8h4a3 3 0 0 1 0 6H8v2h2a5 5 0 0 0 0-10H6z" fill="currentColor" /></svg>,
};

function Session({ track, tracks, status, onChange, onRetry, onOpen, onNew, onDelete }: {
  track: Track; tracks: TrackSummary[]; status: SaveStatus;
  /** Save this track as it is now: its name and its whole arrangement. */
  onChange: (name: string, doc: Doc) => void; onRetry: () => void;
  onOpen: (id: string) => void; onNew: () => void; onDelete: (id: string) => void;
}) {
  const t = useTimeline(track.doc);
  const [name, setName] = useState(track.name);
  const savedName = useRef(track.name);
  const [library, setLibrary] = useState(false);

  // Every edit (and undo) is saved; the track as loaded is already saved.
  const changed = useEffectEvent((doc: Doc) => { if (doc !== track.doc) onChange(savedName.current, doc); });
  useEffect(() => { changed(t.doc); }, [t.doc]);

  const commitName = () => {
    const clean = name.trim().slice(0, 80);
    if (!clean) { setName(savedName.current); return; }
    if (clean === savedName.current) return;
    savedName.current = clean;
    setName(clean);
    onChange(clean, t.doc);
  };

  return (
    <div className={s.root}>
      <header className={s.bar}>
        <div className={s.logo}><Logo className={s.mark} />Six AM</div>
        <div className={s.trackBox}>
          <input
            className={s.trackTitle}
            value={name}
            size={Math.max(8, name.length + 1)}
            maxLength={80}
            aria-label="Track name"
            spellCheck={false}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); e.stopPropagation(); }}
          />
          <button className={s.libBtn} onClick={() => setLibrary((v) => !v)} aria-expanded={library}>
            My tracks <ChevronDown aria-hidden />
          </button>
          {status === "error" ? (
            <button className={cx(s.saveState, s.saveError)} onClick={onRetry}>Not saved · Retry</button>
          ) : (
            <span className={s.saveState} aria-live="polite">{status === "saving" ? "Saving…" : "Saved"}</span>
          )}
          {library ? (
            <Library
              tracks={tracks}
              currentId={track.id}
              onOpen={(id) => { setLibrary(false); onOpen(id); }}
              onNew={() => { setLibrary(false); onNew(); }}
              onDelete={onDelete}
              onClose={() => setLibrary(false)}
            />
          ) : null}
        </div>
        <div className={s.transport}>
          <button className={s.tb} onClick={() => t.jumpTo(1)} aria-label="Back to start">{Icon.start}</button>
          <button className={cx(s.tb, s.play)} onClick={() => t.setPlaying(!t.playing)} aria-label={t.playing ? "Pause" : "Play"}>{t.playing ? Icon.pause : Icon.play}</button>
          <div className={s.lcd}><b>{t.bar}.{t.beat}</b><small>bar</small><b>124</b><small>bpm</small></div>
          <button className={s.undo} onClick={t.undo} disabled={!t.canUndo}>{Icon.undo} Undo</button>
          <div className={s.knobWrap}>
            Filter
            <div className={s.knob} {...t.knob} role="slider" aria-label="Filter" aria-valuenow={Math.round(t.filter * 100)} style={{ ["--a" as string]: `${-135 + t.filter * 270}deg` }} />
          </div>
        </div>
      </header>
      <main className={s.main}>
        <TimelineView t={t} colors={COLORS} />
      </main>
      <Crate t={t} colors={COLORS} />
      {t.bin ? (
        <div className={s.binZone}>
          <div data-bin className={cx(s.bin, t.bin.over && s.binOver)}>
            <Trash2 aria-hidden />
            <span>{t.bin.over ? "Let go to remove" : "Drop here to remove"}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
