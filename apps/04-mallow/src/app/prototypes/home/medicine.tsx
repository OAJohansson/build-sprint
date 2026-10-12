"use client";

import { useState } from "react";
import { amountLabel, timesOfDay, units, type Form, type Medicine } from "./data";
import { Chips, Choice, Muted, Primary, toggleIn } from "./shared";

// Adding (or editing) a medicine: one question per screen, the way it's written on the label.

const forms: { form: Form; sub: string }[] = [
  { form: "Oil", sub: "Drops or a syringe, under the tongue" },
  { form: "Flower", sub: "Dried flower, used in a vaporiser" },
  { form: "Vape", sub: "A cartridge or pen" },
  { form: "Capsule", sub: "Swallowed" },
  { form: "Other", sub: "Something else" },
];

export function MedicineFlow({
  initial,
  onSave,
  onCancel,
  onRemove,
  cancelLabel = "Cancel",
}: {
  initial?: Medicine;
  onSave: (m: Medicine) => void;
  onCancel: () => void;
  onRemove?: () => void;
  cancelLabel?: string;
}) {
  const [step, setStep] = useState(initial ? 1 : 0);
  const [form, setForm] = useState<Form>(initial?.form ?? "Oil");
  const [name, setName] = useState(initial?.name ?? "");
  const [strength, setStrength] = useState(initial?.strength ?? "");
  const [amount, setAmount] = useState(initial?.amount ?? units.Oil.start);
  const [when, setWhen] = useState<string[]>(initial?.when ?? []);
  const u = units[form];

  const back = () => (step === 0 || (initial && step === 1) ? onCancel() : setStep(step - 1));

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center justify-between">
        <button onClick={back} className="press -ml-1 min-h-11 px-1 text-sm" style={{ color: "var(--ink-soft)" }}>
          {step === 0 || (initial && step === 1) ? cancelLabel : "← Back"}
        </button>
        <span className="tnum text-sm" style={{ color: "var(--ink-faint)" }}>
          {step + 1} of 3
        </span>
      </div>

      <section key={step} className="enter mt-6 flex flex-1 flex-col">
        {step === 0 && (
          <>
            <h1 className="serif text-[1.75rem] leading-tight">What form is your medicine?</h1>
            <div className="mt-6 flex flex-col gap-2">
              {forms.map((f) => (
                <Choice
                  key={f.form}
                  on={form === f.form}
                  sub={f.sub}
                  onClick={() => {
                    setForm(f.form);
                    if (!initial) setAmount(units[f.form].start);
                    setTimeout(() => setStep(1), 180);
                  }}
                >
                  {f.form}
                </Choice>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="serif text-[1.75rem] leading-tight">What&apos;s it called?</h1>
            <Muted className="mt-2">As it&apos;s written on your pharmacy label.</Muted>
            <label className="mt-6 block text-sm font-medium" htmlFor="med-name">
              Name
            </label>
            <input
              id="med-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={form === "Flower" ? "e.g. Flower T22" : "e.g. Balanced oil"}
              autoComplete="off"
              className="mt-1.5 min-h-12 w-full rounded-xl border bg-white px-4 outline-none focus:border-[var(--mallow)]"
              style={{ borderColor: "var(--line)" }}
            />
            <label className="mt-4 block text-sm font-medium" htmlFor="med-strength">
              Strength <span style={{ color: "var(--ink-faint)" }}>(optional)</span>
            </label>
            <input
              id="med-strength"
              value={strength}
              onChange={(e) => setStrength(e.target.value)}
              placeholder={form === "Flower" ? "e.g. THC 22%" : "e.g. THC 20 : CBD 20"}
              autoComplete="off"
              className="mt-1.5 min-h-12 w-full rounded-xl border bg-white px-4 outline-none focus:border-[var(--mallow)]"
              style={{ borderColor: "var(--line)" }}
            />
            <Primary className="mt-auto" disabled={!name.trim()} onClick={() => setStep(2)}>
              Next
            </Primary>
            {onRemove && (
              <button onClick={onRemove} className="press mt-3 min-h-11 text-sm" style={{ color: "var(--ink-soft)" }}>
                I don&apos;t take this any more
              </button>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="serif text-[1.75rem] leading-tight">How much do you usually take?</h1>
            <Muted className="mt-2">You can change it each time you log a dose.</Muted>
            <div className="mt-6 flex items-center justify-between rounded-2xl border bg-white p-2" style={{ borderColor: "var(--line)" }}>
              <Step label="Less" onClick={() => setAmount((a) => Math.max(u.step, +(a - u.step).toFixed(2)))}>
                −
              </Step>
              <span className="tnum text-2xl font-medium">{amountLabel({ form, amount })}</span>
              <Step label="More" onClick={() => setAmount((a) => +(a + u.step).toFixed(2))}>
                +
              </Step>
            </div>
            <p className="mb-2 mt-6 text-sm font-medium">When do you usually take it?</p>
            <Chips options={timesOfDay} value={when} onToggle={(t) => setWhen(toggleIn(when, t))} />
            <Primary
              className="mt-auto"
              onClick={() =>
                onSave({ id: initial?.id ?? `m${Date.now()}`, name: name.trim(), form, strength: strength.trim(), amount, when })
              }
            >
              {initial ? "Save" : "Add medicine"}
            </Primary>
          </>
        )}
      </section>
    </div>
  );
}

function Step({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="press size-12 rounded-xl text-2xl leading-none"
      style={{ background: "var(--mallow-tint)", color: "var(--mallow-deep)" }}
    >
      {children}
    </button>
  );
}

// Full-screen overlay used from the Care tab.
export function MedicineScreen(props: React.ComponentProps<typeof MedicineFlow>) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto" style={{ background: "var(--paper)" }}>
      <div className="mx-auto flex min-h-dvh max-w-[440px] flex-col px-5 pb-8 pt-[calc(env(safe-area-inset-top)+var(--top-gap))]">
        <MedicineFlow {...props} />
      </div>
    </div>
  );
}
