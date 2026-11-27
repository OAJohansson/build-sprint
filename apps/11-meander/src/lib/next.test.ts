import { describe, expect, it } from "vitest";
import { nextFromHere } from "./next";

const LINKS = [
  { from: "phe", to: "exi" },
  { from: "ger", to: "exi" },
  { from: "exi", to: "fem" },
  { from: "exi", to: "pos" },
  { from: "sto", to: "ren" },
  { from: "dao", to: "con" },
];
const EARLIEST = ["ved", "pre", "con", "dao", "sto", "ren", "ger", "exi", "phe", "pos", "fem"];

describe("next from here", () => {
  it("empty history: start at the beginning of the timeline", () => {
    expect(nextFromHere([], LINKS, EARLIEST)).toEqual({ mode: "start", picks: [{ id: "ved" }, { id: "pre" }, { id: "con" }] });
  });

  it("takes turns from the most recent school down, skipping what is begun (normal case)", () => {
    const r = nextFromHere(["exi", "sto", "phe"], LINKS, EARLIEST);
    expect(r.mode).toBe("next");
    expect(r.picks.map((p) => [p.id, p.via])).toEqual([["ger", "exi"], ["ren", "sto"], ["fem", "exi"]]);
    expect(r.picks[0].link).toEqual({ from: "ger", to: "exi" });
  });

  it("only one school begun: its neighbours in link order, never repeated", () => {
    const r = nextFromHere(["exi"], LINKS, EARLIEST, 3);
    expect(r.picks.map((p) => p.id)).toEqual(["phe", "ger", "fem"]);
    const r2 = nextFromHere(["dao", "exi"], LINKS, EARLIEST, 3);
    expect(r2.picks.map((p) => p.id)).toEqual(["con", "phe", "ger"]);
  });

  it("an explored school opened again stays begun and is never suggested", () => {
    const r = nextFromHere(["phe", "exi"], LINKS, EARLIEST);
    expect(r.picks.map((p) => p.id)).not.toContain("exi");
    expect(r.picks.map((p) => p.id)).not.toContain("phe");
  });

  it("every neighbour begun: falls back to the earliest schools not begun", () => {
    const r = nextFromHere(["dao", "con"], LINKS, EARLIEST);
    expect(r).toEqual({ mode: "start", picks: [{ id: "ved" }, { id: "pre" }, { id: "sto" }] });
  });

  it("everything begun: no picks", () => {
    expect(nextFromHere(EARLIEST, LINKS, EARLIEST).picks).toEqual([]);
  });
});
