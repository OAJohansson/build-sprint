"use client";

// Per-lane volume, pan, mute and solo in the audio graph (S5, L159, T102): one Tone.Channel per lane
// into the output, set from laneMix() (studio-lanes.ts, where the mute/solo rules are tested). A
// sound's voice connects to its lane's channel (input(id)). Not wired into audio.ts yet: the
// 4-lane Studio keeps its 4 channels until the lane UI lands.
// shortcut: crate loops share one instrument set per old lane (audio.ts makeInstruments), so they
// can't take a lane's pan; when the lane UI lands, either build crate instruments per lane on first
// use or route crate notes by velocity (volume and mute/solo only). Decide with the lane UI.
import * as Tone from "tone";
import { laneMix, type Lane } from "./studio-lanes";

const RAMP = 0.02; // seconds: fader and pan moves glide, so they never click

export class LaneMixer {
  private channels = new Map<string, Tone.Channel>();
  constructor(private out: Tone.InputNode) {}

  /** Make the graph match the lanes: new lanes get a channel, removed ones lose theirs. */
  sync(lanes: Lane[]) {
    const mix = laneMix(lanes);
    for (const m of mix) {
      let ch = this.channels.get(m.id);
      if (!ch) {
        ch = new Tone.Channel({ volume: m.gainDb, pan: m.pan }).connect(this.out);
        this.channels.set(m.id, ch);
      } else {
        ch.volume.rampTo(m.gainDb, RAMP);
        ch.pan.rampTo(m.pan, RAMP);
      }
      // Solo is worked out in laneMix (Tone's own solo is global per context, so it isn't used).
      ch.mute = !m.audible;
    }
    const keep = new Set(mix.map((m) => m.id));
    for (const [id, ch] of this.channels) if (!keep.has(id)) { ch.dispose(); this.channels.delete(id); }
  }

  /** Where a lane's sounds connect, or undefined for a lane the mixer doesn't know. */
  input(id: string): Tone.Channel | undefined {
    return this.channels.get(id);
  }

  dispose() {
    for (const ch of this.channels.values()) ch.dispose();
    this.channels.clear();
  }
}
