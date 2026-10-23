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

#### Evidence has a kind, not just a size
Before quoting research, check what kind of evidence it is: desk research (studies, reviews,
competitors) tells you what's likely; conversations and behaviour tell you what your users do. A
big pack can contain zero user conversations. Why it matters: claims in a pitch or interview must
match the evidence ("research suggests" vs "users told me"). Where we met it: Inkling (05), whose
16-competitor discovery had no interviews. From: Teresa Torres, *Continuous Discovery Habits*.

### User research and testing

#### Testing with users
Three to five users find most of the big usability problems *(Steve Krug)*. A simulated user
(an agent playing a persona) is a cheap first pass that catches wrong numbers and dead ends, not
a replacement for real people.

#### Talking to real people
Ask about their life and past behaviour, not your idea. Compliments are not data; commitments
(time, money, a next step) are. *(Rob Fitzpatrick, The Mom Test)*

#### Maximisers and satisficers
Some people compare carefully before choosing (**maximisers**); others take the first option
that's good enough (**satisficers**) *(Barry Schwartz, The Paradox of Choice, 2004)*.
Maximisers want more options, with reasons and reviews to check; satisficers want a short list.
Where we met it: Folio (06): the owner over-researches, so Folio shows 10 picks.

#### You are not your user
Your own habits are a hypothesis, not the answer: check them against how people in general
behave. Where we met it: Folio (06): the owner reads all 10 picks, but chose to score order
anyway, because most people look closely at only the first few.

### Data and metrics

#### Success signals and guardrails
Define success before building: one main outcome, a few signals you can measure (task done, time,
taps, "would you use it again?"), and a **guardrail**: something that must not get worse, like
correct numbers or readable text.

#### Measure what a feature is for
A feature can't be its own success metric. Ask what it's *for* and measure that. *Where:*
Horizon's landmark is for a sense of place, so the test was "which city is this?" with the name
hidden. That exposed Tokyo looking like Paris.

#### Setting a target without a baseline
With no past numbers, a target feels like a guess, so don't pretend it's a forecast. Three ways
to make it honest: write it as a falsifiable bet, "at least X of Y will Z" (at least 3 of my next
10 interviewers will mention something from the site); set it at the number that would **change
what you do** (0 of 10 means rethink the site; 3 or more means keep going), not the number you
hope for; and with small numbers, use counts over a fixed window, not percentages. The first
round sets the baseline; the second target is the real one. *Where:* the Andreas Product
Portfolio Website's success signals. *(Alberto Savoia, The Right It: the XYZ hypothesis; Douglas
Hubbard, How to Measure Anything: measure to reduce uncertainty for a decision)*

#### Recall bias
People asked "how has the last month been?" don't average the month: they remember the peaks,
the most recent days and how they feel right now. So a measure taken at the moment beats a
summary from memory, which is why diaries and daily check-ins exist (ecological momentary
assessment). Why it matters: if a decision rests on recalled data, the product can win by
capturing it at the time. Where we met it: Mallow (04), patients rebuilding weeks of pain in a
15-minute follow-up. From: Kahneman's peak-end rule; clinical research on patient diaries.

#### The Barnum effect
People rate vague, flattering descriptions ("you value independence but also connection") as a
very accurate picture of themselves. So "users loved their result" proves little; what they *do*
with it is the test. *Where:* stress-testing a self-discovery questionnaire app (07 discovery,
parked). *(Bertram Forer, 1949)*

#### The Johari window
What you know about yourself and what others see only partly overlap: open, blind, hidden and
unknown areas. Asking someone else the same questions shows the blind spot. *Where:* the "seen by
others" idea for the parked self-discovery app. *(Joseph Luft and Harrington Ingham, 1955)*

### Quiz

**Q:** How do you set a success target when you have no baseline?
**A:** Write it as a falsifiable bet ("at least X of Y will Z"), set it at the number that would change your decision, and use counts over a fixed window when numbers are small. The first round becomes the baseline.

**Q:** Why prefer "3 of my next 10 interviews" over "30% of interviews"?
**A:** With small numbers a percentage swings wildly and hides how little data there is; a count over a fixed window is honest and easy to check.

**Q:** What is the Barnum effect, and why does it matter for a personality-quiz product?
**A:** People accept vague, flattering descriptions as accurate, so liking the result proves little; measure what people do with it.

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

**Q:** What is recall bias, and how does a product get around it?
**A:** People remember peaks, recent days and their current mood rather than an average; capture the data at the moment (a daily check-in) instead of asking afterwards.

**Q:** What does Kahneman's peak-end rule say?
**A:** We judge an experience mostly by its most intense moment and how it ended, not by its total or average.

**Q:** A research pack has 16 competitor reviews and many surveys. What should you check before quoting it?
**A:** What kind of evidence it is: desk research says what's likely; only conversations and behaviour show what your users do.

**Q:** What's the difference between a maximiser and a satisficer, and what does each want from a list of options?
**A:** A maximiser compares carefully and wants more options with reasons; a satisficer takes the first good-enough option and wants a short list.

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

#### Assumption mapping: picking the riskiest assumption
**What it is.** A way to decide which assumption to test first. "Riskiest" combines two
questions: **how important is it** (if it's false, does the product fail?) and **how much
evidence do I have** (have I seen it, or am I guessing?). The riskiest assumption is high on the
first and low on the second.

**How it works, in four steps:**
1. **Write the assumptions down** as statements that could be wrong: "I believe hiring managers
   will click a link in a CV." One per sticky note. Cover all three kinds: *desirability* (do they
   want it?), *feasibility* (can we build it?) and *viability* (does it work for the business:
   cost, legal, time?). Cagan's four risks split usability out of desirability.
2. **Place each on a 2×2.** Vertical axis: important (top) to unimportant (bottom). Horizontal
   axis: no evidence (left) to strong evidence (right). Place them relative to each other; exact
   positions don't matter.
3. **Read the four corners:**
   - *Important, no evidence* (top left): **test now**. This is where products die.
   - *Important, evidence* (top right): plan around it; keep an eye on it.
   - *Unimportant, no evidence* (bottom left): park it; it isn't worth the test yet.
   - *Unimportant, evidence* (bottom right): safe; ignore.
4. **Design the cheapest test** for the top-left ones, then **move the notes** as evidence comes
   in. The map is a living thing, not a one-off.

**Why it matters.** Teams naturally test what's easy or interesting, not what's risky, and build
the whole thing before learning that one load-bearing belief was false. The map makes the bet
visible and argues for doing the scary test first. Evidence has strength too: what people *do*
(clicked, paid, came back) beats what they *say* ("I'd use that").

