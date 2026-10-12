"use client";

import { useState } from "react";
import {
  cycleDays,
  daysSinceLast,
  doctor,
  lastAppointment,
  loggedDays,
  missedDays,
  nextAppointment,
  pendingDose,
  product,
  symptoms,
} from "./data";
import { CompactGrades, ReliefRow, Sheet, SideEffectChips, SummarySheet, toggleIn } from "./shared";

// Garden: the weeks between appointments as a mallow growing up its stem. A logged day adds a
// leaf; a missed day adds nothing (no gap marker, no broken streak). It flowers on appointment day.

const W = 300;
const H = 420;
const BASE = 400;
const TOP = 78;

const stemX = (y: number) => W / 2 + 14 * Math.sin(((BASE - y) / (BASE - TOP)) * Math.PI * 1.3);
const slotY = (i: number) => BASE - 18 - i * ((BASE - 18 - TOP - 22) / (cycleDays - 1));

const stemPath = (() => {
  const pts: string[] = [];
  for (let y = BASE; y >= TOP; y -= 6) pts.push(`${stemX(y).toFixed(1)},${y}`);
  return `M${pts.join(" L")}`;
})();

function leafPath(len: number, wid: number) {
  return `M0,0 C${len * 0.28},${-wid} ${len * 0.72},${-wid} ${len},0 C${len * 0.72},${wid} ${len * 0.28},${wid} 0,0Z`;
}

