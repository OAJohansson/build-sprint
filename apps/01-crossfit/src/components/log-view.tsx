"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2, Mic, Plus, Sparkles, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/lib/use-local-storage";
import { useSpeech } from "@/lib/use-speech";
import { DEMO_NOTE, DEMO_RESULT } from "@/lib/demo";
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
  const [accessCode, setAccessCode] = useLocalStorage("01-crossfit:access-code", "");
  const [needCode, setNeedCode] = useState(false);
  const [demo, setDemo] = useState(false);
  const [codeInput, setCodeInput] = useState("");

  // Text typed before the mic was tapped; dictation is placed after it.
  const base = useRef("");
  const onDictation = useCallback(
    (spoken: string) => setTranscript(base.current ? `${base.current} ${spoken}` : spoken),
    [setTranscript],
  );
  const speech = useSpeech(onDictation);
  const startDictation = () => {
    base.current = transcript.trimEnd();
    speech.start();
  };

  const blankLift = (): Lift => ({
    id: uid(),
    movement: "",
    sets: null,
    reps: null,
    weight: null,
    unit,
    note: null,
  });

  const toDraft = (parsed: ParsedSession): Draft => ({
    date: parsed.date ?? date,
    title: parsed.title,
    lifts: parsed.lifts.map((l) => ({ ...l, id: uid() })),
  });

  function tryDemo() {
    setTranscript(DEMO_NOTE);
    setNeedCode(false);
    setError(null);
    setDemo(true);
    setDraft(toDraft(DEMO_RESULT));
  }

  async function parse(code = accessCode) {
    speech.stop();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "content-type": "application/json", "x-access-code": code },
        body: JSON.stringify({ transcript, today: today(), unit, knownMovements }),
      });
      const data = await res.json();
      if (res.status === 401) {
        setAccessCode("");
        setNeedCode(true);
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Parsing failed.");
        if (res.status === 503) setDraft({ date, title: "", lifts: [blankLift()] });
        return;
      }
      setNeedCode(false);
      setDemo(false);
      setDraft(toDraft(data as ParsedSession));
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
        {demo && (
          <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            Demo: this is what Claude returns for the example note (pre-made, no AI call). Edit it and save to
            see History and Progress.
          </p>
        )}

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
          onClick={speech.listening ? speech.stop : startDictation}
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
        <Button size="lg" className="flex-1" disabled={!transcript.trim() || busy} onClick={() => parse()}>
          {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {busy ? "Reading your note…" : "Turn into lifts"}
        </Button>
      </div>
      {needCode && (
        <form
          className="flex flex-col gap-2 rounded-lg border p-3"
          onSubmit={(e) => {
            e.preventDefault();
            setAccessCode(codeInput.trim());
            parse(codeInput.trim());
          }}
        >
          <p className="text-sm">
            Voice parsing is limited to the owner to keep AI costs in check. Have the code? Enter it once
            and this device remembers it.
          </p>
          <div className="flex gap-2">
            <input
              className={input}
              type="password"
              placeholder="Access code"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
            />
            <Button type="submit" disabled={!codeInput.trim() || busy}>
              Unlock
            </Button>
          </div>
          <Button type="button" variant="outline" onClick={tryDemo}>
            No code? Try the demo
          </Button>
        </form>
      )}

      <div className="flex justify-center gap-4 text-sm text-muted-foreground">
        <button
          type="button"
          className="underline underline-offset-4"
          onClick={() => setDraft({ date, title: "", lifts: [blankLift()] })}
        >
          Add lifts by hand
        </button>
        <button type="button" className="underline underline-offset-4" onClick={tryDemo}>
          Try an example
        </button>
      </div>
    </section>
  );
}
