"use client";

import { useRef, useState } from "react";
import { copy, titleCase } from "@/lib/copy";
import type { BuildHabit, HabitDraft, HabitPatch, StopHabit } from "@/lib/habits";
import { Steamer } from "./wonton";

// The build and stop habit forms (prototypes new-habit and new-stop-habit), used to create a
// habit (R2, R3) and to edit its wording (R9). Editing adds a card-title field and drops the preview.

// User wording is stored as typed, trimmed (feedback 26, 28): the label already says "After…",
// so the anchor is never rewritten and no case is ever changed. The one exception: a leading
// "I will" typed into the "I will…" field is dropped so the card doesn't say it twice.
/** "I will read" → "read". */
const normaliseAction = (text: string) => text.trim().replace(/^i\s+will\s+/i, "");

/** Length limits (feedback 30): a card title fits one line, the rest at most two on the card. */
const MAX = { name: 40, text: 80, why: 160 };

function Field({
  id,
  label,
  optional,
  hint,
  missing,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  hint?: string;
  /** Feedback 32 / N2: the submit was tapped with this required field empty. */
  missing?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="w-field">
      <label htmlFor={id}>
        {label}
        {optional && <span className="w-opt">{copy.form.optional}</span>}
      </label>
      {children}
      {missing && <small id={`${id}-note`} className="w-note">{copy.form.required}</small>}
      {hint && <small>{hint}</small>}
    </div>
  );
}

const input = (
  id: string,
  value: string,
  set: (v: string) => void,
  placeholder: string,
  max = MAX.text,
  missing = false,
) => (
  <input
    id={id}
    value={value}
    onChange={(e) => set(e.target.value)}
    placeholder={placeholder}
    autoComplete="off"
    dir="auto"
    maxLength={max}
    aria-invalid={missing || undefined}
    aria-describedby={missing ? `${id}-note` : undefined}
  />
);

/**
 * Feedback 32 / N2: the submit stays enabled at full contrast. Tapped with a required field empty,
 * it notes the first empty one and focuses it; the note goes once that field is filled.
 * Feedback 39 / N4 (editing): the button reads "Saved" while the fields match what was saved.
 */
function useSubmitState(required: [string, string][], editing: boolean) {
  const [tried, setTried] = useState(false);
  // Feedback N8: a double tap on "Add to my board" added the habit twice. A ref (not state, which
  // lags a render behind) lets only the first valid create submit through; the button is then
  // disabled while the board loads. Editing stays repeatable.
  const doneRef = useRef(false);
  const [locked, setLocked] = useState(false);
  const [savedAs, setSavedAs] = useState<string | null>(null);
  const firstEmpty = required.find(([, v]) => !v.trim())?.[0];
  return {
    /** The field showing the note, if any. */
    missing: tried ? firstEmpty : undefined,
    /** True when the form may be saved; otherwise notes and focuses the first empty field. */
    check: () => {
      if (doneRef.current) return false;
      if (!firstEmpty) {
        if (!editing) {
          doneRef.current = true;
          setLocked(true);
        }
        return true;
      }
      setTried(true);
      const el = document.getElementById(firstEmpty);
      el?.focus({ preventScroll: true });
      // Bring the field's label into view too, not just the input.
      el?.closest(".w-field")?.scrollIntoView({ block: "center" });
      return false;
    },
    /** True after a create was submitted: the button is disabled while navigating. */
    locked,
    markSaved: (all: unknown) => setSavedAs(JSON.stringify(all)),
    isSaved: (all: unknown) => savedAs === JSON.stringify(all),
  };
}

const whyArea = (value: string, set: (v: string) => void) => (
  <textarea
    id="why"
    value={value}
    onChange={(e) => set(e.target.value)}
    placeholder={copy.form.whyPlaceholder}
    dir="auto"
    maxLength={MAX.why}
  />
);

/**
 * Feedback 34: a build habit's card title is its action until the title itself is edited. A
 * title still "follows" when it equals the action (ignoring case, as older versions capitalised it).
 */
