// Rolling separation plan (L144): which window to separate and which region of it to play when.
// Pure numbers so it can be unit-tested; all positions are in samples on the capture clock.

export type StreamPlan = {
  /** Window length the model takes (343980 at 44.1 kHz). */
  window: number;
  /** New audio played per window. */
  hop: number;
  /** Samples kept back from the window's right edge (the model is weakest at the edges). */
  guard: number;
  /** Crossfade between neighbouring regions. */
  fade: number;
};

export function makePlan(rate: number, hopS: number, guardS: number, fadeS = 0.03, window = 343980): StreamPlan {
  const hop = Math.round(hopS * rate);
  const guard = Math.round(guardS * rate);
  const fade = Math.round(fadeS * rate);
  if (hop + guard + fade > window) throw new Error("hop + guard + fade must fit in one window");
  return { window, hop, guard, fade };
}

/**
 * The k-th step: the window ends at `end`; the region played is [regionStart, regionStart+length)
 * on the capture clock, found at `from` inside the window. Region k ends where region k+1's fade
 * starts plus `fade`, so they overlap by exactly `fade` samples.
 */
export function step(plan: StreamPlan, k: number) {
  const end = plan.window + k * plan.hop - (plan.window - plan.hop - plan.guard); // first step needs only hop+guard of audio
  const regionEnd = end - plan.guard;
  const regionStart = regionEnd - plan.hop - plan.fade;
  const windowStart = end - plan.window; // may be negative: the left of the window is zero-padded
  return { end, windowStart, regionStart, from: regionStart - windowStart, length: plan.hop + plan.fade };
}

/** Delay between a sample being heard by the capture and the separated sample playing. */
export function playDelay(plan: StreamPlan, rate: number, computeS: number, marginS = 0.5) {
  return (plan.hop + plan.guard + plan.fade) / rate + computeS + marginS;
}
