"use client";

// The app's state: what is in focus, what is open in the card, and the visit history.
// Both the desktop globe and the phone screen render from it; CSS shows one of them.
import { useCallback, useEffect, useMemo, useState } from "react";
import { getThinker } from "@/lib/content";
import { addVisit, type Visit } from "@/lib/visits";
import { useLocalStorage } from "@/lib/use-local-storage";
import { GlobeView } from "./globe-view";
import { PhoneView } from "./phone-view";

export type Nav = {
  focus: string | null;
  thinker: string | null;
  openTheme: number | null;
  threadOpen: boolean;
  visits: Visit[];
  openSchool: (id: string) => void;
  openThinker: (id: string) => void;
  backToSchool: () => void;
  overview: () => void;
  toggleTheme: (i: number) => void;
  toggleThread: () => void;
  closeThread: () => void;
};

const NO_VISITS: Visit[] = [];
const VISITS_KEY = "11-meander:visits";

export function Meander() {
  // shortcut: focus lives in React state, not the URL, so a reload returns to the overview and a school can't be linked; move it to a ?school= search param if linking or back-button support is wanted.
  const [focus, setFocus] = useState<string | null>(null);
  const [thinker, setThinker] = useState<string | null>(null);
  const [openTheme, setOpenTheme] = useState<number | null>(null);
  const [threadOpen, setThreadOpen] = useState(false);
  const [visits, setVisits] = useLocalStorage<Visit[]>(VISITS_KEY, NO_VISITS);

  const record = useCallback(
    (kind: Visit["kind"], id: string) => setVisits((v) => addVisit(Array.isArray(v) ? v : [], kind, id)),
    [setVisits],
  );

  const openSchool = useCallback(
    (id: string) => {
      setFocus(id);
      setThinker(null);
      setOpenTheme(null);
      setThreadOpen(false);
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
      record("thinker", id);
    },
    [focus, record],
  );

  const overview = useCallback(() => {
    setFocus(null);
    setThinker(null);
    setOpenTheme(null);
    setThreadOpen(false);
  }, []);

  const nav: Nav = useMemo(
    () => ({
      focus,
      thinker,
      openTheme,
      threadOpen,
      visits,
      openSchool,
      openThinker,
      overview,
      backToSchool: () => setThinker(null),
      toggleTheme: (i) => setOpenTheme((o) => (o === i ? null : i)),
      toggleThread: () => setThreadOpen((o) => !o),
      closeThread: () => setThreadOpen(false),
    }),
    [focus, thinker, openTheme, threadOpen, visits, openSchool, openThinker, overview],
  );

  // Esc closes the innermost thing: Your thread, then an open theme, then the thinker, then the focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (threadOpen) setThreadOpen(false);
      else if (openTheme !== null && !thinker) setOpenTheme(null);
      else if (thinker) setThinker(null);
      else if (focus) overview();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [threadOpen, openTheme, thinker, focus, overview]);

  return (
    <>
      <GlobeView nav={nav} />
      <PhoneView nav={nav} />
    </>
  );
}
