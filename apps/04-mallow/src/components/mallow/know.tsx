"use client";

import { useEffect } from "react";
import { amountLabel, today, type Form } from "@/lib/mallow/data";
import { cardFor, driving, formCards, intro, thcCbd } from "@/lib/mallow/forms";
import type { Store } from "@/lib/mallow/store";
import { Muted } from "./shared";

// Know your medicine: one card per form, the patient's own forms first. The only dose on a card
// is the patient's own, from My plan, shown as "Your plan".

export const ownForms = (s: Store) =>
  [...new Set(s.meds.filter((m) => !m.stopDate || m.stopDate > today()).map((m) => m.form))].filter((f) => cardFor(f));

export function KnowList({ store, onOpen }: { store: Store; onOpen: (f: Form) => void }) {
  const own = ownForms(store);
  const other = formCards.map((c) => c.form).filter((f) => !own.includes(f));
  const row = (f: Form, sub: string) => (
    <li key={f} style={{ borderColor: "var(--line)" }}>
      <button onClick={() => onOpen(f)} className="press flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2 text-left">
        <span>
          <span className="block font-medium">{f}</span>
          <span className="block text-sm" style={{ color: "var(--ink-soft)" }}>
            {sub}
          </span>
        </span>
        <span aria-hidden style={{ color: "var(--ink-faint)" }}>
          ›
        </span>
      </button>
    </li>
  );
  return (
    <>
      {own.length > 0 && (
        <ul className="divide-y rounded-2xl border bg-white" style={{ borderColor: "var(--line)" }}>
          {own.map((f) => row(f, "In your plan"))}
        </ul>
      )}
      {other.length > 0 && (
        <>
          <p className="mb-2 mt-4 text-sm font-medium" style={{ color: "var(--ink-soft)" }}>
            Other forms
          </p>
          <ul className="divide-y rounded-2xl border bg-white" style={{ borderColor: "var(--line)" }}>
            {other.map((f) => row(f, "General information"))}
          </ul>
        </>
      )}
    </>
  );
}

export function FormCardScreen({ store, form, onClose }: { store: Store; form: Form; onClose: () => void }) {
  const card = cardFor(form);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (!card) return null;
  const mine = store.meds.filter((m) => m.form === form && (!m.stopDate || m.stopDate > today()));

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto overscroll-contain" style={{ background: "var(--paper)" }} role="dialog" aria-modal aria-label={`About ${card.title.toLowerCase()}`}>
      <article className="mx-auto max-w-[440px] px-5 pb-12 pt-[calc(env(safe-area-inset-top)+16px)]">
        <button onClick={onClose} className="press -ml-1 min-h-11 px-1 text-sm" style={{ color: "var(--ink-soft)" }}>
          <span aria-hidden>← </span>Back
        </button>
        <h1 className="serif mt-4 text-[2rem] leading-tight">{card.title}</h1>
        <Muted className="mt-2">{intro}</Muted>

        {mine.length > 0 && (
          <section className="mt-6 rounded-2xl p-4" style={{ background: "var(--mallow-wash)" }}>
            <h2 className="text-sm font-medium" style={{ color: "var(--mallow-deep)" }}>
              Your plan
            </h2>
            {mine.map((m) => (
              <p key={m.id} className="mt-2 break-words">
                <span className="font-medium">{m.name}</span>
                <span className="block text-sm" style={{ color: "var(--ink-soft)" }}>
                  {[
                    m.when.some((w) => w !== "When needed") && `${amountLabel(m)}, ${m.when.filter((w) => w !== "When needed").join(", ").toLowerCase()}`,
                    m.when.includes("When needed") && (m.asNeeded || "When needed"),
                    m.howTo,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </p>
            ))}
            <p className="mt-2 text-xs" style={{ color: "var(--ink-soft)" }}>
              As your doctor prescribed. Questions about your dose go to your doctor or pharmacist.
            </p>
          </section>
        )}

        <Part title="What it is">{card.what}</Part>
        <Part title="How it's taken">{card.how}</Part>
        <Part title="When it starts and how long it lasts">{card.timing}</Part>
        <Part title="Common side effects">
          {[...thcCbd, ...card.side].map((t) => (
            <span key={t} className="mt-1 block first:mt-0">
              {t}
            </span>
          ))}
        </Part>
        <Part title="Storing it">{card.storage}</Part>
        <Part title="Driving and travel">
          {driving.map((t) => (
            <span key={t} className="mt-1 block first:mt-0">
              {t}
            </span>
          ))}
        </Part>

        <section className="mt-8 rounded-2xl border bg-white p-4" style={{ borderColor: "var(--line)" }}>
          <h2 className="font-medium">Questions you could ask your doctor</h2>
          <ul className="mt-2 space-y-2">
            {card.questions.map((q) => (
              <li key={q} className="flex gap-2">
                <span aria-hidden style={{ color: "var(--mallow)" }}>
                  •
                </span>
                {q}
              </li>
            ))}
          </ul>
        </section>
      </article>
    </div>
  );
}

function Part({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-sm font-medium" style={{ color: "var(--ink-soft)" }}>
        {title}
      </h2>
      <p className="mt-1 leading-relaxed">{children}</p>
    </section>
  );
}
