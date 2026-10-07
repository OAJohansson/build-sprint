# Journey

What happened, what was decided and why. Newest last.

## 7 Oct · Day 2

### Before starting: design skills
- Assessed design skills before building: UI UX Pro Max (rejected: its fitness advice contradicts
  clean and minimal), Emil Kowalski's skills, Vercel's audit and others. Installed six, each tied to
  a playbook step ([decision 0008](https://github.com/OAJohansson/build-sprint/blob/main/docs/decisions/0008-design-skills.md)).

### The idea
- **Owner's idea:** a sleek app to find sunrise and sunset times anywhere. "I'm in Bali, it's
  almost 5 pm: when's sunset?" Auto-locate, search other places, and since the core is simple,
  put the effort into making it beautiful, with animations.

### Working like a product manager
- **Owner's proposed approach:** define problems and needs, a quick persona, brainstorm MVP
  features, decide how to measure that it solves the need, and work out jobs to be done. Asked for
  a critique and for Claude to act as product coach.
- **Critique:** the order is right (problem before features) and defining success before building
  is the step most people skip. Added: today's alternatives (Google already answers "what time?"
  in 3 seconds, so why switch?), riskiest assumptions (the four risks), and making the
  "beautiful" goal an explicit, testable bet.
- **Process change:** playbook step 1 is now "Discover and frame", written up as a one-page brief
  per product; sprint goals A/B/C at the top of the playbook; a success check at wrap-up.
- Draft [brief](#02-horizon.brief) and persona (Noor, a traveller in Bali) written for the owner
  to react to. Open calls: main job (here-now vs elsewhere), success measures, MVP cut.

### Owner's decisions on the brief
- **Main job:** how long until sunrise or sunset *here*; searching elsewhere is secondary. The app
  covers sunrise and sunset equally, so the name must too (brainstorm open).
- **Sky as background:** the screen shows the place's sky right now, from dawn through midday to
  sunset and night.
- **Landmark (new):** the place's most famous landmark on the horizon (Paris: the Eiffel Tower).
  Coaching point: a feature can be a success signal if you measure what it's *for* (a sense of
  place: do people recognise the city without its name?). It also raised a feasibility risk:
  "any place in the world" can't be done well in a day, so about 10 hand-drawn silhouettes plus a
  generic horizon; automatic landmarks go to the backlog.
- **Success:** the five signals plus "sense of place" and a readability guardrail. **MVP:** as
  proposed, plus sky and landmarks.
- Test plan written: six scenarios from the jobs and success bars.

### Name and landmarks
- **Name: Horizon.** Sunrise and sunset both happen at the horizon, and the landmark sits on it.
  Runner-up: Dawn & Dusk. Renamed the app and docs from `02-sunset` to `02-horizon` before the
  first deploy.
- **Landmarks for the MVP:** Bali (temple gate), Paris, London, New York, Sydney, Rome, Agra,
  Tokyo, Rio, Cairo.

### Requirements before the prototype
- **Owner's question:** should the prototype prompt include all the requirements, and shouldn't
  we list them before designing? Is the brief a PRD?
- **Coaching:** yes, the brief is a one-page PRD. Requirements come out of discovery (Cagan) and
  are written as behaviours with a check, not designs, plus no-gos and rabbit holes (Singer, Shape
  Up). The prompt should point at the brief rather than repeat it, so there's one source of truth.
- Added nine requirements, no-gos, rabbit holes and the appetite to the brief. Playbook step 1 now
  credits each practice to its source, with a new [Product craft](https://github.com/OAJohansson/build-sprint/blob/main/docs/product-craft.md)
  page: the owner's list (Cagan, Perri, Torres, Pichler, Doshi, Rachitsky) plus Singer,
  Christensen and Moesta, Fitzpatrick, Krug and Husain for balance.

### Prototype: three directions (`/prototype`)
- Built at `/prototypes/home` in the app, behind a picker, with real sun times from `suncalc`
  (Bali on 7 Oct: sunrise 06:00, golden hour 17:46, sunset 18:14; the brief's 18:12 was close).
  `?at=06:05` starts the clock at another Bali time to check every sky.
- **Window** (scene first): full-bleed sky, the sun at its real height sinking toward the
  landmark, the countdown floating on the sky.
- **Arc** (instrument): the day as the sun's path; the countdown is the sun's position on it;
  times listed below the horizon.
- **Scrub** (interactive): split at the horizon with the landmark reflected; drag to move through
  time and watch the light change; the countdown as a sentence.
- Search works across three cases: landmark (Paris), no landmark (Lisbon) and far north (Tromsø).
  Owner to pick a direction.

### First deploy
- Merged PR #14 so `apps/02-horizon` was on `main`; Vercel's Root Directory list only shows
  folders on `main`. Deployed to **horizon-beta-wine.vercel.app** before the real app was built,
  so the prototype can be judged on a real phone.
- Learned along the way: commits, branches, pull requests and merging (explained step by step).

### Arc chosen; the MVP built around it
- **Owner picked Arc** (the instrument: the day as the sun's path, the countdown as the sun's
  position on it). Known cost from the prototype table: the landmark is small, so watch the
  "which city is this?" signal in the user test.
- Built the MVP on it (prototype folder deleted):
  - Welcome screen that says why location helps before the browser asks (R2); if refused or
    unavailable, search opens with a short note.
  - Your location named via BigDataCloud's free lookup; city search via Open-Meteo geocoding (any
    city, its own time zone). Both free, keyless, called from the browser; no backend.
  - All 10 landmarks drawn, matched by distance (e.g. within 40 km of Paris); everywhere else a
    calm generic horizon.
  - Live clock (catches up when the tab comes back); remembers your location choice or last
    place on the device.
  - Polar days say "No sunset today" and "Sun up all day".
- **Environment:** the cloud sandbox blocked vercel.app; the owner allowed `*.vercel.app` in the
  environment's network settings so Claude can check deploys. The two lookup services are still
  blocked from the sandbox, so local tests use realistic stand-in answers (same approach as
  CrossFit's AI).
