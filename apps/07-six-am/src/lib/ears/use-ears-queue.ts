"use client";

// React glue for the queue (F11, F8): persisted queue + results, and a runner that analyses the
// next queued track whenever the player, listening and the model are all there. After a reload
// the queue waits until listening is enabled again (getDisplayMedia needs a click).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "@/lib/use-local-storage";
import { analyseTrack, TrackError, type TrackStage } from "./analyse-track";
import type { TabCapture } from "./capture";
import type { EarsClient } from "./ears-client";
import { activeItem, EMPTY_QUEUE, nextQueued, queueReducer, sanitiseQueue, type QueueAction, type QueueState, type QueueTrack } from "./queue";
import { withMyGenre } from "./my-genre";
import { QUEUE_KEY, RESULTS_KEY, upsertAnalysis, type EarsAnalysis } from "./results";
import type { Snippet } from "./snippets";
import type { Player } from "./widget";

const NO_RESULTS: EarsAnalysis[] = [];
const iso = () => new Date().toISOString();

export function useEarsQueue({
  player,
  capture,
  ears,
  plan,
}: {
  player: Player | null;
  capture: TabCapture | null;
  ears: EarsClient | null;
  plan?: (durationMs: number, policy?: string) => Snippet[];
}) {
  const [stored, setStored] = useLocalStorage<QueueState>(QUEUE_KEY, EMPTY_QUEUE);
  const [results, setResults] = useLocalStorage<EarsAnalysis[]>(RESULTS_KEY, NO_RESULTS);
  const queue = useMemo(() => sanitiseQueue(stored), [stored]);
  const dispatch = useCallback((a: QueueAction) => setStored((prev) => queueReducer(sanitiseQueue(prev), a)), [setStored]);
  const running = useRef<{ id: string; ac: AbortController } | null>(null);
  const [tick, setTick] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  // After a reload nothing is running: whatever was mid-analysis goes back in line.
  useEffect(() => {
    if (!running.current) dispatch({ type: "restore", now: iso() });
  }, [dispatch]);

  // Listening stopped mid-track: put the track back (it restarts when listening is on again).
  useEffect(() => {
    if (!capture && running.current) running.current.ac.abort(new TrackError("listening-stopped", "Listening stopped."));
  }, [capture]);

  // The runner: one track at a time.
  useEffect(() => {
    if (!player || !capture || !ears || running.current) return;
    const next = nextQueued(queue);
    if (!next || activeItem(queue)) return;
    const ac = new AbortController();
    running.current = { id: next.id, ac };
    const id = next.id;
    dispatch({ type: "start", id, now: iso() });
    const onStage = (s: TrackStage) => {
      if (s.stage === "loaded")
        dispatch({ type: "loaded", id, title: s.sound.title, uploader: s.sound.user?.username, durationMs: s.sound.full_duration ?? s.sound.duration, now: iso() });
      else if (s.stage === "listening")
        dispatch({ type: "listening", id, snippet: s.snippet, of: s.of, seconds: s.seconds, snippetSeconds: s.snippetSeconds, now: iso() });
      else if (s.stage === "analysing") dispatch({ type: "analysing", id, now: iso() });
    };
    analyseTrack({ url: next.url, player, capture, ears, signal: ac.signal, onStage, plan })
      .then((a) => {
        setResults((prev) => upsertAnalysis(Array.isArray(prev) ? prev : [], a));
        dispatch({ type: "done", id, resultId: a.id, now: iso() });
        setLastError(null);
      })
      .catch((e: unknown) => {
        const reason = e instanceof TrackError ? e.reason : null;
        if (reason === "listening-stopped") dispatch({ type: "requeue", id, now: iso() });
        else if (reason) dispatch({ type: "fail", id, reason, message: (e as Error).message, now: iso() });
        else {
          const message = e instanceof Error ? e.message : String(e);
          setLastError(message);
          dispatch({ type: "fail", id, reason: "error", message, now: iso() });
        }
      })
      .finally(() => {
        running.current = null;
        setTick((t) => t + 1); // re-run this effect for the next track
      });
  }, [queue, player, capture, ears, dispatch, setResults, plan, tick]);

  const stopCurrent = useCallback((reason: TrackError) => running.current?.ac.abort(reason), []);

  return {
    queue,
    results: Array.isArray(results) ? results : NO_RESULTS,
    lastError,
    add: useCallback((tracks: QueueTrack[]) => dispatch({ type: "add", tracks, now: iso() }), [dispatch]),
    retry: useCallback((id: string) => dispatch({ type: "retry", id, now: iso() }), [dispatch]),
    /** Cancel the track being analysed (it's marked failed: cancelled); the queue moves on. */
    cancel: useCallback(() => stopCurrent(new TrackError("cancelled", "Cancelled.")), [stopCurrent]),
    remove: useCallback(
      (id: string) => {
        if (running.current?.id === id) stopCurrent(new TrackError("cancelled", "Removed."));
        dispatch({ type: "remove", id });
      },
      [dispatch, stopCurrent],
    ),
    clear: useCallback(() => {
      stopCurrent(new TrackError("cancelled", "Queue cleared."));
      dispatch({ type: "clear" });
    }, [dispatch, stopCurrent]),
    clearResults: useCallback(() => setResults(NO_RESULTS), [setResults]),
    /** The owner's genre for one result (F12); empty clears it. */
    setMyGenre: useCallback((id: string, genre: string) => setResults((prev) => withMyGenre(Array.isArray(prev) ? prev : [], id, genre)), [setResults]),
  };
}