**Where we met it:** the Andreas Product Portfolio Website, choosing between "product thinking
comes across in seconds on a phone", "creative design helps rather than gets in the way",
"I can show enough employer work" and "hiring managers click the link".

*(David Bland and Alex Osterwalder, Testing Business Ideas, 2019; desirability, feasibility,
viability from IDEO's design thinking)*

#### Test assumptions, not whole ideas
Break an idea into the assumptions that must be true, and test the riskiest one cheaply first.
*(Teresa Torres, Continuous Discovery Habits)*

#### Pre-mortem
Before starting, imagine the product has failed and ask why. It surfaces risks that optimism
hides. *(Shreyas Doshi)*

#### In regulated products, words are claims
In health and finance, the name, copy and charts can count as claims about what a product or
medicine does. Medical cannabis is a prescription-only medicine in the UK, and promoting those to
the public is restricted (MHRA). So describe a feeling or show the user's own data ("your sleep,
last 30 days"), never promise a result ("pain free"). It's also more honest: some weeks the data
will say it didn't help. Why it matters: it's a viability risk you can design out on day one.
Where we met it: naming Mallow (04). From: Cagan's viability risk (legal and compliance).

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

**Q:** In assumption mapping, what are the two axes, and which corner do you test first?
**A:** Importance (would the product fail if it's false?) and evidence (have I seen it, or am I guessing?). Test the important, no-evidence corner (top left) first.

**Q:** What do you do with an assumption that's important but already has strong evidence, and one that's unimportant with no evidence?
**A:** Important with evidence: plan around it and keep watching it. Unimportant with no evidence: park it; it isn't worth testing yet.

**Q:** Why is "people said they'd use it" weak evidence, and what's stronger?
**A:** What people say they'd do is a poor predictor; what they actually do (click, pay, come back) is much stronger evidence.

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

**Q:** Why is "Pain Free" a risky name for a medical cannabis app in the UK?
**A:** It promises a result for a prescription-only medicine, which UK rules restrict; a name describing a feeling, plus the user's own data, avoids the claim.

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

#### Spike (a throwaway probe)
A small, time-boxed build that answers one technical question before you design around it, then
gets thrown away or folded in. Why it matters: an hour of probing beats a day of building on a
wrong guess. Where we met it: Selvedge (08): a share-target probe that only shows what Instagram,
Pinterest and the gallery send. From: Extreme Programming (Kent Beck, 1990s).

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

#### Worktrees and small batches
A **worktree** is a second folder of the same repo, checked out on its own branch, so two pieces
of work never share files. Why it matters: two sessions editing one folder can overwrite or
commit each other's changes, which is worse than a merge conflict because nothing warns you.
Pair it with **small batches**: branch from the latest `main` and merge the same day, so there is
little for branches to disagree about. Shared files that everyone appends to (a knowledge bank,
a lockfile) are where conflicts still happen, so add to them last. Where we met it: 20 Oct,
three sessions in one folder (Mallow, Selvedge, Scribble) left mixed uncommitted work on a
stale branch. From: `git worktree` (Git 2.5, 2015); small batches from Don Reinertsen's *The
Principles of Product Development Flow* (2009) and trunk-based development (DORA research).

#### Deploying
Vercel watches `main`: every merge rebuilds and deploys. Branches get their own **preview**
deploys. In a monorepo, each app is its own Vercel project with a **Root Directory**
(`apps/NN-slug`), and the folder list only shows what's on `main`. Deploy early, so the rest of
the day is iterating on a live product.

#### Environment variables and keys
Secrets (API keys) live in environment variables on the server, never in the code. Know the kind
of key: a **publishable** key can be public and is limited (read only); a **secret** key must stay
on the server. Change a variable, then redeploy.

Two files keep them apart: **`.env.example`** is a committed template that lists the variable
*names* (and where to get each), with empty values; **`.env.local`** holds the real values, and
git ignores it. Next.js reads `.env.local` automatically when the app runs on your machine, and
the host (Vercel) gets the same values from its own settings. Where we met it: every app with a
key; Folio (06) has three.

### Quality

#### Testing order
Automated checks first (an interface audit, worst-case data), fix, then the user test on the
fixed build, then your own review, so your opinion doesn't shape what the test looks for.

#### Definition of done
Agree what "done" means before starting (live on phone and desktop, write-up, test run, retro),
so finishing is a check, not a feeling.

#### Let time pass in tests
Most tests check one moment. Real use stretches across time: the app resumed from the background
(not reloaded), midnight passing, a date that moves. Anything that says "since", "last time" or
"in 9 days" needs a test where time passes. Why it matters: these bugs never show in a demo.
Where we met it: Mallow (04), where two of four major findings only appeared that way. From:
testing practice for time-dependent software (fake clocks, e.g. Playwright's clock).

#### Kinds of tests
User-journey tests try the app the way a person would: tap through a task and see if it works.
Our playbook's step 3b (simulated user, break-ui, walking the brief) is this kind. Unit tests are
small pieces of code that check one piece of logic with sample inputs ("workouts Monday and
Wednesday → streak of 1 week") and run automatically on every change. Journey tests find what
confuses people; unit tests catch logic that quietly breaks later, especially dates and edge
cases. Evals are unit tests for AI behaviour. We unit-test only date, time and streak logic, where our
bugs have been (decision 0011). Choosing what to test is risk-based testing: test where a failure
is both likely and costly, and leave the rest to the user test. From: the test pyramid (Mike Cohn), many small fast tests at the
bottom, few slow journey tests on top.

#### Root cause, not patch
When a bug shows on one screen, find every place that uses the faulty code and fix it once at the
source, rather than patching the screen where you saw it. Patches pile up and the bug returns
elsewhere. Where we met it: decision 0011 (from the ponytail skill's review).

#### YAGNI and labelled shortcuts
YAGNI, "You Aren't Gonna Need It": don't build options or flexibility nobody asked for. Shortcuts
are fine in a sprint if they're visible: label each in code (`shortcut: <limit>, <when to
upgrade>`) so the technical debt can be found later. From: Extreme Programming (Kent Beck, Ron
Jeffries).

### Quiz

**Q:** What is a spike, and when do you run one?
**A:** A small, time-boxed probe that answers one technical unknown before you design around it; run it first when a feasibility question could change the plan.

**Q:** What's the difference between a user-journey test and a unit test?
**A:** A journey test tries the app like a person would and finds confusion and broken flows; a unit test checks one piece of logic with sample inputs, runs automatically, and catches logic that breaks later.

**Q:** How does a unit test check "what happens just after midnight" without waiting?
**A:** It fakes the clock: set "now" to 00:01 (`vi.setSystemTime`), run the logic, and compare with the expected answer.

**Q:** Why fix a bug's root cause instead of the screen where it appeared?
**A:** Other places using the same code have the same bug; a patch leaves them broken and piles up.

**Q:** What does YAGNI stand for, and where does it come from?
**A:** "You Aren't Gonna Need It": don't build what nobody asked for. From Extreme Programming (Kent Beck, Ron Jeffries).

**Q:** Why add a "time passes" scenario to a user test?
**A:** Because resuming an app, crossing midnight or a date moving can break anything time-based ("last time", countdowns), and a one-moment test never sees it.

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

**Q:** What is a git worktree, and why give each parallel session one?
**A:** A second folder of the same repo on its own branch; sessions then can't overwrite or commit each other's changes.

**Q:** Why merge small and often when work runs in parallel?
**A:** The less a branch drifts from `main`, the fewer lines two branches can change differently, so conflicts stay rare and small.

**Q:** Why work on a branch instead of changing main directly?
**A:** Safety (live apps stay untouched), review (a PR shows every change), history (reasons recorded) and easy undo.

**Q:** Why couldn't Vercel find a new app's folder for the Root Directory?
**A:** The picker lists folders on main; the folder only existed on an unmerged branch.

**Q:** Why have both `.env.example` and `.env.local`?
**A:** The example is a committed template with names only, so anyone knows what to set; the local file holds the real secrets and is never committed.

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

#### Progress without punishment
Show progress as something changing over time (your thinking, your skill), not as streaks or
counts you can lose. Why it matters: punishing mechanics drive people away, and for under-18s in
the UK they can count as nudge techniques, which the Children's Code rules out. Where we met it:
Inkling (05): ideas that "came back" instead of a streak. From: the ICO Age Appropriate Design
Code; Finch and How We Feel as apps young people keep.

#### The Double Diamond
A design process in two diamonds: first widen (discover many possibilities), then narrow (define
one direction), then widen again (develop options) and narrow (deliver one). The point is to
diverge on purpose before converging, instead of polishing the first idea. Where we met it: the
`design-session` skill (06 Folio): Discover, Define, Deliver. From: the UK Design Council (2004);
applied to AI design by Anshu Chimala (Lenny's Newsletter, 2026).

#### AI tells and hand-written copy
Every model overuses certain patterns (purple gradients, glows, cards in cards, eyebrow labels,
"unlock" and "seamless"), and once users notice them, a design reads as AI-made. Look for them
while refining and try alternatives, rather than banning them up front. Treat AI-written copy as
lorem ipsum: a human rewrites every line in one voice, and it usually gets shorter. Where we met
it: `design-session`, `tells.md` (06 Folio). From: Anshu Chimala (Lenny's Newsletter, 2026).

#### Defaults are suggestions
Whatever a field starts with is what most people keep: a default reads as "the normal choice".
Why it matters: a prefilled number is a recommendation in disguise, and a prefilled date quietly
becomes history. Where it's not the user's choice to make for them, start empty (or with rough quick
picks) instead. Where we met it: Mallow (04) v2: amounts started at 0.5 ml and 2 puffs, and dates at
"28 days ago" and "today"; the owner chose blank amounts and "About when?" quick picks. From:
Thaler and Sunstein, *Nudge* (2008); Johnson and Goldstein's organ-donation defaults (2003).

#### One fact, one wording
When two screens describe the same thing, they must agree and use the same words, or people trust
neither. Why it matters: in a 10-second glance, the first sentence wins; if it contradicts the
detail, the detail is lost. Where we met it: Mallow (04) v2 user test: the Journey caption said
anxiety was "quite, as before" while the Summary said "a little better"; the owner made the
caption say then → now in the Summary's words. From: Jakob Nielsen's heuristic "Consistency and
standards" (1994).

#### Premature commitment
Making people decide something before they have what they need to decide it well. Why it matters:
the choice is a guess, and fixing it costs a detour. Where we met it: Selvedge (08): picking photos
in the inbox before making a board asked the owner to choose a board's photos before seeing them
together; on a moodboard you find out what fits by placing it. The board's tray now shows every
save (Days and Folders), so choosing happens on the board. From: Thomas Green's cognitive
dimensions of notations (1989).

#### Recognition rather than recall
Let people see the options instead of having to remember them. Why it matters: memory is slow
and patchy; seeing is fast. Where we met it: Selvedge (08): a board's tray showed only the photos
picked for it, so adding one more meant remembering what was in the inbox and going back; now the
tray shows the inbox's Days and Folders, with a tick on photos already used. From: Jakob Nielsen's
sixth usability heuristic (1994).

#### Proximity (Gestalt)
Things placed close together are read as one group; things far apart as unrelated. Why it
matters: a control far from what it changes looks like it belongs to something else, so people
hunt for it or misread it. Where we met it: Selvedge (08) inbox: the Days and Folders tabs sat at
the far right, away from the title they switch; the owner moved them next to the logo, as the
board editor already had them, and the main action (Add photos) took the right side. From: the
Gestalt psychologists (Wertheimer, 1923), brought to screens by designers like Alan Cooper.

#### Progressive disclosure
Show the simple, cheap option first and offer the heavier one only once it's relevant. Why it
matters: most people never need the advanced path, so making it the default costs everyone the
wait; hiding it entirely leaves the hard cases stuck. Where we met it: Selvedge (08) cut-outs:
the quick model (44 MB, 8 s) is the default, and "Cut out more carefully" (219 MB, about 40 s)
appears only after a quick cut-out, for the photos it missed. From: Jakob Nielsen (2006), going
back to Xerox Star's design in the early 1980s.

### Accessibility

#### Contrast ratio
Readability is measured as a contrast ratio between text and background, from 1:1 (invisible) to
21:1 (black on white). The WCAG target is **4.5:1** for normal text and **3:1** for large text and
icons. Pick the text colour against the exact background behind it, and measure: on Horizon the
countdown looked fine but measured 1.9:1.

#### Numbers that line up
Use tabular figures (`font-variant-numeric: tabular-nums`) for countdowns and columns of numbers,
so digits don't jump as they change.

#### Text direction for what people write
Anything users type can be in a right-to-left language (Arabic, Hebrew). Put `dir="auto"` on inputs
and on elements showing user text so the browser picks the direction per paragraph; otherwise
punctuation lands on the wrong side. Where we met it: Inkling (05), break-ui with an Arabic entry.

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

#### Jakob's law
People spend most of their time in other products, so they expect yours to work the same way.
Fight that expectation only when you have a clear reason. *Where:* Six AM's first idea, a jam
grid of lanes, made no sense to the owner, who expected GarageBand's timeline; the timeline won.
*(Jakob Nielsen)*

#### Content before layout
Agree what has to be on the screen before designing how it looks; a layout judged without its
real content is a guess. *Where:* Six AM's first contact sheet looked "childish" partly because
the features weren't agreed; listing them first (from GarageBand and rekordbox) fixed it.

#### Thumbnail sketches (a contact sheet)
When choosing from words is hard, draw many directions small and rough, side by side, and pick
from pictures. Blending all the ideas into one averages them into something generic.
*Where:* Six AM's ten directions on one page, then three built properly. *(Photographers'
contact sheets; design studio practice)*

#### Design for the decision (data-ink)
Before drawing a chart, say in one sentence what the reader must conclude, then remove everything
that doesn't help them get there: extra colours, numbers on every point, legends a label can
replace, decoration. Why it matters: a chart read in 10 seconds (a video call) gets one glance; every
competing mark costs that glance. *Where:* Mallow v2's graph: the owner's sentence ("how the
symptoms changed and what they were on") cut daily dots from long ranges, put the takeaway above
the graph and named medicines instead of colouring them. *(Edward Tufte's data-ink ratio, The
Visual Display of Quantitative Information; Stephen Few on dashboards)*

### Quiz

**Q:** What is premature commitment, and how did Selvedge remove it?
**A:** Being made to decide before you can judge; picking a board's photos in the inbox before seeing them together. The board's tray now shows every save, so you choose while placing.

**Q:** What is "recognition rather than recall"?
**A:** Show the options instead of making people remember them (Nielsen's sixth heuristic); Selvedge's board tray shows the inbox's Days and Folders, with used photos ticked.

**Q:** What does the Gestalt principle of proximity say, and what did it change in Selvedge's inbox?
**A:** Close things read as a group; the Days/Folders tabs moved from the far right to beside the logo they belong to.

**Q:** What is progressive disclosure, and where did Selvedge use it?
**A:** Offer the simple option first and the heavier one only when needed; "Cut out more carefully" (the slow, 219 MB model) appears only after the quick cut-out.

**Q:** What is "design for the decision", and how did it shape Mallow's graph?
**A:** Name what the reader must conclude, then cut what doesn't serve it (Tufte's data-ink): the owner's one sentence removed daily dots over months, moved the takeaway above the graph and labelled medicines instead of colouring them.

**Q:** What does Jakob's law say, and what did it change in Six AM?
**A:** Users expect your product to work like the ones they already know; the owner expected a GarageBand-style timeline, so it replaced the jam grid.

**Q:** Why agree the features before designing a screen?
**A:** You can't judge a layout without its real content; designs made from vibes alone miss what has to fit.

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

**Q:** Why show progress without streaks in an app for 16–25-year-olds?
**A:** Punishing mechanics drive people away, and for under-18s in the UK they can count as nudge techniques the Children's Code rules out.

**Q:** Which attribute keeps right-to-left user text (like Arabic) displaying correctly?
**A:** `dir="auto"` on the input and on elements that show user text.

**Q:** What are the Double Diamond's four moves?
**A:** Diverge to discover, converge to define, diverge to develop options, converge to deliver one.

**Q:** Why review a design for "AI tells" rather than ban them in the prompt?
**A:** None is wrong on its own, and banning them up front makes the model overthink and invent stranger patterns; check and try alternatives instead.

**Q:** Why can a prefilled amount break a "never suggest a dose" rule?
**A:** People keep defaults, so a starting number works as a recommendation even if nobody meant it as one.

**Q:** Two screens describe the same trend in different words. What goes wrong?
**A:** People trust the first one they read and doubt both; one fact should have one wording everywhere.

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

#### Web Share Target (a web app in the share sheet)
An installed web app (PWA) can list itself in Android's share sheet by declaring a
`share_target` in its manifest; the shared image, link or text then arrives as a request to the
app, usually caught by its service worker. Why it matters: it gives a web app the "save from
anywhere" move without a native app. Limits: Android Chrome only (not iOS), only once installed,
and each source app decides what it sends (often a link, not the picture). Where we met it:
Selvedge (08) capture. From: the W3C Web Share Target spec (Google, 2019).

#### Installable web app (PWA) versus a native wrapper
A website becomes "installable" with a **web app manifest** (name, icon, colours,
`display: standalone`) plus an `apple-touch-icon`. Safari's **Add to Dock** (Mac) or **Add to Home
Screen** (iPhone) then opens it in its own window with an icon and no browser bar. Why it matters:
most of what "make it an app" means (an icon, focus, no tabs) costs 30 minutes, not a native
build. The next step up is a **wrapper** like Capacitor: a real Xcode project that shows the site,
which earns its keep only for native features (widgets, reliable notifications, App Store). An
installed web app keeps its own storage, separate from the browser's. Where we met it: Scribble
(03) as a Dock app, then Six AM (07). From: the W3C Web App Manifest spec; "Progressive Web Apps", coined by Alex
Russell and Frances Berriman (Google, 2015).

#### Open Graph tags (link previews)
`<meta property="og:image">`, `og:title` and friends in a page's head say what a link preview
shows: the picture, title and description you see when a link is pasted into a chat. Why it
matters: a server can fetch a public page and read its preview without an API. Limits: the
image may be cropped or small, signed links can expire (so download it), and sites can block
fetches. Where we met it: Selvedge (08): Instagram and Pinterest share only a link, but both
pages carry an `og:image`. From: Facebook's Open Graph protocol (2010).

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

#### Raw data stays raw
Keep a source file exactly as it came (an export, a download) and put fixes in a separate,
explained step: a corrections file or a cleaning script. Why it matters: you can always rerun from
the source, see every change and why it was made, and re-export without losing your fixes. Where
we met it: Folio (06): a misplaced *Mindset* rating fixed in `corrections.json`, not in the
Goodreads CSV. From: data engineering practice (immutable raw layer, as in "bronze/silver/gold").

#### Controlled vocabulary (mapping messy tags)
User-generated tags are messy: hundreds of variants, other languages, noise. To filter on them,
define a short fixed list of categories (a controlled vocabulary or taxonomy) and write rules
that map raw tags into it, allowing several per item and keeping an honest "unsorted" bucket.
Why it matters: every catalogue, store and search filter does this, and the rules (or a
classifier) are where quality is won or lost. Where we met it: Folio (06): 600+ Open Library
subjects mapped to 10 shelf genres; 73 of 285 books left unsorted.

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

#### One data shape, two sources (adapter pattern)
Define the data your screens need as one interface, then write two implementations: one calls the
real API, one returns demo or test data. The screens never know which they got. Why it matters: a
safe public demo, tests without a backend, and no screen built twice. Where we met it: Inkling
(05): `/demo` runs Maya's scripted journal through the same screens as the real app.

### Recommendation systems

#### The three families of recommender
A recommender predicts how much someone would like something they haven't seen. **Popularity**
recommends what most people like: trivial, and hard to beat for new users. **Content-based**
matches features of items you liked (genre, author, description): works for one user and can
explain itself, but stays in a bubble. **Collaborative filtering** uses people with similar taste
("readers like you loved…"): finds surprising picks, but needs many users and can't place a new
item or user. Why it matters: every product's "for you" is one of these or a blend. Where we met
it: Folio (06). From: the Netflix Prize (2006–09) and the recommender systems literature.

#### Multi-stage recommenders: retrieval, ranking, re-ranking
Real systems work in stages. **Retrieval** narrows millions of items to a few hundred, fast,
usually with embeddings. **Ranking** scores those with a heavier model and many signals.
**Re-ranking** applies rules on top: variety, nothing already seen, freshness. Spotify's Discover
Weekly blends collaborative filtering on playlists, language models on what people write about
artists, and audio models for brand-new songs. Why it matters: it's the shape interviewers expect
you to sketch. Where we met it: Folio (06). From: Covington et al., "Deep Neural Networks for
YouTube Recommendations" (2016).

#### Embeddings
An embedding turns a thing (a book description, a user, a song) into a list of numbers, so that
similar things land close together; "similar" becomes a distance you can compute (cosine
similarity). A "two-tower" model learns one embedding for users and one for items, in the same
space. Why it matters: embeddings power retrieval, search and most modern AI features. Where we
met it: Folio (06), content-based step.

#### Explicit vs implicit feedback
**Explicit** feedback is what people tell you: a star rating, a thumbs up. It's clear but rare,
and skewed (people mostly rate what they liked). **Implicit** feedback is what people do: plays,
saves, skips, adding to a want-to-read list. It's noisy but plentiful, so most real recommenders
(Spotify, YouTube) run mainly on it. Where we met it: Folio (06): 65 rated books, but 287
want-to-reads, and ratings only from 3 to 5 stars.

#### Cold start
A recommender has nothing to go on for a new user or a new item. Fixes: ask for a few favourites
up front, fall back to popularity, or use content features (Spotify's audio models place songs no
one has played yet). Where we met it: Folio (06), solved for the owner by importing a Goodreads
history.

#### Precision vs recall in matching
When matching records (an imported book to a catalogue entry), a looser rule finds more matches
(recall) but more of them are wrong (precision). Which error is worse depends on what a match
does: when matches merge records, a wrong match destroys data, so prefer precision and let a
person fix the leftovers. Where we met it: Folio (06): a broader search "matched" *A Corruption of
Blood* to *Imitation of Christ*; we kept strict matching and listed the 15 unmatched books.

#### The long tail and popularity bias
A few books are read by almost everyone; most books are read by a few people each, and together
those make up most of what people read: the **long tail** *(Chris Anderson, 2004)*. Accuracy
grades reward recommending what everybody reads, so models drift towards bestsellers
(**popularity bias**). Experienced readers live in the tail: they read the famous books first and
move on. Why it matters: the tail is where a personal recommender earns its keep. Where we met
it: Folio (06): goodbooks readers' first books sit around popularity rank 290, their latest liked
ones around 1,700; the owner's *Design of Everyday Things* is rank 8,973 of 10,000.

#### Item cold start, and why hybrids exist
A "readers like you" model only knows books that sit on readers' shelves; a new book nobody has
read is invisible to it, however good the model. Models that read content (descriptions, audio)
can place a brand-new item, and AI models know newer books but can invent some. Each family
covers another's blind spot, which is the real reason production systems are hybrids (Spotify
places new songs with audio models). Where we met it: Folio (06): only 11 of the owner's 66
want-to-reads since 2023 are in the 2017 dataset.

#### Context: the same person wants different things at different times
Taste is stable-ish; intent isn't. On a fiction evening a great non-fiction pick is wrong
*tonight*. Two designs: one varied list the person scans (needs diversity), or a mood choice first
(needs accuracy within a mood). Where we met it: Folio (06), owner: "it depends on my mood";
parked for the re-ranking step.

#### Benchmark datasets and staleness
A **benchmark** is a public dataset everyone tests on, so results compare across papers and
teams. They're frozen in time (**staleness**): goodbooks-10k is Goodreads' 10,000 most popular
books around 2017, with 53k readers and 6M ratings. Goodreads closed its API in Dec 2020, so no
fresh copy exists; Amazon Reviews 2023 is fresher but messier; Open Library's monthly dumps have
no reader id, so they can't show which books sit on the same shelf. Separate *learning the
method* (a benchmark is fine) from *serving today's books* (needs fresh data). Where we met it:
Folio (06).

#### TF-IDF: describing an item by its rare words
Turn each item into a fingerprint, one number per word (or tag): **TF** (term frequency) says how
strongly this item carries the word, **IDF** (inverse document frequency) says how rare the word
is across all items, so "favorites", on nearly every book, counts for almost nothing and
"cancer-memoir" counts a lot. Items with similar fingerprints are similar (cosine similarity);
a user is a blend of the items they liked. Why it matters: a fast, explainable content baseline
that needs no other users. Where we met it: Folio (06), on Goodreads shelf tags: 2.3× bestsellers,
but 70% of its hits were sequels. From: Karen Spärck Jones (1972), the idea behind early search
engines.

#### An LLM as the recommender
Show the model the user's history and ask for items by name. It knows items newer than any
dataset and writes reasons, but it can invent items, repeat what the user owns, and favours
famous things. So **the model isn't the system**: code around it matches names to a real
catalogue, drops owned and duplicate items, and checks existence (Folio uses Open Library). Why
it matters: the common shape of "AI recommendations" today, and a cheap MVP. Where we met it:
Folio (06): Haiku tied TF-IDF on goodbooks readers; Opus found 7 of the owner's 48 books, the
classic models 0.

#### Matching records across datasets: a ladder
Try the strictest identifier first (a shared id), then a looser one (ISBN, but every edition has
its own), then normalised title + author, and check the loose matches by eye. Some matches only a
person knows (*If This Is a Man* is *Survival in Auschwitz* in the US). Watch for damaged fields:
goodbooks stored 13-digit ISBNs as rounded numbers, and dropped leading zeros from 10-digit ones.
Where we met it: Folio (06): 131 by id, 0 extra by ISBN, 12 by title + author, all correct.

### Audio

#### Schedule sound on the audio clock
Browser timers (setTimeout, requestAnimationFrame) drift and pause; the Web Audio clock doesn't.
Schedule each note a little ahead on `AudioContext.currentTime` and let a timer only look
ahead. *Where:* Six AM's playhead is a silent rAF loop for now; real sound must use the audio
clock. *(Chris Wilson, "A Tale of Two Clocks")*

#### Sample licences: use vs redistribute
Most sample packs, free ones included, let you use the sounds *in your tracks* but forbid sharing
the raw files inside another app. CC0 sounds can be shipped. *Where:* Six AM's crate must be CC0
(Freesound filters by licence).

#### House is built in 8-bar phrases
Dance tracks change every 8 bars (and 16, 32): that's where sounds come in and drop out and how
DJs count. *Where:* Six AM's ruler labels every 8 bars, with grid lines every 4.

### Quiz

**Q:** What does a website need before "Add to Dock" or "Add to Home Screen" makes it feel like an app?
**A:** A web app manifest (name, icons, `display: standalone`) and an apple-touch-icon; then it opens in its own window with its own icon.

**Q:** When is wrapping a web app in Capacitor worth it over a PWA?
**A:** When you need native features (widgets, dependable notifications, the App Store); for an icon and a focused window, a PWA is enough.

**Q:** A shared link has no picture. Where can a server find one without an API?
**A:** In the page's Open Graph tags (`og:image`), the same ones that make link previews; download it, since the link may expire.

**Q:** What does the Web Share Target API let a web app do, and where does it work?
**A:** Appear in the phone's share sheet and receive images, links or text; only Android Chrome, and only once the app is installed.

**Q:** Why not time music with setTimeout in the browser?
**A:** Timers drift and pause in background tabs; schedule notes ahead on the Web Audio clock (AudioContext.currentTime) instead.

**Q:** Can you ship a free sample pack's sounds inside your app?
**A:** Usually not: most licences allow use in your own tracks but not redistributing the raw files. CC0 sounds are safe.

**Q:** In TF-IDF, why does a tag like "favorites" count for almost nothing?
**A:** IDF: it's on nearly every book, so it says nothing about any one of them; rare tags get the weight.

**Q:** Why isn't an LLM on its own a recommender system?
**A:** It can invent items, repeat what the user owns and favour famous ones; code around it must match names to a real catalogue and drop owned, repeated and unknown items.

**Q:** What is a hydration mismatch?
**A:** When the HTML rendered on the server differs from the first render in the browser (for example because of the clock or localStorage), so React complains.

**Q:** What's the "blast radius" of sharing one database and secret key between two apps?
**A:** A bug or leaked key in either app can expose both apps' data; acceptable for one user, split once there are real users.

**Q:** When would you use requestAnimationFrame instead of CSS?
**A:** For motion calculated every frame in JavaScript, like moving the sun along an arc to a computed position.

**Q:** Why test a production build, not just the dev server?
**A:** The production build is what users get; it can behave differently, and dev servers are built for localhost.

**Q:** What is a controlled vocabulary, and why map tags into one?
**A:** A short fixed list of categories; mapping messy user tags into it makes filters reliable and keeps the noise out.

**Q:** Why fix data in a separate corrections step instead of editing the raw export?
**A:** The raw file stays a faithful source you can rerun from, every fix is visible and explained, and a fresh export doesn't wipe the fixes.

**Q:** What are localStorage's limits?
**A:** It lives in one browser on one device, can be cleared, holds little data and isn't shared between people.

**Q:** How should you show a time in another city's local time?
**A:** Keep the instant in UTC and format it with the city's time-zone name (e.g. Europe/Paris) using Intl.DateTimeFormat; never hand-write offsets.

**Q:** When can an API be called straight from the browser?
**A:** When it's free and needs no secret key, and allows browser requests (CORS). Anything with a secret key goes through a server.

**Q:** What is the adapter pattern, in one sentence, and what did it give Inkling?
**A:** One interface with interchangeable implementations; the same screens run on the real API or a scripted demo.

**Q:** Name the three classic families of recommender and one weakness of each.
**A:** Popularity (same list for everyone), content-based (stays in a bubble), collaborative filtering (needs many users; cold start).

**Q:** What are the three stages of a production recommender?
**A:** Retrieval (narrow to a few hundred candidates, fast), ranking (score them with a heavier model), re-ranking (rules like variety and nothing already seen).

**Q:** When should a matching rule favour precision over recall?
**A:** When a wrong match is costly, e.g. it merges two records into one; leave the uncertain ones for a person to fix.

**Q:** What is an embedding, in one sentence?
**A:** A list of numbers representing a thing, placed so that similar things are close together.

**Q:** What is the difference between explicit and implicit feedback?
**A:** Explicit is what people say (a rating); implicit is what they do (plays, saves, want-to-read). Implicit is noisier but far more plentiful.

**Q:** What is the long tail, and why does it matter for a recommender?
**A:** The many less-famous items that together make up most of what people consume; experienced users live there, and bestseller lists can't reach it.

**Q:** Why can't a "readers like you" model recommend a book published last year (if the data is older)?
**A:** It only knows books that appear on readers' shelves in its data (item cold start); a content or AI model has to place new books.

**Q:** What is a benchmark dataset, and what's its usual catch?
**A:** A public dataset everyone tests on, so results compare; it's frozen in time, so it misses newer items.

## Building with AI

### Tools

#### Skills
A skill is a packaged set of instructions an assistant loads for a kind of task. Most trigger
automatically when their description fits; some only run when you call them (`/prototype`).
Keep the set small: competing skills give competing rules.

#### Subagents
An assistant can hand a focused job to a separate agent with its own instructions, such as the
simulated user tester. It returns a report, and the main session decides what to do with it.

#### Structured outputs and thinking tokens
Structured outputs make the model reply in JSON that matches a schema you give it, so code can rely
on the fields. On models that think before answering, the thinking counts against `max_tokens`:
a limit sized for the answer alone cuts replies off. Treat a "max_tokens" stop as an error, not a
result. Where we met it: Inkling (05), moving five 200-token calls to Claude Haiku 5.5.

#### Two ways AI draws: pixels or code
An image model (OpenAI's or Google's image models, Flux) paints pixels: rich, painterly,
reads photos, but it arrives all at once and costs cents a picture. A language model like
Claude draws by writing code (SVG, canvas, libraries like rough.js): instant, animatable,
nearly free, crisp at any size, but strongest at simple shapes and doodles, weakest at
realistic people. Why it matters: pick by what the drawing must be, and combine them (paint
with one, animate with the other). Where we met it: Selvedge (08): the image model's
character was "my style, full stop"; Claude's one-pass SVG of the same outfit was "really
bad". From: practice; the doodle-chess projects made with Claude use rough.js plus GSAP.

### Judgment

#### Keep the product calls
AI is fast at building, testing and drafting; the product decisions stay with you: the problem,
the main job, what to cut, what "done" means. Review its work: AI drafts can look right and still
be wrong (a too-subtle animation, a wrong-number bug).

#### The agreeable-AI risk
Language models tend to agree with the user (sycophancy). For reflection or advice products that's
the core failure: people say ChatGPT "just agrees with me". Design against it: one question that
helps the user step back, a named idea, no advice unless asked. Where we met it: Inkling (05).
From: OpenAI's 2025 rollback of an over-agreeable GPT-4o update.

#### Separate the builder from the critic
A model judges its own work poorly: it knows what it meant, so it sees that instead of what's
there. Give the judging to a separate agent with a fresh context and only the output (a
screenshot), a fixed prompt and a score, and keep the stopping bar out of its prompt. Set a
stopping rule (a score, or stop when it plateaus) so the loop doesn't burn tokens. Where we met
it: the `design-critic` subagent (06 Folio): 6/10 on its first screen, with six specific gaps.
From: Anshu Chimala (Lenny's Newsletter, 2026); the same idea as generator–evaluator loops and
LLM-as-judge.

#### Seed strings for real variety
Asking a model to "be random" or "make it unique" doesn't work: it still picks the likely
answer. Give it real randomness instead, such as a random string from a script, and have it
derive choices (colours, layout, type) from patterns in the string. Where we met it:
`design-session`'s Discover step. From: Sakana AI's "String Seed of Thought".

### Evals

#### What an eval is
A repeatable test of an AI feature: a set of inputs with known good outputs, scored
automatically, so you can tell whether a change made the AI better or worse. Start by looking at
real outputs and where they fail. *(Hamel Husain)*

#### A model change is a behaviour change
Switching model or provider, or editing a prompt, can change behaviour even when the code is the
same. Run the evals before and after, and record both results. Newer models often follow prompts
more literally, so loose rules ("exactly one question") may need to be stated exactly. Where we
met it: Inkling (05): on the Claude API, safety held but two rules broke (6/8), fixed with two
sentences (8/8).

#### Evaluating a recommender: offline, beyond accuracy, online
**Offline:** hide part of real history and check whether it comes back. Split by time (train on
the past, test on the future), so the model never "sees the future". **Hit rate@10:** was a
hidden item in the top 10? **NDCG@10:** was it near the top? **Beyond accuracy:** diversity,
novelty and coverage, because accuracy alone rewards recommending bestsellers to everyone.
**Online:** A/B tests on real behaviour (saves, clicks, finishes); offline and online results
often disagree. Why it matters: measurement is what separates a recommender from a guess. Where we
met it: Folio (06).

#### Always beat a baseline
Before any clever model, build the dumbest reasonable one (e.g. "most popular books you haven't
read") and score it. A model that doesn't beat it isn't working, however impressive it sounds.
Where we met it: Folio (06), step 2 of the ladder.

#### An offline evaluation harness: the exam board
A fixed frame every model is strapped into and tested the same way, on past data. Parts: the
data; the **split** (what's hidden, what the model may see); the model, which only has to *learn*
and *answer*; **guardrails** (pass/fail rules); the **grades**; a **results table** with a row
per model; and tests that check the grading itself against hand-worked answers. Why it matters:
it turns "the most advanced recommender" into a measurable claim. Where we met it: Folio (06),
`apps/06-folio/lab` (decision 0017).

#### Data leakage: Thursday's newspaper
When information from the future, or from the answer, slips into what a model sees, it looks
brilliant in the lab and disappoints in real life. Fix: train on the past, test on the future
(**out-of-time validation**). Where we met it: Folio (06), owner: letting the model see *Circe*
while hiding *The Song of Achilles*, the book that led to it.

#### Leave-last-out vs random hold-out
**Leave-last-out:** hide each person's most recent items; the standard in recommender papers.
**Random hold-out:** hide random items; used when there's no order, but slightly optimistic (the
model sees later items) and can't test drift or sequences. Check what order the data really has:
goodbooks has no dates, but its file is in time order (no 2016–17 book is rated before row 1.1M
of 6M). Where we met it: Folio (06).

#### Sample size and confidence intervals
One person's handful of hidden books can't separate two models: like judging two penalty takers
on 3 kicks each. Test on thousands of people, and show each grade as a range (a **confidence
interval**). The **bootstrap** gets the range by re-drawing the people at random, with
replacement, a thousand times and seeing how much the average moves *(Bradley Efron, 1979)*. If
two models' ranges overlap, there's no winner yet. Where we met it: Folio (06): 10,000 readers,
plus the owner's 48 books as a personal check.

#### Ranking grades: hit rate, MRR, NDCG, recall
For a list of k recommendations with hidden items: **hit rate@k**, was one in the list;
**recall@k**, what share of the hidden items were; **MRR**, one over the position of the first
hit (1, ½, ⅓…), drops fast; **NDCG@k**, read backwards: *gain* (points per hit, can be more for a
5★ item), *cumulative* (summed), *discounted* (less the lower it sits, 1/log2(position + 1)),
*normalised* (divided by the best possible, so 0 to 1) *(Järvelin & Kekäläinen, 2002)*. Position
matters because attention falls down a list (Netflix: people look closely at about 3 titles).
Compare models only on the same exam: hiding more items makes a hit easier. Where we met it:
Folio (06): headline NDCG@10, 5★ = 2 points, 4★ = 1.

#### Beyond accuracy: coverage, novelty, diversity
**Coverage:** share of the catalog that appears in anyone's list (are lists personal?).
**Novelty:** how un-mainstream the picks are (would they have found it alone?). **Diversity:**
how different the books in one list are (authors, genres). Random wins all three and is useless;
bestsellers wins accuracy and fails all three. So no single grade can be trusted alone: report
them side by side. Where we met it: Folio (06): bestsellers shows about 60 books to everyone
(coverage 0.6%).

#### Grades vs guardrails, and base rates
A **grade** is something to improve; a **guardrail** is a rule that disqualifies when broken
(never a book already on the shelf, never a book that doesn't exist). A guardrail must be
checkable before the outcome: "never recommend a book I'd rate 3★" can't be, so it became a
grade instead (**regret**: of the picks people went on to read, how many disappointed). Read a
grade against its **base rate**: bestsellers' regret is 31%, exactly the share of 3★-or-lower
ratings overall, so it's no better than chance at avoiding disappointment. Where we met it:
Folio (06), owner's regret grade; no quality floor, to keep polarising books.

#### Slicing
Break a grade down by subgroup to see where a model works and fails: only 5★ hidden books; the
owner's 16 books that are in the dataset (fair to the model) vs all 48 (the real experience,
catalog gaps included). A miss can be bad judgment or "not in its world"; slices separate them.
Where we met it: Folio (06).

#### Decide the bar before the result (pre-registration)
Write down what counts as success before running the new model, so a disappointing result
can't quietly move the goalposts. Combine a clear win on the headline (ranges not overlapping),
"no worse" on the guardrail grades, and a human look at real outputs. Where we met it: Folio (06),
the bar for step 2 (decision 0017). From: scientific pre-registration of studies.

#### Measure an LLM's raw mistakes, not just the final score
When code cleans up after a model (drops made-up or already-owned items), the final score hides
how often the model was wrong. Count the raw errors separately: made-up items (the
**hallucination rate**, checked against an outside source), items the user already has, repeats,
failed calls, and how often code had to pad the list. Why it matters: these rates are what break
trust, and they move when you change model or prompt. Where we met it: Folio (06): 90% of
Haiku's named books were in the catalogue and 7% were already on the shelf.

#### Data contamination
An LLM was trained on much of the internet, so it may have *seen* the test answers (famous
"readers who liked X liked Y" pairs, the benchmark itself) and score better than it would on
truly new cases. Why it matters: an LLM's offline score can flatter it; say so, and prefer tests
on data newer than the model or private to you. Where we met it: Folio (06): Opus put *Circe*
first right after *The Song of Achilles*, a pairing all over Goodreads. From: the LLM evaluation
literature (e.g. Sainz et al., 2023, "NLP evaluation in trouble").

#### The cheapest model that clears the bar
Run the exam on a small, cheap model first; pay for the big one only where the cheap one falls
short, and measure whether it earns its price. Make calls through a **batch API** (half price,
results within the hour) and **cache** answers by prompt so reruns cost nothing. Why it matters:
eval runs and production calls are a real bill; "which model" is a cost decision backed by the
eval, not taste. Where we met it: Folio (06): Haiku on 1,000 reader tests plus Opus on 48 books
cost about $1.20, where Opus on everything would have been about $13.

#### Reading numbers like an analyst
Surprise → theory → check with data → lesson, and ask whether the first cause explains *all* of
it. Where we met it: Folio (06): bestsellers finds the next liked book only 2% of the time because
these readers have already read 3.3 of the top 10, and only 9% of hidden books are in the top 100.

### Quiz

**Q:** When would you have Claude draw in code rather than use an image model?
**A:** When it must be instant, animated, cheap or simple (doodles, icons, UI marks); use an image model for painterly or realistic pictures, like a person in an outfit.

**Q:** What is data contamination, and why does it matter when you evaluate an LLM?
**A:** The model may have seen the test answers in its training data, so its score can flatter it; say so and prefer new or private test data.

**Q:** Why count an LLM's raw mistakes separately from the final score?
**A:** Code may clean up its errors (made-up or already-owned items), hiding how often it was wrong; those rates drive trust and change with model or prompt.

**Q:** How do you keep LLM eval runs cheap?
**A:** Test the cheapest model first, pay for the big one only where needed, use a batch API (half price) and cache answers by prompt so reruns are free.

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

**Q:** Why can a model switch break an app whose code didn't change?
**A:** Behaviour lives in the model and prompt; a new model can follow rules differently, so run the evals before and after.

**Q:** Why did 200-token limits break on newer Claude models?
**A:** They think before answering, and thinking counts against `max_tokens`.

**Q:** What is the core failure of an AI used for reflection?
**A:** Agreeing with the user (sycophancy) instead of helping them see more clearly.

**Q:** Why split a recommender's test data by time instead of at random?
**A:** So the model is trained only on the past and tested on the future, like real use; a random split lets it "see the future".

**Q:** What do hit rate@10 and NDCG@10 measure?
**A:** Hit rate: whether a hidden item appears in the top 10. NDCG: also rewards it for being near the top.

**Q:** Why build a popularity baseline first?
**A:** It's the bar to beat; a clever model that can't beat "most popular" isn't working.

**Q:** Why should a separate agent critique a design, seeing only a screenshot?
**A:** The builder knows what it meant and judges that; a fresh critic judges only what's on screen.

**Q:** Why keep the stopping score out of the critic's prompt?
**A:** So it scores honestly instead of aiming at the bar.

**Q:** Why do seed strings work when "be random" doesn't?
**A:** A model can't produce randomness on request; a real random input gives it something to derive different choices from.

**Q:** What is data leakage, and how does a time split prevent it?
**A:** Future or answer information slipping into what the model sees; training only on the past and testing on the future keeps it out.

**Q:** Why show a recommender's grade as a range, and how does the bootstrap get it?
**A:** A score from few people can be luck; re-drawing the people at random a thousand times shows how much the average moves. Overlapping ranges mean no winner yet.

**Q:** What do the four words in NDCG stand for?
**A:** Gain (points per hit), cumulative (summed), discounted (less for lower positions), normalised (divided by the best possible, so 0 to 1).

**Q:** Why can't you judge a recommender on accuracy alone?
**A:** Bestsellers can score decently while showing everyone the same few books; report coverage, novelty and diversity next to it.

**Q:** What's the difference between a grade and a guardrail?
**A:** A grade is improved over time; a guardrail is a checkable rule that disqualifies a model when broken.

**Q:** Bestsellers' regret is 31% and 31% of all ratings are 3★ or lower. What does that tell you?
**A:** It disappoints at the base rate: it has no idea who you are, so it can't steer away from books you'd find meh.

**Q:** Why agree a model's success bar before you run it?
**A:** So a disappointing result can't move the goalposts; you read the result honestly instead of explaining it away.

## Communication and influence

### Storytelling

#### STAR
For interviews, tell a project as **S**ituation, **T**ask, **A**ction, **R**esult, in about two
minutes, then one line on what you learned. Lead with the problem, say "I", include a mistake and
have the numbers ready.

#### A demo is an argument
In a short demo, every screen should carry one "we learned → we decided → here it is" beat, and end
on what you'd test next. Rehearse it on the real path, and say plainly what's scripted. Where we
met it: Inkling's 2-minute script for an interview (05).

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

**Q:** What should each screen of a short product demo carry?
**A:** One "we learned → we decided → here it is" beat, ending on what you'd test next.
