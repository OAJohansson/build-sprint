# Re-test: Six AM Lab S1 "Listen", after the fix pass, 2026-10-26

Simulated, build 8ce4354, sandbox :3047, real capture, no sound (levels via `__sixamLab.levels()`).
Screens: `shots-2026-10-26-lab-s1-retest/`.

**Jobs:** 1 structure with layers **3** (was 3) · 2 isolate parts **4** (was 4).

Fixed: LS1-2, 5, 6, 7, 8, 9 (Lab controls; "← All tracks" 18 px tall), 10, 11. Partly: LS1-1 (hints
only), LS1-3 (message shown, but 35 s wait and 26 s skip on reopening the Deck). As expected: LS1-4.

New:
- **N1 (major):** with Only Vocals, the vocals part plays at −16 to −26 dB in bars 12–20 while the
  Vocals lane is empty there (lanes come from the full-mix estimate). In the Breakdown lanes match.
- N2 (minor): "catching up… 7 s" doesn't count down.
- N3 (minor): resume after a pause plays 2.7 s, then 2.8 s silence, then continues (a stutter).
- N4 (minor): the first passes of a loop freeze at the wrap 4–6 s; held in memory after ~55 s.
- N5 (polish): headphones on a second part adds it ("Only Bass, Vocals"), chip makes it clear.
- N6 (polish): the "not heard yet" hyphen is 2.28:1; a chord name changed between runs.

Guardrails: no audio stored or uploaded (pass); text ≥ 4.5:1 (pass); hit areas pass except
"← All tracks".
