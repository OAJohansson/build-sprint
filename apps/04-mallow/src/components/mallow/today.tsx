"use client";

import { useEffect, useState } from "react";
import { amountLabel, daysBetween, long, nowTime, reliefPhrase, today, units, type Medicine } from "@/lib/mallow/data";
import { activeOn } from "@/lib/mallow/history";
import { duePlan, planDate, planDoses, tickDose, type Due } from "@/lib/mallow/schedule";
import { Muted, Primary, ReliefRow, Secondary, Sheet } from "./shared";
import { CheckinSheet, DoseEditor, type DoseTarget } from "./day-editing";
import { appointmentPassed, confirmAppointment, dayOf, doctorName, lastOf, moveAppointment, pendingDose, withDay, type Store } from "@/lib/mallow/store";
import { SummarySheet } from "./summary";

// Today: a mallow that grows quietly beside what Sam does here: ticking off the plan, logging an
// as-needed dose and saying how the day was. The plant is never explained: a logged day adds a leaf, a missed day
// adds nothing, and the bud opens on appointment day.

const W = 300;
const H = 420;
const BASE = 404;
const TOP = 70;

const stemX = (y: number) => W / 2 + 14 * Math.sin(((BASE - y) / (BASE - TOP)) * Math.PI * 1.3);
const stemPath = (() => {
  const pts: string[] = [];
  for (let y = BASE; y >= TOP; y -= 6) pts.push(`${stemX(y).toFixed(1)},${y}`);
  return `M${pts.join(" L")}`;
})();
const leafPath = (len: number, wid: number) =>
  `M0,0 C${len * 0.28},${-wid} ${len * 0.72},${-wid} ${len},0 C${len * 0.72},${wid} ${len * 0.28},${wid} 0,0Z`;

function Plant({ store, grewToday, compact }: { store: Store; grewToday: boolean; compact: boolean }) {
  const last = lastOf(store);
  const cycle = store.next ? Math.max(daysBetween(last, store.next), 7) : 30;
  const slotY = (i: number) => BASE - 18 - (Math.min(i, cycle - 1) * (BASE - 18 - TOP - 26)) / (cycle - 1);
  const loggedIdx = store.days.filter((d) => d.logged && d.date >= last).map((d) => daysBetween(last, d.date));
  const blooming = store.next !== "" && today() >= store.next;

  const budX = stemX(TOP);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`mx-auto block h-auto w-full max-w-[220px] ${compact ? "max-h-[18dvh]" : "max-h-[30dvh]"}`} aria-hidden>
      <path d={stemPath} fill="none" stroke="var(--leaf-deep)" strokeWidth="2.5" strokeLinecap="round" />
      {loggedIdx.map((i) => {
        const y = slotY(i);
        const right = i % 2 === 0;
        const len = 26 + 12 * (1 - i / cycle) + ((i * 7) % 5); // older leaves have grown more
        const angle = right ? -24 - ((i * 5) % 12) : 204 + ((i * 5) % 12);
        const isNew = grewToday && i === daysBetween(last, today());
        return (
          <g key={i} transform={`translate(${stemX(y).toFixed(1)} ${y.toFixed(1)}) rotate(${angle})`}>
            <path
              className={isNew ? "leaf-new" : undefined}
              d={leafPath(len, len * 0.46)}
              fill={i % 3 === 0 ? "var(--leaf-deep)" : "var(--leaf)"}
              opacity={0.92}
            />
          </g>
        );
      })}
      <g transform={`translate(${budX.toFixed(1)} ${TOP - 6})`}>
        {blooming ? (
          [0, 72, 144, 216, 288].map((r) => (
            <ellipse key={r} cx="0" cy="-11" rx="8" ry="12" transform={`rotate(${r})`} fill="var(--mallow)" opacity="0.9" />
          ))
        ) : (
          <path d="M0,10 C-9,4 -9,-10 0,-18 C9,-10 9,4 0,10Z" fill="var(--mallow)" />
        )}
        <path d="M0,10 C-4,2 -10,0 -12,-6 C-6,-2 -2,2 0,10Z M0,10 C4,2 10,0 12,-6 C6,-2 2,2 0,10Z" fill="var(--leaf-deep)" />
      </g>
    </svg>
  );
}

