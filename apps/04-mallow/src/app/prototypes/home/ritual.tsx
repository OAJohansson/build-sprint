"use client";

import { useState } from "react";
import {
  daysToGo,
  doctor,
  lastAppointment,
  loggedDays,
  daysSinceLast,
  nextAppointment,
  pendingDose,
  product,
  reliefOptions,
  symptoms,
} from "./data";
import { GradeList, SideEffectChips, SummarySheet, toggleIn } from "./shared";

// Ritual: one calm question at a time. The app leads; Sam only ever answers the card in front.

type Step =
  | { kind: "relief" }
  | { kind: "dose" }
  | { kind: "symptom"; i: number }
  | { kind: "side" }
  | { kind: "done" };

const steps: Step[] = [
  { kind: "relief" },
  { kind: "dose" },
  ...symptoms.map((_, i) => ({ kind: "symptom" as const, i })),
  { kind: "side" },
  { kind: "done" },
];

export default function Ritual() {
  const [at, setAt] = useState(0);
  const [relief, setRelief] = useState<string>();
  const [dose, setDose] = useState<"taken" | "not-yet">();
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [side, setSide] = useState<string[]>([]);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const step = steps[at];
  const next = () => setAt((a) => Math.min(a + 1, steps.length - 1));
  // A short beat after a tap so the choice is seen before the next card arrives.
  const answerThenNext = (fn: () => void) => {
    fn();
    setTimeout(next, 220);
  };
  const logged = loggedDays + (at === steps.length - 1 ? 1 : 0);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col px-5 pb-28 pt-[calc(env(safe-area-inset-top)+20px)]">
      <header className="flex items-baseline justify-between">
        <span className="serif text-xl" style={{ color: "var(--mallow-deep)" }}>
          Mallow
        </span>
        <span className="tnum text-sm" style={{ color: "var(--ink-soft)" }}>
          {daysToGo} days to {doctor}
        </span>
      </header>

      {/* Where you are in tonight's few questions */}
      <div className="mt-6 flex gap-1" aria-hidden>
        {steps.slice(0, -1).map((_, i) => (
          <span
            key={i}
            className="h-1 flex-1 rounded-full"
            style={{
              background: i < at ? "var(--mallow)" : i === at ? "var(--mallow-tint)" : "var(--line)",
              transition: "background-color 200ms ease-out",
            }}
          />
        ))}
      </div>

      <section key={at} className="enter mt-10 flex flex-1 flex-col">
        {step.kind === "relief" && (
          <>
            <Eyebrow>
              {pendingDose.when}, {pendingDose.time} · {pendingDose.amount} {product.name}
            </Eyebrow>
            <Title>How much did it help?</Title>
            <div className="mt-8 flex flex-col gap-2">
              {reliefOptions.map((r) => (
                <Choice key={r} on={relief === r} onClick={() => answerThenNext(() => setRelief(r))}>
                  {r}
                </Choice>
              ))}
            </div>
            <Skip onClick={next}>I don&apos;t remember</Skip>
          </>
        )}

        {step.kind === "dose" && (
          <>
            <Eyebrow>Since then</Eyebrow>
            <Title>Have you taken a dose?</Title>
            <div className="mt-8 flex flex-col gap-2">
              <button
                onClick={() => answerThenNext(() => setDose("taken"))}
                className="press min-h-16 rounded-2xl px-5 text-left text-white"
                style={{ background: dose === "taken" ? "var(--mallow-deep)" : "var(--mallow)" }}
              >
                <span className="block font-medium">Yes, just now</span>
                <span className="block text-sm opacity-80">
                  {product.usual} {product.name}
                </span>
              </button>
              <Choice on={dose === "not-yet"} onClick={() => answerThenNext(() => setDose("not-yet"))}>
                Not yet
              </Choice>
            </div>
            <Skip onClick={next}>A different amount or time</Skip>
          </>
        )}

        {step.kind === "symptom" && (
          <>
            <Eyebrow>
              {symptoms[step.i].name} · {step.i + 1} of {symptoms.length}
            </Eyebrow>
            <Title>{symptoms[step.i].question}</Title>
            <div className="mt-8">
              <GradeList
                grades={symptoms[step.i].grades}
                value={grades[symptoms[step.i].id]}
                onPick={(g) => answerThenNext(() => setGrades((s) => ({ ...s, [symptoms[step.i].id]: g })))}
              />
            </div>
          </>
        )}

        {step.kind === "side" && (
          <>
            <Eyebrow>Last one</Eyebrow>
            <Title>Anything else you noticed?</Title>
            <div className="mt-8">
              <SideEffectChips value={side} onToggle={(s) => setSide(toggleIn(side, s))} />
            </div>
            <button
              onClick={next}
              className="press mt-8 min-h-14 rounded-2xl font-medium text-white"
              style={{ background: "var(--mallow)" }}
            >
              {side.length ? "Done" : "Nothing else"}
            </button>
          </>
        )}

        {step.kind === "done" && (
          <div className="flex flex-1 flex-col">
            <Title>That&apos;s today.</Title>
            <p className="mt-4 text-lg leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              <span className="tnum">{logged}</span> of <span className="tnum">{daysSinceLast + 1}</span> days
              logged since {lastAppointment}. {doctor} will see all of it on {nextAppointment}.
            </p>
            <div className="mt-auto flex flex-col gap-2 pt-10">
              <button
                onClick={() => setSummaryOpen(true)}
                className="press min-h-14 rounded-2xl font-medium text-white"
                style={{ background: "var(--mallow)" }}
              >
                See what {doctor} will see
              </button>
              <button
                onClick={() => setAt(1)}
                className="press min-h-14 rounded-2xl border font-medium"
                style={{ borderColor: "var(--line)", background: "var(--card)" }}
              >
                Log another dose
              </button>
            </div>
          </div>
        )}
      </section>

      {at > 0 && at < steps.length - 1 && (
        <button
          onClick={() => setAt((a) => a - 1)}
          className="press mt-6 self-start text-sm"
          style={{ color: "var(--ink-soft)" }}
        >
          ← Back
        </button>
      )}

      <SummarySheet open={summaryOpen} onClose={() => setSummaryOpen(false)} />
    </main>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
      {children}
    </p>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return <h1 className="serif mt-2 text-[2rem] leading-tight">{children}</h1>;
}

function Choice({ on, onClick, children }: { on?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className="press min-h-14 rounded-2xl border px-5 text-left font-medium"
      style={{
        background: on ? "var(--mallow-tint)" : "var(--card)",
        borderColor: on ? "var(--mallow)" : "var(--line)",
      }}
    >
      {children}
    </button>
  );
}

function Skip({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="press mt-5 self-center py-2 text-sm underline-offset-4 hover:underline" style={{ color: "var(--ink-soft)" }}>
      {children}
    </button>
  );
}
