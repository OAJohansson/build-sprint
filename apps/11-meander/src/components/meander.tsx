"use client";

// The app's state: what is in focus, what is open in the card, and the visit history.
// Both the desktop globe and the phone screen render from it; CSS shows one of them.
import { useCallback, useEffect, useMemo, useState } from "react";
import { getSchool, getThinker, schools } from "@/lib/content";
import { addVisit, type Visit } from "@/lib/visits";
import { seeIdea, stateOf, touchSchool, withHistory, type Progress, type SchoolState } from "@/lib/progress";
import { useLocalStorage } from "@/lib/use-local-storage";
import { GlobeView } from "./globe-view";
import { PhoneView } from "./phone-view";

export type Nav = {
  focus: string | null;
  thinker: string | null;
  openTheme: number | null;
  threadOpen: boolean;
  /** Stepped inside the focused school: the skeleton (knot and first page) instead of the globe and card. */
  inside: boolean;
  /** The idea picked in the skeleton, by theme index. */
  pick: number | null;
  visits: Visit[];
  /** Progress per school (#37), with the old visit history folded in as "started". */
  progress: Progress;
  /** Not started, started or explored, per school id. */
  states: Map<string, SchoolState>;
  openSchool: (id: string) => void;
  openThinker: (id: string) => void;
  backToSchool: () => void;
  overview: () => void;
  toggleTheme: (i: number) => void;
  toggleThread: () => void;
  closeThread: () => void;
  stepInside: () => void;
  /** One level back out of the skeleton: an open idea first, then the skeleton itself. */
  stepBack: () => void;
  /** Straight out of the skeleton, whatever is picked (the phone's Back link). */
  stepOut: () => void;
  togglePick: (i: number) => void;
};

const NO_VISITS: Visit[] = [];
const VISITS_KEY = "11-meander:visits";
const PROGRESS_KEY = "11-meander:progress";
const NO_PROGRESS: Progress = {};
/** Whatever is in storage, as progress (a hand-edited or broken value reads as none). */
const safe = (p: unknown): Progress => (p && typeof p === "object" && !Array.isArray(p) ? (p as Progress) : NO_PROGRESS);
const IDEAS = schools.map((s) => ({ id: s.id, ideas: s.themes.map((t) => t.name) }));

export function Meander() {
  // shortcut: focus lives in React state, not the URL, so a reload returns to the overview and a school can't be linked; move it to a ?school= search param if linking or back-button support is wanted.
  const [focus, setFocus] = useState<string | null>(null);
  const [thinker, setThinker] = useState<string | null>(null);
  const [openTheme, setOpenTheme] = useState<number | null>(null);
  const [threadOpen, setThreadOpen] = useState(false);
  const [inside, setInside] = useState(false);
  const [pick, setPick] = useState<number | null>(null);
  const [stored, setVisits] = useLocalStorage<Visit[]>(VISITS_KEY, NO_VISITS);
  // Visits to schools or thinkers no longer in the content (ids change when the content is re-imported)
  // stay in storage but don't count or show.
  const visits = useMemo(
    () => (Array.isArray(stored) ? stored : NO_VISITS).filter((v) => (v.kind === "school" ? getSchool(v.id) : getThinker(v.id))),
    [stored],
  );

  const [storedProgress, setProgress] = useLocalStorage<Progress>(PROGRESS_KEY, NO_PROGRESS);
  // Schools opened before progress existed count as started (migration); it stays a merge, never a rewrite.
  const progress = useMemo(
    () => withHistory(safe(storedProgress), visits),
    [storedProgress, visits],
  );
  const states = useMemo(() => new Map(IDEAS.map((s) => [s.id, stateOf(progress[s.id], s.ideas)])), [progress]);

  const record = useCallback(
    (kind: Visit["kind"], id: string) => {
      setVisits((v) => addVisit(Array.isArray(v) ? v : [], kind, id));
      if (kind === "school") setProgress((p) => touchSchool(safe(p), id));
    },
    [setVisits, setProgress],
  );
  /** An idea of the focused school was opened: in the skeleton, on the phone, or in the card's themes. */
  const see = useCallback(
    (i: number) => {
      const name = focus ? getSchool(focus)?.themes[i]?.name : undefined;
      if (focus && name) setProgress((p) => seeIdea(safe(p), focus, name));
    },
    [focus, setProgress],
  );

  const openSchool = useCallback(
    (id: string) => {
      setFocus(id);
      setThinker(null);
      setOpenTheme(null);
      setThreadOpen(false);
      setInside(false);
      setPick(null);
      record("school", id);
    },
    [record],
  );

  const openThinker = useCallback(
    (id: string) => {
      const t = getThinker(id);
      if (!t) return;
      if (focus !== t.school) {
        setFocus(t.school);
        setOpenTheme(null);
        record("school", t.school);
      }
      setThinker(id);
      setThreadOpen(false);
      setInside(false);
      setPick(null);
      record("thinker", id);
    },
    [focus, record],
  );

  const overview = useCallback(() => {
    setFocus(null);
    setThinker(null);
    setOpenTheme(null);
    setThreadOpen(false);
    setInside(false);
    setPick(null);
  }, []);

  const stepBack = useCallback(() => {
    if (pick !== null) setPick(null);
    else setInside(false);
  }, [pick]);

  const nav: Nav = useMemo(
    () => ({
      focus,
      thinker,
      openTheme,
      threadOpen,
      inside,
      pick,
      visits,
      progress,
      states,
      openSchool,
      openThinker,
      overview,
      backToSchool: () => setThinker(null),
      toggleTheme: (i) => { if (openTheme !== i) see(i); setOpenTheme(openTheme === i ? null : i); },
      // Your thread opens on the globe, so it steps out of the skeleton first.
      toggleThread: () => { setInside(false); setPick(null); setThreadOpen((o) => !o); },
      closeThread: () => setThreadOpen(false),
      stepInside: () => { if (focus && !thinker) { setThreadOpen(false); setPick(null); setInside(true); } },
      stepBack,
      stepOut: () => { setPick(null); setInside(false); },
      togglePick: (i) => { if (pick !== i) see(i); setPick(pick === i ? null : i); },
    }),
    [focus, thinker, openTheme, threadOpen, inside, pick, visits, progress, states, openSchool, openThinker, overview, stepBack, see],
  );

  // Esc closes the innermost thing: Your thread, then a picked idea, then the skeleton, then an open theme,
  // then the thinker, then the focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (threadOpen) setThreadOpen(false);
      else if (inside) stepBack();
      else if (openTheme !== null && !thinker) setOpenTheme(null);
      else if (thinker) setThinker(null);
      else if (focus) overview();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [threadOpen, inside, stepBack, openTheme, thinker, focus, overview]);

  return (
    <>
      <GlobeView nav={nav} />
      <PhoneView nav={nav} />
    </>
  );
}
