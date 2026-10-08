# Knowledge bank

General knowledge picked up while building, separate from each product's own Learnings. It's
organised by the skills of building products: the first four categories follow Ravi Mehta's
Product Competency Toolkit (customer insight, strategy, delivery, influence), plus three for the
builder side (design, technology, AI). Every category ends with quiz questions, which feed the
**Quiz** page (active recall, spaced repetition).

| Category | What it covers |
| --- | --- |
| Customer insight | Finding the real problem, research and testing with users, data and metrics |
| Product strategy | Outcomes and bets, risks and assumptions, prioritisation |
| Product delivery | Specifying what to build, building and shipping, quality |
| Design and UX | Principles, accessibility, mobile, motion |
| Technology | Web foundations, data and storage, working with APIs |
| Building with AI | Tools, judgment, evals |
| Communication and influence | Storytelling, writing, decisions |

## Customer insight

### Discovery

#### Discovery before delivery
Find out what's worth building before building it. Fall in love with the problem, not the
solution. *Where I met it:* CrossFit Log v1 logged workouts well but solved the wrong problem; the
real job was recalling a PB mid-class. *(Marty Cagan, Inspired)*

#### Jobs to be done
People "hire" a product to make progress in a situation. Write jobs as "When [situation], I want
[outcome], so I can [motivation]", ranked. The top job decides the main screen. *Where:* Horizon's
top job, "how long until sunset where I am", made the countdown the home screen.
*(Clayton Christensen, Bob Moesta)*

#### Today's alternatives
Ask how people solve the problem now and why they would switch. People switch when the *push* of
the current way and the *pull* of the new one beat their *anxiety* about the change and their
*habits*. *Where:* Google already answers "what time is sunset?", so Horizon had to answer
"do I have time?" and feel better. *(Bob Moesta)*

### User research and testing

#### Testing with users
Three to five users find most of the big usability problems *(Steve Krug)*. A simulated user
(an agent playing a persona) is a cheap first pass that catches wrong numbers and dead ends, not
a replacement for real people.

#### Talking to real people
Ask about their life and past behaviour, not your idea. Compliments are not data; commitments
(time, money, a next step) are. *(Rob Fitzpatrick, The Mom Test)*

### Data and metrics

#### Success signals and guardrails
Define success before building: one main outcome, a few signals you can measure (task done, time,
taps, "would you use it again?"), and a **guardrail**: something that must not get worse, like
correct numbers or readable text.

#### Measure what a feature is for
A feature can't be its own success metric. Ask what it's *for* and measure that. *Where:*
Horizon's landmark is for a sense of place, so the test was "which city is this?" with the name
hidden. That exposed Tokyo looking like Paris.

### Quiz

**Q:** Write the jobs-to-be-done format.
**A:** "When [situation], I want [outcome], so I can [motivation]."

**Q:** What four forces decide whether someone switches to a new product?
**A:** The push of the current situation and the pull of the new solution, against anxiety about the new one and the habits of the current one.

**Q:** Why ask "how do people solve this today?" before building?
**A:** Because the product has to beat that alternative; if you can't say why anyone would switch, change the idea or find the edge.

**Q:** Roughly how many users does a usability test need to find most big problems?
**A:** Three to five (Steve Krug, Jakob Nielsen).

**Q:** What is the core rule of The Mom Test?
**A:** Ask about people's lives and past behaviour, not about your idea. Compliments aren't data; commitments are.

**Q:** What is a simulated user good for, and what isn't it good for?
**A:** A cheap first pass that catches wrong numbers, dead ends and friction; it doesn't replace real people's reactions and context.

**Q:** What is a guardrail metric?
**A:** Something that must not get worse while you chase the main outcome, such as correct numbers or readable text.

**Q:** How do you turn a feature into a success measure?
**A:** Ask what the feature is for and measure that. For example, a landmark is for a sense of place, so measure whether people recognise the city without its name.

## Product strategy

### Outcomes and bets

#### Outcomes over outputs
Success is what changes for the user, not the number of features shipped.
*(Melissa Perri, Escaping the Build Trap)*

#### Name the bet
State the smallest thing that could solve the problem, and what you're betting makes it win.
A differentiation strategy (like "beautiful enough to beat Googling it") is legitimate if you name
it as the bet and test it.

### Risks and assumptions

#### The four risks
Every idea carries four risks: **value** (will they use it?), **usability** (can they?),
**feasibility** (can we build it?) and **viability** (does it work for the business: cost,
legal, time?). Name the riskiest one and make the MVP test it. *(Marty Cagan)*

