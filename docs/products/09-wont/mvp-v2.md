# Wonty MVP: what's in, why, and what's open

The owner's MVP list (28 Nov) checked against `research.md` (P = principle, A = anti-pattern),
the Finch walkthrough and the Habitica teardown. Short on purpose: it is the base for the kickoff
gate and the design brief. Evidence strength comes from `research.md`.

## The MVP, feature by feature

| # | Feature (owner's words, tidied) | Research says | Strength | Design rule |
| --- | --- | --- | --- | --- |
| 1 | **Onboarding** that gets to know you and suggests habits, with a very short intro to behaviour change | Autonomy-supportive choice (P11); start small (P3); a long lecture changes nothing (A12) | Moderate | 3–4 questions that change the suggestions, ~60 s; the intro is one idea, not a course. Finch asks ~15 and health conditions first: don't |
| 2 | **Yearly goals** tied to habits | A goal gives the habit a reason (P11, "why this matters"); fresh starts help starting (P17); the habit, not the goal, carries the change (P1) | Moderate | Goals in your own words (examples by area to help); each habit serves one goal; a goal shows the habits serving it |
| 3 | **Build vs quit habits**, treated differently | Build: if-then plan on an existing routine (P1), minimum version counts (P3). Quit: change the cue, add friction, a replacement (P13); log urges, swaps, slips separately (P14); quit or cut down (P15); never "don't do X" reminders (A9) | Strong (P1, P13 clinical) | Two setup paths, one board. Wont v1 already does both: reuse it |
| 4 | **Logging** a habit | One tap, flexible within the day (P12); no rigid time windows (A8); light quantification (A7) | Strong | One tap; "Not today" closes a day honestly |
| 5 | **Wonty reacts**: encourages on success, supports on a miss | Kind response after a lapse beats guilt (P7); celebrate the return (P5); no guilt copy (A2) | Moderate–Strong | Every log and miss gets a line in Wonty's voice: honest, sure of you, short. Content is a real workstream (a line bank) |
| 6 | **Setbacks: record what went wrong and learn** | The hours after a slip decide relapse (P7, Shiffman); if-then plans are the cheapest strong tool (P1) | Strong | After a miss: "What got in the way?" (one tap) → a smaller version or an if-then plan for today |
| 7 | **Insights**: how am I doing, patterns | Self-monitoring plus feedback and review (P2); progress that survives a miss (P6) | Strong | Rolling rate ("24 of last 30"), comebacks, top obstacles from #6. No streak counter (A1) |
| 8 | **Education as a thread** | Not studied as an app feature; teaching the mechanisms supports P1, P7, P8 | Weak (as a feature) | Lessons at the moment they matter: setup → if-then; first miss → one slip doesn't undo a habit; week 3 → habits take ~2 months (P8, A6). Name the mechanism, don't claim "science-backed" (A14) |
| 9 | **Wonty's world grows** with you; alive (animation, haptics); adult | Points and rewards fade and can crowd out own motivation (A5) | Moderate | The world shows progress, it isn't a payment: no currency, no shop, misses never take anything away. Motion on moments (a log, a comeback), not everywhere |
| 10 | **Notifications** (owner: important) | Reminders build repetition but the phone becomes the cue (A3); effect fades by ~day 28 (A4); best: optional, few, near the routine, fading (P10) | Moderate | One check-in a day from Wonty, opt-in, timed to the routine, fading as habits stick. The morning after a miss is the one that matters most |
| 11 | **Accounts and data** | Never erase history (A11) | — | Anonymous start, Google sign-in, sync, delete account, export |

## What you didn't list (and whether it should be in)

| Idea | From | Call | Why |
| --- | --- | --- | --- |
| **Weekly look-back**: keep, shrink or re-anchor each habit | Research P2 (strong) | **MVP** | The strongest-evidence piece we don't have; it's where the learning from #6 turns into change |
| **Starter suggestions by area** | Finch (39–53) | **MVP**, small | Feeds #1; keep ~6 areas, not 10 tabs |
| **Pause or archive without penalty** | Finch, P11 | **MVP** | Cheap; avoids the "delete and lose history" trap (A11) |
| **Gentle limit of ~3 new habits** | P4 (weak) | **MVP**, soft | Finch users report overwhelm; one line in onboarding |
| **Mood check-in / short reflection** | Finch | Later | Nice, but #6 covers the learning that matters |
| **Graduate a habit once it's automatic** | P9 | Later | Fits "Wonty grows" well: a habit that no longer needs tracking is a win (A13) |
| **Home-screen widget** | Finch | Later | Useful, not core; Finch's "4x" claim is correlation |
| **Accountability partner / friends** | P18, Finch | Later | Moderate evidence; needs social features |
| **Shop, currency, quests, seasons, party damage** | Finch, Habitica | **No** | The bloat; A5; shared punishment |

## Honest scope check

This is more than the earlier draft: onboarding with suggestions, goals, two habit types, a line bank
for Wonty, lessons, insights, a weekly look-back, notifications, a growing world and accounts. With
~3½ working weeks to 1 Jan it fits only as a **thin slice of each**, decided now:

- 5 lessons, ~40 Wonty lines, 4 poses, 6 suggestion areas, one notification, one insights screen.
- Cut order if time runs short: illustrated lessons → text; growing world → fixed poses; weekly
  look-back → week 2 of the test; patterns → after launch.

## Open design questions (answered at the design step, not now)

1. Goals: free text with examples, or pick from a list per area?
2. How does Wonty's world grow: what's visible on day 1, week 2, month 2?
3. Which 5 lessons, and in what visual form (a card, a short story, a Wonty scene)?
4. Where do insights live: their own tab, or on each habit and goal?
