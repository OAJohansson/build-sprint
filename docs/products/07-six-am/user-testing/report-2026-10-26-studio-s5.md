# User test: S5 Studio lanes, plus Lab → Studio end to end, 2026-10-26

Simulated, build ae17786, sandbox :3047, window 1440×900, no paid calls. Screens:
`shots-2026-10-26-studio-s5/`.

**Jobs:** 5b use my saved sounds in the Studio **4** · end-to-end loop (Lab make and save → Studio
drop → play) **4** (47 s in the Lab, 7 s in the Studio).

Pass: families fold; hover shows headphones, speaker, ⋯, volume, pan; hear-only and mute lit and
other lanes dim; muted/soloed lanes book no notes (2,063 → 2 with only Bass, etc.); ⋯ menu; + Add
lane with 11 hinted types; drop on Bass and onto a track without a Bass lane (new lane in family
order); the block drawer edits only the track's copy (library unchanged); worst case renders.

Findings: **S5-1 blocker: Undo is never saved** (remove lane → Undo → reload: the lane and its
blocks are gone; it damaged a seeded track); S5-2 lane removal has no confirmation; S5-3 hit areas
< 28 px (lane icons 23, sliders 15, fold 19, + Add lane 23); S5-4 contrast 3.0:1 on crate meta and
ruler numbers; S5-5 the crate shows ~1¼ rows; S5-6 the block drawer uses unlabelled sliders vs
the Lab's knobs; S5-7 hear-only and mute lit together on a seeded track.

Guardrails: no audio in any request; storage clean; hit areas and contrast fail.
