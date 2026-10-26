"use client";

// A library block's sound in the Studio (S5, L158: "stays editable in the Studio"): Make's preset
// and its six macros, with the word under each, as in Make. It edits the track's own copy (L199),
// so the library and other tracks don't change. The pattern stays as saved (transposed to the
// track's key on play, L197).
import { ChevronDown, X } from "lucide-react";
import { editLibLoop, type LibLoop } from "@/lib/make/lib-loop";
import { MACRO_IDS, MAKE_PRESETS, MAKE_PRESET_IDS, type MacroId, type MakePresetId } from "@/lib/make/presets";
import { Knob } from "@/components/ui/knob";
import type { Timeline } from "./use-timeline";
import s from "./sound-drawer.module.css";
import l from "./lanes.module.css";

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
          {/* T110: one picker labelled with the current preset (four tabs wrapped in 300 px); what it is, under it. */}
          <label className={l.presetPick}>
            <span className={l.presetLabel}>Preset</span>
            <select value={sound.preset} onChange={(e) => change(editLibLoop(sound, { preset: e.target.value as MakePresetId }))} aria-label="Preset">
              {MAKE_PRESET_IDS.map((id) => <option key={id} value={id}>{MAKE_PRESETS[id].name}</option>)}
            </select>
            <ChevronDown aria-hidden />
          </label>
          <p className={s.dim}>{MAKE_PRESETS[sound.preset].about}</p>
          <p className={s.dim}>{sound.name}: saved in {sound.key} {sound.scale} at {Math.round(sound.bpm)} BPM; plays in the track&apos;s key and tempo.</p>
        </section>
        {/* T110: the Make room's own knobs (components/ui/knob), so a sound turns the same in both places. */}
        <section className={s.shape} style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
          {MACRO_IDS.map((id: MacroId) => (
            <Knob key={id} id={id} value={sound.macros[id]} color={color} disabled={false} reset={MAKE_PRESETS[sound.preset].macros[id]}
              onChange={(v) => change(editLibLoop(sound, { macros: { [id]: v } }), `lib:${sound.id}:${id}`)} size={72} />
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
