"use client";

import { useState } from "react";
import {
  cycleDays,
  daysSinceLast,
  daysToGo,
  doctor,
  earlierDays,
  lastAppointment,
  loggedDays,
  missedDays,
  nextAppointment,
  pendingDose,
  product,
  symptoms,
  todayDoses,
} from "./data";
import { CompactGrades, GradeMark, ReliefRow, SideEffectChips, SummarySheet, toggleIn } from "./shared";

// Journal: the day as a timeline. Everything is visible and answered in place; nothing leads.

export default function Journal() {
  const [relief, setRelief] = useState<string>();
  const [doses, setDoses] = useState(todayDoses);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [side, setSide] = useState<string[]>([]);
  const [checkedIn, setCheckedIn] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const allGraded = symptoms.every((s) => grades[s.id] !== undefined);
  const logged = loggedDays + (checkedIn ? 1 : 0);

  return (
    <main className="mx-auto w-full max-w-[440px] px-5 pb-32 pt-[calc(env(safe-area-inset-top)+20px)]">
      <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
        Monday
      </p>
      <h1 className="serif text-[2rem] leading-tight">12 October</h1>

      {/* The month between appointments: one dot per day, filled when logged. */}
      <section className="mt-5 rounded-2xl border p-4" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
        <div className="flex items-baseline justify-between">
          <p className="font-medium">
            <span className="tnum">{daysToGo}</span> days to {doctor}
          </p>
          <p className="tnum text-sm" style={{ color: "var(--ink-soft)" }}>
            {logged} days logged
          </p>
        </div>
        <div className="mt-3 flex gap-[3px]" aria-hidden>
          {Array.from({ length: cycleDays }, (_, i) => {
            const isToday = i === daysSinceLast;
            const filled = (i < daysSinceLast && !missedDays.has(i)) || (isToday && checkedIn);
            return (
              <span
                key={i}
                className="h-2 flex-1 rounded-full"
                style={{
                  background: filled ? "var(--mallow)" : i > daysSinceLast ? "var(--mallow-wash)" : "var(--line)",
                  outline: isToday ? "1.5px solid var(--mallow)" : undefined,
                  outlineOffset: 1,
                  transition: "background-color 200ms ease-out",
                }}
              />
            );
          })}
        </div>
        <div className="mt-1.5 flex justify-between text-xs" style={{ color: "var(--ink-faint)" }}>
          <span>{lastAppointment}</span>
          <span>{nextAppointment}</span>
        </div>
        <p className="mt-3 text-sm" style={{ color: "var(--ink-soft)" }}>
          Every day you log here is a day {doctor} can see, instead of guessing.
        </p>
      </section>

      <ol className="relative mt-8">
        <span className="absolute bottom-3 left-[7px] top-3 w-px" style={{ background: "var(--line)" }} aria-hidden />

        <Entry time={`${pendingDose.when} · ${pendingDose.time}`} dot={relief ? "done" : "ask"}>
          <p className="font-medium">
            {pendingDose.amount} {product.name}
          </p>
          {relief ? (
            <p className="enter text-sm" style={{ color: "var(--mallow-deep)" }}>
              Helped: {relief.toLowerCase()}
            </p>
          ) : (
            <div className="mt-3 rounded-2xl p-3" style={{ background: "var(--mallow-wash)" }}>
              <p className="mb-2.5 text-sm">How much did it help?</p>
              <ReliefRow value={relief} onPick={setRelief} />
            </div>
          )}
        </Entry>

        {doses.map((d, i) => (
          <Entry key={i} time={`Today · ${d.time}`} dot="done" animate={i >= todayDoses.length}>
            <p className="font-medium">
              {d.amount} {product.name}
            </p>
            <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
              {d.relief ? `Helped: ${d.relief.toLowerCase()}` : "We'll ask how it helped next time"}
            </p>
          </Entry>
        ))}

        <Entry time="Today" dot={checkedIn ? "done" : "open"}>
          {checkedIn ? (
            <div className="enter">
              <p className="font-medium">How today was</p>
              <ul className="mt-1.5 space-y-1">
                {symptoms.map((s) => (
                  <li key={s.id} className="flex items-center justify-between text-sm">
                    <span style={{ color: "var(--ink-soft)" }}>{s.name}</span>
                    <span className="flex items-center gap-2">
                      {s.grades[grades[s.id]][0]} <GradeMark level={grades[s.id]} />
                    </span>
                  </li>
                ))}
                {side.length > 0 && (
                  <li className="text-sm" style={{ color: "var(--ink-soft)" }}>
                    {side.join(", ")}
                  </li>
                )}
              </ul>
            </div>
          ) : !checkinOpen ? (
            <button
              onClick={() => setCheckinOpen(true)}
              className="press -mt-1 flex min-h-12 w-full items-center justify-between rounded-2xl border px-4 text-left font-medium"
              style={{ borderColor: "var(--line)", background: "var(--card)" }}
            >
              How was today?
              <span className="text-sm font-normal" style={{ color: "var(--ink-faint)" }}>
                4 questions
              </span>
            </button>
          ) : (
            <div className="enter -mt-1 space-y-5">
              <CompactGrades grades={grades} onPick={(id, g) => setGrades((x) => ({ ...x, [id]: g }))} />
              <div>
                <p className="mb-2 text-sm font-medium">Anything else?</p>
                <SideEffectChips value={side} onToggle={(s) => setSide(toggleIn(side, s))} />
              </div>
              <button
                disabled={!allGraded}
                onClick={() => {
                  setCheckedIn(true);
                  setCheckinOpen(false);
                }}
                className="press min-h-12 w-full rounded-2xl font-medium text-white disabled:opacity-40"
                style={{ background: "var(--mallow)" }}
              >
                Save today
              </button>
            </div>
          )}
        </Entry>
      </ol>

      <button
        onClick={() => setDoses((d) => [...d, { time: "19:40", amount: product.usual, relief: "" }])}
        className="press mt-2 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl font-medium text-white"
        style={{ background: "var(--mallow)" }}
      >
        <span aria-hidden className="text-lg leading-none">+</span> Took a dose · {product.usual}
      </button>

      <h2 className="mt-10 text-sm font-medium" style={{ color: "var(--ink-soft)" }}>
        Earlier
      </h2>
      <ul className="mt-2 divide-y" style={{ borderColor: "var(--line)" }}>
        {earlierDays.map((d) => (
          <li key={d.day} className="py-3" style={{ borderColor: "var(--line)" }}>
            <p className="text-sm font-medium">{d.day}</p>
            <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
              {d.parts.join(" · ")}
            </p>
          </li>
        ))}
      </ul>

      <button
        onClick={() => setSummaryOpen(true)}
        className="press mt-6 min-h-12 w-full rounded-2xl border font-medium"
        style={{ borderColor: "var(--mallow)", color: "var(--mallow-deep)", background: "var(--card)" }}
      >
        Summary for {doctor}
      </button>

      <SummarySheet open={summaryOpen} onClose={() => setSummaryOpen(false)} />
    </main>
  );
}

function Entry({
  time,
  dot,
  animate,
  children,
}: {
  time: string;
  dot: "done" | "ask" | "open";
  animate?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className={`relative pb-7 pl-8 ${animate ? "enter" : ""}`}>
      <span
        className="absolute left-0 top-1 size-[15px] rounded-full border-2"
        style={{
          background: dot === "done" ? "var(--mallow)" : dot === "ask" ? "var(--mallow-tint)" : "var(--paper)",
          borderColor: dot === "open" ? "var(--line)" : "var(--mallow)",
        }}
        aria-hidden
      />
      <p className="tnum mb-1 text-xs" style={{ color: "var(--ink-faint)" }}>
        {time}
      </p>
      {children}
    </li>
  );
}
