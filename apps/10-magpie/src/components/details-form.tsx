"use client";

import { useEffect, useRef, useState } from "react";
import { KindSticker } from "@/components/sticker";
import { lastSpot, rememberSpot, spotHere } from "@/lib/place";
import { defaultSubKind, KINDS, SUB_KINDS, type Kind, type YumFields } from "@/lib/yum";

// Capture, step 2 (design E), also used to edit a yum: name, kind and sub-kind, the restaurant,
// city and country (suggested from where you are, editable), 1–5 hearts and a note (R3).

type Props = {
  title: string;
  submitLabel: string;
  photoUrl: string | null;
  initial?: YumFields;
  onBack: () => void;
  onSubmit: (fields: YumFields) => Promise<string | null>;
};

export function DetailsForm({ title, submitLabel, photoUrl, initial, onBack, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState<Kind | null>(initial?.kind ?? null);
  const [sub, setSub] = useState<string | null>(initial?.subKind ?? null);
  const [place, setPlace] = useState(initial?.place ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [country, setCountry] = useState(initial?.country ?? "");
  const [cityFrom, setCityFrom] = useState<"here" | "last" | "typed" | null>(initial ? "typed" : null);
  const [editingCity, setEditingCity] = useState(false);
  const [hearts, setHearts] = useState(initial?.hearts ?? 0);
  const [note, setNote] = useState(initial?.note ?? "");
  const [problem, setProblem] = useState<{ field: string; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const touchedCity = useRef(false);

  // A new yum starts with the last city at once, then the city where the phone is, if it can tell.
  useEffect(() => {
    if (initial) return;
    const last = lastSpot();
    if (last) {
      // Reading this device's memory after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCity(last.city); setCountry(last.country); setCityFrom("last");
    }
    let alive = true;
    void spotHere().then((here) => {
      if (!alive || !here || touchedCity.current) return;
      setCity(here.city); setCountry(here.country); setCityFrom("here");
    });
    return () => { alive = false; };
  }, [initial]);

  function pickKind(k: Kind) {
    setKind(k);
    setSub(k === kind ? sub : defaultSubKind(k));
    if (problem?.field === "kind") setProblem(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    // A missing answer: say so next to the field and take the person there (it may be off-screen).
    const ask = (field: string, text: string) => {
      setProblem({ field, text });
      const el = document.getElementById(`f-${field}`);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      el?.focus({ preventScroll: true });
    };
    if (!name.trim()) return ask("name", "What's it called? Even a guess helps future you.");
    if (!kind) return ask("kind", "Is it food, a drink or a dessert?");
    if (!hearts) return ask("hearts", "How much did you love it?");
    setProblem(null);
    setBusy(true);
    const fields: YumFields = { name: name.trim(), kind, subKind: sub, place: place.trim() || null, city: city.trim() || null, country: country.trim() || null, hearts, note: note.trim() || null };
    if (fields.city) rememberSpot({ city: fields.city, country: fields.country ?? "" });
    const failed = await onSubmit(fields);
    if (failed) { setProblem({ field: "save", text: failed }); setBusy(false); }
  }

  const err = (field: string) => (problem?.field === field ? <p role="alert" id={`err-${field}`} className="text-[14px] text-link">{problem.text}</p> : null);

  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col">
      <form onSubmit={submit} noValidate className="flex flex-1 flex-col gap-[14px] px-5 pt-[max(20px,env(safe-area-inset-top))] safe-bottom">
        <div className="flex items-center justify-between">
          <button type="button" aria-label="Back" onClick={onBack} className="btn btn-round">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B1F1A" strokeWidth="2.4" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <h1 className="text-[17px] font-medium">{title}</h1>
          <span className="w-11" />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-[84px] w-[84px] flex-none items-center justify-center overflow-hidden rounded-[18px] border-[2.5px] border-cocoa bg-[#4A3027]">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- a local blob or private route
              <img src={photoUrl} alt="Your photo" className="h-full w-full object-cover" />
            ) : (
              <KindSticker kind={kind ?? "drink"} shape="round" size={60} />
            )}
          </div>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="label">Name</span>
            <input value={name} onChange={(e) => { setName(e.target.value); if (problem?.field === "name") setProblem(null); }} id="f-name" maxLength={120} autoCapitalize="sentences" autoComplete="off" enterKeyHint="done" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } }} className="field text-[18px]" aria-invalid={problem?.field === "name"} aria-describedby={problem?.field === "name" ? "err-name" : undefined} />
          </label>
        </div>
        {err("name")}

        <fieldset className="flex flex-col gap-1.5">
          <legend className="label mb-1.5">It&apos;s a…</legend>
          <div className="flex gap-2" id="f-kind" tabIndex={-1} aria-describedby={problem?.field === "kind" ? "err-kind" : undefined}>
            {KINDS.map((k) => (
              <button key={k.id} type="button" className="chip" aria-pressed={kind === k.id} onClick={() => pickKind(k.id)}>{k.label}</button>
            ))}
          </div>
          {kind === "drink" && (
            <div className="sub-row mt-0.5">
              {SUB_KINDS.drink.map((s) => (
                <button key={s.id} type="button" className="chip chip-small" aria-pressed={sub === s.id} onClick={() => setSub(sub === s.id ? null : s.id)}>{s.label}</button>
              ))}
            </div>
          )}
          {err("kind")}
        </fieldset>

        <label className="flex flex-col gap-1.5">
          <span className="label">Restaurant, bar or spot</span>
          <input value={place} onChange={(e) => setPlace(e.target.value)} maxLength={120} autoCapitalize="words" autoComplete="off" className="field" />
        </label>

        {editingCity ? (
          <div className="flex gap-2">
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="label">City</span>
              <input value={city} onChange={(e) => { touchedCity.current = true; setCity(e.target.value); setCityFrom("typed"); }} maxLength={80} autoCapitalize="words" autoComplete="off" className="field" />
            </label>
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="label">Country</span>
              <input value={country} onChange={(e) => { touchedCity.current = true; setCountry(e.target.value); setCityFrom("typed"); }} maxLength={80} autoCapitalize="words" autoComplete="off" className="field" />
            </label>
          </div>
        ) : (
          <div className="flex min-h-11 items-center gap-2 text-[14px] text-bark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E9A97" strokeWidth="2.2" aria-hidden="true" className="flex-none"><path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>
            {city || country ? (
              <span className="min-w-0 truncate">
                {[city, country].filter(Boolean).join(", ")}
                {cityFrom === "here" && <span className="text-dusk"> · from where you are</span>}
                {cityFrom === "last" && <span className="text-dusk"> · where you were last</span>}
              </span>
            ) : (
              <span className="text-dusk">Which city?</span>
            )}
            <button type="button" onClick={() => { touchedCity.current = true; setEditingCity(true); }} className="ml-auto min-h-11 flex-none px-1 text-link active:opacity-60">{city || country ? "Change" : "Add"}</button>
          </div>
        )}

        <fieldset className="flex flex-col gap-1.5">
          <legend className="label mb-1.5">How much did you love it?</legend>
          <div className="flex gap-1.5" id="f-hearts" tabIndex={-1} aria-describedby={problem?.field === "hearts" ? "err-hearts" : undefined}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" aria-label={`${n} ${n === 1 ? "heart" : "hearts"}`} aria-pressed={hearts === n} onClick={() => { setHearts(n); if (problem?.field === "hearts") setProblem(null); }} className="flex h-12 w-12 items-center justify-center transition-transform active:scale-90">
                <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21l-8-8a5 5 0 0 1 8-6 5 5 0 0 1 8 6z" fill={n <= hearts ? "#F2705B" : "#FFFFFF"} stroke="#3B1F1A" strokeWidth="1.6" /></svg>
              </button>
            ))}
          </div>
          {err("hearts")}
        </fieldset>

        <label className="flex flex-col gap-1.5">
          <span className="label">A note for future you <span className="font-normal text-dusk">(optional)</span></span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} rows={2} className="field h-auto min-h-14 resize-none py-3 text-[16px] leading-snug [field-sizing:content]" />
        </label>

        <div className="min-h-2 flex-1" />
        {err("save")}
        <button type="submit" className="btn btn-primary w-full" disabled={busy}>{busy ? "Saving…" : submitLabel}</button>
      </form>
    </main>
  );
}
