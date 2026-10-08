# Interview story: Horizon

*Draft by Claude from the brief, test report, feedback log and retro; edit it into your own words.*

**Headline:** Google already tells you when sunset is, so I built for the question it can't answer
("do I have time?") and bet that a beautiful, live sky was the reason to switch.

**Themes:** Discovery · Metrics · Trade-offs · Prioritisation · Craft · Working with AI

## In 30 seconds

In Bali at 4:45 pm I wanted to know whether I'd make the sunset. Google gives you a time, not an
answer. Before writing code I wrote a one-page brief: the jobs, today's alternatives, the riskiest
assumption (would anyone switch from Google?) and how I'd measure success. I prototyped three
directions, shipped the one that showed the countdown as the sun's position on its arc, and
tested it. Testing found a contrast problem I couldn't see (1.9:1 against a 4.5:1 target) and a
bug that showed the wrong city's sunset. Both were fixed the same day.

## The story

**Situation.** People who plan their evenings around sunset (me, in Bali) check Google or a weather
app. Both give a clock time, not "how long have I got?", and checking feels like a chore.

**Task.** In one day, ship something that answers "can I still make it?" in five seconds with no
typing, and is beautiful enough that you'd show it to a friend. Success was defined up front:
answer at a glance, another place in 15 seconds, people recognise the city from its landmark, they'd
pick it over Google, and two guardrails (readable text, correct times).

**Action.**
- **Named the alternative first.** Google answers "what time?", so the edge had to be "do I have
  time?" plus feel. That made the riskiest assumption *value*, not *feasibility*.
- **Wrote requirements before designing:** nine behaviours with checks, plus what we wouldn't
  build and the traps that could eat the day.
- **Prototyped three directions** (a scene, an instrument, an interactive scrubber) on the live
  site and chose on a real phone: the *Arc*, where the countdown is the sun's position on its path.
- **Tested in a fixed order:** an interface audit, a simulated user (Noor, a traveller) through six
  scenarios, then my own phone review. 29 findings, each triaged by which success signal it moved.
- **Made trade-offs explicit:**
  - Landmarks for 10 famous places plus terrain scenes (beach, peaks, skyline), instead of
    "a landmark for any city" that couldn't be done well in a day.
  - The real moon (sometimes absent), not a decorative one, because the promise is "the sky right
    now".
  - No start screen on every open: it would add a tap to the main job.

**Result.**
- Live the same day, 6 pull requests, 29 findings: 23 fixed, 2 declined with reasons, 4 parked.
- The simulated user said it "beats Google for *do I have time?*". The live sky and the sunset
  moment are what she'd show a friend.
- Readability went from 1.9:1 to 4.3:1 once I measured it: text colour is now picked against the
  sky right behind it.
- Times match published ones (Bali 18:14, Paris 19:17). The one signal still unconfirmed: a real
  person outside the project.

**What I learned.** "Beautiful" can be a strategy, but only if you name it as the bet and test it.
Measure what a feature is *for* (the landmark's job is "which city is this?", which exposed Tokyo
looking like Paris). And guardrails need numbers; my eye said the contrast was fine.

## Assumptions: what I believed vs what was true

| I assumed | Turned out | How I found out |
| --- | --- | --- |
| Speed and beauty would beat Google | True in simulated testing; not yet confirmed by a real user | User test verdict; still open |
| The countdown was readable | 1.9:1 in the afternoon | Interface audit, then contrast maths |
| Reopening on the last place was helpful | It showed yesterday's city: wrong data for the main job | Simulated user test |
| The countdown was the payoff | The emotional peak is the sunset moment itself | Testing, then built "happening now" and the afterglow |

## Likely follow-ups

- **"How did you decide what to fix?"** The playbook rule: anything showing wrong data or looking
  broken gets fixed now; the rest is prioritised by which success signal it moves, against effort.
- **"How did you use AI?"** Claude built the app, ran the simulated user test, and coached me
  on product practice. I made the calls: the main job, the name, Arc over the other two, the real
  moon, and what to park. I also pushed back when its first version of a feature was too subtle.
- **"What would you do next?"** Show it to one real person at sunset, then make the landmark
  bigger and visible at night.

## Theme prompts

Smaller examples beyond the main story; empty where this product has no real one.

- **Discovery:** naming the alternative (Google) turned "what time is sunset?" into "do I have time?".
- **Prioritisation:** triaged 29 findings by which success signal each one moved; parked the "This week" strip.
- **Metrics:** success defined before building; readability measured at 1.9:1, then 4.3:1.
- **Failure:** the app reopened on yesterday's searched city and showed the wrong sunset; caught by the simulated user.
- **Ambiguity:** a landmark for *any* city wasn't possible, so 10 hand-drawn ones plus a terrain guess from elevation data (beach, peaks, skyline), checked against real places like Pemenang and Zermatt.
- **Trade-offs:** the real moon (some nights none) over a decorative one; no start screen on every open.
- **Craft:** the sunset moment ("happening now", the afterglow) and a ring of light sweeping the sky.
- **Technical:** text colour picked by measured contrast against the sky right behind it; times via each place's time-zone name, not hand-written maths.
- **Working with AI:** Claude built three working prototypes and ran the simulated user; I made the product calls and pushed back when a first version of the light pulse was too subtle to see.
- **Speed:** prototype live within hours so I judged it on my phone; shipped in a day, plus a 2-minute demo mode for showing it.

**Evidence:** [live app](https://horizon-beta-wine.vercel.app) ([2-minute demo day](https://horizon-beta-wine.vercel.app/?demo)) ·
[brief](#02-horizon.brief) · [user test](#02-horizon.testing) · [feedback](#02-horizon.feedback) ·
[retro](#02-horizon.learnings)
