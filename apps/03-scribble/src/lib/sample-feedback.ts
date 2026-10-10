import type { Feedback } from "@/lib/types";

// Stand-in for the reader when there's no ANTHROPIC_API_KEY in development: quotes the writer's own words, one strength
// and one thing to try, in the shape the real feedback will have.
function clip(s: string, words = 12) {
  const w = s.replace(/[.!?]+$/, "").split(/\s+/);
  return w.length > words ? w.slice(0, words).join(" ") + "…" : w.join(" ");
}

export function sampleFeedback(text: string): Feedback {
  const s = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((x) => x.trim())
    .filter(Boolean);
  const first = clip(s[0] ?? text);
  const last = clip(s[s.length - 1] ?? text);
  if (s.length < 2) {
    return {
      strength: `“${first}” already sounds like you talking, not like someone trying to write.`,
      tryNext: "Add one concrete detail the reader could see or hear. What exactly was in front of you?",
      craft:
        "Concrete detail does the work that adjectives can't: name the thing itself. Not \"a nice smell\", but \"burnt toast and someone else's perfume\".",
      lesson: "add one detail I could see",
    };
  }
  return {
    strength: `“${first}” is a confident opening. It drops me straight into the moment.`,
    tryNext: `Your ending, “${last}”, explains the feeling. Try ending on an image instead and let the reader feel it.`,
    craft:
      "T.S. Eliot called it the objective correlative: let an object or action carry the feeling. Not \"I felt lonely\", but \"I still set out two cups.\"",
    lesson: "end on an image, not a feeling",
  };
}
