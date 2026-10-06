"use client";

import { useCallback, useState } from "react";
import { Loader2, Mic, Plus, Sparkles, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/lib/use-local-storage";
import { useSpeech } from "@/lib/use-speech";
import { type Lift, type ParsedSession, type Session, type Unit, today, uid } from "@/lib/types";

type Draft = { date: string; title: string; lifts: Lift[] };

const input =
  "w-full rounded-md border border-input bg-transparent px-2.5 py-2 text-base outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

export function LogView({
  unit,
  knownMovements,
  onSave,
}: {
  unit: Unit;
  knownMovements: string[];
  onSave: (s: Session) => void;
}) {
  // The note survives a locked phone or closed tab until it's saved.
  const [transcript, setTranscript] = useLocalStorage("01-crossfit:note", "");
  const [date, setDate] = useState(today);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const append = useCallback(
    (text: string) => setTranscript((t) => (t ? `${t.trimEnd()} ${text}` : text)),
    [setTranscript],
  );
  const speech = useSpeech(append);

  const blankLift = (): Lift => ({
    id: uid(),
    movement: "",
    sets: null,
    reps: null,
    weight: null,
    unit,
    note: null,
  });

  async function parse() {
    speech.stop();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transcript, today: today(), unit, knownMovements }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Parsing failed.");
        if (res.status === 503) setDraft({ date, title: "", lifts: [blankLift()] });
        return;
      }
      const parsed = data as ParsedSession;
      setDraft({
        date: parsed.date ?? date,
        title: parsed.title,
        lifts: parsed.lifts.map((l) => ({ ...l, id: uid() })),
      });
    } catch {
      setError("Network error. Your note is still here.");
    } finally {
      setBusy(false);
    }
  }

  function save() {
    if (!draft) return;
    const lifts = draft.lifts.filter((l) => l.movement.trim());
    onSave({
      id: uid(),
      date: draft.date,
      title: draft.title.trim() || "Session",
      transcript,
      lifts: lifts.map((l) => ({ ...l, movement: l.movement.trim() })),
      createdAt: Date.now(),
    });
    setDraft(null);
    setTranscript("");
    setDate(today());
  }

  const updateLift = (id: string, patch: Partial<Lift>) =>
    setDraft((d) => d && { ...d, lifts: d.lifts.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  const num = (v: string) => (v.trim() === "" ? null : Number(v));

  if (draft) {
    return (
      <section className="flex flex-col gap-4">
        <div className="flex gap-2">
          <input
            className={input}
            value={draft.title}
            placeholder="Session title"
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <input
            type="date"
            className={`${input} w-auto`}
            value={draft.date}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}

        <ul className="flex flex-col gap-3">
          {draft.lifts.map((l) => (
            <li key={l.id} className="rounded-lg border p-3">
              <div className="flex gap-2">
                <input
                  className={`${input} font-medium`}
                  value={l.movement}
                  placeholder="Movement"
                  list="movements"
                  onChange={(e) => updateLift(l.id, { movement: e.target.value })}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove lift"
                  onClick={() => setDraft({ ...draft, lifts: draft.lifts.filter((x) => x.id !== l.id) })}
                >
                  <Trash2 />
                </Button>
              </div>
              <div className="mt-2 grid grid-cols-[1fr_1fr_1.4fr_auto] gap-2">
                {(["sets", "reps", "weight"] as const).map((k) => (
                  <label key={k} className="flex flex-col gap-1 text-xs text-muted-foreground">
                    {k}
                    <input
                      className={input}
                      inputMode="decimal"
                      value={l[k] ?? ""}
                      onChange={(e) => updateLift(l.id, { [k]: num(e.target.value) })}
                    />
                  </label>
                ))}
                <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                  unit
                  <select
                    className={input}
                    value={l.unit}
                    onChange={(e) => updateLift(l.id, { unit: e.target.value as Unit })}
                  >
                    <option>kg</option>
                    <option>lb</option>
                  </select>
                </label>
              </div>
              <input
                className={`${input} mt-2 text-sm`}
                value={l.note ?? ""}
                placeholder="Note"
                onChange={(e) => updateLift(l.id, { note: e.target.value || null })}
              />
            </li>
          ))}
        </ul>
        <datalist id="movements">
          {knownMovements.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>

        <Button variant="outline" onClick={() => setDraft({ ...draft, lifts: [...draft.lifts, blankLift()] })}>
          <Plus /> Add lift
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={() => setDraft(null)}>
            Back to note
          </Button>
          <Button size="lg" className="flex-[2]" onClick={save}>
            Save session
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <p className="text-muted-foreground">
        Tell it what you did: movements, sets, reps, weights. Like{" "}
        <em>&ldquo;Snatch, worked up to 62 kilos. Then clean and jerk, 5 sets of 2 at 80.&rdquo;</em>
      </p>

      <div className="relative">
        <textarea
          className={`${input} min-h-48 resize-y leading-relaxed`}
          value={transcript}
          placeholder={speech.supported ? "Tap the mic and talk, or type here…" : "Type, or use your keyboard's mic…"}
          onChange={(e) => setTranscript(e.target.value)}
        />
        {speech.interim && (
          <p className="pointer-events-none px-2.5 text-sm italic text-muted-foreground">{speech.interim}…</p>
        )}
      </div>

      {speech.supported && (
        <button
          type="button"
          onClick={speech.listening ? speech.stop : speech.start}
          className={`mx-auto flex size-24 items-center justify-center rounded-full text-primary-foreground shadow-lg transition ${
            speech.listening ? "animate-pulse bg-destructive" : "bg-primary hover:opacity-90"
          }`}
          aria-label={speech.listening ? "Stop dictation" : "Start dictation"}
        >
          {speech.listening ? <Square className="size-8" /> : <Mic className="size-10" />}
        </button>
      )}
      {speech.error && <p className="text-center text-sm text-destructive">{speech.error}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-2">
        <input type="date" className={`${input} w-auto`} value={date} onChange={(e) => setDate(e.target.value)} />
        <Button size="lg" className="flex-1" disabled={!transcript.trim() || busy} onClick={parse}>
          {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {busy ? "Reading your note…" : "Turn into lifts"}
        </Button>
      </div>
      <button
        type="button"
        className="self-center text-sm text-muted-foreground underline underline-offset-4"
        onClick={() => setDraft({ date, title: "", lifts: [blankLift()] })}
      >
        or add lifts by hand
      </button>
    </section>
  );
}
