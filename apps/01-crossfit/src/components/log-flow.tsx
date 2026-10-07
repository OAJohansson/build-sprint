"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Loader2, Mic, Plus, Square, Trash2 } from "lucide-react";
import { BigButton, Chip, Screen, SectionLabel, TopBar, inputClass } from "@/components/ui/bits";
import { MovementPicker } from "@/components/movement-picker";
import { ApiError, type Api, type NewEntry } from "@/lib/api";
import { findMovement, isWod } from "@/lib/movements";
import { candidateFromEntry, detectPbs, pbKey, repLabel } from "@/lib/pb";
import { useLocalStorage } from "@/lib/use-local-storage";
import { useSpeech } from "@/lib/use-speech";
import { type Entry, type NewPb, type Pb, type Unit, formatDate, formatEntry, today, uid } from "@/lib/types";
import { cn } from "@/lib/utils";

type Draft = { date: string; title: string; entries: Entry[] };

const blank = (movement: string, unit: Unit): Entry => ({
  id: uid(), movement, sets: null, reps: null, weight: null, unit, score: null, rx: null, note: null,
});

/** Talk (or pick) → AI tidies it up → check & save. */
export function LogFlow({
  api,
  pbs,
  unit,
  onClose,
  onSaved,
}: {
  api: Api;
  pbs: Pb[];
  unit: Unit;
  onClose: () => void;
  onSaved: (newPbs: NewPb[]) => void;
}) {
  // The note survives a locked phone or closed tab until it's saved.
  const [transcript, setTranscript] = useLocalStorage("01-crossfit:note", "");
  const [date, setDate] = useState(today);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [picking, setPicking] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = useRef("");
  const onDictation = useCallback(
    (spoken: string) => setTranscript(base.current ? `${base.current} ${spoken}` : spoken),
    [setTranscript],
  );
  const speech = useSpeech(onDictation);

  async function sumUp() {
    speech.stop();
    setBusy(true);
    setError(null);
    try {
      const parsed = await api.parse(transcript, today(), unit);
      setDraft({
        date: parsed.date ?? date,
        title: parsed.title,
        entries: parsed.entries.map((e) => ({ ...e, id: uid(), movement: findMovement(e.movement).name })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "The AI step failed.");
      // Without the AI, carry on by hand.
      if (err instanceof ApiError && err.status === 503) setDraft({ date, title: "", entries: [] });
    } finally {
      setBusy(false);
    }
  }

  // Which entries would set a PB (worked out the same way the server does on save).
  const flagged = useMemo(() => {
    if (!draft) return new Map<string, NewPb>();
    const found = new Map(detectPbs(draft.entries, pbs, draft.date, null).map((n) => [pbKey(n.pb), n]));
    const byEntry = new Map<string, NewPb>();
    for (const e of draft.entries) {
      const c = candidateFromEntry(e, draft.date, null);
      const hit = c && found.get(pbKey(c));
      if (hit && hit.pb.value === c.value && hit.pb.unit === c.unit) byEntry.set(e.id, hit);
    }
    return byEntry;
  }, [draft, pbs]);

  async function save() {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      const entries: NewEntry[] = draft.entries
        .filter((e) => e.movement.trim())
        .map((e) => ({ movement: e.movement, sets: e.sets, reps: e.reps, weight: e.weight, unit: e.unit, score: e.score, rx: e.rx, note: e.note }));
      const { newPbs } = await api.saveSession({ date: draft.date, title: draft.title, transcript, entries });
      setTranscript("");
      onSaved(newPbs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
      setBusy(false);
    }
  }

  const update = (id: string, patch: Partial<Entry>) =>
    setDraft((d) => d && { ...d, entries: d.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  const remove = (id: string) => setDraft((d) => d && { ...d, entries: d.entries.filter((e) => e.id !== id) });

  if (picking) {
    return (
      <MovementPicker
        pbs={pbs}
        onClose={() => setPicking(false)}
        onPick={(name) => {
          const e = blank(name, unit);
          setDraft((d) => ({ ...(d ?? { date, title: "", entries: [] }), entries: [...(d?.entries ?? []), e] }));
          setOpen(e.id);
          setPicking(false);
        }}
      />
    );
  }

  if (draft) {
    const groups = [
      { name: "Strength & skills", entries: draft.entries.filter((e) => !isWod(e.movement)) },
      { name: "WOD", entries: draft.entries.filter((e) => isWod(e.movement)) },
    ].filter((g) => g.entries.length);

    return (
      <Screen>
        <TopBar title="Check & save" sub={formatDate(draft.date, { weekday: "short", day: "numeric", month: "short" })} onBack={() => setDraft(null)} />
        <div className="flex gap-2">
          <label className="flex-1">
            <span className="sr-only">Session title</span>
            <input className={inputClass} placeholder="Session title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </label>
          <label>
            <span className="sr-only">Date</span>
            <input type="date" className={`${inputClass} w-auto`} value={draft.date} max={today()} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
          </label>
        </div>
        {transcript && (
          <details className="rounded-xl bg-card px-4 py-3 text-sm text-muted-foreground">
            <summary className="cursor-pointer">What you said</summary>
            <p className="mt-2 italic leading-relaxed">{transcript}</p>
          </details>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {groups.map((g) => (
          <section key={g.name} className="flex flex-col gap-2">
            <SectionLabel>{g.name}</SectionLabel>
            {g.entries.map((e) => (
              <EntryCard
                key={e.id}
                entry={e}
                pb={flagged.get(e.id)}
                open={open === e.id}
                onToggle={() => setOpen(open === e.id ? null : e.id)}
                onChange={(patch) => update(e.id, patch)}
                onRemove={() => remove(e.id)}
              />
            ))}
          </section>
        ))}
        {draft.entries.length === 0 && <p className="py-4 text-center text-muted-foreground">Nothing yet. Add what you did.</p>}

        <button type="button" onClick={() => setPicking(true)} className="flex h-12 items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-input text-muted-foreground">
          <Plus className="size-4" /> Add movement
        </button>
        {draft.entries.length > 0 && <p className="text-center text-[13px] text-muted-foreground">Tap a row to fix it</p>}
        <div className="flex-1" />
        <BigButton onClick={save} disabled={busy || draft.entries.length === 0}>
          {busy ? <Loader2 className="animate-spin" /> : null}
          {busy ? "Saving…" : "Save session"}
        </BigButton>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar
        title="Log class"
        onBack={onClose}
        close
        right={
          <label>
            <span className="sr-only">Date</span>
            <input type="date" className="h-9 rounded-full border border-input bg-transparent px-3 text-sm" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
          </label>
        }
      />
      <div className="flex flex-1 flex-col gap-3 rounded-2xl bg-card p-5">
        <SectionLabel>{speech.listening ? "Listening" : "What did you do?"}</SectionLabel>
        <label className="flex flex-1 flex-col">
          <span className="sr-only">Your note</span>
          <textarea
            className="min-h-40 flex-1 resize-none bg-transparent text-[21px] font-medium leading-snug outline-none placeholder:text-muted-foreground/60"
            placeholder="Snatch, worked up to 75 kilos. Then Fran, 4:32 Rx."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
          />
        </label>
        {speech.interim && <p className="text-[15px] italic text-muted-foreground">{speech.interim}…</p>}
      </div>

      {speech.supported && (
        <div className="flex flex-col items-center gap-2">
          <span className={cn("rounded-full border-2 p-3", speech.listening ? "animate-pulse border-primary/50" : "border-transparent")}>
            <button
              type="button"
              aria-label={speech.listening ? "Stop recording" : "Start recording"}
              onClick={() => {
                if (speech.listening) return speech.stop();
                base.current = transcript.trimEnd();
                speech.start();
              }}
              className="flex size-24 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              {speech.listening ? <Square className="size-8 fill-current" /> : <Mic className="size-10" />}
            </button>
          </span>
          <span className="text-sm text-muted-foreground">{speech.listening ? "Tap to stop" : "Tap and talk"}</span>
        </div>
      )}
      {speech.error && <p className="text-center text-sm text-destructive">{speech.error}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2.5">
        <BigButton variant="outline" className="flex-1" onClick={() => setPicking(true)}>
          <Plus /> Pick instead
        </BigButton>
        <BigButton variant="light" className="flex-[1.4]" disabled={!transcript.trim() || busy} onClick={sumUp}>
          {busy ? <Loader2 className="animate-spin" /> : null}
          {busy ? "Reading…" : "Sum it up"}
        </BigButton>
      </div>
    </Screen>
  );
}

function EntryCard({
  entry: e,
  pb,
  open,
  onToggle,
  onChange,
  onRemove,
}: {
  entry: Entry;
  pb?: NewPb;
  open: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<Entry>) => void;
  onRemove: () => void;
}) {
  const mv = findMovement(e.movement);
  const scored = mv.category === "WODs" || mv.pb === "time" || mv.pb === "rounds";
  const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")) || null);
  const isNew = pb && pb.previous;
  const label = pb?.pb.kind === "load" ? `NEW ${repLabel(pb.pb.repMax)}` : "NEW PB";

  return (
    <div className={cn("rounded-2xl border bg-[#1a1a18]", isNew ? "border-[1.5px] border-primary" : "border-border")}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left">
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[17px] font-semibold">{e.movement || "Movement"}</span>
          <span className="truncate text-xs text-muted-foreground">
            {[mv.category === "Other" ? null : mv.category, e.note ?? mv.detail].filter(Boolean).join(" · ")}
          </span>
        </span>
        <span className="flex flex-none flex-col items-end gap-1">
          <span className="font-display text-[22px] font-bold tabular-nums">{formatEntry(e)}</span>
          {isNew && <span className="rounded-md bg-primary px-1.5 py-0.5 text-[11px] font-bold tracking-wider text-primary-foreground">{label}</span>}
          {pb && !pb.previous && <span className="text-[11px] text-muted-foreground">first record</span>}
        </span>
      </button>
      {open && (
        <div className="flex flex-col gap-3 border-t border-border px-4 pb-4 pt-3">
          {scored ? (
            <div className="flex items-end gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
                Score
                <input className={inputClass} placeholder="4:32 or 7+4" value={e.score ?? ""} onChange={(ev) => onChange({ score: ev.target.value || null })} />
              </label>
              <Chip active={e.rx === true} onClick={() => onChange({ rx: true })}>Rx</Chip>
              <Chip active={e.rx === false} onClick={() => onChange({ rx: false })}>Scaled</Chip>
            </div>
          ) : (
            <div className="grid grid-cols-[1fr_1fr_1.4fr_auto] gap-2">
              {(["sets", "reps", "weight"] as const).map((k) => (
                <label key={k} className="flex flex-col gap-1 text-xs text-muted-foreground">
                  {k}
                  <input className={inputClass} inputMode="decimal" value={e[k] ?? ""} onChange={(ev) => onChange({ [k]: num(ev.target.value) })} />
                </label>
              ))}
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                unit
                <select className={inputClass} value={e.unit} onChange={(ev) => onChange({ unit: ev.target.value as Unit })}>
                  <option>kg</option>
                  <option>lb</option>
                </select>
              </label>
            </div>
          )}
          <div className="flex gap-2">
            <label className="flex-1">
              <span className="sr-only">Note</span>
              <input className={`${inputClass} text-sm`} placeholder="Note" value={e.note ?? ""} onChange={(ev) => onChange({ note: ev.target.value || null })} />
            </label>
            <button type="button" aria-label={`Remove ${e.movement}`} onClick={onRemove} className="flex size-12 items-center justify-center rounded-xl border border-input text-muted-foreground">
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
