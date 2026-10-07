"use client";

import type { Api, NewEntry, NewPbInput } from "@/lib/api";
import { findMovement } from "@/lib/movements";
import { currentPbs, detectPbs, isBetter, pbKey } from "@/lib/pb";
import { weekOf } from "@/lib/summary";
import { type Entry, type ParsedSession, type Pb, type Session, uid } from "@/lib/types";

// Demo mode: realistic sample data for visitors without the access code (e.g. a
// recruiter). Everything lives in this browser tab: nothing is saved and the AI
// isn't called, so the demo costs nothing.

export const DEMO_NOTE =
  "Back squat 5 by 3 at 105. Then snatch, worked up to a new heavy single. WOD was Fran, 4:51, Rx.";

const DEMO_PARSE: ParsedSession = {
  date: null,
  title: "Squat + Fran",
  entries: [
    { movement: "Back Squat", sets: 5, reps: 3, weight: 105, unit: "kg", score: null, rx: null, note: null },
    { movement: "Snatch", sets: null, reps: 1, weight: 77.5, unit: "kg", score: null, rx: null, note: "Heavy single" },
    { movement: "Fran", sets: null, reps: null, weight: null, unit: "kg", score: "4:51", rx: true, note: null },
  ],
};

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const shift = (day: string, n: number) => {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + n);
  return iso(d);
};
const e = (movement: string, o: Partial<Entry> = {}): Entry => ({
  id: uid(), movement, sets: null, reps: null, weight: null, unit: "kg", score: null, rx: null, note: null, ...o,
});

/** Eight weeks of training ending today: one missed week, lifts trending up, Fran done twice. */
export function demoData(today: string): { sessions: Session[]; pbs: Pb[] } {
  const thisMonday = weekOf(today)[0];
  const firstMonday = shift(thisMonday, -7 * 7);
  const pbs: Pb[] = [
    // PBs entered on day one, dated a while back.
    { movement: "Snatch", kind: "load", repMax: 1, value: 70, unit: "kg" },
    { movement: "Clean & Jerk", kind: "load", repMax: 1, value: 90, unit: "kg" },
    { movement: "Back Squat", kind: "load", repMax: 1, value: 120, unit: "kg" },
    { movement: "Deadlift", kind: "load", repMax: 1, value: 160, unit: "kg" },
    { movement: "Fran", kind: "time", repMax: null, value: 340, unit: null, rx: true },
  ].map((p) => ({ rx: null, ...p, id: uid(), achievedOn: shift(firstMonday, -30), sessionId: null }) as Pb);

  const pattern = [[0, 2, 4], [0, 1, 3, 5], [0, 2, 4], [1, 3, 5], [], [0, 1, 3, 5], [0, 2, 3, 5], [0, 2, 4]];
  const sessions: Session[] = [];
  let n = 0;
  pattern.forEach((days, week) => {
    for (const offset of days) {
      const date = shift(firstMonday, week * 7 + offset);
      if (date > today) continue;
      const step = sessions.length;
      // Real training wobbles: some days are heavier, some lighter.
      const wobble = [0, 2.5, -2.5, 0, 2.5][step % 5];
      const kind = n++ % 3;
      const entries =
        kind === 0
          ? [e("Back Squat", { sets: 5, reps: 3, weight: 85 + Math.floor(step / 3) * 2.5 + wobble }), e("WOD", { score: `${12 + (step % 4)}:${String(10 + step * 7 % 50).padStart(2, "0")}`, rx: true, note: "For time: 21-15-9 wall balls, burpees" })]
          : kind === 1
            ? [e("Snatch", { reps: 1, weight: 60 + Math.floor(step / 3) * 2.5 + wobble, note: "Heavy single" }), e("Snatch Pull", { sets: 3, reps: 3, weight: 75 + Math.floor(step / 3) * 2.5 })]
            : [e("Clean & Jerk", { reps: 1, weight: 78 + Math.floor(step / 3) * 2.5 + wobble }), e("Deadlift", { sets: 5, reps: 3, weight: 135 + Math.floor(step / 3) * 2.5 })];
      if (week === 0 && offset === 4) entries.push(e("Fran", { score: "5:32", rx: true }));
      if (week === 6 && offset === 5) entries.push(e("Fran", { score: "4:58", rx: true }));
      const id = uid();
      const title = kind === 0 ? "Squat + metcon" : kind === 1 ? "Snatch day" : "Clean & jerk + pulls";
      for (const found of detectPbs(entries, pbs, date, id)) pbs.push({ ...found.pb, id: uid() });
      sessions.push({ id, date, title, transcript: "", entries: entries.map((x) => ({ ...x, movement: findMovement(x.movement).name })), createdAt: `${date}T18:00:00Z` });
    }
  });
  return { sessions, pbs };
}

/** Same shape as the real API, served from memory. */
export function demoApi(today: string): Api {
  let data = demoData(today);
  const clone = <T,>(x: T) => structuredClone(x);
  const wait = <T,>(x: T, ms = 250) => new Promise<T>((r) => setTimeout(() => r(x), ms));
  const toSession = (id: string, s: { date: string; title: string; transcript: string; entries: NewEntry[] }, createdAt: string): Session => ({
    id, date: s.date, title: s.title.trim() || "Session", transcript: s.transcript, createdAt,
    entries: s.entries.map((x) => ({ ...x, id: uid(), movement: findMovement(x.movement).name })),
  });
  return {
    load: () => wait(clone(data), 150),
    // The pre-made "AI" result always beats the current snatch best, so the celebration shows.
    parse: () => {
      const snatch = [...currentPbs(data.pbs).values()].find((p) => p.movement === "Snatch" && p.repMax === 1);
      const parsed = clone(DEMO_PARSE);
      parsed.entries[1].weight = (snatch?.value ?? 75) + 2.5;
      return wait(parsed, 900);
    },
    saveSession: (s) => {
      const session = toSession(uid(), s, new Date().toISOString());
      const newPbs = detectPbs(session.entries, data.pbs, session.date, session.id).map((n) => ({ ...n, pb: { ...n.pb, id: uid() } }));
      data = { sessions: [...data.sessions, session], pbs: [...data.pbs, ...newPbs.map((n) => n.pb)] };
      return wait(clone({ session, newPbs }));
    },
    updateSession: (id, s) => {
      const old = data.sessions.find((x) => x.id === id);
      const session = toSession(id, s, old?.createdAt ?? new Date().toISOString());
      const others = data.pbs.filter((p) => p.sessionId !== id);
      const newPbs = detectPbs(session.entries, others, session.date, id).map((n) => ({ ...n, pb: { ...n.pb, id: uid() } }));
      data = { sessions: data.sessions.map((x) => (x.id === id ? session : x)), pbs: [...others, ...newPbs.map((n) => n.pb)] };
      return wait(clone({ session, newPbs }));
    },
    deleteSession: (id) => {
      data = { sessions: data.sessions.filter((x) => x.id !== id), pbs: data.pbs.filter((p) => p.sessionId !== id) };
      return wait({ ok: true });
    },
    addPb: (input: NewPbInput) => {
      const pb: Pb = { ...input, id: uid(), movement: findMovement(input.movement).name, sessionId: null };
      const previous = currentPbs(data.pbs).get(pbKey(pb)) ?? null;
      data = { ...data, pbs: [...data.pbs, pb] };
      return wait(clone({ pb, previous, isBest: !previous || isBetter(pb, previous) }));
    },
    deletePb: (id) => {
      data = { ...data, pbs: data.pbs.filter((p) => p.id !== id) };
      return wait({ ok: true });
    },
  };
}
