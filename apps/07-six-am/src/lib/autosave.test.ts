// The undo-save fix (S5-1): every edit and every undo reaches the server, nothing else does.
import { describe, expect, it } from "vitest";
import { autosave } from "./autosave";
import { lanesOf, removeLane, withLanes } from "./studio-lanes";
import { demoDoc, type Doc } from "./timeline";

const doc = (n: number) => ({ n });

describe("autosave", () => {
  it("saves an edit", () => {
    const opened = doc(0), s = autosave(opened), a = doc(1);
    expect(s.change(a)).toBe(true);
    expect(s.flush()).toBe(a);
    expect(s.flush()).toBeNull();
  });
  it("saves an undo back to the opened state (the S5-1 blocker)", () => {
    const opened = doc(0), s = autosave(opened);
    s.change(doc(1));
    s.flush();
    expect(s.change(opened)).toBe(true);
    expect(s.flush()).toBe(opened);
  });
  it("saves nothing when nothing changed: the doc as opened, or the same doc again", () => {
    const opened = doc(0), s = autosave(opened), a = doc(1);
    expect(s.change(opened)).toBe(false);
    expect(s.flush()).toBeNull();
    s.change(a);
    s.flush();
    expect(s.change(a)).toBe(false);
    expect(s.flush()).toBeNull();
  });
  it("two quick edits before a save: the last one is saved", () => {
    const s = autosave(doc(0)), a = doc(1), b = doc(2);
    s.change(a);
    s.change(b);
    expect(s.flush()).toBe(b);
  });
  it("an edit and its undo before a save: the opened doc is saved (the server may hold an older edit)", () => {
    const opened = doc(0), s = autosave(opened);
    s.change(doc(1));
    s.flush();
    s.change(doc(2));
    s.change(opened);
    expect(s.flush()).toBe(opened);
  });
  it("never saves a Mentor draft", () => {
    const s = autosave(doc(0));
    expect(s.change(doc(1), true)).toBe(false);
    expect(s.flush()).toBeNull();
  });
  it("remove a lane, then undo: the doc sent equals the opened doc", () => {
    // The Studio's own steps: a lane edit makes a new doc (withLanes); undo puts back the earlier doc object.
    const opened: Doc = demoDoc(), s = autosave(opened), past: Doc[] = [];
    const removed = removeLane(lanesOf(opened), opened.regions, "bass");
    const edited = withLanes({ ...opened, regions: removed.regions }, removed.lanes);
    past.push(opened);
    s.change(edited);
    expect(s.flush()!.lanes!.map((l) => l.id)).toEqual(["drums", "chords", "top"]);
    s.change(past.pop()!);
    const sent = s.flush();
    expect(sent).toBe(opened);
    expect(sent!.lanes).toBeUndefined();
    expect(sent!.regions.some((r) => r.track === 1)).toBe(true);
  });
});
