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
import { clampBpm, DEFAULT_BPM, formatBpm, TEMPO_KEY } from "@/lib/tempo";
import { STUDIO_DRAFT_KEY, type StudioDraft } from "@/lib/mentor/studio";
import { mentorApi, useAccessCode } from "@/lib/mentor/client";
import { FAMILIES, colorOf, laneType, type LaneType } from "@/lib/studio-lanes";
import v from "./lanes.module.css";
import { parseDoc } from "@/lib/tracks";
import { autosave } from "@/lib/autosave";
import { SettingsLink, ViewsNav } from "@/components/views-nav";
import { useTimeline } from "./use-timeline";
import { LanesView, cx } from "./lanes";
import { Crate, type MySounds } from "./crate";
import { SoundDrawer } from "./sound-drawer";
import { LibDrawer } from "./lib-drawer";
import { Library } from "./library";
import { Logo } from "./logo";
import { Notice, Unlock } from "./unlock";
import s from "./studio.module.css";

const familyId = (t: LaneType) => laneType(t).family;
/** The sound drawer's colour per old lane (drums, bass, chords): its family's. */
const COLORS = [FAMILIES[0].color, FAMILIES[1].color, FAMILIES[2].color, FAMILIES[5].color];
const SAVE_AFTER_MS = 700;
const LEAVE_DRAFT = "This Mentor draft isn't saved. Leave it?";
const emptyDoc = (): Doc => ({ regions: [], muted: TRACKS.map(() => false) });
const summary = (t: Track): TrackSummary => ({ id: t.id, name: t.name, updatedAt: t.updatedAt });

type Phase = { is: "loading" } | { is: "locked"; error: string | null } | { is: "problem"; text: string } | { is: "ready" };
export type SaveStatus = "saved" | "saving" | "error";