function Plant({ todayLeaf }: { todayLeaf: boolean }) {
  const leaves = [];
  for (let i = 0; i <= daysSinceLast; i++) {
    const isToday = i === daysSinceLast;
    if (isToday ? !todayLeaf : missedDays.has(i)) continue;
    const y = slotY(i);
    const x = stemX(y);
    const right = i % 2 === 0;
    // Older leaves have had longer to grow.
    const len = 26 + 12 * (1 - i / cycleDays) + ((i * 7) % 5);
    const angle = right ? -24 - ((i * 5) % 12) : 204 + ((i * 5) % 12);
    leaves.push(
      <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle})`}>
        <path
          className={isToday ? "leaf-new" : undefined}
          d={leafPath(len, len * 0.46)}
          fill={i % 3 === 0 ? "var(--leaf-deep)" : "var(--leaf)"}
          opacity={isToday ? 1 : 0.9}
        />
      </g>,
    );
  }

  const budY = TOP - 4;
  const budX = stemX(TOP);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block h-auto w-full max-w-[230px]" role="img" aria-label={`A mallow with ${loggedDays + (todayLeaf ? 1 : 0)} leaves, one for each day logged`}>
      <path d={stemPath} fill="none" stroke="var(--leaf-deep)" strokeWidth="2.5" strokeLinecap="round" />
      {leaves}
      {/* The bud that opens on appointment day */}
      <g transform={`translate(${budX.toFixed(1)} ${budY})`}>
        <path d="M0,10 C-9,4 -9,-10 0,-18 C9,-10 9,4 0,10Z" fill="var(--mallow)" />
        <path d="M0,10 C-4,2 -10,0 -12,-6 C-6,-2 -2,2 0,10Z M0,10 C4,2 10,0 12,-6 C6,-2 2,2 0,10Z" fill="var(--leaf-deep)" />
      </g>
      <text x={budX + 18} y={budY - 2} fontSize="12" fill="var(--ink-soft)">
        {nextAppointment}
      </text>
      <text x={stemX(BASE) + 14} y={BASE - 2} fontSize="12" fill="var(--ink-faint)">
        {lastAppointment}
      </text>
    </svg>
  );
}

export default function Garden() {
  const [relief, setRelief] = useState<string>();
  const [doseLogged, setDoseLogged] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [side, setSide] = useState<string[]>([]);
  const [checkedIn, setCheckedIn] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const leaves = loggedDays + (checkedIn ? 1 : 0);
  const allGraded = symptoms.every((s) => grades[s.id] !== undefined);

  return (
    <main className="mx-auto w-full max-w-[440px] px-5 pb-32 pt-[calc(env(safe-area-inset-top)+20px)]">
      <header className="flex items-baseline justify-between">
        <span className="serif text-xl" style={{ color: "var(--mallow-deep)" }}>
          Mallow
        </span>
        <button onClick={() => setSummaryOpen(true)} className="press text-sm underline-offset-4 hover:underline" style={{ color: "var(--ink-soft)" }}>
          For {doctor}
        </button>
      </header>

      {!relief ? (
        <section className="mt-6 rounded-3xl p-4" style={{ background: "var(--mallow-wash)" }}>
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
            {pendingDose.when} at {pendingDose.time} you took {pendingDose.amount}.
          </p>
          <p className="serif mb-3 mt-0.5 text-lg">How much did it help?</p>
          <ReliefRow value={relief} onPick={setRelief} />
        </section>
      ) : (
        <p className="enter mt-6 text-center text-sm" style={{ color: "var(--ink-soft)" }}>
          Noted: last night&apos;s dose helped {relief.toLowerCase()}.
        </p>
      )}

      <div className="mt-4">
        <Plant todayLeaf={checkedIn} />
      </div>

      <div className="text-center">
        <p className="serif text-2xl">
          <span className="tnum">{leaves}</span> leaves
        </p>
        <p className="mx-auto mt-1 max-w-[30ch] text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
          {checkedIn
            ? `Today is in. Your mallow flowers on ${nextAppointment}, when you see ${doctor}.`
            : `One for each day you've logged. Your mallow flowers on ${nextAppointment}, when you see ${doctor}.`}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <button
          onClick={() => setDoseLogged(true)}
          className="press flex min-h-16 flex-col items-center justify-center rounded-2xl border"
          style={{ borderColor: doseLogged ? "var(--mallow)" : "var(--line)", background: doseLogged ? "var(--mallow-tint)" : "var(--card)" }}
        >
          <span className="font-medium">{doseLogged ? "Dose logged" : "Took a dose"}</span>
          <span className="tnum text-xs" style={{ color: "var(--ink-soft)" }}>
            {doseLogged ? `19:40 · ${product.usual}` : `${product.usual} ${product.name}`}
          </span>
        </button>
        <button
          onClick={() => setCheckinOpen(true)}
          disabled={checkedIn}
          className="press flex min-h-16 flex-col items-center justify-center rounded-2xl text-white disabled:opacity-100"
          style={{ background: checkedIn ? "var(--leaf-deep)" : "var(--mallow)" }}
        >
          <span className="font-medium">{checkedIn ? "Today's leaf" : "How was today?"}</span>
          <span className="text-xs opacity-80">{checkedIn ? "See you tomorrow" : "Adds today's leaf"}</span>
        </button>
      </div>
      {doseLogged && (
        <p className="enter mt-3 text-center text-xs" style={{ color: "var(--ink-soft)" }}>
          Next time you open Mallow, we&apos;ll ask how it helped.
        </p>
      )}

      <Sheet open={checkinOpen} onClose={() => setCheckinOpen(false)} label="How was today?">
        <h2 className="serif mb-5 text-2xl">How was today?</h2>
        <div className="space-y-4">
          <CompactGrades grades={grades} onPick={(id, g) => setGrades((x) => ({ ...x, [id]: g }))} />
          <div>
            <p className="mb-2 text-sm font-medium">Anything else?</p>
            <SideEffectChips value={side} onToggle={(s) => setSide(toggleIn(side, s))} />
          </div>
        </div>
        <button
          disabled={!allGraded}
          onClick={() => {
            setCheckinOpen(false);
            setCheckedIn(true);
          }}
          className="press mt-6 min-h-14 w-full rounded-2xl font-medium text-white disabled:opacity-40"
          style={{ background: "var(--mallow)" }}
        >
          Add today&apos;s leaf
        </button>
      </Sheet>

      <SummarySheet open={summaryOpen} onClose={() => setSummaryOpen(false)} />
    </main>
  );
}
