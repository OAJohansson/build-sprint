"use client";

// The app's state: what is in focus, what is open in the card, and the visit history.
// Both the desktop globe and the phone screen render from it; CSS shows one of them.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getField, isFieldId, type Field, type FieldId } from "@/lib/content";
import { addVisit, type Visit } from "@/lib/visits";
import { forField, seeIdea, stateOf, storageKeys, touchSchool, type Progress, type SchoolState } from "@/lib/progress";
import { useLocalStorage } from "@/lib/use-local-storage";
import { GlobeView } from "./globe-view";
import { PhoneView } from "./phone-view";

export type View = "globe" | "timeline";

export type Nav = {
  /** The field on show (phase 4): philosophy or music. Its content, words and progress. */
  field: Field;
  /** Switch field: anything open closes, the view (globe or timeline) stays, and the choice survives a reload. */
  showField: (id: FieldId) => void;
  /** The overview: the globe, or the schools laid out in time (#41). */
  view: View;
  /** Switch view: Your thread and the skeleton close; the open school stays open. */
  showView: (v: View) => void;
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
const NO_PROGRESS: Progress = {};
const FIELD_KEY = "11-meander:field";
/** Whatever is in storage, as progress (a hand-edited or broken value reads as none). */
const safe = (p: unknown): Progress => (p && typeof p === "object" && !Array.isArray(p) ? (p as Progress) : NO_PROGRESS);

export function Meander() {
  // shortcut: focus lives in React state, not the URL, so a reload returns to the overview and a school can't be linked; move it to a ?school= search param if linking or back-button support is wanted.
  const [focus, setFocus] = useState<string | null>(null);
  const [thinker, setThinker] = useState<string | null>(null);
  const [openTheme, setOpenTheme] = useState<number | null>(null);
  const [threadOpen, setThreadOpen] = useState(false);
  const [inside, setInside] = useState(false);
  const [pick, setPick] = useState<number | null>(null);
  // shortcut: the view lives in React state like the focus, so a reload returns to the globe; move both to the URL together.
  const [view, setView] = useState<View>("globe");
  // shortcut: the field is read from localStorage after hydration, so a reload into music shows philosophy for one frame; move it to the URL with the focus and view.
  const [storedField, setStoredField] = useLocalStorage<string>(FIELD_KEY, "philosophy");
  const field = getField(isFieldId(storedField) ? storedField : "philosophy");
  const keys = storageKeys(field.id);
  const { getSchool, getThinker } = field;
  const [stored, setVisits] = useLocalStorage<Visit[]>(keys.visits, NO_VISITS);
  const [storedProgress, setProgress] = useLocalStorage<Progress>(keys.progress, NO_PROGRESS);
  // Only this field's schools and thinkers count: visits to ones no longer in the content (ids change when the content
  // is re-imported) stay in storage but don't count or show. Schools opened before progress existed count as started
  // (migration); it stays a merge, never a rewrite.
  const { visits, progress } = useMemo(
    () => forField({ visits: stored, progress: storedProgress }, { school: (id) => !!getSchool(id), thinker: (id) => !!getThinker(id) }),
    [stored, storedProgress, getSchool, getThinker],
  );
  const states = useMemo(
    () => new Map(field.schools.map((s) => [s.id, stateOf(progress[s.id], s.themes.map((t) => t.name))])),
    [field, progress],
  );

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
    [focus, getSchool, setProgress],
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
    [focus, getThinker, record],
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

  // F6: each field remembers the school last open in it, for this visit (in memory), and reopens it on the way back.
  const lastOpen = useRef<Partial<Record<FieldId, string | null>>>({});
  const showField = useCallback(
    (id: FieldId) => {
      if (id === field.id) return;
      lastOpen.current[field.id] = focus;
      overview();
      setStoredField(id);
      const back = lastOpen.current[id];
      if (back && getField(id).getSchool(back)) setFocus(back);
    },
    [field.id, focus, overview, setStoredField],
  );

  const nav: Nav = useMemo(
    () => ({
      field,
      showField,
      view,
      showView: (v) => { setView(v); setThreadOpen(false); setInside(false); setPick(null); },
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
    [field, showField, view, focus, thinker, openTheme, threadOpen, inside, pick, visits, progress, states, openSchool, openThinker, overview, stepBack, see],
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
