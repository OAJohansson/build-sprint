# User test: Lab S3 Make + S4 Save, 2026-10-26

Simulated, build 4f29a8a, sandbox :3047, window 1440×900 (page 734 px), 1 real Mentor call.
Screens: `shots-2026-10-26-lab-s3s4/`.

**Jobs:** 4 make my own **4** · 5a save it **3**.

Pass: entering Make loops the section and fills it; Y9 A/B 0.2 dB apart; knobs by keyboard and mouse
drag, name follows the strongest knob; preset menu; the Mentor line updates live; a Make question
used the preset, knobs and ticks; save and read back from the API; Listen ↔ Make keeps state;
guardrails (no audio in /api/mentor or /api/sounds bodies, storage clean).

Findings: S5-1 (major) rename after save isn't saved and Save stays disabled; S3-1 (major) the A/B
switch is below the fold at 734 px; S5-2 (major) no trace of saved sounds in the Lab after a reload;
S3-2 Suggest spins 9 s and changes nothing when ticks are current; S3-3 Make rail title vs whole
thread; S3-4 no route from Drums to the bass in Make; S3-5 knob step 0.01 too fine, a cut sentence,
loop strip shows a block not the read notes.