const follows = (h?: BuildHabit) =>
  !h || h.name.trim().toLowerCase() === h.action.trim().toLowerCase();

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
  const [nameFollows, setNameFollows] = useState(follows(initial));
  const [ownName, setOwnName] = useState(initial?.name ?? "");
  const [after, setAfter] = useState(initial?.anchor ?? "");
  const [will, setWill] = useState(initial?.action ?? "");
  const [goal, setGoal] = useState(initial?.goal ?? "");
  const [why, setWhy] = useState(initial?.why ?? "");
  const derivedName = normaliseAction(will).slice(0, MAX.name);
  // Until the action changes, a following title keeps its stored wording exactly.
  const name = nameFollows ? (initial && will === initial.action ? initial.name : derivedName) : ownName;
  const setName = (v: string) => {
    setNameFollows(false);
    setOwnName(v);
  };
  const form = useSubmitState([
    ...(editing ? [["name", name] as [string, string]] : []),
    ["after", after],
    ["will", will],
    ["goal", goal],
  ], editing);
  const current = { name, after, will, goal, why };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.check()) return;
    const fields = {
      // shortcut: a new habit's card title is its action ("write in my journal"); a separate
      // title field only appears when editing. Add one to the create form if titles read badly.
      name: name.trim(),
      anchor: after.trim(),
      action: normaliseAction(will),
      goal: goal.trim(),
      why: why.trim() || undefined,
    };
    onSave(editing ? fields : { kind: "build", ...fields });
    if (editing) form.markSaved(current);
  };

  return (
    <form className="w-form" onSubmit={submit}>
      {editing && (
        <Field id="name" label={f.name} missing={form.missing === "name"}>
          {input("name", name, setName, derivedName, MAX.name, form.missing === "name")}
        </Field>
      )}
      <Field id="after" label={f.after} hint={f.afterHint} missing={form.missing === "after"}>
        {input("after", after, setAfter, f.afterPlaceholder, MAX.text, form.missing === "after")}
      </Field>
      <Field id="will" label={f.will} missing={form.missing === "will"}>
        {input("will", will, setWill, f.willPlaceholder, MAX.text, form.missing === "will")}
      </Field>
      <Field id="goal" label={f.goal} hint={f.goalHint} missing={form.missing === "goal"}>
        {input("goal", goal, setGoal, f.goalPlaceholder, MAX.text, form.missing === "goal")}
        <div className="w-chips">
          {f.goalChips.map((g) => (
            <button key={g} type="button" onClick={() => setGoal(g)} aria-pressed={goal === g}>
              {g}
            </button>
          ))}
        </div>
      </Field>
      <Field id="why" label={f.why} optional>
        {whyArea(why, setWhy)}
      </Field>

      {!editing && (
        <>
          <p className="w-label">{f.preview}</p>
          <div className="w-card w-card-static">
            <div className="w-art"><Steamer marks={[]} /></div>
            <div className="w-body">
              <h2 className={`w-nm ${derivedName ? "" : "w-ph"}`} dir="auto">
                {derivedName ? <bdi>{titleCase(derivedName)}</bdi> : f.previewBuildName}
              </h2>
              <p className="w-rate">{goal.trim() ? f.previewGoal(goal.trim()) : copy.card.rate(0, 0)}</p>
              <p className="w-an">
                {after.trim() ? f.previewAfter(after.trim(), normaliseAction(will)) : <span className="w-ph">{f.after}</span>}
              </p>
              <p className="w-st">{copy.card.open}</p>
            </div>
          </div>
        </>
      )}

      <button type="submit" className="w-primary" disabled={form.locked}>
        {editing ? (form.isSaved(current) ? f.saved : f.saveEdit) : f.save}
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
  const form = useSubmitState([
    ["name", name],
    ["trigger", trigger],
    ["instead", instead],
  ], editing);
  const current = { name, trigger, friction, instead, why };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.check()) return;
    const fields = {
      name: name.trim(),
      trigger: trigger.trim(),
      friction: friction.trim(),
      replacement: normaliseAction(instead),
      why: why.trim() || undefined,
    };
    onSave(editing ? fields : { kind: "stop", ...fields });
    if (editing) form.markSaved(current);
  };

  const line =
    trigger.trim() || instead.trim()
      ? copy.card.stopLine(trigger.trim() || "…", normaliseAction(instead) || "…")
      : null;

  return (
    <form className="w-form" onSubmit={submit}>
      <Field id="name" label={editing ? f.name : f.stopName} missing={form.missing === "name"}>
        {input("name", name, setName, f.stopNamePlaceholder, MAX.name, form.missing === "name")}
      </Field>
      <Field id="trigger" label={f.trigger} hint={f.triggerHint} missing={form.missing === "trigger"}>
        {input("trigger", trigger, setTrigger, f.triggerPlaceholder, MAX.text, form.missing === "trigger")}
      </Field>
      <Field id="friction" label={f.friction} optional hint={f.frictionHint}>
        {input("friction", friction, setFriction, f.frictionPlaceholder)}
      </Field>
      <Field id="instead" label={f.instead} hint={f.insteadHint} missing={form.missing === "instead"}>
        {input("instead", instead, setInstead, f.insteadPlaceholder, MAX.text, form.missing === "instead")}
      </Field>
      {editing && (
        <Field id="why" label={f.why} optional>
          {whyArea(why, setWhy)}
        </Field>
      )}

      {!editing && (
        <>
          <p className="w-label">{f.preview}</p>
          <div className="w-card w-card-static">
            <div className="w-art"><Steamer marks={[]} /></div>
            <div className="w-body">
              <h2 className={`w-nm ${name.trim() ? "" : "w-ph"}`} dir="auto">
                {name.trim() ? <bdi>{titleCase(name.trim())}</bdi> : f.previewStopName}
              </h2>
              <p className="w-rate">{copy.card.cleanDays(0)}</p>
              <p className="w-an">{line ?? <span className="w-ph">{f.previewStopLine}</span>}</p>
              <p className="w-st">{copy.card.tapIfClean}</p>
            </div>
          </div>
        </>
      )}

      <button type="submit" className="w-primary" disabled={form.locked}>
        {editing ? (form.isSaved(current) ? f.saved : f.saveEdit) : f.save}
      </button>
    </form>
  );
}
