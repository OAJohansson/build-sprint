# User test: Six AM Lab, slice S1 "Listen", 2026-10-26

Simulated (user-tester agent), laptop 1440×900, real launched Chrome 155 with real tab capture, no
sound (`quiet=1`). Build 2a3006c, sandbox :3047. Track: Mason Flint remix of *It Just Won't Do*.
Screens: `shots-2026-10-26-lab-s1-test/`.

**Jobs:** 1 See the structure with layers **3/5** · 2 Re-listen and isolate parts **4/5**.

**Verdict (in persona):** "I pressed one button, waited about half a minute once, and then I could
pull the bass out of a SoundCloud bootleg and loop the breakdown… But the map tells me less about
what's inside the song than I hoped, and every jump costs six seconds of silence."

| Scenario | Result | Time |
| --- | --- | --- |
| Read the song's shape | pass | ~20 s |
| First Play (Deck + share), fresh profile | pass | 37 s to first sound |
| Hear only the bass | pass | instant |
| Click to jump | pass | 6.1 s catching up |
| Loop a section | struggle | Breakdown 49–76 looped 49–64 silently |
| Mute parts, back to everything | pass | instant in a loop |
| Pause and play | pass in a loop (0.2 s) / 6 s outside | |
| Deck window closed, Play | struggle | 34 s, resumed 27 s late |
| Reload, Play | pass | 7 s, back at 0:00, "Deck off" with the Deck open |

Findings L1–L11 are in `feedback.md` (Lab S1). Guardrails: no audio stored (localStorage only the
access code; Cache Storage only the model; IndexedDB and OPFS empty), only `/api/analyses` and
`/api/maps` fetched, nothing reads as recording; text contrast ≥ 4.93:1; **hit areas fail**
(24 px icons, × and section buttons).

Owner's-ear checks left: soloed part usefulness, loop seam, whether lanes match what's audible.
Tester's suggestion: a per-part live level hook so graders can check audible vs drawn.
