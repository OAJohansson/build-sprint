"use client";

// The sound drawer (S3/S4, L107): one panel in the crate's place, opened from a lane's "Sound"
// button (add) or by selecting a sound's block (edit). Pick a preset or kit and a pattern, turn three
// knobs live, add it to the lane; on Bass, generate an AI loop like the reference track. Flat, mono,
// one gold primary, no motion (the map's Studio direction).
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { ApiError, mentorApi, money, useAccessCode } from "@/lib/mentor/client";
import { newId } from "@/lib/timeline";
import { DRUM_PATTERNS, KITS, type KitId } from "@/lib/synths/kits";
import { makeKitLoop, makeSynthLoop, type AiLoop, type Sound } from "@/lib/synths/loop";
import { SYNTH_PATTERNS } from "@/lib/synths/patterns";
import { BASS_PRESETS, CHORD_PRESETS, KNOB_BASICS, PRESETS, knobGuide, knobPosition, knobValue, type KnobId, type PresetId } from "@/lib/synths/presets";
import type { Timeline } from "./use-timeline";
import { cx } from "./timeline";
import s from "./sound-drawer.module.css";

const LANE_WORD = ["Drums", "Bass", "Chords"];
const KIT_IDS: KitId[] = ["909", "808"];
const month = () => new Date().toLocaleString("en", { month: "long" });
const fmtKnob = (v: number, unit: string) => unit === "Hz" ? `${v >= 1000 ? (v / 1000).toFixed(1) + " k" : Math.round(v) + " "}Hz` : unit === "s" ? `${v < 1 ? Math.round(v * 1000) + " ms" : v.toFixed(2) + " s"}` : v.toFixed(1);

/** A new sound for a lane: its first preset (or kit) and pattern, with a fresh id. */
function starter(lane: number, choice?: PresetId | KitId, pattern?: string): Sound {
  const id = `snd${newId()}`;
  if (lane === 0) {
    const kit = (choice as KitId) ?? "909";
    return makeKitLoop(kit, pattern ?? DRUM_PATTERNS[DRUM_PATTERNS.length - 1].id, id)!;
  }
  const preset = (choice as PresetId) ?? (lane === 1 ? "sub" : "organ");
  const fits = SYNTH_PATTERNS.filter((p) => (p.presets as string[]).includes(preset));
  return makeSynthLoop(preset, pattern && fits.some((p) => p.id === pattern) ? pattern : fits[0].id, undefined, id)!;
}

type AiResult = { soundId: string; draws: number; costUsd: number; todayUsd: number | null; monthUsd: number | null; bar: number };
type AiState = { is: "idle" } | { is: "waiting" } | { is: "error"; text: string } | { is: "done"; result: AiResult };

