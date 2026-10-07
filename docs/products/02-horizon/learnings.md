# Learnings

What building Horizon taught me.

## Retro (7 Oct)

*Draft by Claude; edit to make it yours.*

**Numbers**

| | |
| --- | --- |
| Planned | 1 day |
| Actual | 1 day (7 Oct), after a morning setting up design skills and the PM playbook |
| First live version | The prototype, before the real app was built (Vercel, early afternoon) |
| Pull requests | 4 (#14–#17) |
| Feedback items | 27: 8 from the interface audit, 12 from the simulated user test, 7 from my review on a real phone. 21 fixed, 2 won't do, 4 parked |
| Who found the bugs | Audit: unreadable text (1.9:1), accessibility. Test agent: reopening on yesterday's searched city (wrong data), today's times under tomorrow's countdown, polar "what next", the sun over the digits, Tokyo looking like Paris. Me on my phone: empty space, spacing, sunset colour, places with no scene, start screen. Claude while building: polar text overlap, a hard glow |
| Time lost to setup | About an hour: the cloud sandbox blocked vercel.app and the lookup APIs, and the test browser couldn't reach the local app |

**Keep**
- The brief as a one-page PRD before code: problem, jobs, alternatives, four risks, success, requirements. The prototype prompt just pointed at it.
- `/prototype`: three working directions behind a picker on the live site made choosing quick (Arc).
- Deploying the prototype early, so I judged it on my phone.
- Measuring guardrails with numbers. The contrast bug looked fine at a glance.

**Change**
- `break-ui` was in the playbook but never ran.
- The audit and the user test ran at the same time, so the tester spent part of its run on a bug the audit had already found.
- Setup surprises again, this time in the cloud sandbox's network rather than Vercel.

**Try next time**
- Run the audit and `break-ui` first, then the simulated user test on the fixed build.
- Set up the sandbox's network access and the local test server at kick-off.
- Show the app to one real person (the only success signal still simulated).

**What surprised me**
- Product: the most emotional moment wasn't in the brief: the minutes around sunset ("happening now", then the afterglow) are what people would show a friend.
- Technical: there is no single "sunset time" at the poles; definitions differ by days. And text colour has to be chosen against what's right behind it, not the screen as a whole.
- Process: writing requirements before the prototype made the three directions sharper, not slower.

**Growth**
- **A, product:** "beautiful" can be a strategy, but only if you name it as the bet and test it ("would you show a friend?").
- **B, product craft:** the brief as a lean PRD; the four risks; deciding success before building, and measuring what a feature is *for* (the landmark → "which city is this?"); prioritising by which signal an item moves.
- **C, technical:** branches, pull requests and merging; time zones with the browser's date formatting; animation with `requestAnimationFrame` and CSS keyframes, with reduced-motion fallbacks; contrast maths; how the sandbox's proxy and network rules work.

**Process changes carried forward** (logged in `docs/learnings.md`)
1. Setup checklist: allow `*.vercel.app` and the product's API domains in the cloud environment, and test in the browser against a production build.
2. The test agent measures every guardrail with a number (e.g. text contrast for each sky).
3. Testing order: audit and `break-ui` first, fix, then the simulated user test.

## Product
- Google already answers "what time is sunset?", so the edge had to be "do I have time?" plus feel. Naming the alternative early shaped the whole home screen.
- The emotional peak (the sunset moment) only showed up in testing; build for the moment, not just the countdown.
- A searched place must never silently stand in for "here": reopening on yesterday's city gave wrong data for the main job.

## Design
- Pick text colour against the exact background behind it; measure it, don't eyeball it.
- Sky above, ground below: starting the ground at the horizon line made the screen read as a real view.
- A silhouette has to be distinct, not just correct: Tokyo Tower read as the Eiffel Tower.

## Engineering
- Sun times: a library (suncalc) plus the place's time-zone name and the browser's date formatting; no hand-written time maths.
- Free, keyless APIs called from the browser (Open-Meteo, BigDataCloud) kept it backend-free.
- In the cloud sandbox: Next's dev server only serves its scripts to localhost, and Playwright sends even localhost through the proxy, so test a production build at the machine's address.

## Process and tools
- `/prototype` (Emil Kowalski's skill) and the `web-design-guidelines` audit earned their place; `mobile-native`'s baseline meant no "feels like a website" findings. Keep the design skills (decision 0008).
- One PR per testing round kept `main` deployable and the history readable.
