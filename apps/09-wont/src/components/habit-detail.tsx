"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { canEditDay } from "@/lib/actions";
import { cardModel, dayParts, history, type HistoryRow } from "@/lib/card";
import { copy, titleCase } from "@/lib/copy";
import { addDays, type DayKey } from "@/lib/day";
import type { Habit, HabitPatch, SlipSize } from "@/lib/habits";
import { useWont } from "@/lib/store";
import { BuildForm, StopForm } from "./habit-form";
import { Steamer } from "./wonton";

// One habit (R9): change today's or yesterday's log, see its history (R5, R8), edit the
// wording (id and start day stay, so history is kept) and delete after a confirm.
export function HabitDetail({ id }: { id: string }) {
  const w = useWont();
  const router = useRouter();
  const { state, today } = w;
  const [confirming, setConfirming] = useState(false);
  const d = copy.detail;

  if (!today) return <main className="w" />;
  const habit = state.habits.find((h) => h.id === id);
  if (!habit) {
    return (
      <main className="w">
        <header className="w-head w-head-form">
          <Link href="/" className="w-back">{copy.form.back}</Link>
          <p>{d.notFound}</p>
        </header>
      </main>
    );
  }

  const days = state.logs[habit.id];
  const m = cardModel(habit, days, today);
  const yesterday = addDays(today, -1);
  const editable = [today, yesterday].filter((day) => canEditDay(habit, day, today));

  const save = (patch: HabitPatch) => w.updateHabit(habit.id, patch);

  return (
    <main className="w">
      <header className="w-head w-head-form">
        <Link href="/" className="w-back">{copy.form.back}</Link>
        <h1 dir="auto"><bdi>{titleCase(habit.name)}</bdi></h1>
        <p>
          {habit.kind === "build"
            ? copy.card.rate(m.rate.kept, m.rate.of, m.today === "pending")
            : copy.card.cleanDays(m.cleanDays)}
        </p>
      </header>

      <div className="w-stack">
        <section className="w-panel">
          <h2>{d.logTitle}</h2>
          <small>{d.logHint}</small>
          {editable.map((day) => (
            <LogRow key={day} habit={habit} day={day} label={day === today ? d.today : d.yesterday} w={w} />
          ))}
        </section>

        <section className="w-panel">
          <div className="w-panel-art"><Steamer marks={m.marks} /></div>
          <h2>{d.historyTitle}</h2>
          <small>{d.historyHint}</small>
          <ul className="w-history">
            {history(habit, days, today).map((r) => (
              <li key={r.day} className={r.comeback ? "comeback" : undefined}>
                <span>{copy.days.short(dayParts(r.day).weekday, dayParts(r.day).date, dayParts(r.day).month)}</span>
                <b>{statusText(habit, r)}</b>
              </li>
            ))}
          </ul>
        </section>

        <section className="w-panel">
          <h2>{d.editTitle}</h2>
          <small>{d.editHint}</small>
          {habit.kind === "build" ? (
            <BuildForm key={habit.id} initial={habit} onSave={(p) => save(p as HabitPatch)} />
          ) : (
            <StopForm key={habit.id} initial={habit} onSave={(p) => save(p as HabitPatch)} />
          )}
        </section>

        <section className="w-panel">
          {confirming ? (
            <>
              <p className="w-confirm">{d.deleteConfirm(habit.name)}</p>
              <div className="w-quiet-row">
                <button
                  type="button"
                  className="w-quiet w-quiet-strong"
                  onClick={() => {
                    router.push("/");
                    w.deleteHabit(habit.id);
                  }}
                >
                  {d.deleteYes}
                </button>
                <button type="button" className="w-quiet" onClick={() => setConfirming(false)} autoFocus>
                  {d.deleteNo}
                </button>
              </div>
            </>
          ) : (
            <button type="button" className="w-quiet w-wide" onClick={() => setConfirming(true)}>
              {d.deleteButton}
            </button>
          )}
        </section>
      </div>
    </main>
  );
}

function statusText(habit: Habit, r: HistoryRow) {
  const s = copy.detail.status;
  const base =
    r.status === "slip"
      ? s.slip(r.slipSize ?? "1")
      : r.status === "kept"
        ? r.comeback ? s.comeback : habit.kind === "stop" ? s.clean : s.kept
        : r.status === "clean-so-far"
          ? r.comeback ? `${s.cleanSoFar} · ${s.comeback}` : s.cleanSoFar
          : r.status === "pending"
            ? s.pending
            : s.notLogged;
  return r.urges > 0 ? base + s.urges(r.urges) : base;
}

function LogRow({
  habit,
  day,
  label,
  w,
}: {
  habit: Habit;
  day: DayKey;
  label: string;
  w: ReturnType<typeof useWont>;
}) {
  const d = copy.detail;
  const log = w.state.logs[habit.id]?.[day] ?? {};
  if (habit.kind === "build") {
    const kept = log.kept !== undefined;
    return (
      <div className="w-logrow">
        <span>{label}</span>
        <button type="button" className="w-toggle" aria-pressed={kept} onClick={() => w.toggleKept(habit.id, day)}>
          {d.keptToggle}
        </button>
      </div>
    );
  }
  const clean = log.clean !== undefined;
  const urges = log.urges?.length ?? 0;
  return (
    <div className="w-logrow w-logrow-stop">
      <span>{label}</span>
      <div className="w-logrow-controls">
        <button type="button" className="w-toggle" aria-pressed={clean} onClick={() => w.toggleKept(habit.id, day)}>
          {d.cleanToggle}
        </button>
        <div className="w-seg" role="group" aria-label={copy.slip.title}>
          {(["1", "2", "3+"] as SlipSize[]).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={log.slip?.size === s}
              aria-label={copy.slip.sizeLabel(s)}
              onClick={() => w.logSlip(habit.id, s, day)}
            >
              {s}
            </button>
          ))}
          <button type="button" aria-pressed={!log.slip} onClick={() => w.undoSlip(habit.id, day)}>
            {d.noSlip}
          </button>
        </div>
        <div className="w-urges">
          <span>{d.urgeCount(urges)}</span>
          {urges > 0 && (
            <button type="button" className="w-link w-link-inline" onClick={() => w.undoUrge(habit.id, day)}>
              {d.removeUrge}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