export function SoundDrawer({ t, lane, sound, color, onClose }: {
  t: Timeline; lane: number;
  /** Editing this sound (a selected block); null = adding a new one to `lane`. */
  sound: Sound | null;
  color: string; onClose: () => void;
}) {
  const [code] = useAccessCode();
  const [draft, setDraft] = useState<Sound>(() => starter(lane));
  const editing = sound !== null;
  const cur: Sound = sound ?? draft;
  const listening = t.previewSound !== null;
  const [focus, setFocus] = useState<KnobId>("cutoff");
  const [mentor, setMentor] = useState<{ is: "idle" } | { is: "asking" } | { is: "error"; text: string } | { is: "done"; text: string; cost: number }>({ is: "idle" });
  const [ai, setAi] = useState<AiState>({ is: "idle" });
  const bar = Math.max(1, Math.floor(t.playhead));

  // Stop listening when the drawer closes or switches to another sound.
  const stop = useRef(t.setPreviewSound);
  useEffect(() => { stop.current = t.setPreviewSound; });
  useEffect(() => () => stop.current(null), [lane, sound?.id]);

  /** Apply a change: an edited sound changes in the track; a new one in the drawer (and its Listen). */
  const change = (next: Sound, merge?: string) => {
    if (editing) t.updateSound(next, merge);
    else { setDraft(next); if (listening) t.setPreviewSound(next); }
  };

  const pick = (choice: PresetId | KitId) => {
    if (cur.source === "ai") return;
    const next = starter(lane, choice, cur.pattern);
    change({ ...next, id: cur.id });
    setMentor({ is: "idle" });
  };
  const pickPattern = (id: string) => {
    if (cur.source === "ai") return;
    const next = cur.source === "kit" ? makeKitLoop(cur.kit, id, cur.id) : makeSynthLoop(cur.preset, id, cur.knobs, cur.id);
    if (next) change(next);
  };
  const turn = (k: KnobId, position: number) => {
    if (cur.source !== "synth") return;
    const spec = PRESETS[cur.preset].knobs.find((x) => x.id === k)!;
    change({ ...cur, knobs: { ...cur.knobs, [k]: knobValue(spec, position) } }, `knob:${cur.id}:${k}`);
  };

  const askMentor = async () => {
    if (cur.source !== "synth") return;
    setMentor({ is: "asking" });
    const k = cur.knobs;
    // The chat job keeps answers to two sentences (with "Tell me more"), so ask for exactly that.
    const env = PRESETS[cur.preset].knobs[2].label.toLowerCase();
    const message = `In two short sentences: what do cutoff, resonance and ${env} do on my ${PRESETS[cur.preset].name} ${cur.lane === 1 ? "bass" : "chords"} in the Studio, and which one should I turn first for a house track? It's at cutoff ${Math.round(k.cutoff)} Hz, resonance ${k.resonance.toFixed(1)}, ${env} ${k.envelope.toFixed(2)} s.\n\nWhat the knobs do (from Six AM):\n${knobGuide(cur.preset)}`;
    try {
      const reply = await mentorApi(code).ask({ job: "chat", message });
      setMentor({ is: "done", text: reply.answer.sentences.map((x) => x.text).join(" "), cost: reply.message.costUsd });
    } catch (e) {
      setMentor({ is: "error", text: e instanceof ApiError ? e.message : "The Mentor didn't answer. Try again." });
    }
  };

  const fromTrack = t.doc.bpm !== undefined && !!t.doc.key;
  const generate = async () => {
    if (!fromTrack) return;
    setAi({ is: "waiting" });
    try {
      const res = await fetch("/api/loops/generate", {
        method: "POST",
        headers: { "content-type": "application/json", "x-access-code": code },
        // The track's own tempo and key always go along (the template's refined tempo wins); the
        // analysis id only adds the reference's style words, and a missing one is no error.
        body: JSON.stringify({ ...(t.doc.analysisId ? { analysisId: t.doc.analysisId } : {}), analysis: { bpm: t.doc.bpm, key: t.doc.key!.key, scale: t.doc.key!.scale }, bars: 4, tz: new Date().getTimezoneOffset() }),
      }).catch(() => null);
      if (!res) { setAi({ is: "error", text: "No connection. Check your internet and try again." }); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const text = res.status === 429 ? (data.error ?? "That's today's limit for AI loops. More tomorrow.")
          : res.status === 503 ? "AI loops aren't set up on this server yet."
          : res.status === 401 ? "Your access code didn't work. Reload and enter it again."
          : (data.error ?? "The AI loop service failed. Try again in a minute.");
        setAi({ is: "error", text });
        return;
      }
      const loop = data.loop, m = data.measured;
      const aiId: string = loop.id ?? crypto.randomUUID();
      const x: AiLoop = {
        id: `snd${newId()}`, source: "ai", name: "AI bass loop", bars: 4, lane: 1, aiId,
        bpm: loop.bpm, key: loop.key, scale: loop.scale === "major" ? "major" : "minor",
        measured: m ? { bpm: m.bpm, key: m.key, scale: m.scale } : null,
        checked: data.checked === true, costUsd: data.costUsd ?? 0, draws: data.draws ?? 1,
      };
      const bytes = Uint8Array.from(atob(data.audio.base64), (c) => c.charCodeAt(0)).buffer;
      await t.engine().then((e) => e.addAiAudio(aiId, bytes));
      t.addSound(x, bar);
      setAi({ is: "done", result: { soundId: x.id, draws: x.draws, costUsd: x.costUsd, todayUsd: data.usage?.todayUsd ?? x.costUsd, monthUsd: data.usage?.monthUsd ?? x.costUsd, bar } });
    } catch {
      setAi({ is: "error", text: "Something went wrong making the loop. Try again." });
    }
  };

  const choices: (PresetId | KitId)[] = lane === 0 ? KIT_IDS : lane === 1 ? BASS_PRESETS : CHORD_PRESETS;
  const chosen = cur.source === "kit" ? cur.kit : cur.source === "synth" ? cur.preset : null;
  const patterns = cur.source === "kit" ? DRUM_PATTERNS : cur.source === "synth" ? SYNTH_PATTERNS.filter((p) => (p.presets as string[]).includes(cur.preset)) : [];
  const focusKnob = cur.source === "synth" ? PRESETS[cur.preset].knobs.find((k) => k.id === focus)! : null;
  // The one line under the sliders: the knob being touched; for a kit, what its pattern does.
  const line = focusKnob ? <><b>{focusKnob.label}:</b> {focusKnob.explain}</>
    : cur.source === "kit" ? DRUM_PATTERNS.find((p) => p.id === cur.pattern)?.idiom
    : "Plays once every 4 bars on the grid. An AI loop's notes are fixed, so it has no knobs.";
  // AI cost, once, in the Mentor's format.
  const aiLoop = cur.source === "ai" ? cur : null;
  const fresh = ai.is === "done" && (!aiLoop || ai.result.soundId === aiLoop.id) ? ai.result : null;
  const result: Omit<AiResult, "soundId" | "bar"> | null = fresh ?? (aiLoop ? { costUsd: aiLoop.costUsd, draws: aiLoop.draws, todayUsd: null, monthUsd: null } : null);
  const costLine = result ? [money(result.costUsd), result.draws > 1 ? `${result.draws} tries` : null,
    result.todayUsd !== null ? `today ${money(result.todayUsd)}` : null, result.monthUsd !== null ? `${month()} ${money(result.monthUsd)}` : null]
    .filter(Boolean).join(" · ") + " (estimate)" : null;

  return (
    <aside className={cx(s.drawer, lane === 1 && s.withAi)} style={{ ["--c" as string]: color }} aria-label={cur.source === "ai" ? "AI bass loop" : `${LANE_WORD[lane]} sound`}>
      {mentor.is === "done" || mentor.is === "error" ? (
        <div className={s.answer} role="status">
          <p>{mentor.text}{mentor.is === "done" ? <span className={s.dim}> {money(mentor.cost)} (estimate)</span> : null}</p>
          <button className={s.link} onClick={() => setMentor({ is: "idle" })}>Hide</button>
        </div>
      ) : null}
      <div className={s.body}>
        <section className={s.pick}>
          {aiLoop ? (
            <AiFacts x={aiLoop} />
          ) : (
            <>
              <div className={s.choices} role="radiogroup" aria-label={lane === 0 ? "Kit" : "Preset"}>
                {choices.map((c) => (
                  <button key={c} role="radio" aria-checked={chosen === c} className={cx(s.choice, chosen === c && s.on)} onClick={() => pick(c)}
                    title={lane === 0 ? KITS[c as KitId].about : PRESETS[c as PresetId].about}>
                    {lane === 0 ? KITS[c as KitId].name : PRESETS[c as PresetId].name}
                  </button>
                ))}
              </div>
              <ul className={s.patterns} aria-label="Pattern">
                {patterns.map((p) => (
                  <li key={p.id}>
                    <button className={cx(s.pattern, "pattern" in cur && cur.pattern === p.id && s.patternOn)} aria-pressed={"pattern" in cur && cur.pattern === p.id} title={p.idiom} onClick={() => pickPattern(p.id)}>
                      <span>{p.name}</span><em>{p.bars} {p.bars === 1 ? "bar" : "bars"}</em>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className={s.shape}>
          {cur.source === "synth" ? PRESETS[cur.preset].knobs.map((k) => (
            <label key={k.id} className={s.knob} onPointerEnter={() => setFocus(k.id)}>
              <span className={s.knobName}>{k.label}</span>
              <input
                type="range" min={0} max={1000} step={1}
                value={Math.round(knobPosition(k, cur.knobs[k.id]) * 1000)}
                onFocus={() => setFocus(k.id)}
                onPointerDown={() => setFocus(k.id)}
                onChange={(e) => turn(k.id, Number(e.target.value) / 1000)}
                aria-valuetext={fmtKnob(cur.knobs[k.id], k.unit)}
              />
              <output className={s.knobValue}>{fmtKnob(cur.knobs[k.id], k.unit)}</output>
            </label>
          )) : null}
          <p className={s.line}>{line}</p>
          {cur.source !== "ai" ? (
            <div className={s.row}>
              <button className={s.secondary} aria-pressed={listening} onClick={() => t.setPreviewSound(listening ? null : cur)}>{listening ? "Stop" : "Listen"}</button>
              {editing ? <span className={s.dim}>Changes apply to every block of this sound.</span> : (
                <button className={s.primary} onClick={() => { t.setPreviewSound(null); t.addSound(draft, bar); setDraft(starter(lane, chosen ?? undefined, "pattern" in draft ? draft.pattern : undefined)); }}>
                  Add to lane at bar {bar}
                </button>
              )}
              {cur.source === "synth" ? (
                <button className={s.link} onClick={askMentor} disabled={mentor.is === "asking"} title={KNOB_BASICS[focus]}>
                  {mentor.is === "asking" ? "The Mentor is answering…" : "Ask the Mentor about these knobs"}
                </button>
              ) : null}
            </div>
          ) : null}
        </section>

        {lane === 1 ? (
          <section className={s.ai}>
            <button className={s.link} onClick={generate} disabled={!fromTrack || ai.is === "waiting"}>Generate a bass loop like this track</button>
            {!fromTrack ? <p className={s.dim}>Start a track from a map first: the loop copies that track&apos;s tempo and key.</p>
              : ai.is === "waiting" ? <p className={s.dim} role="status">Making a 4-bar loop at {t.doc.bpm} BPM in {t.doc.key!.key} {t.doc.key!.scale}. This takes 5–30 seconds.</p>
              : ai.is === "error" ? <p className={s.err} role="alert">{ai.text}</p>
              : costLine ? <p className={s.dim} role="status">{fresh ? `Added at bar ${fresh.bar}. ` : ""}{costLine}</p>
              : <p className={s.dim}>About $0.08 a try, up to 3 tries if a loop misses the tempo or key.</p>}
          </section>
        ) : null}
      </div>
      <button className={s.close} onClick={onClose} aria-label="Close the sound drawer"><X aria-hidden /></button>
    </aside>
  );
}

/** What an AI loop is: made at, measured, and whether it passed the check (plain words). */
function AiFacts({ x }: { x: AiLoop }) {
  const m = x.measured;
  const offTempo = m ? Math.abs(m.bpm - x.bpm) > 1 : false;
  const warn = !x.checked ? (offTempo ? "may be off tempo" : "may be off key") : null;
  return (
    <div className={s.facts}>
      <p>AI bass loop · {x.bars} bars</p>
      <p>Made at {x.bpm} BPM in {x.key} {x.scale}.</p>
      {m ? <p>Measured {m.bpm.toFixed(1)} BPM, {m.key} {m.scale}{warn ? <> — <b className={s.warn}>{warn}</b></> : null}</p>
        : <p>Not measured{warn ? <> — <b className={s.warn}>{warn}</b></> : null}</p>}
    </div>
  );
}
