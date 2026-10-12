"use client";

import { useState } from "react";
import {
  amountLabel,
  daysBetween,
  fmt,
  long,
  periodStats,
  reliefPhrase,
  short,
  symptomById,
  today,
  type Day,
} from "@/lib/mallow/data";
import { allDays, chaptersOf, doctorName, lastOf, type Store } from "@/lib/mallow/store";
import { Chips, GradeMark, Muted } from "./shared";
import { SummarySheet } from "./summary";

// Journey: everything logged so far, as a calendar. The summary for the appointment sits on top.
export function Journey({ store }: { store: Store }) {
  const [summaryOpen, setSummaryOpen] = useState(false);
  const all = allDays(store);
  const empty = store.days.every((d) => !d.logged && d.doses.length === 0);
  const now = periodStats(chaptersOf(store).at(-1)?.days ?? [], store.tracked);

  return (
    <main className="mx-auto w-full max-w-[440px] px-5 pb-36 pt-[calc(env(safe-area-inset-top)+20px)]">
      <h1 className="serif text-[2rem] leading-tight">Journey</h1>

      <button
        onClick={() => setSummaryOpen(true)}
        className="press mt-5 flex w-full items-center justify-between gap-3 rounded-2xl p-4 text-left"
        style={{ background: "var(--mallow-wash)" }}
      >
        <span>
          <span className="block font-medium">For {doctorName(store)}</span>
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
      ) : (
        <Calendar store={store} days={all} />
      )}

      <SummarySheet store={store} open={summaryOpen} onClose={() => setSummaryOpen(false)} />
    </main>
  );
}

const medOf = (s: Store, id: string) => s.meds.find((m) => m.id === id);
const dayLabel = (d: string) => (d === today() ? "Today" : daysBetween(d, today()) === 1 ? "Yesterday" : long(d));

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

// ---------- A month at a glance, shaded by one symptom ----------

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
          const future = date > today();
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
                outline: picked === date ? "2px solid var(--ink)" : date === today() ? "1.5px solid var(--mallow)" : undefined,
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
