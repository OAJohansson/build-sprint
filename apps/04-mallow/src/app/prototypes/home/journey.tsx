"use client";

import { useState } from "react";
import {
  TODAY,
  addDays,
  amountLabel,
  appointments,
  daysBetween,
  doctor,
  fmt,
  gradeWord,
  long,
  periodStats,
  reliefOptions,
  reliefPhrase,
  short,
  symptomById,
  trendWord,
  type Day,
} from "./data";
import { Chips, GradeMark, Muted } from "./shared";
import { chaptersOf, lastOf, type Store } from "./store";
import { SummarySheet } from "./summary";

// Journey: everything Sam has logged. Three directions for the history itself; the summary card
// for the appointment sits on top in all of them.

export type JourneyKind = "timeline" | "calendar" | "chapters";

export function Journey({ store, kind }: { store: Store; kind: JourneyKind }) {
  const [summaryOpen, setSummaryOpen] = useState(false);
  const all = allDays(store);
  const empty = all.every((d) => !d.logged && d.doses.length === 0);
  const now = periodStats(chaptersOf(store).at(-1)?.days ?? [], store.tracked);

  return (
    <main className="mx-auto w-full max-w-[440px] px-5 pb-36 pt-[calc(env(safe-area-inset-top)+var(--top-gap))]">
      <h1 className="serif text-[2rem] leading-tight">Journey</h1>

      <button
        onClick={() => setSummaryOpen(true)}
        className="press mt-5 flex w-full items-center justify-between gap-3 rounded-2xl p-4 text-left"
        style={{ background: "var(--mallow-wash)" }}
      >
        <span>
          <span className="block font-medium">For {doctor}</span>
          <span className="tnum block text-sm" style={{ color: "var(--ink-soft)" }}>
            Since {short(lastOf(store))} · {now.logged} days logged
          </span>
        </span>
        <span className="text-sm font-medium" style={{ color: "var(--mallow-deep)" }}>
          Summary ›
        </span>
      </button>

      {empty ? (
        <Muted className="mt-10 text-center">Your days will appear here as you log them.</Muted>
      ) : kind === "timeline" ? (
        <Timeline store={store} days={all} />
      ) : kind === "calendar" ? (
        <Calendar store={store} days={all} />
      ) : (
        <Chapters store={store} />
      )}

      <SummarySheet store={store} open={summaryOpen} onClose={() => setSummaryOpen(false)} />
    </main>
  );
}

const allDays = (s: Store) => [...s.days, ...(s.today.logged || s.today.doses.length ? [s.today] : [])];
const medOf = (s: Store, id: string) => s.meds.find((m) => m.id === id);
const dayLabel = (d: string) => (d === TODAY ? "Today" : daysBetween(d, TODAY) === 1 ? "Yesterday" : long(d));

// ---------- Shared day pieces ----------

function DayDetail({ store, day }: { store: Store; day: Day }) {
  return (
    <div className="enter mt-3 space-y-3 text-sm">
      {day.logged && (
        <ul className="space-y-1">
          {store.tracked.map(symptomById).map((s) => (
            <li key={s.id} className="flex items-center justify-between">
              <span style={{ color: "var(--ink-soft)" }}>{s.name}</span>
              <span className="flex items-center gap-2">
                {day.grades[s.id] !== undefined ? s.grades[day.grades[s.id]][0] : "–"}
                <GradeMark level={day.grades[s.id]} />
              </span>
            </li>
          ))}
        </ul>
      )}
      {day.doses.length > 0 && (
        <ul className="space-y-1">
          {day.doses.map((d, i) => {
            const m = medOf(store, d.med);
            return (
              <li key={i} className="flex justify-between gap-3">
                <span>
                  <span className="tnum" style={{ color: "var(--ink-faint)" }}>
                    {d.time}
                  </span>{" "}
                  {m ? `${amountLabel(m, d.amount)} ${m.name}` : "Dose"}
                </span>
                <span style={{ color: "var(--ink-soft)" }}>{d.relief !== undefined ? reliefPhrase[d.relief] : "Not rated"}</span>
              </li>
            );
          })}
        </ul>
      )}
      {day.side.length > 0 && <p style={{ color: "var(--ink-soft)" }}>{day.side.join(", ")}</p>}
      {day.note && <p className="serif italic">“{day.note}”</p>}
    </div>
  );
}

