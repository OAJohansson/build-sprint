"use client";

import { useState } from "react";
import {
  amountLabel,
  daysBetween,
  fmt,
  long,
  reliefPhrase,
  short,
  symptomById,
  today,
  type Day,
} from "@/lib/mallow/data";
import { allDays, doctorName, type Store } from "@/lib/mallow/store";
import { CheckinSheet, DoseEditor, type DoseTarget } from "./day-editing";
import { ChipRow, GradeMark, Muted } from "./shared";
import { SummarySheet } from "./summary";
import { TrendChart } from "./trend-chart";
import { rangeLabel, type Range } from "@/lib/mallow/trend";

// Journey: is it changing? A trend per symptom with the medicines underneath, the summary for the
// appointment, and every day logged so far as a calendar.
type SetStore = (fn: (s: Store) => Store) => void;

export function Journey({ store, setStore }: { store: Store; setStore: SetStore }) {
  const [summaryOpen, setSummaryOpen] = useState(false);
  const all = allDays(store);
  const empty = store.days.every((d) => !d.logged && d.doses.length === 0);
  // One symptom choice for the graph and the calendar below it.
  const [picked, setPicked] = useState(store.tracked[0]);
  const symptom = store.tracked.includes(picked) ? picked : store.tracked[0];

  return (
    <main className="mx-auto w-full max-w-[440px] px-5 pb-36 pt-[calc(env(safe-area-inset-top)+20px)]">
      <h1 className="serif text-[2rem] leading-tight">Journey</h1>

      <Trends store={store} symptom={symptom} onPick={setPicked} />

      {/* The appointment summary, one slim row under the graph (owner, 20 Oct: graph first). */}
      <button
        onClick={() => setSummaryOpen(true)}
        className="press mt-6 flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left"
        style={{ background: "var(--mallow-wash)" }}
      >
        <span className="min-w-0 font-medium">
          Summary for {doctorName(store)}
          {store.next ? <span className="tnum font-normal" style={{ color: "var(--ink-soft)" }}>{` · ${short(store.next)}`}</span> : null}
        </span>
        <span aria-hidden className="shrink-0" style={{ color: "var(--mallow-deep)" }}>
          ›
        </span>
      </button>

      {empty && <Muted className="mt-8 text-center">Your days will appear here as you log them.</Muted>}
      <Calendar store={store} setStore={setStore} days={all} sym={symptom} />

      <SummarySheet store={store} open={summaryOpen} onClose={() => setSummaryOpen(false)} />
    </main>
  );
}

// One graph at a time: pick the symptom (the first tracked one by default) and the range.
function Trends({ store, symptom, onPick }: { store: Store; symptom: string; onPick: (id: string) => void }) {
  const [range, setRange] = useState<Range>("all");
  return (
    <section className="mt-5" aria-label="How it's been changing">
      {store.tracked.length > 1 && (
        <div>
          <ChipRow options={store.tracked.map((id) => ({ id, label: symptomById(id).name }))} value={symptom} onPick={onPick} />
        </div>
      )}
      <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl p-1" role="radiogroup" aria-label="Time range" style={{ background: "var(--mallow-wash)" }}>
        {(["4w", "3m", "all"] as Range[]).map((r) => (
          <button
            key={r}
            role="radio"
            aria-checked={range === r}
            onClick={() => setRange(r)}
            className="press min-h-11 rounded-lg text-sm"
            style={{ background: range === r ? "var(--card)" : "transparent", color: range === r ? "var(--ink)" : "var(--ink-soft)", fontWeight: range === r ? 500 : 400 }}
          >
            {rangeLabel[r]}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {/* Keyed so a picked day never carries over to another symptom or range. */}
        <TrendChart key={`${symptom}-${range}`} store={store} symptom={symptom} range={range} />
      </div>
    </section>
  );
}

const medOf = (s: Store, id: string) => s.meds.find((m) => m.id === id);
const dayLabel = (d: string) => (d === today() ? "Today" : daysBetween(d, today()) === 1 ? "Yesterday" : long(d));

// ---------- Shared day pieces ----------

function DayDetail({ store, setStore, day }: { store: Store; setStore: SetStore; day: Day }) {
  const [editing, setEditing] = useState<DoseTarget>();
  const [checkin, setCheckin] = useState(false);
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
              <li key={i}>
                <button
                  onClick={() => setEditing({ date: day.date, index: i })}
                  aria-label={`Change the ${d.time} dose`}
                  className="press grid min-h-10 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 text-left"
                >
                  <span className="tnum" style={{ color: "var(--ink-faint)" }}>
                    {d.time}
                  </span>
                  <span className="truncate">{m ? `${amountLabel(m, d.amount)} ${m.name}` : "Dose"}</span>
                  <span className="whitespace-nowrap" style={{ color: "var(--ink-soft)" }}>
                    {d.relief !== undefined ? reliefPhrase[d.relief] : "Not rated"} ›
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {day.side.length > 0 && <p style={{ color: "var(--ink-soft)" }}>{day.side.join(", ")}</p>}
      {day.note && <p className="serif italic">“{day.note}”</p>}
      {/* Fill in or correct a day, so mistakes never stay in the summary. */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => setCheckin(true)}
          className="press min-h-11 flex-1 rounded-xl border text-sm font-medium"
          style={{ borderColor: "var(--line)", color: "var(--mallow-deep)" }}
        >
          {day.logged ? "Change check-in" : "Add check-in"}
        </button>
        {store.meds.length > 0 && (
          <button
            onClick={() => setEditing({ date: day.date })}
            className="press min-h-11 flex-1 rounded-xl border text-sm font-medium"
            style={{ borderColor: "var(--line)", color: "var(--mallow-deep)" }}
          >
            Add a dose
          </button>
        )}
      </div>
      {checkin && <CheckinSheet open store={store} setStore={setStore} date={day.date} onClose={() => setCheckin(false)} />}
      {editing && <DoseEditor store={store} setStore={setStore} target={editing} onClose={() => setEditing(undefined)} />}
    </div>
  );
}

// ---------- A month at a glance, shaded by one symptom ----------

const shade = ["var(--mallow-wash)", "color-mix(in oklch, var(--mallow) 34%, white)", "color-mix(in oklch, var(--mallow) 62%, white)", "var(--mallow-deep)"];

function Calendar({ store, setStore, days, sym }: { store: Store; setStore: SetStore; days: Day[]; sym: string }) {
  const months = [...new Set(days.map((d) => d.date.slice(0, 7)))];
  const [mi, setMi] = useState(months.length - 1);
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
    <div className="mt-10">
      <h2 className="text-sm font-medium" style={{ color: "var(--ink-soft)" }}>
        Your days
      </h2>
      <div className="mt-2 flex items-center justify-between">
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
          <DayDetail key={picked} store={store} setStore={setStore} day={pickedDay} />
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
