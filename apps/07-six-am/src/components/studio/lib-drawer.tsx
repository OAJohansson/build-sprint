"use client";

// A library block's sound in the Studio (S5, L158: "stays editable in the Studio"): Make's preset
// and its six macros, with the word under each, as in Make. It edits the track's own copy (L199),
// so the library and other tracks don't change. The pattern stays as saved (transposed to the
// track's key on play, L197).
import { X } from "lucide-react";
import { editLibLoop, type LibLoop } from "@/lib/make/lib-loop";
import { MACRO_IDS, MACRO_SPECS, MAKE_PRESETS, MAKE_PRESET_IDS, macroWord, type MacroId } from "@/lib/make/presets";
import type { Timeline } from "./use-timeline";
import { cx } from "./lanes";
import s from "./sound-drawer.module.css";

export function LibDrawer({ t, sound, color, onClose }: { t: Timeline; sound: LibLoop; color: string; onClose: () => void }) {
  const listening = t.previewSound?.id === sound.id;
  const change = (next: LibLoop, merge?: string) => {
    t.updateSound(next, merge);
    if (listening) t.setPreviewSound(next);
  };
  const blocks = t.doc.regions.filter((r) => r.loopId === sound.id).length;
  return (
    <aside className={s.drawer} style={{ ["--c" as string]: color }} aria-label={`${sound.name}, a sound from your library`}>
      <div className={s.top}>
        <button className={s.close} onClick={onClose} aria-label="Close the sound drawer"><X aria-hidden /></button>
      </div>
      <div className={s.body}>
        <section className={s.pick}>
          <div className={s.choices} style={{ flexWrap: "wrap", gap: "4px 16px" }} role="radiogroup" aria-label="Preset">
            {MAKE_PRESET_IDS.map((id) => (
              <button key={id} role="radio" aria-checked={sound.preset === id} className={cx(s.choice, sound.preset === id && s.on)} title={MAKE_PRESETS[id].about}
                onClick={() => change(editLibLoop(sound, { preset: id }))}>{MAKE_PRESETS[id].name}</button>
            ))}
          </div>
          <p className={s.dim}>{sound.name}. Saved in {sound.key} {sound.scale} at {Math.round(sound.bpm)} BPM; it plays in the track&apos;s key and tempo.</p>
        </section>
        <section className={s.shape}>
          {MACRO_IDS.map((id: MacroId) => (
            <label key={id} className={s.knob} title={MACRO_SPECS[id].explain}>
              <span className={s.knobName}>{MACRO_SPECS[id].name}</span>
              <input type="range" min={0} max={1000} step={1} value={Math.round(sound.macros[id] * 1000)}
                onChange={(e) => change(editLibLoop(sound, { macros: { [id]: Number(e.target.value) / 1000 } }), `lib:${sound.id}:${id}`)}
                aria-valuetext={macroWord(id, sound.macros[id])} />
              <output className={s.knobValue}>{macroWord(id, sound.macros[id])}</output>
            </label>
          ))}
        </section>
        <section className={s.ai}>
          <div className={s.row}>
            <button className={s.secondary} aria-pressed={listening} onClick={() => t.setPreviewSound(listening ? null : sound)}>{listening ? "Stop" : "Listen"}</button>
          </div>
          <p className={s.dim}>Changes apply to {blocks === 1 ? "this block" : `all ${blocks} blocks of this sound`} in this track; your library keeps the original.</p>
        </section>
      </div>
    </aside>
  );
}
