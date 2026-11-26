"use client";

import { useEffect, useState } from "react";
import { CHORD_SPECS, renderChordPart } from "@/lib/make/layers-bench";
import { MakeClient } from "@/lib/make/make-client";
import type { ChordsReader } from "@/lib/make/chords-read";

/** Reader A once and reader B three times on the bench's chord parts; one line per read. */
export function ChordsCheck() {
  const [lines, setLines] = useState<string[]>([]);
  useEffect(() => {
    const cl = new MakeClient();
    const say = (x: string) => setLines((ls) => [...ls, x]);
    (async () => {
      const runs: [number, ChordsReader][] = [[0, "dsp"], [2, "dsp"], [0, "basic-pitch"], [2, "basic-pitch"], [0, "basic-pitch"]];
      for (const [i, reader] of runs) {
        const spec = CHORD_SPECS[i];
        const { mono } = renderChordPart(spec, { rate: 44100, seed: 1 });
        const t0 = performance.now();
        const res = await cl.chordsRead({ left: mono.slice(), right: mono.slice(), rate: 44100, bpm: spec.bpm, key: spec.key, reader });
        say(`${spec.name}: ${res.reader} in ${Math.round(performance.now() - t0)} ms (worker ${res.ms} ms): ${res.chords.cells.map((c) => c.name || "-").join(" ")} · ${res.chords.events.length} chords (${res.chords.events.filter((e) => e.held).length} held) · lead ${res.lead.notes.length} (${res.lead.from})`);
      }
      say("done");
    })().catch((e) => say(`error: ${e instanceof Error ? e.message : String(e)}`));
    return () => cl.stop();
  }, []);
  useEffect(() => { (window as unknown as { __chordsCheck?: string[] }).__chordsCheck = lines; }, [lines]);
  return <pre style={{ padding: 24, color: "#f1e6d3", background: "#131110", minHeight: "100vh", font: "13px monospace" }}>{lines.join("\n")}</pre>;
}
