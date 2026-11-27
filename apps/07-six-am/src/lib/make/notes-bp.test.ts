// BP-1 regression guard (13 Nov grade): every Basic Pitch read in one worker must use the model, not only
// the first. The bug: the first read got a model still loading, its weights were made inside the read's
// tfjs scope and disposed with it, so the second read threw "Tensor is disposed". Two short synthetic
// reads in a row, the first one given the model while it is still loading (as the worker does).
import { describe, expect, it } from "vitest";
import { loadBpModelFromDisk } from "./bp-model.node";
import { readNotesBP } from "./notes-bp";

function tone(midis: number[], sec: number, rate: number): Float32Array {
  const x = new Float32Array(Math.round(sec * rate));
  for (let i = 0; i < x.length; i++) for (const m of midis) { const hz = 440 * 2 ** ((m - 69) / 12); x[i] += 0.2 * Math.sin((2 * Math.PI * hz * i) / rate) * Math.exp(-((i / rate) % 0.5) * 3); }
  return x;
}

describe("Basic Pitch reads every time (BP-1)", () => {
  it("reads twice in a row with the model, the first while it still loads", async () => {
    const rate = 22050;
    // The model arrives late, as a 917 KB fetch does in the browser: after the read has started.
    const late = new Promise((r) => setTimeout(r, 2500)).then(() => loadBpModelFromDisk());
    const a = await readNotesBP(tone([60, 64, 67], 2, rate), undefined, rate, 120, late);
    const b = await readNotesBP(tone([57, 60, 64], 2, rate), undefined, rate, 120, loadBpModelFromDisk());
    expect(a.notes.length).toBeGreaterThan(0);
    expect(b.notes.length).toBeGreaterThan(0);
  }, 60000);
});