export function Studio() {
  const [code, setCode, ready] = useAccessCode();
  const [lastId, setLastId] = useLocalStorage("07-six-am:last", "");
  const client = useMemo(() => api(code), [code]);
  const [phase, setPhase] = useState<Phase>({ is: "loading" });
  const [tracks, setTracks] = useState<TrackSummary[]>([]);
  const [track, setTrack] = useState<Track | null>(null);
  const [status, setStatus] = useState<SaveStatus>("saved");
  /** N1: a Mentor starting point, open as a new track that isn't saved until the owner saves it.
   *  It has its own tempo, so the device tempo (and the saved tracks) stay as they were. */
  const [draft, setDraft] = useState<{ bpm: number } | null>(null);
  const [, setDeviceBpm] = useLocalStorage<number>(TEMPO_KEY, DEFAULT_BPM);

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
    // N14: no request until the stored code has been read, and none without a code.
    if (!ready || !code) return;
    const me = ++run.current;
    (async () => {
      try {
        // One request for the list and the track to open (the last one, else the newest): the first
        // load used to wait for the list, then fetch the track.
        const first = await client.listAndOpen(lastId);
        let list = first.tracks;
        let open: Track;
        // A starting point handed over from the Mentor opens as a new, unsaved track (read once).
        let handed: StudioDraft | null = null;
        try {
          const raw = localStorage.getItem(STUDIO_DRAFT_KEY);
          const d = raw ? (JSON.parse(raw) as StudioDraft) : null;
          if (d && parseDoc(d.doc) && Date.now() - Date.parse(d.at) < 10 * 60_000) handed = d;
        } catch { /* no draft */ }
        if (handed) {
          // Removed only by the load that opens it (a dev double-run must not lose it).
          if (me !== run.current) return;
          try { localStorage.removeItem(STUDIO_DRAFT_KEY); } catch { /* storage blocked */ }
          setTracks(list);
          setTrack({ id: crypto.randomUUID(), name: handed.name.slice(0, 80), doc: parseDoc(handed.doc)!, updatedAt: handed.at });
          setDraft({ bpm: clampBpm(handed.bpm) });
          setPhase({ is: "ready" });
          return;
        }
        if (!list.length) {
          open = await client.save(crypto.randomUUID(), "My first track", demoDoc());
          list = [summary(open)];
        } else {
          open = first.track ?? await client.get((list.find((x) => x.id === lastId) ?? list[0]).id);
        }
        if (me !== run.current) return;
        setTracks(list);
        setTrack(open);
        // A re-run of this load (e.g. the access code changing) opens a saved track: it is no draft.
        setDraft(null);
        setPhase({ is: "ready" });
      } catch (e) {
        if (me !== run.current) return;
        if (e instanceof ApiError && e.status === 401) setPhase({ is: "locked", error: code ? "That code didn't work." : null });
        else setPhase({ is: "problem", text: e instanceof Error ? e.message : "Something went wrong." });
      }
    })();
    // lastId is read once per load on purpose: opening a track shouldn't reload the list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, ready]);

  // N10: an unsaved draft is lost on leaving, so ask first (closing the tab, links, other tracks).
  useEffect(() => {
    if (!draft) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [draft]);
  const leaveDraft = () => !draft || window.confirm(LEAVE_DRAFT);

  /** Save the draft as a new track; from then on it autosaves like any other, and its tempo
   *  becomes the device tempo (one tempo per device, see Session). */
  const saveDraft = async (name: string, doc: Doc) => {
    if (!track || !draft) return;
    setStatus("saving");
    try {
      const saved = await client.save(track.id, name, doc);
      // A template keeps its own tempo in the doc (S2); a Mentor draft sets the device tempo.
      if (doc.bpm === undefined) setDeviceBpm(draft.bpm);
      setDraft(null);
      setTrack(saved);
      setLastId(saved.id);
      setTracks((list) => [summary(saved), ...list.filter((x) => x.id !== saved.id)]);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  };

  const openTrack = async (id: string) => {
    if (id === track?.id) return;
    if (!leaveDraft()) return;
    setDraft(null);
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
    if (!leaveDraft()) return;
    setDraft(null);
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

  if (ready && !code) return <Unlock error={null} onUnlock={(c) => { setPhase({ is: "loading" }); setCode(c); }} />;
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
      draft={draft}
      onSaveDraft={saveDraft}
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

function Session({ track, tracks, status, draft, onSaveDraft, onChange, onRetry, onOpen, onNew, onDelete }: {
  track: Track; tracks: TrackSummary[]; status: SaveStatus;
  /** An unsaved starting point from the Mentor: its own tempo, no autosave until saved. */
  draft: { bpm: number } | null; onSaveDraft: (name: string, doc: Doc) => void;
  /** Save this track as it is now: its name and its whole arrangement. */
  onChange: (name: string, doc: Doc) => void; onRetry: () => void;
  onOpen: (id: string) => void; onNew: () => void; onDelete: (id: string) => void;
}) {
  // The project tempo (F10): set from Analyse ("Set Studio to N BPM"), stored on this device.
  // shortcut: one tempo per device (localStorage), not saved with each track; move it into Doc
  // (and the Supabase track) when tracks need their own tempo.
  const [storedBpm] = useLocalStorage<number>(TEMPO_KEY, DEFAULT_BPM);
  // A template track (S2) carries its own tempo; older tracks use the device tempo.
  const bpm = draft ? draft.bpm : track.doc.bpm !== undefined ? clampBpm(track.doc.bpm) : clampBpm(storedBpm);
  // D1: every track opens at bar 1 (it used to open saved tracks at the demo's mid-song bar 37).
  const t = useTimeline(track.doc, bpm, 1);
  const [name, setName] = useState(track.name);
  const savedName = useRef(track.name);
  const [library, setLibrary] = useState(false);
  const [code] = useAccessCode();
  useEffect(() => { t.engine().then((e) => e.setAccessCode(code)); }, [t, code]);
  // My sounds (L158, L200): the library, newest first, for the crate's first tab.
  const [mine, setMine] = useState<MySounds>({ is: "loading" });
  useEffect(() => {
    let live = true;
    mentorApi(code).sounds().then((sounds) => { if (live) setMine({ is: "ready", sounds }); }).catch(() => { if (live) setMine({ is: "error" }); });
    return () => { live = false; };
  }, [code]);
  // The sound drawer (S3): adding to a lane (its ⋯ menu's "New sound…"), or editing the selected block's sound.
  const [addLane, setAddLane] = useState<number | null>(null);
  const selRegion = t.doc.regions.find((r) => r.id === t.selected);
  const selSound = selRegion ? t.doc.sounds?.find((x) => x.id === selRegion.loopId) ?? null : null;
  const drawerLane = selSound ? selSound.lane : addLane;
  const selLane = selRegion ? t.laneOf(selRegion) : undefined;
  const drawerLaneObj = selLane ?? t.lanes.find((l) => l.id === t.soundTarget);
  const closeDrawer = () => { setAddLane(null); t.setSoundTarget(null); t.setSelected(null); };

  // Every edit and undo is saved. S5-1: compare with the doc last sent (at first, the track as
  // loaded), not with the loaded doc: an undo back to the opening state restores that very object
  // and used to be skipped, so the undone edit stayed saved (bug since 19 Oct, 0a25c59).
  const [saver] = useState(() => autosave(track.doc));
  const changed = useEffectEvent((doc: Doc) => {
    if (!saver.change(doc, !!draft)) return;
    // The debounced save in Studio keeps only the latest doc, as saver.flush() would.
    onChange(savedName.current, saver.flush()!);
  });
  useEffect(() => { changed(t.doc); }, [t.doc]);

  const commitName = () => {
    const clean = name.trim().slice(0, 80);
    if (!clean) { setName(savedName.current); return; }
    if (clean === savedName.current) return;
    savedName.current = clean;
    setName(clean);
    if (!draft) onChange(clean, t.doc);
  };

  return (
    <div className={s.root}>
      <header
        className={s.bar}
        // N10: the views and Settings links leave the page; a draft asks first.
        onClickCapture={(e) => { if (draft && (e.target as HTMLElement).closest("a[href]") && !window.confirm(LEAVE_DRAFT)) e.preventDefault(); }}
      >
        <div className={s.logo}><Logo className={s.mark} />Six AM</div>
        <ViewsNav current="studio" />
        <div className={s.trackBox}>
          <input
            className={s.trackTitle}
            value={name}
            // F3: a long draft name is capped and ends in an ellipsis; the full name is the tooltip.
            size={Math.min(Math.max(8, name.length + 1), 40)}
            title={name}
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
          {draft ? (
            // The gold "Save track" alone says it isn't saved yet (N9: no "Not saved ·" beside it).
            <button className={s.saveDraft} onClick={() => onSaveDraft(savedName.current, t.doc)} title="A starting point from the Mentor. It isn't saved until you press this.">Save track</button>
          ) : status === "error" ? (
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
          {/* L200: one 13 px line; a track without its own key plays synths in A minor (the crate's key). */}
          <div className={v.facts} aria-live="off">
            bar <b>{t.bar}.{t.beat}</b> · <span title={bpm === DEFAULT_BPM ? undefined : `Set from Analyse; the Studio's default is ${DEFAULT_BPM}`}>{formatBpm(bpm)} bpm</span> · {track.doc.key
              ? <span>{track.doc.key.key}{track.doc.key.scale === "minor" ? "m" : ""}</span>
              : <span title="No key set: synths play in A minor, the crate's key">Am</span>}
          </div>
          <button className={s.undo} onClick={t.undo} disabled={!t.canUndo} aria-label="Undo">{Icon.undo} <span className={s.undoWord}>Undo</span></button>
        </div>
        <SettingsLink />
      </header>
      <LanesView t={t} onNewSound={(l) => { t.setSelected(null); t.setSoundTarget(l.id); setAddLane([0, 1, 2, 2, 3, 3, 3][FAMILIES.findIndex((f) => f.id === familyId(l.type))]); }} />
      {selSound?.source === "lib" ? (
        <LibDrawer key={selSound.id} t={t} sound={selSound} color={colorOf(selSound.type)} onClose={closeDrawer} />
      ) : drawerLane !== null ? (
        <SoundDrawer key={drawerLane} t={t} lane={drawerLane} sound={selSound} color={drawerLaneObj ? colorOf(drawerLaneObj.type) : COLORS[drawerLane]} onClose={closeDrawer}
          onNewSound={() => { setAddLane(drawerLane); t.setSelected(null); }} />
      ) : (
        <Crate t={t} mine={mine} />
      )}
      {t.toast ? (
        <div className={v.toast} role="status">
          <span>{t.toast}</span>
          <button onClick={t.undoToast}>Undo</button>
        </div>
      ) : null}
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