export function Today({
  store,
  setStore,
  onAddMedicine,
}: {
  store: Store;
  setStore: (fn: (s: Store) => Store) => void;
  onAddMedicine: () => void;
}) {
  const [doseOpen, setDoseOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [grewToday, setGrewToday] = useState(false);
  const [editing, setEditing] = useState<DoseTarget>();
  const [thanks, setThanks] = useState<{ when: string; phrase: string }>();
  // Doses are asked about relative to when this visit started, so one logged a minute ago isn't.
  const [visit, setVisit] = useState(() => ({ date: today(), time: nowTime() }));
  // Coming back to the app (resuming a tab or the home-screen app) counts as a new visit.
  useEffect(() => {
    const onShow = () => document.visibilityState === "visible" && setVisit({ date: today(), time: nowTime() });
    document.addEventListener("visibilitychange", onShow);
    return () => document.removeEventListener("visibilitychange", onShow);
  }, []);
  const clock = useClock();
  const plan = duePlan(store, clock);
  const extras = planDoses(store, planDate(clock)).filter((x) => !x.dose.slot);
  const active = store.meds.filter((m) => activeOn(m, today()));
  // Relief is optional (v2): only asked when more than one medicine is in use, since that's the
  // only thing it's used for, and "Not now" quiets it for the rest of the day.
  const pending = active.length > 1 && store.reliefPausedOn !== today() ? pendingDose(store, visit) : undefined;
  const medName = (id: string) => store.meds.find((m) => m.id === id);
  const now = dayOf(store, today());
  const passed = appointmentPassed(store);
  const toGo = store.next && !passed ? daysBetween(today(), store.next) : undefined;
  const when = pending ? `${pending.date === visit.date ? "Today" : "Yesterday"} at ${pending.dose.time}` : "";

  const rate = (relief: number) => {
    if (!pending) return;
    setStore((s) => withDay(s, pending.date, (d) => ({ ...d, doses: d.doses.map((x, i) => (i === pending.i ? { ...x, relief } : x)) })));
    setThanks({ when: `your ${pending.dose.time} dose`, phrase: reliefPhrase[relief].toLowerCase() });
  };
  const tick = (due: Due) => {
    if (due.taken) return setEditing({ date: due.taken.date, index: due.taken.index });
    const t = tickDose(due, { date: today(), time: nowTime() });
    setStore((s) => withDay(s, t.date, (d) => ({ ...d, doses: [...d.doses, t.dose].sort((a, b) => a.time.localeCompare(b.time)) })));
    setThanks({ when: `${due.slot.toLowerCase()} ${due.med.name}`, phrase: `taken at ${t.dose.time}` });
  };

  return (
    <main className="mx-auto w-full max-w-[440px] px-5 pb-36 pt-[calc(env(safe-area-inset-top)+20px)]">
      <header className="flex items-baseline justify-between">
        <h1 className="serif text-xl" style={{ color: "var(--mallow-deep)" }}>
          Mallow
        </h1>
        <span className="text-sm" style={{ color: "var(--ink-soft)" }}>
          {long(today())}
        </span>
      </header>

      {pending ? (
        <section className="mt-6 rounded-3xl p-4" style={{ background: "var(--mallow-wash)" }}>
          <Muted>
            {when} you took {amountLabel(medName(pending.dose.med)!, pending.dose.amount)}{" "}
            {medName(pending.dose.med)?.name}.
          </Muted>
          <p className="serif mb-3 mt-0.5 text-lg">How much did it help?</p>
          <ReliefRow onPick={rate} />
          <button
            onClick={() => setStore((s) => ({ ...s, reliefPausedOn: today() }))}
            className="press mt-2 min-h-11 w-full text-sm"
            style={{ color: "var(--ink-soft)" }}
          >
            Not now
          </button>
        </section>
      ) : thanks ? (
        <Muted className="enter mt-6 text-center" role="status">
          Noted: {thanks.when} {thanks.phrase}.
        </Muted>
      ) : null}

      <div className="mt-6">
        <Plant store={store} grewToday={grewToday} compact={!!pending || passed || (toGo !== undefined && toGo <= 1) || plan.length > 2} />
      </div>

      {/* The day before and the day of the appointment, the summary comes to Sam. */}
      {toGo !== undefined && toGo <= 1 && (
        <section className="enter mt-4 rounded-3xl p-4 text-center" style={{ background: "var(--mallow-wash)" }}>
          <p className="serif text-xl">
            {toGo === 0 ? "Your appointment is today" : "Your appointment is tomorrow"}
          </p>
          <Muted className="mt-1">Show {doctorName(store)} how it&apos;s really been.</Muted>
          <Primary className="mt-4" onClick={() => setSummaryOpen(true)}>
            Open your summary
          </Primary>
        </section>
      )}

      {passed && <AppointmentCheck store={store} setStore={setStore} />}
      {!store.next && <NextAppointment setStore={setStore} />}

      {toGo !== undefined && toGo > 1 && (
        <div className="mt-4 text-center">
          <p className="serif text-xl">
            <span className="tnum">{toGo}</span> {toGo === 1 ? "day" : "days"} until you see {doctorName(store)}
          </p>
          <Muted className="mt-1">What you log here is what they&apos;ll see.</Muted>
        </div>
      )}

      {plan.length > 0 && <PlanList plan={plan} onTick={tick} />}

      <div className="mt-6 grid grid-cols-2 gap-2">
        <button
          onClick={() => (active.length ? setDoseOpen(true) : onAddMedicine())}
          className="press flex min-h-16 flex-col items-center justify-center rounded-2xl border px-2"
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        >
          <span className="font-medium">Took a dose</span>
          <span className="text-xs" style={{ color: "var(--ink-soft)" }}>
            {active.length ? "As needed or extra" : "Add your medicine"}
          </span>
        </button>
        <button
          onClick={() => setCheckinOpen(true)}
          className="press flex min-h-16 flex-col items-center justify-center rounded-2xl px-2 py-2 leading-tight text-white"
          style={{ background: now.logged ? "var(--leaf-deep)" : "var(--mallow)" }}
        >
          <span className="font-medium">{now.logged ? "Today is logged" : "How was today?"}</span>
          <span className="mt-0.5 text-xs opacity-80">{now.logged ? "Tap to change" : `${store.tracked.length} quick questions`}</span>
        </button>
      </div>

      {extras.length > 0 && (
        <ul className="mt-6 divide-y text-sm" style={{ borderColor: "var(--line)" }}>
          {extras.map(({ dose: d, date, index }) => {
            const m = medName(d.med);
            return (
              <li key={`${date}-${index}`} className="enter" style={{ borderColor: "var(--line)" }}>
                <button
                  onClick={() => setEditing({ date, index })}
                  aria-label={`Change the ${d.time} dose`}
                  className="press grid min-h-11 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 py-2 text-left"
                >
                  <span className="tnum" style={{ color: "var(--ink-faint)" }}>
                    {d.time}
                  </span>
                  <span className="truncate">{m ? `${amountLabel(m, d.amount)} ${m.name}` : "Dose"}</span>
                  <span className="whitespace-nowrap" style={{ color: "var(--ink-soft)" }}>
                    {d.relief !== undefined ? reliefPhrase[d.relief] : "How it helped"} ›
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <SummarySheet store={store} open={summaryOpen} onClose={() => setSummaryOpen(false)} />

      <DoseSheet
        open={doseOpen}
        meds={[...active].sort((a, b) => +b.when.includes("When needed") - +a.when.includes("When needed"))}
        onClose={() => setDoseOpen(false)}
        onLog={(med, amount, time) => {
          setStore((s) => withDay(s, today(), (d) => ({ ...d, doses: [...d.doses, { med, amount, time }].sort((a, b) => a.time.localeCompare(b.time)) })));
          setDoseOpen(false);
        }}
      />

      {checkinOpen && (
        <CheckinSheet
          open
          store={store}
          setStore={setStore}
          date={today()}
          onClose={() => setCheckinOpen(false)}
          onSaved={(first) => setGrewToday(first)}
        />
      )}
      {editing && <DoseEditor store={store} setStore={setStore} target={editing} onClose={() => setEditing(undefined)} />}
    </main>
  );
}

function DoseSheet({
  open,
  meds,
  onClose,
  onLog,
}: {
  open: boolean;
  meds: Medicine[];
  onClose: () => void;
  onLog: (med: string, amount: number, time: string) => void;
}) {
  const [editing, setEditing] = useState<Medicine>();
  const [amount, setAmount] = useState(0);
  const [time, setTime] = useState(nowTime);
  const close = () => {
    setEditing(undefined);
    onClose();
  };

  return (
    <Sheet open={open} onClose={close} label="Log a dose">
      {!editing ? (
        <>
          <h2 className="serif text-2xl">Which one?</h2>
          <Muted className="mt-1">Logged now. Tap Change for a different amount or time.</Muted>
          <div className="mt-5 flex flex-col gap-2">
            {meds.map((m) => (
              <div key={m.id} className="flex gap-2">
                <button
                  onClick={() => onLog(m.id, m.amount, nowTime())}
                  className="press flex min-h-16 min-w-0 flex-1 flex-col justify-center rounded-2xl px-5 text-left text-white"
                  style={{ background: "var(--mallow)" }}
                >
                  <span className="line-clamp-2 font-medium">
                    {amountLabel(m)} {m.name}
                  </span>
                  <span className="text-sm opacity-80">{m.asNeeded || [m.form, m.strength].filter(Boolean).join(" · ")}</span>
                </button>
                <button
                  onClick={() => {
                    setEditing(m);
                    setAmount(m.amount);
                    setTime(nowTime());
                  }}
                  aria-label={`Change amount or time for ${m.name}`}
                  className="press min-h-16 rounded-2xl border px-4 text-sm"
                  style={{ borderColor: "var(--line)", background: "var(--card)" }}
                >
                  Change
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <h2 className="serif text-2xl">{editing.name}</h2>
          <div className="mt-5 flex items-center justify-between rounded-2xl border bg-white p-2" style={{ borderColor: "var(--line)" }}>
            <button
              aria-label="Less"
              onClick={() => setAmount((a) => Math.max(units[editing.form].step, +(a - units[editing.form].step).toFixed(2)))}
              className="press size-12 rounded-xl text-2xl"
              style={{ background: "var(--mallow-tint)", color: "var(--mallow-deep)" }}
            >
              −
            </button>
            <span className="tnum text-2xl font-medium">{amountLabel(editing, amount)}</span>
            <button
              aria-label="More"
              onClick={() => setAmount((a) => +(a + units[editing.form].step).toFixed(2))}
              className="press size-12 rounded-xl text-2xl"
              style={{ background: "var(--mallow-tint)", color: "var(--mallow-deep)" }}
            >
              +
            </button>
          </div>
          <label className="mt-4 flex items-center justify-between rounded-2xl border bg-white px-4 py-2" style={{ borderColor: "var(--line)" }}>
            <span className="font-medium">Time</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="tnum min-h-10 bg-transparent text-right outline-none" />
          </label>
          <Primary className="mt-6" onClick={() => onLog(editing.id, amount, time)}>
            Log dose
          </Primary>
          <button onClick={() => setEditing(undefined)} className="press mt-2 min-h-11 w-full text-sm" style={{ color: "var(--ink-soft)" }}>
            Back
          </button>
        </>
      )}
    </Sheet>
  );
}

// The appointment date has passed: did it happen, or did the clinic move it? Until Sam says,
// the summary and the stretch stay as they are.
function AppointmentCheck({ store, setStore }: { store: Store; setStore: (fn: (s: Store) => Store) => void }) {
  const [step, setStep] = useState<"ask" | "happened" | "moved">("ask");
  const [date, setDate] = useState("");
  return (
    <section className="enter mt-4 rounded-3xl p-4 text-center" style={{ background: "var(--mallow-wash)" }}>
      {step === "ask" && (
        <>
          <p className="serif text-xl">Did your appointment on {long(store.next)} happen?</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Primary onClick={() => setStep("happened")}>Yes</Primary>
            <Secondary className="min-h-14" onClick={() => setStep("moved")}>
              It moved
            </Secondary>
          </div>
        </>
      )}
      {step !== "ask" && (
        <>
          <p className="serif text-xl">{step === "happened" ? "When is the next one?" : "When is it now?"}</p>
          <input
            type="date"
            name="next-appointment"
            aria-label={step === "happened" ? "Next appointment" : "New appointment date"}
            value={date}
            min={today()}
            onChange={(e) => setDate(e.target.value)}
            className="tnum mt-4 min-h-12 w-full rounded-xl border bg-white px-4"
            style={{ borderColor: "var(--line)" }}
          />
          <Primary
            className="mt-3"
            disabled={!date}
            onClick={() => setStore((s) => (step === "happened" ? confirmAppointment(s, date) : moveAppointment(s, date)))}
          >
            Save
          </Primary>
          {step === "happened" && (
            <button onClick={() => setStore((s) => confirmAppointment(s))} className="press mt-2 min-h-11 text-sm" style={{ color: "var(--ink-soft)" }}>
              Not booked yet
            </button>
          )}
        </>
      )}
    </section>
  );
}

// No next appointment yet: one quiet place to add it, so the countdown can come back.
function NextAppointment({ setStore }: { setStore: (fn: (s: Store) => Store) => void }) {
  return (
    <label className="mt-4 flex min-h-14 items-center justify-between gap-3 rounded-2xl border bg-white px-4" style={{ borderColor: "var(--line)" }}>
      <span className="text-sm font-medium">Next appointment</span>
      <input
        type="date"
        name="next-appointment"
        min={today()}
        onChange={(e) => e.target.value && setStore((s) => ({ ...s, next: e.target.value }))}
        className="tnum min-h-10 bg-transparent text-right text-sm"
      />
    </label>
  );
}

// The minute hand: what's due changes while the app stays open, and on coming back to it.
function useClock() {
  const read = () => ({ date: today(), time: nowTime() });
  const [clock, setClock] = useState(read);
  useEffect(() => {
    const update = () => setClock((c) => {
      const n = read();
      return n.date === c.date && n.time === c.time ? c : n;
    });
    const id = window.setInterval(update, 30_000);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return clock;
}

// The plan for today, in time-of-day order. Ticking is one tap; a missed slot just says "Not
// taken", in the same quiet grey as everything else (no red, no streaks).
function PlanList({ plan, onTick }: { plan: Due[]; onTick: (d: Due) => void }) {
  const label: Record<Due["status"], string> = { now: "Now", later: "Later", "not taken": "Not taken", taken: "" };
  return (
    <section className="mt-6" aria-labelledby="plan-heading">
      <h2 id="plan-heading" className="text-sm font-medium" style={{ color: "var(--ink-soft)" }}>
        Your plan today
      </h2>
      <ul className="mt-2 flex flex-col gap-2">
        {plan.map((d) => {
          const taken = d.status === "taken";
          const now = d.status === "now";
          return (
            <li key={`${d.slot}-${d.med.id}`}>
              <button
                onClick={() => onTick(d)}
                aria-label={taken ? `${d.slot}: ${d.med.name}, taken at ${d.taken!.dose.time}. Change it` : `Tick ${d.slot.toLowerCase()} ${d.med.name} as taken`}
                className="press grid min-h-16 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border px-4 py-2.5 text-left"
                style={{ background: now ? "var(--mallow-wash)" : "var(--card)", borderColor: now ? "var(--mallow)" : "var(--line)" }}
              >
                <span
                  aria-hidden
                  className="grid size-7 place-items-center rounded-full border-2"
                  style={{ borderColor: taken ? "var(--leaf-deep)" : "var(--ink-faint)", background: taken ? "var(--leaf-deep)" : "transparent" }}
                >
                  {taken && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5 10 17 19 7" />
                    </svg>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block break-words font-medium">
                    {d.slot}: {amountLabel(d.med, d.amount)} {d.med.name}
                  </span>
                  {d.med.howTo && (
                    <span className="block break-words text-sm" style={{ color: "var(--ink-soft)" }}>
                      {d.med.howTo}
                    </span>
                  )}
                </span>
                <span className="tnum whitespace-nowrap text-sm" style={{ color: now ? "var(--mallow-deep)" : "var(--ink-soft)" }}>
                  {taken ? d.taken!.dose.time : label[d.status]}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
