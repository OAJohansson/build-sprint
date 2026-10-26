# User test re-check: Magpie, 2026-10-26

Re-check by the `user-tester` agent after commit 66aec86 (fixes F1–F8), persona Andreas, phone
390 × 844, sandbox code only. S4 in a fresh context with no location and no last city; the share
sheet simulated as before (multipart POST through the service worker). Screenshots:
`screens-2026-10-26-recheck/`.

| Finding / scenario | Before | After | Result |
| --- | --- | --- | --- |
| S3 wines 4+ in London (bar 5 taps / 15 s) | 6 taps, ~11 s | 5 taps, ~9 s (Filter, Wine, 4+, London, Show); "Show 2 wines"; results correct | pass |
| S2 "noble" | 3 taps, ~6 s | same | pass |
| F2 "red wine" | 0 results; wrong empty copy | message fixed; "red wine" still 0 ("red" is in no field) | partial → fixed after (falls back to any-word, best first) |
| S4 / F4 shared photo, no city | city empty | London prefilled; 4 taps, ~12 s; saved with photo | pass (label said "where you were last": now "your home city") |
| F3 placeholders | blank slots 1–1.6 s | sticker-shaped cream placeholders at 0.6 s | pass |
| F5 Name focused | no | yes, after share and Skip | pass |
| F6 top rows | two | three (dishes 3, wines 2, cocktails 2) | pass |
| F7 targets | 19 × 44, 40 × 40 | 44 × 44 both | pass (the count stays a number, as in the design) |
| F8 disabled labels | 2.25–2.63:1 | 8.93:1 | pass |
