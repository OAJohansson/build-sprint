# 0025 — Selvedge removes backgrounds in the browser with ormbg

- **Date:** 2026-10-23
- **Status:** accepted

## Context

The owner's own moodboard mixes whole photos with cut-outs (a shoe, a clog, sunglasses with no
background), and asked for background removal as its own feature, separate from cropping
(feedback 7). Earlier the owner chose "automatic, then fix by hand" and "an AI model that runs
in the browser (free, no key, about 40 MB the first time)".

## Decision

- **Model:** `onnx-community/ormbg-ONNX` (Apache-2.0), the 8-bit version (44 MB), through
  Transformers.js 4.3.1's `background-removal` pipeline, on the CPU (WASM) so every browser
  can run it. It runs in a Web Worker so the editor never freezes.
- **Where the photo goes:** nowhere new. The model downloads from Hugging Face once and the
  browser keeps it; the photo is processed on the device.
- **Storage:** the cut-out (WebP with transparency, the same size as the photo, so a piece's crop
  box still fits) is kept beside the original in the private bucket at `cutouts/<save id>.webp`
  (`/api/cutouts`). No schema change. A piece switches between the photo and its cut-out
  (`cutout: true`), so "Restore background" is instant and the original is never touched.
- **Edges:** the mask is cleaned with a levels curve (faint pixels clear, near-solid ones solid,
  a smooth step between), as the ormbg write-up suggests, so no haze of background remains.

## Alternatives considered

- **imgly background-removal:** works well, but AGPL-3.0.
- **RMBG-1.4 / RMBG-2.0 (BRIA):** strong and popular, but non-commercial only.
- **BiRefNet (lite):** the best edges on paper, but reported to crash the browser for memory.
- **MODNet:** small and Apache-2.0, but made for portraits; weak on flat lays and products.
- **A paid API (remove.bg, Replicate):** better on hard cases, but costs per photo, needs a key,
  and sends the owner's photos to a third party.

## Consequences

- First use downloads 44 MB; after that a cut-out takes a few seconds (7 s on a laptop, 17 s the
  first time including the download).
- Automatic only for now: there's no way yet to fix a miss by hand (the owner's "then fix" half),
  marked as a shortcut and in the backlog.
- Depends on Hugging Face (the model) and jsDelivr (the ONNX runtime files) being reachable the
  first time; revisit by self-hosting both if either becomes a problem.
- Revisit the model if cut-outs of busy backgrounds disappoint on real saves.
