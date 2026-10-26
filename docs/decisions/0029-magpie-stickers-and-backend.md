# 0029 — Magpie's stickers: Gemini 2.5 Flash Image, cut out on the server, drawn after save

- **Date:** 2026-10-26
- **Status:** accepted (PM, Founder mode; L1–L3 in `docs/products/10-magpie/decisions.md`)

## Context

Magpie's riskiest feasibility question: can an image model turn a phone photo of food or drink
into a flat, thick-outlined die-cut sticker in the design's style, recognisable and consistent,
in under 20 s and for under $0.05? The spike (`apps/10-magpie/spike/sticker.mjs`) sent 12 real
photos (Wikimedia Commons, `apps/10-magpie/evals/photos/`) to four image models through
OpenRouter, the way Selvedge does (decision 0022). Contact sheets:
`docs/products/10-magpie/design/sticker-spike/`.

| Model | Median time | Cost | Notes |
| --- | --- | --- | --- |
| google/gemini-2.5-flash-image | 8.2 s | $0.039 | every sticker has its outer outline; flattest |
| google/gemini-3.1-flash-lite-image | 6.3 s | $0.034 | as good a drawing, but drops the outer outline on some, leaving a halo |
| google/gemini-nano-banana-2.1 | 10.8 s | $0.038 | more shading than asked |
| openai/gpt-5-image-mini | 46.6 s | $0.047 | too slow for capture |

## Decision

- **Model:** `google/gemini-2.5-flash-image`, one photo plus one prompt (the style in words, no
  reference image). The shape alternates like the design: odd yum numbers round, even ones a
  rounded square.
- **Cut-out:** the model draws on pure white; the server makes the white outside the sticker's
  dark outline transparent (a flood fill from the edges, `sharp`) and stores a 512 px WebP.
- **When:** the yum and its photo are saved first; the sticker is drawn on the server after the
  response (`after()` in the save route), so closing the app doesn't stop it. A yum shows its
  photo in a sticker frame until the sticker is ready, and keeps it if the drawing fails (with a
  "Draw it again" on the item page). The original photo is never replaced.
- **No photo:** the same model draws the sticker from the name and kind.
- **Backend:** Supabase in the shared project (decision 0021), table `magpie_yums` and a private
  `magpie` bucket. The access code decides the library: the owner's code opens `owner`, the
  graders' `SANDBOX_ACCESS_CODE` opens `sandbox` (decision 0028 #10).

## Alternatives considered

- **Flash-Lite:** cheaper and faster, but the missing outline breaks the cut-out on some photos.
  Worth a retry with a stricter prompt if cost matters.
- **A reference sticker in every call** for consistency: not needed on 12 photos; adds input cost.
- **Cut-out in the browser** (Selvedge's ormbg, decision 0025): a 44 MB model on the phone for a
  job a flood fill does on a plain white background.

## Consequences

- About $0.04 a yum; 10 yums a week is under $2 a month.
- The cut-out needs the model to keep the outer outline; the eval watches for halos.
- `after()` runs within the route's `maxDuration` (60 s); a drawing that never finishes is marked
  failed after 2 minutes and can be retried.