function DayRow({ store, day }: { store: Store; day: Day }) {
  const [open, setOpen] = useState(false);
  if (!day.logged && day.doses.length === 0)
    return (
      <li className="py-2 text-sm" style={{ color: "var(--ink-faint)", borderColor: "var(--line)" }}>
        {dayLabel(day.date)} · not logged
      </li>
    );
  const helped = day.doses.filter((d) => d.relief !== undefined);
  const best = helped.length ? Math.max(...helped.map((d) => d.relief!)) : undefined;
  return (
    <li style={{ borderColor: "var(--line)" }}>
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="press w-full py-3 text-left">
        <span className="flex items-baseline justify-between gap-3">
          <span className="font-medium">{dayLabel(day.date)}</span>
          <span className="tnum text-xs" style={{ color: "var(--ink-faint)" }}>
            {day.doses.length} {day.doses.length === 1 ? "dose" : "doses"}
            {best !== undefined ? ` · up to “${reliefOptions[best].toLowerCase()}”` : ""}
          </span>
        </span>
        {day.logged && (
          <span className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: "var(--ink-soft)" }}>
            {store.tracked.map(symptomById).map((s) => (
              <span key={s.id} className="flex items-center gap-1.5">
                {s.name} <GradeMark level={day.grades[s.id]} />
              </span>
            ))}
          </span>
        )}
        {day.note && !open && (
          <span className="serif mt-1 block truncate text-sm italic" style={{ color: "var(--ink-soft)" }}>
            “{day.note}”
          </span>
        )}
      </button>
      {open && (
        <div className="pb-3">
          <DayDetail store={store} day={day} />
        </div>
      )}
    </li>
  );
}

// ---------- 1. Timeline: days, newest first, grouped by week ----------

