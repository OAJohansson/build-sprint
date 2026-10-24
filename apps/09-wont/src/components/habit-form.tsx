"use client";

import { useState } from "react";
import { copy, upper } from "@/lib/copy";
import type { BuildHabit, HabitDraft, HabitPatch, StopHabit } from "@/lib/habits";
import { Steamer } from "./wonton";

// The build and stop habit forms (prototypes new-habit and new-stop-habit), used to create a
// habit (R2, R3) and to edit its wording (R9). Editing adds a card-title field and drops the preview.

/** "I make coffee" / "make coffee" / "After I make coffee" → "I make coffee". */
function normaliseAnchor(text: string) {
  const t = text.trim().replace(/^after\s+/i, "");
  return /^i\s/i.test(t) ? `I ${t.slice(2)}` : `I ${t}`;
}
/** "I will read" → "read". */
const normaliseAction = (text: string) => text.trim().replace(/^i\s+will\s+/i, "");

function Field({
  id,
  label,
  optional,
  hint,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-field">
      <label htmlFor={id}>
        {label}
        {optional && <span className="w-opt">{copy.form.optional}</span>}
      </label>
      {children}
      {hint && <small>{hint}</small>}
    </div>
  );
}

const input = (id: string, value: string, set: (v: string) => void, placeholder: string) => (
  <input id={id} value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder} autoComplete="off" />
);

export function BuildForm({
  initial,
  onSave,
}: {
  /** Present when editing. */
  initial?: BuildHabit;
  onSave: (draft: HabitDraft | HabitPatch) => void;
}) {
  const f = copy.form;
  const editing = !!initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [after, setAfter] = useState(initial?.anchor ?? "");
  const [will, setWill] = useState(initial?.action ?? "");
  const [goal, setGoal] = useState(initial?.goal ?? "");
  const [why, setWhy] = useState(initial?.why ?? "");
  const ready = after.trim() && will.trim() && goal.trim() && (!editing || name.trim());
  const derivedName = upper(normaliseAction(will));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    const fields = {
      // shortcut: a new habit's card title is its action ("Write in my journal"); a separate
      // title field only appears when editing. Add one to the create form if titles read badly.
      name: editing ? name.trim() : derivedName,
      anchor: editing ? after.trim() : normaliseAnchor(after),
      action: normaliseAction(will),
      goal: goal.trim(),
      why: why.trim() || undefined,
    };
    onSave(editing ? fields : { kind: "build", ...fields });
  };

  return (
    <form className="w-form" onSubmit={submit}>
      {editing && <Field id="name" label={f.name}>{input("name", name, setName, derivedName)}</Field>}
      <Field id="after" label={editing ? f.afterEdit : f.after} hint={f.afterHint}>
        {input("after", after, setAfter, f.afterPlaceholder)}
      </Field>
      <Field id="will" label={f.will}>{input("will", will, setWill, f.willPlaceholder)}</Field>
      <Field id="goal" label={f.goal} hint={f.goalHint}>
        {input("goal", goal, setGoal, f.goalPlaceholder)}
        <div className="w-chips">
          {f.goalChips.map((g) => (
            <button key={g} type="button" onClick={() => setGoal(g)} aria-pressed={goal === g}>
              {g}
            </button>
          ))}
        </div>
      </Field>
      <Field id="why" label={f.why} optional>
        <textarea id="why" value={why} onChange={(e) => setWhy(e.target.value)} placeholder={f.whyPlaceholder} />
      </Field>

      {!editing && (
        <>
          <p className="w-label">{f.preview}</p>
          <div className="w-card w-card-static">
            <div className="w-art"><Steamer marks={[]} /></div>
            <div className="w-body">
              <h2 className={`w-nm ${derivedName ? "" : "w-ph"}`}>{derivedName || f.previewBuildName}</h2>
              <p className="w-rate">{goal.trim() ? f.previewGoal(goal.trim()) : copy.card.rate(0, 0)}</p>
              <p className="w-an">
                {after.trim() ? f.previewAfter(normaliseAnchor(after)) : <span className="w-ph">{f.after}</span>}
              </p>
              <p className="w-st">{copy.card.open}</p>
            </div>
          </div>
        </>
      )}

      <button type="submit" className="w-primary" disabled={!ready}>
        {editing ? f.saveEdit : f.save}
      </button>
    </form>
  );
}

export function StopForm({
  initial,
  onSave,
}: {
  initial?: StopHabit;
  onSave: (draft: HabitDraft | HabitPatch) => void;
}) {
  const f = copy.form;
  const editing = !!initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [trigger, setTrigger] = useState(initial?.trigger ?? "");
  const [friction, setFriction] = useState(initial?.friction ?? "");
  const [instead, setInstead] = useState(initial?.replacement ?? "");
  const [why, setWhy] = useState(initial?.why ?? "");
  const ready = name.trim() && trigger.trim() && instead.trim();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    const fields = {
      name: name.trim(),
      trigger: trigger.trim(),
      friction: friction.trim(),
      replacement: normaliseAction(instead),
      why: why.trim() || undefined,
    };
    onSave(editing ? fields : { kind: "stop", ...fields });
  };

  const line = trigger.trim() || instead.trim()
    ? `${trigger.trim()}${trigger.trim() && instead.trim() ? ". " : ""}${instead.trim() ? `Instead: ${instead.trim().toLowerCase()}` : ""}`
    : null;

  return (
    <form className="w-form" onSubmit={submit}>
      <Field id="name" label={editing ? f.name : f.stopName}>
        {input("name", name, setName, f.stopNamePlaceholder)}
      </Field>
      <Field id="trigger" label={f.trigger} hint={f.triggerHint}>
        {input("trigger", trigger, setTrigger, f.triggerPlaceholder)}
      </Field>
      <Field id="friction" label={f.friction} optional hint={f.frictionHint}>
        {input("friction", friction, setFriction, f.frictionPlaceholder)}
      </Field>
      <Field id="instead" label={f.instead} hint={f.insteadHint}>
        {input("instead", instead, setInstead, f.insteadPlaceholder)}
      </Field>
      {editing && (
        <Field id="why" label={f.why} optional>
          <textarea id="why" value={why} onChange={(e) => setWhy(e.target.value)} placeholder={f.whyPlaceholder} />
        </Field>
      )}

      {!editing && (
        <>
          <p className="w-label">{f.preview}</p>
          <div className="w-card w-card-static">
            <div className="w-art"><Steamer marks={[]} /></div>
            <div className="w-body">
              <h2 className={`w-nm ${name.trim() ? "" : "w-ph"}`}>{name.trim() || f.previewStopName}</h2>
              <p className="w-rate">{copy.card.cleanDays(0)}</p>
              <p className="w-an">{line ?? <span className="w-ph">{f.previewStopLine}</span>}</p>
              <p className="w-st">{copy.card.tapIfClean}</p>
            </div>
          </div>
        </>
      )}

      <button type="submit" className="w-primary" disabled={!ready}>
        {editing ? f.saveEdit : f.save}
      </button>
    </form>
  );
}
