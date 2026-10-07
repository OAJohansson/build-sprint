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
- Draft [brief](#02-sunset.brief) and persona (Noor, a traveller in Bali) written for the owner
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