function Timeline({ store, days }: { store: Store; days: Day[] }) {
  const weeks = new Map<string, Day[]>();
  for (const d of [...days].reverse()) {
    const dow = (new Date(`${d.date}T00:00:00Z`).getUTCDay() + 6) % 7;
    const monday = addDays(d.date, -dow);
    weeks.set(monday, [...(weeks.get(monday) ?? []), d]);
  }
  const thisMonday = addDays(TODAY, -((new Date(`${TODAY}T00:00:00Z`).getUTCDay() + 6) % 7));
  const appts = new Set([...store.past, ...appointments]);

  return (
    <div className="mt-8 space-y-8">
      {[...weeks].map(([monday, list]) => (
        <section key={monday}>
          <h2 className="text-sm font-medium" style={{ color: "var(--ink-soft)" }}>
            {monday === thisMonday ? "This week" : monday === addDays(thisMonday, -7) ? "Last week" : `Week of ${short(monday)}`}
          </h2>
          <ul className="mt-1 divide-y" style={{ borderColor: "var(--line)" }}>
            {list.map((d) => (
              <FragmentWithAppointment key={d.date} isAppt={appts.has(d.date)}>
                <DayRow store={store} day={d} />
              </FragmentWithAppointment>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function FragmentWithAppointment({ isAppt, children }: { isAppt: boolean; children: React.ReactNode }) {
  return (
    <>
      {children}
      {isAppt && (
        <li className="flex items-center gap-2 py-2 text-xs font-medium" style={{ color: "var(--leaf-deep)", borderColor: "var(--line)" }}>
          <span className="size-2 rounded-full" style={{ background: "var(--leaf)" }} /> Appointment with {doctor}
        </li>
      )}
    </>
  );
}

// ---------- 2. Calendar: a month at a glance, one symptom at a time ----------

const shade = ["var(--mallow-wash)", "color-mix(in oklch, var(--mallow) 22%, white)", "color-mix(in oklch, var(--mallow) 55%, white)", "var(--mallow-deep)"];

function Calendar({ store, days }: { store: Store; days: Day[] }) {
  const months = [...new Set(days.map((d) => d.date.slice(0, 7)))];
  const [mi, setMi] = useState(months.length - 1);
  const [sym, setSym] = useState(store.tracked[0]);
  const [picked, setPicked] = useState<string>(days.at(-1)!.date);
  const s = symptomById(sym);
  const month = months[mi];
  const first = `${month}-01`;
  const lead = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;
  const len = new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7), 0)).getUTCDate();
  const byDate = new Map(days.map((d) => [d.date, d]));
  const appts = new Set(store.past);
  if (store.next) appts.add(store.next);
  const pickedDay = byDate.get(picked);

  return (
    <div className="mt-6">
      <Chips options={store.tracked.map((id) => symptomById(id).name)} value={[s.name]} onToggle={(n) => setSym(store.tracked.find((id) => symptomById(id).name === n)!)} />

      <div className="mt-5 flex items-center justify-between">
        <MonthArrow label="Previous month" disabled={mi === 0} onClick={() => setMi(mi - 1)}>
          ‹
        </MonthArrow>
        <h2 className="serif text-lg">{fmt(first, { month: "long", year: "numeric" })}</h2>
        <MonthArrow label="Next month" disabled={mi === months.length - 1} onClick={() => setMi(mi + 1)}>
          ›
        </MonthArrow>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs" style={{ color: "var(--ink-faint)" }}>
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: lead }, (_, i) => (
          <span key={`l${i}`} />
        ))}
        {Array.from({ length: len }, (_, i) => {
          const date = `${month}-${String(i + 1).padStart(2, "0")}`;
          const d = byDate.get(date);
          const g = d?.logged ? d.grades[sym] : undefined;
          const future = date > TODAY;
          return (
            <button
              key={date}
              disabled={!d}
              onClick={() => setPicked(date)}
              aria-label={`${long(date)}${g !== undefined ? `, ${s.name.toLowerCase()} ${s.grades[g][0].toLowerCase()}` : ""}`}
              className="press relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm tabular-nums"
              style={{
                background: g !== undefined ? shade[g] : "transparent",
                color: g === 3 ? "#fff" : future || !d?.logged ? "var(--ink-faint)" : "var(--ink)",
                outline: picked === date ? "2px solid var(--ink)" : date === TODAY ? "1.5px solid var(--mallow)" : undefined,
                outlineOffset: 1,
              }}
            >
              {i + 1}
              {appts.has(date) && <span className="absolute bottom-1 size-1.5 rounded-full" style={{ background: "var(--leaf)" }} />}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: "var(--ink-soft)" }}>
        {s.grades.map(([w], g) => (
          <span key={w} className="flex items-center gap-1.5">
            <span className="size-3 rounded" style={{ background: shade[g], border: g === 0 ? "1px solid var(--line)" : undefined }} /> {w}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full" style={{ background: "var(--leaf)" }} /> Appointment
        </span>
      </div>

      {pickedDay && (
        <section key={picked} className="mt-6 rounded-2xl border bg-white p-4" style={{ borderColor: "var(--line)" }}>
          <h3 className="font-medium">{dayLabel(picked)}</h3>
          {pickedDay.logged || pickedDay.doses.length ? <DayDetail store={store} day={pickedDay} /> : <Muted className="mt-1">Not logged</Muted>}
        </section>
      )}
    </div>
  );
}

function MonthArrow({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label} className="press size-11 rounded-full text-2xl disabled:opacity-20" style={{ color: "var(--ink-soft)" }}>
      {children}
    </button>
  );
}

// ---------- 3. Chapters: each stretch between appointments, with how it went ----------

function Chapters({ store }: { store: Store }) {
  const chapters = chaptersOf(store);
  return (
    <div className="mt-8 space-y-4">
      {[...chapters].reverse().map((c) => {
        const prev = chapters[c.n - 2];
        return <ChapterCard key={c.from} store={store} chapter={c} prev={prev} />;
      })}
    </div>
  );
}

function ChapterCard({
  store,
  chapter,
  prev,
}: {
  store: Store;
  chapter: ReturnType<typeof chaptersOf>[number];
  prev?: ReturnType<typeof chaptersOf>[number];
}) {
  const [open, setOpen] = useState(false);
  const a = periodStats(chapter.days, store.tracked);
  const b = prev ? periodStats(prev.days, store.tracked) : undefined;
  const span = daysBetween(chapter.from, chapter.to);

  return (
    <section className="rounded-3xl border bg-white p-5" style={{ borderColor: chapter.current ? "var(--mallow)" : "var(--line)" }}>
      <p className="text-xs font-medium uppercase tracking-wide" style={{ color: chapter.current ? "var(--mallow-deep)" : "var(--ink-faint)" }}>
        Chapter {chapter.n}
        {chapter.current ? " · now" : ""}
      </p>
      <h2 className="serif mt-1 text-xl">{chapter.current ? `Since ${short(chapter.from)}` : `${short(chapter.from)} – ${short(chapter.to)}`}</h2>
      <Muted className="tnum mt-0.5">
        {a.logged} of {span} days logged
      </Muted>

      <ul className="mt-4 space-y-3">
        {store.tracked.map(symptomById).map((s) => (
          <li key={s.id} className="grid grid-cols-[1fr_88px] items-center gap-3">
            <span>
              <span className="block text-sm font-medium">
                {s.name} <span style={{ color: "var(--ink-soft)", fontWeight: 400 }}>· mostly {gradeWord(s, a.averages[s.id]).toLowerCase()}</span>
              </span>
              {b && (
                <span className="block text-xs" style={{ color: "var(--mallow-deep)" }}>
                  {trendWord(b.averages[s.id], a.averages[s.id])} than chapter {chapter.n - 1}
                </span>
              )}
            </span>
            <Spark days={chapter.days} id={s.id} from={chapter.from} span={span} />
          </li>
        ))}
      </ul>

      <p className="tnum mt-4 text-sm" style={{ color: "var(--ink-soft)" }}>
        {a.doses} doses · {a.rated ? Math.round((a.helped / a.rated) * 100) : 0}% helped quite a bit or more
      </p>

      <button onClick={() => setOpen(!open)} aria-expanded={open} className="press mt-3 min-h-11 text-sm font-medium" style={{ color: "var(--mallow-deep)" }}>
        {open ? "Hide days" : `Show days${a.notes.length ? ` · ${a.notes.length} notes` : ""}`}
      </button>
      {open && (
        <ul className="enter divide-y" style={{ borderColor: "var(--line)" }}>
          {[...chapter.days].reverse().map((d) => (
            <DayRow key={d.date} store={store} day={d} />
          ))}
        </ul>
      )}
    </section>
  );
}

// A tiny line of how easy the days were (up = easier), three-day average, broken where days weren't logged.
function Spark({ days, id, from, span }: { days: Day[]; id: string; from: string; span: number }) {
  const w = 88;
  const h = 28;
  const byIdx = new Map(days.filter((d) => d.logged && d.grades[id] !== undefined).map((d) => [daysBetween(from, d.date), 3 - d.grades[id]]));
  let path = "";
  let pen = false;
  for (let i = 0; i < span; i++) {
    if (!byIdx.has(i)) {
      pen = false;
      continue;
    }
    const near = [i - 1, i, i + 1].filter((j) => byIdx.has(j)).map((j) => byIdx.get(j)!);
    const v = near.reduce((x, y) => x + y, 0) / near.length;
    const x = (i / Math.max(span - 1, 1)) * (w - 4) + 2;
    const y = h - 3 - (v / 3) * (h - 6);
    path += `${pen ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)} `;
    pen = true;
  }
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <line x1="2" x2={w - 2} y1={h - 3} y2={h - 3} stroke="var(--line)" />
      <path d={path} fill="none" stroke="var(--mallow)" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
