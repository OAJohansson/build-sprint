// What changed between two versions of the taste profile, for Settings' "was / now" (M11). Sentence
// level: the sentences that went and the ones that came, each cut short. Pure.

const sentences = (t: string) =>
  t.split(/(?<=[.!?])\s+|\n+/).map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean);
const cut = (t: string, max: number) => (t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`);

export function profileDiff(before: string, after: string, max = 320): { was: string; now: string } {
  const a = sentences(before), b = sentences(after);
  const inA = new Set(a.map((x) => x.toLowerCase())), inB = new Set(b.map((x) => x.toLowerCase()));
  return {
    was: cut(a.filter((x) => !inB.has(x.toLowerCase())).join(" "), max),
    now: cut(b.filter((x) => !inA.has(x.toLowerCase())).join(" "), max),
  };
}
