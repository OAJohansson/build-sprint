// Spot-check: the engineer's seeded pre-S5 track "S5 baseline B" (sandbox, read-only copy).
import fs from "node:fs";
import { expect, it } from "vitest";
import * as OLD_T from "./old/tracks";
import * as OLD_S from "./old/schedule";
import { parseDoc } from "@/lib/tracks";
import { registerSounds, silentLanes } from "@/lib/timeline";
import { buildSoundIndex } from "@/lib/synths/schedule";
import { buildIndex } from "@/lib/schedule";
import { RECIPES } from "@/lib/recipes";
import { laneMix, lanesOf, migrateDoc } from "@/lib/studio-lanes";
const key = (m: Map<number, unknown[]>) => JSON.stringify([...m.entries()].sort((a, b) => a[0] - b[0]));
it("baseline B unchanged", () => {
  const raw = JSON.parse(fs.readFileSync(new URL("./s5-baseline-b.json", import.meta.url), "utf8")).track.doc;
  const o = OLD_T.parseDoc(raw)!, n = parseDoc(raw)!;
  registerSounds(n.sounds);
  const steps = (n.bars ?? 64) * 16, k = n.key?.key ?? "A", sc = n.key?.scale ?? "minor";
  const oi = OLD_S.buildSoundIndex(o.regions, o.sounds ?? [], k, sc, steps), ni = buildSoundIndex(n.regions, n.sounds ?? [], k, sc, steps);
  const m = migrateDoc(n), back = parseDoc(JSON.parse(JSON.stringify(m)))!;
  const res = {
    parseSame: JSON.stringify(o) === JSON.stringify(n),
    soundHits: [...ni.values()].reduce((a, x) => a + x.length, 0), soundIndexSame: key(oi) === key(ni),
    crateHits: [...buildIndex(n.regions, RECIPES).values()].reduce((a, x) => a + x.length, 0), crateSame: key(buildIndex(o.regions as never, RECIPES)) === key(buildIndex(n.regions, RECIPES)),
    gains: laneMix(lanesOf(m)).map((x) => x.gainDb), audibleSame: laneMix(lanesOf(m)).every((x, i) => x.audible === !silentLanes(n)[i]),
    migratedIndexSame: key(buildSoundIndex(back.regions, back.sounds ?? [], k, sc, steps)) === key(ni),
  };
  console.log(res);
  fs.writeFileSync(new URL("./y5-spot-results.json", import.meta.url), JSON.stringify(res));
  expect(res.parseSame && res.soundIndexSame && res.crateSame && res.audibleSame && res.migratedIndexSame).toBe(true);
});
