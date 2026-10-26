"use client";

// The sound drawer (S3/S4, L107): one panel in the crate's place, opened from a lane's "Sound"
// button (add) or by selecting a sound's block (edit). Pick a preset or kit and a pattern, turn three
// knobs live, add it to the lane; on Bass, generate an AI loop like the reference track. Flat, mono,
// one gold primary, no motion (the map's Studio direction).
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { ApiError, mentorApi, money, useAccessCode } from "@/lib/mentor/client";
import { firstFreeBar, newId } from "@/lib/timeline";
import { aiCostLine, triesReason, type Try } from "@/lib/synths/ai-text";
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
  // A preset's own pattern first (Pad → Sustained Pad, not the Rhodes Nines it also plays).
  const own = fits.find((p) => p.presets[0] === preset) ?? fits[0];
  return makeSynthLoop(preset, pattern && fits.some((p) => p.id === pattern) ? pattern : own.id, undefined, id)!;
}

/** One of this track's stored AI loops, as GET /api/loops/generate?analysisId= lists it (numbers only). */
type Listed = { id: string; bpm: number; key: string; scale: string; bars: number; costUsd: number; draws: number; checked: boolean; measured: { bpm: number; key: string; scale: string } | null; createdAt: string };
type AiState = { is: "idle" } | { is: "waiting" } | { is: "error" | "limit"; text: string } | { is: "done"; id: string; bar: number | null; why: string | null; missed: boolean };
const usdShort = (v: number) => `$${v.toFixed(2)}`;
/** N2: why a stored loop missed the check, from what was measured; null when it passed. */
const missTag = (l: { bpm: number; checked: boolean; measured: { bpm: number } | null }) =>
  l.checked ? null : !l.measured ? "not measured" : Math.abs(l.measured.bpm - l.bpm) > 1 ? "off tempo" : "off key";