#### Test assumptions, not whole ideas
Break an idea into the assumptions that must be true, and test the riskiest one cheaply first.
*(Teresa Torres, Continuous Discovery Habits)*

#### Pre-mortem
Before starting, imagine the product has failed and ask why. It surfaces risks that optimism
hides. *(Shreyas Doshi)*

### Prioritisation

#### Impact versus effort
Rank work by which success signal it moves against what it costs, or score it with RICE: Reach ×
Impact × Confidence ÷ Effort.

#### Triage rule
When time is short: fix anything that shows wrong data or looks broken straight away if it's
quick; park the rest in the backlog with a "start here" note.

#### One-way and two-way doors
Irreversible decisions (one-way doors) deserve slow care; reversible ones (two-way doors) should
be made fast, then corrected with real use. When stuck between two good options: go back to the
brief's job and moment of use, test both in the real moment, or flip a coin and notice your
reaction. Where we met it: Scribble's light vs dark design (03), solved by following the phone's
setting. From: Jeff Bezos, Amazon shareholder letter (2015).

### Quiz

**Q:** What's the difference between an outcome and an output?
**A:** An output is what you ship (features). An outcome is what changes for the user because of it. Success should be measured in outcomes.

**Q:** What's a two-way door decision, and how should you treat it?
**A:** A reversible decision. Make it quickly and let real use correct it; save slow deliberation for one-way doors.

**Q:** What are the four product risks, and what does each one ask?
**A:** Value (will they use it?), usability (can they?), feasibility (can we build it?) and viability (does it work for the business: cost, legal, time?).

**Q:** Which risk should the MVP test?
**A:** The riskiest one, often value: will people actually use it instead of what they do today?

**Q:** What does it mean to test assumptions rather than ideas?
**A:** Break the idea into what must be true, then test the riskiest assumption cheaply first, instead of building the whole idea to find out.

**Q:** What is a pre-mortem?
**A:** Imagining the project has already failed and asking why, before starting, to surface hidden risks.

**Q:** What does RICE stand for?
**A:** Reach × Impact × Confidence ÷ Effort.

**Q:** What is a good triage rule when time is short?
**A:** Fix anything that shows wrong data or looks broken straight away if it's quick; park the rest with a note.

## Product delivery

### Specifying

#### The one-page PRD (brief)
A modern PRD (product requirements document) is short and puts the *why* first: problem, who,
jobs; alternatives and riskiest assumptions; success measures; then the MVP and requirements.
Old-style PRDs listed features up front and decided the solution before anyone learned anything.
*(Lenny Rachitsky's collected templates, Cagan's criticism)*

