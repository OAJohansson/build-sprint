"use client";

import { useState } from "react";
import { NOW, TODAY, amountLabel, daysBetween, doctor, long, reliefPhrase, units, type Medicine } from "./data";
import { CompactGrades, Muted, Primary, ReliefRow, Sheet, SideEffectChips, toggleIn } from "./shared";
import { lastOf, pendingDose, type Store } from "./store";

// Today: a mallow that grows quietly beside the two things Sam does here, logging a dose and
// saying how the day was. The plant is never explained: a logged day adds a leaf, a missed day
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

function Plant({ store, grewToday }: { store: Store; grewToday: boolean }) {
  const last = lastOf(store);
  const cycle = store.next ? Math.max(daysBetween(last, store.next), 7) : 30;
  const slotY = (i: number) => BASE - 18 - (Math.min(i, cycle - 1) * (BASE - 18 - TOP - 26)) / (cycle - 1);
  const loggedIdx = store.days.filter((d) => d.logged && d.date >= last).map((d) => daysBetween(last, d.date));
  if (store.today.logged) loggedIdx.push(daysBetween(last, TODAY));
  const blooming = store.next !== "" && TODAY >= store.next;

  const budX = stemX(TOP);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block h-auto w-full max-w-[220px]" aria-hidden>
      <path d={stemPath} fill="none" stroke="var(--leaf-deep)" strokeWidth="2.5" strokeLinecap="round" />
      {loggedIdx.map((i) => {
        const y = slotY(i);
        const right = i % 2 === 0;
        const len = 26 + 12 * (1 - i / cycle) + ((i * 7) % 5); // older leaves have grown more
        const angle = right ? -24 - ((i * 5) % 12) : 204 + ((i * 5) % 12);
        const isNew = grewToday && i === daysBetween(last, TODAY);
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
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [grewToday, setGrewToday] = useState(false);
  const [thanks, setThanks] = useState<string>();
  const pending = pendingDose(store);
  const medName = (id: string) => store.meds.find((m) => m.id === id);
  const toGo = store.next ? daysBetween(TODAY, store.next) : undefined;

  const rate = (relief: number) => {
    if (!pending) return;
    setStore((s) => {
      const days = [...s.days];
      const day = { ...days[days.length - 1] };
      day.doses = day.doses.map((d, i) => (i === pending.i ? { ...d, relief } : d));
      days[days.length - 1] = day;
      return { ...s, days };
    });
    setThanks(reliefPhrase[relief].toLowerCase());
  };

  return (
    <main className="mx-auto w-full max-w-[440px] px-5 pb-36 pt-[calc(env(safe-area-inset-top)+var(--top-gap))]">
      <header className="flex items-baseline justify-between">
        <span className="serif text-xl" style={{ color: "var(--mallow-deep)" }}>
          Mallow
        </span>
        <span className="text-sm" style={{ color: "var(--ink-soft)" }}>
          {long(TODAY)}
        </span>
      </header>

      {pending ? (
        <section className="mt-6 rounded-3xl p-4" style={{ background: "var(--mallow-wash)" }}>
          <Muted>
            Last night at {pending.dose.time} you took {amountLabel(medName(pending.dose.med)!, pending.dose.amount)}{" "}
            {medName(pending.dose.med)?.name}.
          </Muted>
          <p className="serif mb-3 mt-0.5 text-lg">How much did it help?</p>
          <ReliefRow onPick={rate} />
        </section>
      ) : thanks ? (
        <Muted className="enter mt-6 text-center">Noted: last night&apos;s dose {thanks}.</Muted>
      ) : null}

      <div className="mt-6">
        <Plant store={store} grewToday={grewToday} />
      </div>

      {toGo !== undefined && toGo > 0 && (
        <div className="mt-4 text-center">
          <p className="serif text-xl">
            <span className="tnum">{toGo}</span> {toGo === 1 ? "day" : "days"} until you see {doctor}
          </p>
          <Muted className="mt-1">What you log here is what they&apos;ll see.</Muted>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-2">
        <button
          onClick={() => (store.meds.length ? setDoseOpen(true) : onAddMedicine())}
          className="press flex min-h-16 flex-col items-center justify-center rounded-2xl border px-2"
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        >
          <span className="font-medium">Took a dose</span>
          <span className="text-xs" style={{ color: "var(--ink-soft)" }}>
            {store.meds.length ? `${store.today.doses.length} today` : "Add your medicine"}
          </span>
        </button>
        <button
          onClick={() => setCheckinOpen(true)}
          className="press flex min-h-16 flex-col items-center justify-center rounded-2xl px-2 text-white"
          style={{ background: store.today.logged ? "var(--leaf-deep)" : "var(--mallow)" }}
        >
          <span className="font-medium">{store.today.logged ? "Today is logged" : "How was today?"}</span>
          <span className="text-xs opacity-80">{store.today.logged ? "Tap to change" : `${store.tracked.length} quick questions`}</span>
        </button>
      </div>

      {store.today.doses.length > 0 && (
        <ul className="mt-6 divide-y text-sm" style={{ borderColor: "var(--line)" }}>
          {store.today.doses.map((d, i) => {
            const m = medName(d.med);
            return (
              <li key={i} className="enter flex justify-between gap-3 py-2.5" style={{ borderColor: "var(--line)" }}>
                <span>
                  <span className="tnum" style={{ color: "var(--ink-faint)" }}>
                    {d.time}
                  </span>{" "}
                  {m ? `${amountLabel(m, d.amount)} ${m.name}` : "Dose"}
                </span>
                <span style={{ color: "var(--ink-soft)" }}>
                  {d.relief !== undefined ? reliefPhrase[d.relief] : "We'll ask tomorrow"}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <DoseSheet
        open={doseOpen}
        meds={store.meds}
        onClose={() => setDoseOpen(false)}
        onLog={(med, amount, time) => {
          setStore((s) => ({ ...s, today: { ...s.today, doses: [...s.today.doses, { med, amount, time }] } }));
          setDoseOpen(false);
        }}
      />

      <CheckinSheet
        open={checkinOpen}
        store={store}
        onClose={() => setCheckinOpen(false)}
        onSave={(grades, side) => {
          setGrewToday(!store.today.logged);
          setStore((s) => ({ ...s, today: { ...s.today, logged: true, grades, side } }));
          setCheckinOpen(false);
        }}
      />
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
  const [time, setTime] = useState(NOW);
  const close = () => {
    setEditing(undefined);
    onClose();
  };

  return (
    <Sheet open={open} onClose={close} label="Log a dose">
      {!editing ? (
        <>
          <h2 className="serif text-2xl">Which one?</h2>
          <Muted className="mt-1">Logged at {NOW}. Tomorrow we&apos;ll ask how it helped.</Muted>
          <div className="mt-5 flex flex-col gap-2">
            {meds.map((m) => (
              <div key={m.id} className="flex gap-2">
                <button
                  onClick={() => onLog(m.id, m.amount, NOW)}
                  className="press flex min-h-16 flex-1 flex-col justify-center rounded-2xl px-5 text-left text-white"
                  style={{ background: "var(--mallow)" }}
                >
                  <span className="font-medium">
                    {amountLabel(m)} {m.name}
                  </span>
                  <span className="text-sm opacity-80">{[m.form, m.strength].filter(Boolean).join(" · ")}</span>
                </button>
                <button
                  onClick={() => {
                    setEditing(m);
                    setAmount(m.amount);
                    setTime(NOW);
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

function CheckinSheet({
  open,
  store,
  onClose,
  onSave,
}: {
  open: boolean;
  store: Store;
  onClose: () => void;
  onSave: (grades: Record<string, number>, side: string[]) => void;
}) {
  const [grades, setGrades] = useState<Record<string, number>>(store.today.grades);
  const [side, setSide] = useState<string[]>(store.today.side);
  const done = store.tracked.every((id) => grades[id] !== undefined);
  return (
    <Sheet open={open} onClose={onClose} label="How was today?">
      <h2 className="serif mb-5 text-2xl">How was today?</h2>
      <div className="space-y-4">
        <CompactGrades tracked={store.tracked} grades={grades} onPick={(id, g) => setGrades((x) => ({ ...x, [id]: g }))} />
        <div>
          <p className="mb-2 text-sm font-medium">Anything else?</p>
          <SideEffectChips value={side} onToggle={(s) => setSide(toggleIn(side, s))} />
        </div>
      </div>
      <Primary className="mt-6" disabled={!done} onClick={() => onSave(grades, side)}>
        Save today
      </Primary>
    </Sheet>
  );
}
