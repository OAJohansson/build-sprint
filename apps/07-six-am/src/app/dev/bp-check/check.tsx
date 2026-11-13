"use client";

import { useEffect, useState } from "react";
import { CHORD_SPECS, renderChordPart, scoreNotes } from "@/lib/make/layers-bench";
import { MakeClient } from "@/lib/make/make-client";
import { MELODY_READER } from "@/lib/make/melody-reader";

/** Runs the melody read twice (the first loads the model) on two of the bench's parts and prints the numbers. */
export function BpCheck() {
  const [lines, setLines] = useState<string[]>([`reader: ${MELODY_READER}`]);
  useEffect(() => {
    const cl = new MakeClient();
    const say = (x: string) => setLines((ls) => [...ls, x]);
    (async () => {
      for (const i of [0, 0, 4]) {
        const spec = CHORD_SPECS[i];
        const { mono, truth } = renderChordPart(spec, { rate: 44100, seed: 1 });
        const t0 = performance.now();
        const res = await cl.melodyRead({ left: mono.slice(), right: mono.slice(), rate: 44100, bpm: spec.bpm, key: spec.key });
        const ms = Math.round(performance.now() - t0);
        const notes = [...res.reading.rows.chords.notes, ...res.reading.rows.lead.notes];
        const s = scoreNotes(truth, notes);
        say(`${spec.name}: ${res.reader} in ${ms} ms round trip (worker ${res.ms} ms), ${notes.length} notes, found ${Math.round(s.pcFound * 100)} %, wrong ${Math.round(s.wrong * 100)} %`);
      }
      say("done");
      (window as unknown as { __bpCheck?: string[] }).__bpCheck = [];
    })().catch((e) => say(`error: ${e instanceof Error ? e.message : String(e)}`));
    return () => cl.stop();
  }, []);
  useEffect(() => { (window as unknown as { __bpLines?: string[] }).__bpLines = lines; }, [lines]);
  return <pre style={{ padding: 24, color: "#f1e6d3", background: "#131110", minHeight: "100vh", font: "13px monospace" }}>{lines.join("\n")}</pre>;
}
