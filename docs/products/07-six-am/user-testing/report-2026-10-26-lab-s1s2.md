# User test: Lab S1 after fix pass 2, plus S2 Mentor in the Lab, 2026-10-26

Simulated, build 140441b, sandbox :3047, real capture, 4 real Claude calls. Screens:
`shots-2026-10-26-lab-s1s2/`.

**Jobs:** 1 structure **4** (was 3) · 2 isolate **4** · 3 ask the Mentor **3** (content good; card too
small to read, tiny targets).

S2 checks all pass: "+ Ask" with context line; outside a loop the Mentor says it uses the map's
estimate and suggests looping; inside a loop it uses the measured pattern (G1–Bb1, 1/16, 4 a bar);
tone question: "I can't hear tone, only pitch, timing and loudness…"; dots at the right bar,
clustering; bar tags jump; Send arrow; notes survive a reload; Analyse Mentor unaffected.
S1: LS1-3, N1, N2, N3, N4 fixed; LS1-1 partly (new N7: heard Drums merges kick/hats rows); N6 not
re-measured.

New: M1 (major) the card thread is 150 px with nested scrolls, answers cut after 3 lines; M2 hit
areas < 28 px (dots, + Ask, bar tag, Send, Make link); M3 outside a loop the Mentor quotes the
full-mix estimate, not the heard lanes; M4 hover on a dot shows nothing visible; M5 jargon (Hz,
"minor third"; "I can't hear tone, only pitch…" implies hearing); N7.

Guardrails: Mentor POSTs carry only text and numbers (≤ 2.2 KB, no base64); nothing stored but the
model and the access code; hit areas fail for S2 controls.
