# 0022 — Selvedge's character: an image model draws, Claude replays it

- **Date:** 2026-10-22
- **Status:** proposed (owner's first lean; revisit once day 1 ships)

## Context

Day 2 gives each board a hand-drawn character wearing its style. The owner also wants to watch
it being drawn. The character spike compared two image models on the owner's Summer 2026 board;
a Claude-only test drew the same outfit as SVG code.

## Decision

- **The drawing:** OpenAI `gpt-5.4-image-2` through OpenRouter, given the board's images (no
  style words needed). Owner: "my style, full stop." About 88 s and $0.23 a drawing.
- **The motion:** Claude-written browser code finds the drawing's ink lines (darker than their
  surroundings), reveals them along each line like a pen, then fades the colour in
  (`public/spike/draw-on.html`). About 10 s.
- **The wait:** hand-drawn doodles (Claude, as code) on the waiting screen while the model draws.

## Alternatives considered

- **Google `gemini-3-pro-image`:** three times faster and cheaper, cleaner but less sketchy, and
  drew a logo despite "no logos". Its newest model (`nano-banana-2.1`) was rate-limited and is
  untried.
- **Claude only, drawing in code:** instant and animatable, but one-pass SVG of a realistic
  figure was "really bad"; code draws simple doodles well, people and fabric badly.
- **A paper doll:** a base figure and a library of garment drawings, dressed by Claude per
  board. Instant, near free, the same character every season; but limited to the library and a
  project of its own. Kept as an option.

## Consequences

- A second paid API and key (`OPENROUTER_API_KEY`), and an upstream that can rate-limit: plan a
  retry and maybe a fallback model.
- The character's face changes from board to board unless we pass the previous character as a
  reference; untested.
- The draw-on thresholds are tuned on one drawing; check on several and on a phone.