#### Requirements as behaviours
Write each requirement as something the user sees, with a check ("when location is blocked,
search appears"), not as a design. That fixes the *what* and *why* and leaves the *how* to design.

#### Appetite, no-gos and rabbit holes
Fix the time and vary the scope: decide how much time the problem deserves (the **appetite**),
then shape a solution that fits. A good pitch names **no-gos** (what we won't build) and
**rabbit holes** (traps that could eat the time). *(Ryan Singer, Shape Up)*

#### Prototype directions, not variations
Build several genuinely different directions, each defensible on its own, and judge them in
realistic context (on a real phone) against the success signals, not just looks.

### Building and shipping

#### The git building blocks
- **Repository (repo):** the project folder plus its full history.
- **Commit:** a saved snapshot of changes with a message saying why; permanent and revertible.
- **Branch:** a separate line of work. `main` is the official version that gets deployed.
- **Push / pull (fetch):** upload commits to GitHub / download commits from it.
- **Pull request (PR):** a proposal to bring a branch into `main`, where changes are reviewed.
- **Merge:** accepting a PR; its commits join `main`.

#### Local and origin
There are two copies: your computer's (**local**) and GitHub's (**origin**). Git never syncs them
by itself. "61 commits behind origin/main" means your copy hasn't downloaded new work yet.
**Fast-forward** means catching up by adding the missing commits in order. Habit: pull when you
start, push when you finish, and push before switching between machines. Run git in the Claude
app's Terminal panel. `git pull --ff-only` is a safety catch: if your copy and GitHub's have both
changed, it stops instead of blending them. Since all changes reach `main` through PRs, plain
`git pull` works the same for me.

#### Ways to merge, and conflicts
**Merge commit** keeps every commit and adds one recording the merge (safest). **Squash** combines
the PR into a single commit. **Rebase** replays the commits onto `main` without a merge commit.
When two branches change the same lines differently, git can't choose: a **merge conflict**,
which a person resolves.

#### Deploying
Vercel watches `main`: every merge rebuilds and deploys. Branches get their own **preview**
deploys. In a monorepo, each app is its own Vercel project with a **Root Directory**
(`apps/NN-slug`), and the folder list only shows what's on `main`. Deploy early, so the rest of
the day is iterating on a live product.

#### Environment variables and keys
Secrets (API keys) live in environment variables on the server, never in the code. Know the kind
of key: a **publishable** key can be public and is limited (read only); a **secret** key must stay
on the server. Change a variable, then redeploy.

### Quality

#### Testing order
Automated checks first (an interface audit, worst-case data), fix, then the user test on the
fixed build, then your own review, so your opinion doesn't shape what the test looks for.

#### Definition of done
Agree what "done" means before starting (live on phone and desktop, write-up, test run, retro),
so finishing is a check, not a feeling.

### Quiz

**Q:** What does a one-page PRD contain, in order?
**A:** Why (problem, who, jobs), what we don't know (alternatives, riskiest assumptions), how we'll know it worked (success measures), and what we'll build (MVP, requirements, no-gos).

**Q:** How should a requirement be written?
**A:** As a behaviour the user can see, with a check, not as a design. For example: "When location is blocked, search appears."

**Q:** In Shape Up, what are appetite, no-gos and rabbit holes?
**A:** Appetite is the time the problem deserves (fixed); no-gos are what you deliberately won't build; rabbit holes are traps that could eat the time.

**Q:** What is a commit?
**A:** A saved snapshot of changes with a message explaining why; part of the project's permanent history.

**Q:** What is the difference between push and pull?
**A:** Push uploads your commits to GitHub; pull downloads others' commits to your computer.

**Q:** What is a pull request?
**A:** A proposal to bring a branch's changes into main, where they can be reviewed before merging.

**Q:** What does "your branch is 61 commits behind origin/main" mean?
**A:** GitHub's main has 61 commits your local copy hasn't downloaded yet. Pulling (fast-forwarding) catches up.

**Q:** What is a fast-forward?
**A:** Catching up a branch by adding the missing commits in order, without creating a merge commit.

**Q:** What does `--ff-only` add to `git pull`?
**A:** A safety catch: it only catches up (fast-forwards); if both copies have changed, it stops instead of blending them.

**Q:** Name the three ways GitHub can merge a PR.
**A:** Merge commit (keeps all commits plus a merge commit), squash (one combined commit), rebase (replays commits without a merge commit).

**Q:** What causes a merge conflict?
**A:** Two branches changing the same lines of the same file differently; a person has to choose.

**Q:** Why work on a branch instead of changing main directly?
**A:** Safety (live apps stay untouched), review (a PR shows every change), history (reasons recorded) and easy undo.

**Q:** Why couldn't Vercel find a new app's folder for the Root Directory?
**A:** The picker lists folders on main; the folder only existed on an unmerged branch.

**Q:** What's the difference between a publishable key and a secret key?
**A:** A publishable key can be public and is limited (often read-only); a secret key must stay on the server. Using the wrong one makes writes fail.

**Q:** In what order should you test a new build?
**A:** Automated checks first (audit, worst-case data), fix, then the user test, then your own review.

## Design and UX

### Principles

#### Clean and minimal
Every element earns its place. Don't repeat in words what the visual already shows; make a
feature discoverable with one quiet cue instead of a sentence. *(Decision 0007)*

#### Describing a design: from feeling to dimensions
A feeling ("candlelit, vintage, warm") becomes buildable when you split it into separate levers:
mood words (three adjectives plus one you *don't* want), light and colour (dark or light,
temperature, one accent, contrast), typography (serif, typewriter, handwritten; size, line height,
line length), texture (literal vs evoked), space and layout, motion and pace, details and
ornaments, voice of the words, and sound or touch. Why it matters: vague direction gets generic
results, from a designer or an AI. Where we met it: Scribble's candlelit look (03). From: the
mood board and design brief practice; "three words" is a common brand exercise.

#### Skeuomorphism
Making digital things look like physical ones (paper, leather, wood). *Literal* skeuomorphism (the
2010 iPhone) dates fast; *evoked* (a faint grain, warm ink colours, a soft vignette) carries the
feeling without the costume. Where we met it: Scribble (03).

### Accessibility

#### Contrast ratio
Readability is measured as a contrast ratio between text and background, from 1:1 (invisible) to
21:1 (black on white). The WCAG target is **4.5:1** for normal text and **3:1** for large text and
icons. Pick the text colour against the exact background behind it, and measure: on Horizon the
countdown looked fine but measured 1.9:1.

#### Numbers that line up
Use tabular figures (`font-variant-numeric: tabular-nums`) for countdowns and columns of numbers,
so digits don't jump as they change.

### Mobile

#### Touch targets
Anything tappable should be at least 44 × 44 points (Apple) or 48 dp (Android), with space between
targets.

#### Feeling native on a phone
A few lines separate "a website" from "an app": inputs of at least 16 px (or iOS zooms in), `dvh`
instead of `vh` for full-height layouts, safe-area padding for the notch, no grey tap flash,
hover effects only on devices that can hover, and real-phone testing. *(mobile-native skill)*

### Motion

#### When and how to animate
Decide whether something should animate before how. Things seen 100+ times a day shouldn't
animate; occasional things (sheets, toasts) get standard motion; rare moments can delight. Every
animation needs a purpose: feedback, showing where something came from, a state change, or
delight. UI motion stays under about 300 ms and uses a strong **ease-out** (fast start, gentle
stop). Constant or travelling motion (a progress bar, a wave of light) uses **linear**. Animate
`transform` and `opacity`, and always provide a gentler version for **reduced motion**.
*(Emil Kowalski)*

### Quiz

**Q:** What does "clean and minimal" mean in practice?
**A:** Every element earns its place: don't repeat in words what the visual already shows, and make features discoverable with one quiet cue.

**Q:** How do you turn a feeling like "cosy and vintage" into design direction?
**A:** Split it into dimensions: three mood words plus one to avoid, light and colour, typography, texture, space, motion, details, voice, sound/touch.

**Q:** What is skeuomorphism, and which kind ages better?
**A:** Making digital things look physical. Evoked (a hint of grain, warm colours) ages better than literal (fake leather, torn paper).

**Q:** What contrast ratio does WCAG ask for, for normal text and for large text?
**A:** 4.5:1 for normal text, 3:1 for large text and icons.

**Q:** Why might text look readable but fail a contrast check?
**A:** Our eyes adapt and judge in context; the ratio is a measured number. Horizon's countdown looked fine but measured 1.9:1.

**Q:** What are tabular figures for?
**A:** They give every digit the same width, so numbers in columns or countdowns line up and don't jump.

**Q:** What is the minimum comfortable touch target?
**A:** About 44 × 44 points (Apple), 48 dp (Android).

**Q:** Why should form inputs be at least 16 px on phones?
**A:** Below 16 px, iOS Safari zooms the page in when the field is focused.

**Q:** Which easing should a UI element entering the screen use, and why?
**A:** A strong ease-out: it moves immediately (feels responsive) and settles gently.

**Q:** When is linear easing the right choice?
**A:** For constant or travelling motion, like a progress bar or a wave of light moving across the screen.

**Q:** Should something people use 100 times a day animate?
**A:** No. Frequent actions should feel instant; save motion for occasional and rare moments.

**Q:** Which CSS properties are cheapest to animate?
**A:** transform and opacity, because the browser can animate them without re-laying out the page.

**Q:** What does "reduced motion" mean for a designer?
**A:** A system setting some people turn on; respect it by replacing movement with gentle fades or stillness.

## Technology

### Web foundations

#### Server and browser rendering
Next.js can render a page on the server (fast first paint) or only in the browser. Anything that
needs the clock, location or localStorage differs between server and browser, which causes a
**hydration mismatch**. Rendering such parts in the browser only (`dynamic(..., { ssr: false })`)
avoids it.

#### Three ways to animate on the web
**CSS transitions** for state changes (interruptible). **CSS keyframes** for set sequences and
loops. **requestAnimationFrame** in JavaScript for motion computed every frame (like the sun
replaying along the arc).

#### Dev build and production build
The dev server compiles on demand and is made for localhost; a production build (`build`, then
`start`) is what users get. Test the production build when it matters.

#### Network rules in the cloud
A cloud sandbox only reaches domains its network policy allows. Allow what the product needs
(`*.vercel.app`, the API domains) in the environment settings.

### Data and storage

#### localStorage
A small key-value store in the browser. Free and instant, but it lives on one device and one
browser, can be cleared, and isn't shared. Good for preferences and personal data in a prototype.

#### Time and time zones
Store moments as absolute instants (UTC) and show them in a place's time zone by its name, such
as `Asia/Makassar`, using the browser's date formatting (`Intl.DateTimeFormat`). Never hand-write
offsets: daylight saving time breaks them.

### Working with APIs

#### Calling APIs from the browser
Free, keyless APIs (like Open-Meteo) can be called straight from the browser, so no backend is
needed. Anything that needs a secret key must go through a server route instead.

#### Blast radius
How much breaks or leaks when one thing goes wrong. Two apps sharing one database and one
all-powerful key have a bigger blast radius: a bug or a leaked key in either exposes both.
Fine for a single user; split (separate projects, or keys with limited rights) once real users
arrive. Where we met it: Scribble sharing CrossFit Log's Supabase project (03, decision 0009).
From: site reliability and security engineering.

### Quiz

**Q:** What is a hydration mismatch?
**A:** When the HTML rendered on the server differs from the first render in the browser (for example because of the clock or localStorage), so React complains.

**Q:** What's the "blast radius" of sharing one database and secret key between two apps?
**A:** A bug or leaked key in either app can expose both apps' data; acceptable for one user, split once there are real users.

**Q:** When would you use requestAnimationFrame instead of CSS?
**A:** For motion calculated every frame in JavaScript, like moving the sun along an arc to a computed position.

**Q:** Why test a production build, not just the dev server?
**A:** The production build is what users get; it can behave differently, and dev servers are built for localhost.

**Q:** What are localStorage's limits?
**A:** It lives in one browser on one device, can be cleared, holds little data and isn't shared between people.

**Q:** How should you show a time in another city's local time?
**A:** Keep the instant in UTC and format it with the city's time-zone name (e.g. Europe/Paris) using Intl.DateTimeFormat; never hand-write offsets.

**Q:** When can an API be called straight from the browser?
**A:** When it's free and needs no secret key, and allows browser requests (CORS). Anything with a secret key goes through a server.

## Building with AI

### Tools

#### Skills
A skill is a packaged set of instructions an assistant loads for a kind of task. Most trigger
automatically when their description fits; some only run when you call them (`/prototype`).
Keep the set small: competing skills give competing rules.

#### Subagents
An assistant can hand a focused job to a separate agent with its own instructions, such as the
simulated user tester. It returns a report, and the main session decides what to do with it.

### Judgment

#### Keep the product calls
AI is fast at building, testing and drafting; the product decisions stay with you: the problem,
the main job, what to cut, what "done" means. Review its work: AI drafts can look right and still
be wrong (a too-subtle animation, a wrong-number bug).

### Evals

#### What an eval is
A repeatable test of an AI feature: a set of inputs with known good outputs, scored
automatically, so you can tell whether a change made the AI better or worse. Start by looking at
real outputs and where they fail. *(Hamel Husain)*

### Quiz

**Q:** What is a skill, and how does it get used?
**A:** A packaged set of instructions for a kind of task. Most load automatically when their description matches; some only run when called explicitly.

**Q:** Why keep the set of skills small?
**A:** Different skills give different rules; too many and the assistant follows whichever loaded last.

**Q:** What is a subagent?
**A:** A separate agent given one focused job (like a simulated user test) that reports back to the main session.

**Q:** Which decisions should stay with you when building with AI?
**A:** The problem, the main job, what to cut, what "done" means, and which bugs block shipping.

**Q:** What is an eval?
**A:** A repeatable test of an AI feature: inputs with known good outputs, scored automatically, to see whether a change made it better or worse.

## Communication and influence

### Storytelling

#### STAR
For interviews, tell a project as **S**ituation, **T**ask, **A**ction, **R**esult, in about two
minutes, then one line on what you learned. Lead with the problem, say "I", include a mistake and
have the numbers ready.

### Writing

#### Write to think
A short written brief forces clear thinking and lets others (and future you) see the reasoning:
the why first, then the what. One page beats a long document nobody reads.

### Decisions

#### Decision records
Write down non-obvious decisions: the context, what was chosen, the alternatives and why they
lost, and the consequences. It stops the same debate happening twice. *(The `docs/decisions/`
folder)*

### Quiz

**Q:** What does STAR stand for?
**A:** Situation, Task, Action, Result.

**Q:** What makes an interview story land?
**A:** Lead with the problem, say "I", include a mistake and what you changed, and have the numbers ready.

**Q:** What goes in a decision record?
**A:** The context, what was decided, the alternatives and why they lost, and the consequences.