export function SoundDrawer({ t, lane, sound, color, onClose, onNewSound }: {
  t: Timeline; lane: number;
  /** Editing this sound (a selected block); null = adding a new one to `lane`. */
  sound: Sound | null;
  color: string; onClose: () => void;
  /** M1 (T79): another preset or kit picked on a selected block: leave that sound alone and add a new one. */
  onNewSound: () => void;
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
    // shortcut: a library block (S5, source "lib") opens read-only here like an AI loop; its own editor comes with the lane UI.
    if (cur.source === "ai" || cur.source === "lib") return;
    setMentor({ is: "idle" });
    const same = cur.source === "kit" ? cur.kit === choice : cur.preset === choice;
    if (editing && !same) {
      // M1 (T79): picking another preset on a selected block starts a NEW sound in add mode; the
      // selected sound and all its blocks stay exactly as they were.
      const name = lane === 0 ? KITS[choice as KitId].name : PRESETS[choice as PresetId].name;
      const was = cur.source === "kit" ? KITS[cur.kit].name : PRESETS[cur.preset].name;
      setDraft(starter(lane, choice));
      setAddNote(`New ${name} sound. Your ${was} blocks stay as they are.`);
      onNewSound();
      return;
    }
    change({ ...starter(lane, choice, cur.pattern), id: cur.id });
  };
  const pickPattern = (id: string) => {
    if (cur.source === "ai" || cur.source === "lib") return;
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
    // F9: the history shows only the short question; the knob guide and settings go as hidden context.
    const message = `What do cutoff, resonance and ${env} do on my ${PRESETS[cur.preset].name} ${cur.lane === 1 ? "bass" : "chords"}, and which should I turn first?`;
    // F8: the Studio has no automation, so advice must be about one setting per sound.
    const context = `Answer in two short sentences, for a house track. Current settings: cutoff ${Math.round(k.cutoff)} Hz, resonance ${k.resonance.toFixed(1)}, ${env} ${k.envelope.toFixed(2)} s.\nWhat the knobs do (from Six AM):\n${knobGuide(cur.preset)}\nThe Six AM Studio has no automation: knobs are set once per sound and don't move over time. Knobs belong to the sound, so every block of one sound sounds the same. To change the sound for a part (e.g. a brighter filter for the drop), add the same preset again as a second sound with different knob settings ("Duplicate" in the drawer copies the current sound with its knobs; picking another preset on a block starts a new sound) and use that one there. Never suggest automating or sweeping a knob during playback.`;
    try {
      const reply = await mentorApi(code).ask({ job: "chat", message, context });
      setMentor({ is: "done", text: reply.answer.sentences.map((x) => x.text).join(" "), cost: reply.message.costUsd });
    } catch (e) {
      setMentor({ is: "error", text: e instanceof ApiError ? e.message : "The Mentor didn't answer. Try again." });
    }
  };

  const fromTrack = t.doc.bpm !== undefined && !!t.doc.key;
  const tz = () => new Date().getTimezoneOffset();

  // F2: this track's AI loops (stored server-side, newest first) and today's / this month's spend.
  const [mine, setMine] = useState<Listed[]>([]);
  const [usage, setUsage] = useState<{ todayUsd: number; monthUsd: number } | null>(null);
  const analysisId = t.doc.analysisId;
  useEffect(() => {
    if (lane !== 1 || !code) return;
    let live = true;
    const q = `/api/loops/generate?tz=${tz()}${analysisId ? `&analysisId=${encodeURIComponent(analysisId)}` : ""}`;
    fetch(q, { headers: { "x-access-code": code } }).then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (!live || !d) return;
      if (d.usage) setUsage({ todayUsd: d.usage.todayUsd, monthUsd: d.usage.monthUsd });
      if (Array.isArray(d.loops)) setMine(d.loops);
    }).catch(() => {});
    return () => { live = false; };
  }, [lane, code, analysisId]);

  /** A stored loop as a sound for the Bass lane (a new sound id each time it's added). */
  const asSound = (l: Listed): AiLoop => ({
    id: `snd${newId()}`, source: "ai", name: "AI bass loop", bars: l.bars === 8 ? 8 : 4, lane: 1, aiId: l.id,
    bpm: l.bpm, key: l.key, scale: l.scale === "major" ? "major" : "minor",
    measured: l.measured ? { bpm: l.measured.bpm, key: l.measured.key, scale: l.measured.scale === "major" ? "major" : "minor" } : null,
    checked: l.checked, costUsd: l.costUsd, draws: l.draws,
  });
  /** F1: into the first empty bars at or after the playhead, never over another block. */
  const place = (x: AiLoop): number | null => {
    const at = firstFreeBar(t.doc.regions, 1, x.bars, bar, t.bars);
    if (at !== null) t.addSound(x, at);
    return at;
  };

  const generate = async () => {
    if (!fromTrack) return;
    setAi({ is: "waiting" });
    try {
      const res = await fetch("/api/loops/generate", {
        method: "POST",
        headers: { "content-type": "application/json", "x-access-code": code },
        // The track's own tempo and key always go along (the template's refined tempo wins); the
        // analysis id only adds the reference's style words, and a missing one is no error.
        body: JSON.stringify({ ...(analysisId ? { analysisId } : {}), analysis: { bpm: t.doc.bpm, key: t.doc.key!.key, scale: t.doc.key!.scale }, bars: 4, tz: tz() }),
      }).catch(() => null);
      if (!res) { setAi({ is: "error", text: "No connection. Check your internet and try again." }); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 429) { setAi({ is: "limit", text: data.error ?? "That's today's limit for AI loops. More tomorrow." }); return; }
        const text = res.status === 503 ? "AI loops aren't set up on this server yet."
          : res.status === 401 ? "Your access code didn't work. Reload and enter it again."
          : (data.error ?? "The AI loop service failed. Try again in a minute.");
        setAi({ is: "error", text });
        return;
      }
      const loop = data.loop, m = data.measured;
      const listed: Listed = {
        id: loop.id ?? crypto.randomUUID(), bpm: loop.bpm, key: loop.key, scale: loop.scale, bars: loop.bars ?? 4,
        costUsd: data.costUsd ?? 0, draws: data.draws ?? 1, checked: data.checked === true,
        measured: m ? { bpm: m.bpm, key: m.key, scale: m.scale } : null, createdAt: new Date().toISOString(),
      };
      const bytes = Uint8Array.from(atob(data.audio.base64), (c) => c.charCodeAt(0)).buffer;
      await t.engine().then((e) => e.addAiAudio(listed.id, bytes));
      if (data.usage) setUsage({ todayUsd: data.usage.todayUsd, monthUsd: data.usage.monthUsd });
      // F2: a new loop joins the list; it never replaces an earlier one.
      setMine((list) => [listed, ...list.filter((x) => x.id !== listed.id)].slice(0, 10));
      const tries: Try[] = Array.isArray(data.tries) ? data.tries : [];
      // N1: a loop that missed the tempo/key check stays in Your loops ("Add anyway"), off the lane.
      setAi({ is: "done", id: listed.id, bar: listed.checked ? place(asSound(listed)) : null, why: triesReason(tries), missed: !listed.checked });
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
  const aiLoop = cur.source === "ai" ? cur : null;
  // F10: the template's first drop, by its marker label.
  const drop = t.markers.find((m) => /drop/i.test(m.label));
  const [where, setWhere] = useState<"playhead" | "drop">("playhead");
  /** Where Add or Duplicate put the sound (or that it couldn't), or that a new preset starts a new sound (M1). */
  const [addNote, setAddNote] = useState<string | null>(null);
  const atDrop = where === "drop" && !!drop && drop.bar !== bar;
  const at = atDrop ? drop!.bar : bar;
  const listenTo = (x: Sound) => t.setPreviewSound(t.previewSound?.id === x.id ? null : x);
  // One cost line in every state (the Mentor's form): the selected or newest loop, plus today / month.
  // A loop just made (placed, or kept off the lane after a missed check) is the subject until another is picked.
  const justMade = ai.is === "done" && (!aiLoop || ai.missed || aiLoop.aiId === ai.id) ? mine.find((l) => l.id === ai.id) : undefined;
  const shown = justMade ?? (aiLoop ? mine.find((l) => l.id === aiLoop.aiId) ?? { costUsd: aiLoop.costUsd, draws: aiLoop.draws } : mine[0] ?? null);
  const costLine = shown ? aiCostLine(shown.costUsd, shown.draws, usage?.todayUsd ?? null, usage?.monthUsd ?? null, month()) : null;
  // Listen from the list: a stable preview id per stored loop, so Stop finds it again.
  const previewOf = (l: Listed): AiLoop => ({ ...asSound(l), id: `listen-${l.id}` });

  return (
    <aside className={s.drawer} style={{ ["--c" as string]: color }} aria-label={cur.source === "ai" ? "AI bass loop" : `${LANE_WORD[lane]} sound`}>
      <div className={s.top}>
        {mentor.is === "done" || mentor.is === "error" ? (
          <button className={s.link} onClick={() => setMentor({ is: "idle" })}>Hide answer</button>
        ) : null}
        <button className={s.close} onClick={onClose} aria-label="Close the sound drawer"><X aria-hidden /></button>
      </div>
      <div className={s.body}>
        <section className={s.pick}>
          {aiLoop ? (
            <AiFacts x={aiLoop} why={ai.is === "done" && ai.id === aiLoop.aiId ? ai.why : null} />
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
          {mentor.is === "done" || mentor.is === "error" ? (
            // The Mentor's answer takes the knob line's place, fixed height, its own scroll (critic r2).
            <div className={s.answer} role="status" tabIndex={0} aria-label="The Mentor's answer">
              <p>{mentor.text}{mentor.is === "done" ? <span className={s.dim}> {money(mentor.cost)} (estimate)</span> : null}</p>
            </div>
          ) : (
            <p className={s.line}>{line}</p>
          )}
          {cur.source !== "ai" ? (
            <>
              <div className={s.row}>
                <button className={s.secondary} aria-pressed={listening && t.previewSound?.id === cur.id} onClick={() => listenTo(cur)}>{listening && t.previewSound?.id === cur.id ? "Stop" : "Listen"}</button>
                {editing ? (
                  // N3: knobs belong to the sound; a copy with its own knobs is how a part gets a different sound.
                  // N2 (re-check): the copy goes into the first free bars at or after `at` (as AI loops do),
                  // never over another block; with no room it says so.
                  <button className={s.secondary} title="A copy of this sound with its own knobs, in the first free bars" aria-label="Duplicate this sound (its own knobs)" onClick={() => {
                    t.setPreviewSound(null);
                    const free = firstFreeBar(t.doc.regions, cur.lane, cur.bars, at, t.bars);
                    if (free === null) { setAddNote(`No free bars on this lane after bar ${at}: make room first.`); return; }
                    setAddNote(free !== at ? `Added at bar ${free}, the first free bars after bar ${at}.` : null);
                    t.addSound({ ...cur, id: `snd${newId()}` }, free);
                  }}>
                    Duplicate
                  </button>
                ) : (
                  <button className={s.primary} onClick={() => {
                    // Like AI loops and Duplicate: the first free bars at or after the chosen bar, never over a block.
                    t.setPreviewSound(null);
                    const free = firstFreeBar(t.doc.regions, draft.lane, draft.bars, at, t.bars);
                    if (free === null) { setAddNote(`No free bars on this lane after bar ${at}: make room first.`); return; }
                    t.addSound(draft, free);
                    setAddNote(`Added at bar ${free}${free !== at ? `, the first free bars after bar ${at}` : ""}.`);
                    setDraft(starter(lane, chosen ?? undefined, "pattern" in draft && typeof draft.pattern === "string" ? draft.pattern : undefined));
                  }}>
                    {atDrop ? `Add at the ${drop!.label.toLowerCase()} (bar ${drop!.bar})` : "Add to lane"}
                  </button>
                )}
                {addNote ? <span className={s.dim} role="status">{addNote}</span> : null}
                {cur.source === "synth" ? (
                  <button className={s.link} onClick={askMentor} disabled={mentor.is === "asking"} title={KNOB_BASICS[focus]}>
                    {mentor.is === "asking" ? "The Mentor is answering…" : "Ask the Mentor about these knobs"}
                  </button>
                ) : null}
              </div>
              {/* F10: where Add (or a new sound) goes: the playhead, or the template's drop. In edit mode the
                  same line first says that knob changes reach every block of this sound. */}
              {editing && !(drop && drop.bar !== bar) ? <p className={s.dim}>Changes apply to every block of this sound.</p> : (
                <p className={s.where} role="radiogroup" aria-label="Where to add">
                  {editing ? <span>Changes apply to every block. New sound:&nbsp;</span> : null}
                  <button role="radio" aria-checked={!atDrop} className={cx(s.whereBtn, !atDrop && s.whereOn)} onClick={() => setWhere("playhead")}>at bar {bar}</button>
                  {drop && drop.bar !== bar ? <>
                    <span aria-hidden> · </span>
                    <button role="radio" aria-checked={atDrop} className={cx(s.whereBtn, atDrop && s.whereOn)} onClick={() => setWhere("drop")}>at the {drop.label.toLowerCase()} (bar {drop.bar})</button>
                  </> : null}
                </p>
              )}
            </>
          ) : null}
        </section>

        <section className={s.ai}>
          {lane === 1 ? (
            <>
              <button className={s.link} onClick={generate} disabled={!fromTrack || ai.is === "waiting"}>Generate a bass loop like this track</button>
              {!fromTrack ? <p className={s.dim}>Start a track from a map first: the loop copies that track&apos;s tempo and key.</p>
                : ai.is === "waiting" ? <p className={s.dim} role="status">Making a 4-bar loop at {t.doc.bpm} BPM in {t.doc.key!.key} {t.doc.key!.scale}. This takes 5–30 seconds.</p>
                : ai.is === "error" ? <p className={s.err} role="alert">{ai.text}</p>
                : ai.is === "limit" ? <p className={s.dim} role="status">{ai.text}</p>
                : ai.is === "done" ? (
                  <p className={s.dim} role="status">
                    {ai.missed ? "It missed the tempo or key check, so it's not on the lane: it's in your loops below." : ai.bar !== null ? `Added at bar ${ai.bar}.` : "The Bass lane is full: it's in your loops below."}
                  </p>
                ) : costLine ? null : <p className={s.dim}>About $0.08 a try, up to 3 tries ($0.24).</p>}
              {costLine ? <p className={s.dim}>{costLine}</p> : null}
              {mine.length ? (
                <div className={s.mine}>
                  <h3 className={s.mineHead}>Your loops</h3>
                  <ul>
                    {mine.map((l, i) => {
                      const x = previewOf(l), on = t.previewSound?.id === x.id;
                      return (
                        <li key={l.id} className={cx(s.loop, aiLoop?.aiId === l.id && s.loopOn)} aria-current={aiLoop?.aiId === l.id || undefined}>
                          {/* N2: what was measured, with a short tag when the check missed. */}
                          <span title={`Loop ${mine.length - i}: asked for ${l.bpm} BPM in ${l.key} ${l.scale}; ${usdShort(l.costUsd)}${l.draws > 1 ? `, ${l.draws} tries` : ""}`}>
                            {l.measured ? `${l.measured.bpm.toFixed(1)} BPM · ${l.measured.key}${l.measured.scale === "minor" ? "m" : ""}` : `${l.bpm} BPM · not measured`}
                            {missTag(l) ? <b className={s.tag}> · {missTag(l)}</b> : null}
                          </span>
                          <button className={s.mini} aria-pressed={on} onClick={() => listenTo(x)}>{on ? "Stop" : "Listen"}</button>
                          <button className={s.mini} onClick={() => { const at = place(asSound(l)); if (at === null) setAi({ is: "limit", text: "The Bass lane is full: make room, then add it." }); }}>{l.checked ? "Add" : "Add anyway"}</button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </>
          ) : null}
        </section>
      </div>
    </aside>
  );
}

/** What an AI loop is: made at, measured, and whether it passed the check (plain words). */
function AiFacts({ x, why }: { x: AiLoop; why: string | null }) {
  const m = x.measured;
  const offTempo = m ? Math.abs(m.bpm - x.bpm) > 1 : false;
  const warn = !x.checked ? (offTempo ? "may be off tempo" : "may be off key") : null;
  return (
    <div className={s.facts}>
      <p>AI bass loop · {x.bars} bars</p>
      <p>Made at {x.bpm} BPM in {x.key} {x.scale}.</p>
      {m ? <p>Measured {m.bpm.toFixed(1)} BPM, {m.key} {m.scale}{warn ? <> — <b className={s.warn}>{warn}</b></> : null}</p>
        : <p>Not measured{warn ? <> — <b className={s.warn}>{warn}</b></> : null}</p>}
      {why ? <p className={s.dim}>{why}</p> : null}
    </div>
  );
}
