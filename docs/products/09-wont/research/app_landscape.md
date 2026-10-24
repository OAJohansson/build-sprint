# Habit-tracker app landscape (2025–2026): UX patterns, behaviour-science mechanisms, complaints and gaps

Source caveat up front: most 2026 roundups that list prices and ratings are written by competing app makers (HabitBox, Habi, Nibble, SingularityApp, Lifestack). HabitBox's roundup is the most detailed and says it re-checked store listings on 20 Sept 2026 and discloses that it makes HabitBox; treat its rankings as biased but its store-derived facts (prices, ratings, release counts) as reasonably reliable. Zapier (Harry Guinness, last reviewed June 2026) is the main independent roundup found. No Wirecutter or The Verge habit-app roundup was found in this pass. Reddit pages could not be fetched (scraper blocked), so Reddit findings are from search snippets only.

## 1. Which apps lead in 2026, and how each works (core loop, setup, check-in, streaks, reminders, stats, social, price)

### Takeaway
The field splits into (a) plain trackers built on one-tap check-ins and a visible chain or grid (Streaks, Loop, HabitNow, Way of Life, Habitify, HabitBox, everyday, Done), (b) guided/coached programmes (Fabulous, Productive's Programs, Atoms), (c) motivational wrappers that move the reward off the streak (Habitica's RPG, Finch's pet), (d) quit/abstinence counters (I Am Sober), and (e) friction tools for phone habits (one sec, Opal). Streak handling is where they differ most: hard reset (Streaks), decaying score (Loop), skip-as-its-own-state (Way of Life, Productive, everyday, SingularityApp), earned shields/repairs/pause (HabitBox, Finch).

### Cited Findings

**Streaks (iOS/Apple only)**
- $5.99 one-time, no IAP, no free tier or trial; up to 24 tasks shown as tappable circles; 4.8 stars from ~27,400 US ratings; 25 releases Sept 2025–Sept 2026 — [HabitBox roundup](https://habitbox.app/blog/best-habit-tracker-app)
- Auto-completes tasks from Apple Health (steps, workouts, water, caffeine); has timed tasks and "negative tasks" for habits you want to break (streak counts days avoided); can share tasks with other Streaks users — [HabitBox](https://habitbox.app/blog/best-habit-tracker-app)
- Complaints: hard 24-task ceiling (~20 reviews since Jan 2025 ask for more), setup/edit/undo called unintuitive, Watch complications and widgets lag or go blank — [HabitBox](https://habitbox.app/blog/best-habit-tracker-app)

**Loop Habit Tracker (Android, open source)**
- Free, GPLv3, no account, no ads; 4.7 stars from 63,000+ Play reviews; last Play update 14 Sept 2025 — [HabitBox](https://habitbox.app/blog/best-habit-tracker-app)
- Signature mechanic: a "habit score" that weights recent days and decays slowly, so a missed day dents rather than resets; supports frequency schedules (3x/week) but not fixed weekdays; measurable (numeric) habits; CSV/SQLite export; no sync, so phone switches lose data — [HabitBox](https://habitbox.app/blog/best-habit-tracker-app)

**HabitNow (Android)** — free up to 7 habits, Premium one-off ~$11.99 (often discounted); daily/weekly/monthly habits, yes/no, numeric or timer check-ins, streak + completion rate stats, widgets — [Zapier](https://zapier.com/blog/best-habit-tracker-app/). (Zapier's text also says $5.99 in the price line — internal inconsistency, likely due to discounts.)

**Habitify (cross-platform)**
- Groups habits by time of day (morning/afternoon/evening/anytime); April 2026 moved to Free/Plus/Pro tiers; App Store: Plus $29.99/yr, Pro $8.99/mo or $49.99/yr, Pro Lifetime $119.99; free plan limited to 3 habits; cloud account required; added an in-app AI assistant Sept 2026 — [HabitBox](https://habitbox.app/blog/best-habit-tracker-app); 3-habit free limit also in [Habi](https://habi.app/insights/best-habit-tracker-apps/)
- Integrations allow automatic habit tracking — [Zapier](https://zapier.com/blog/best-habit-tracker-app/)
- Complaints: updates breaking relied-on features (17 reviews since Jan 2025), widgets refresh only every 15–60 min, weekly summaries can't be turned off separately from reminders — [HabitBox](https://habitbox.app/blog/best-habit-tracker-app)
- Claims 3M+ users (marketing) — [habitify.me](https://habitify.me/)

**Habitica (gamified RPG)**
- Habits/dailies/to-dos earn XP and gold; missed dailies damage your avatar; party boss fights where your misses damage the whole party; free core, subscription $4.99/mo–$47.99/yr buys cosmetics/gems; 4.3 App Store stars; Tavern and Guilds closed Aug 2023; account mandatory — [HabitBox](https://habitbox.app/blog/best-habit-tracker-app)
- Popular with ADHD users per reviews; criticism that you end up managing gear/quests on top of habits — [HabitBox](https://habitbox.app/blog/best-habit-tracker-app)

**Finch (self-care pet)**
- Goals feed a pet bird that goes on adventures; missing a day never hurts the bird; daily check-in streak exists but with free streak repairs and Pause Mode (goals hidden, streak frozen); free tier covers goals, mood check-ins, journaling, breathing; Plus $9.99/mo or $69.99/yr; 4.9 stars from ~754,000 US ratings — [HabitBox](https://habitbox.app/blog/best-habit-tracker-app)
- Habi lists Finch Plus at "roughly $15/year on iOS", with regional price variation as a complaint — [Habi](https://habi.app/insights/best-habit-tracker-apps/) (conflicts with HabitBox's $69.99/yr; likely regional/promo pricing)
- Complaints: film tie-in events feel like ads, data-loss reports (~20 since 2025), slow support; no serious long-term stats — [HabitBox](https://habitbox.app/blog/best-habit-tracker-app)

**Productive**
- Deepest scheduling (weekdays only, every other day), time-of-day sections, location reminders on Premium, "perfect days" metric, guided Programs and global Challenges; 4.6 stars from ~91,000 US ratings — [HabitBox](https://habitbox.app/blog/best-habit-tracker-app)
- Swipe left = skip, which still counts toward the streak; vacation mode pauses habits; but changing a habit's schedule resets its progress — [HabitBox](https://habitbox.app/blog/best-habit-tracker-app)
- Pricing $5.99/week, $10.99/mo, annual $19.99–$79.99; renewal jumps 2–4x in 2024–25 reported; Android app stale (3.7 stars) — [HabitBox](https://habitbox.app/blog/best-habit-tracker-app)

**Way of Life (since 2010)**
- Colour grid: green done, red missed, grey skipped; skips excluded from the trend line; notes, tags, export, passcode; iOS 4.8 (~5,250 ratings), Android 3.6 and stale; subscriptions since v4.0 (2023), App Store SKUs $4.99–$29.99 — [HabitBox](https://habitbox.app/blog/best-habit-tracker-app)
- Every habit is daily yes/no/skip, no weekly targets — [HabitBox](https://habitbox.app/blog/best-habit-tracker-app)

**Atoms (James Clear's official Atomic Habits app)**
- Marketing frames it on Clear's four laws (obvious, attractive, easy, satisfying); setup asks for an identity ("the kind of person you want to become"), guidance on starting at the right size, and commitment to a time and place; flexible reminders (exact time or several through the day); daily lessons from Clear; claims to help "adjust habits that aren't sticking, and level them up" — [atoms.jamesclear.com](https://atoms.jamesclear.com/)
- A featured user review describes a press-and-hold check-in where a circle expands and ends with a vibration — [atoms.jamesclear.com](https://atoms.jamesclear.com/)
- Pro $4.99/mo or $39.99/yr; 4.8 on iPhone but 3.1 on Android — [HabitBox](https://habitbox.app/blog/best-habit-tracker-app); Android 3.1 from 681 ratings — [Google Play](https://play.google.com/store/apps/details?id=app.getatoms.android)
- Apple Editors' Choice — [App Store listing](https://apps.apple.com/de/app/6474421906?l=en-GB&see-all=reviews&platform=ipad)

**Fabulous**
- Incubated at Duke's Center for Advanced Hindsight (Dan Ariely's lab); leans on habit stacking, self-tracking, small wins — [Nibble review](https://nibble-app.com/blog/fabulous-app-review); site says "backed by behavioral science" — [thefabulous.co](https://www.thefabulous.co/)
- Core loop: pick a goal Journey (mornings, sleep, focus...), follow guided daily tasks that add habits gradually, coaching audio/text lessons, nudges; streak markers; one Aug 2026 checkout showed $39.99 billed every 2 months after a "pay what you want" trial — [Nibble](https://nibble-app.com/blog/fabulous-app-review)
- Complaints: cancellation friction and confusing payment structure, repetitive content after months, naggy notifications — [Nibble](https://nibble-app.com/blog/fabulous-app-review); [ChoosingTherapy](https://www.choosingtherapy.com/fabulous-app-review/); Reddit rant that it "love-bombs" users and pushes referrals — [r/ProductivityApps](https://www.reddit.com/r/ProductivityApps/comments/1f0umjc/another_rant_about_the_fabulous_app/)

**Tiimo (visual planner, ADHD/autism)**
- iPhone App of the Year 2025; visual routines with icons/colours, circular timer, AI planner that turns a brain dump into a day plan; "co-designed with ADHD/Autism experts" — [App Store](https://apps.apple.com/us/app/tiimo-to-do-list-planner/id1480220328); [tiimoapp.com](https://www.tiimoapp.com/)
- $7.99/mo or $79.99/yr — [Lifestack](https://lifestack.ai/blog/tiimo-pricing) (competitor source). User review: tasks auto-start timers and incomplete tasks don't roll over, "felt rushed... like the app would punish you for being late" — [App Store review](https://apps.apple.com/us/app/tiimo-to-do-list-planner/id1480220328)

**Others**
- everyday: tap = done, tap again = triangle (skipped) and the streak stays intact; big grid view; $29.99/yr or $99 lifetime — [SingularityApp](https://singularity-app.com/blog/best-habit-tracker-apps-for-your-phone/)
- Done: multi-count goals per day/week/month with partial-fill progress bar, Apple Health integration, praised for simplicity — [Habi](https://habi.app/insights/best-habit-tracker-apps/)
- SingularityApp: double-tap marks half-done or skipped and keeps streak — [SingularityApp](https://singularity-app.com/blog/best-habit-tracker-apps-for-your-phone/)
- HabitBox: each seven-day run earns a "shield" that covers one missed day — [HabitBox](https://habitbox.app/blog/best-habit-tracker-app)
- Bearable: habits logged beside symptoms/mood, correlation reports ("is this habit doing anything?"); $34.99/yr — [HabitBox](https://habitbox.app/blog/best-habit-tracker-app)
- Daylio: mood journal where habits are activity tags; 4.7 from 462,000+ Play reviews — [HabitBox](https://habitbox.app/blog/best-habit-tracker-app)

**Quit/abstinence: I Am Sober**
- Core loop: morning pledge, sober-time counter (to the second), milestones, money-saved, evening review (sober? difficulty, mood, activities, notes); "Log Urge" records strength, triggers (stress, boredom, social) and notes, with a common-triggers view; 127M+ pledges claimed — [iamsober.com](https://iamsober.com/en/tools/alcohol-app)
- Relapse: resetting the clock preserves all previous start dates, milestone history, reasons, savings and photos; free tracks 2 habits, Sober Plus up to 10 plus full urge history, workbook, a "supporter" who gets milestone emails — [I Am Sober FAQ](https://iamsober.com/en/site/faq)
- Communities organised by addiction type and by milestone stage — [iamsober.com](https://iamsober.com/en/site/home); 4.7 from 143,166 Play ratings — [Google Play](https://play.google.com/store/apps/details?id=com.thehungrywasp.iamsober)

**Phone habits: one sec**
- Intercepts opening of chosen apps with a full-screen breathing pause + deliberation message + option to dismiss; PNAS 2023 field experiment: 36% of opening attempts dismissed, opening attempts fell over 6 weeks (166 → 105 per user per week), actual openings down 57% after 6 weeks; the dismiss option was the most effective component, time-delay friction also helped; dismissal rate declined over time (43% wk1 → 33% wk3) — [PNAS](https://www.pnas.org/doi/10.1073/pnas.2213114120)
- 4.8 from 46,331 Play ratings — [Google Play](https://play.google.com/store/apps/details?id=wtf.riedel.onesec)

### Inferences
- The market has converged on "one tap, visible chain, widget" as table stakes; differentiation is in how misses are treated and what wraps the check-in (pet, game, coach, identity).
- Pricing is a trust issue: the best-rated long-term apps are one-time or generous-free (Streaks, Loop, Way of Life historically), while subscription-heavy guided apps (Fabulous, Productive) attract billing complaints.
- Forgiving-miss mechanics (skip state, shields, decay score, pause) have spread widely since ~2023, suggesting streak anxiety is now a recognised design problem.

### Gaps
- Not researched in this pass: Opal (pricing, mechanics), HabitKit, Strides, QuitNow, Duolingo-style streak freezes as a reference pattern; Atoms' exact streak rules ("never miss twice"?) not confirmed from a primary source.
- No independent usage/market-share data per app; ratings counts are the only popularity proxy.

## 2. Which apps explicitly build in behaviour-science methods

### Takeaway
Only a handful explicitly encode methods beyond self-monitoring and reminders: Atoms (identity, start small, time+place = implementation intention, satisfying check-in), Fabulous (habit stacking and gradual journeys, from a behavioural-economics lab), I Am Sober (daily pledge commitment, urge/trigger logging, CBT-style workbook), one sec (friction + deliberation, with peer-reviewed evidence), Finch (self-compassion framing, reward displaced to a pet). Most trackers implement only self-monitoring, feedback and time-based prompts.

### Cited Findings
- Atoms: "Build habits anchored in meaningful identities", "start at the right size", "committing to a time and place" — [Atoms](https://atoms.jamesclear.com/). These map to identity-based habits, Tiny-Habits-style scaling, and implementation intentions; the hold-to-complete with vibration is a "make it satisfying" celebration cue — [Atoms user review](https://atoms.jamesclear.com/)
- Fabulous: Duke Center for Advanced Hindsight origin; habit stacking, self-tracking, small wins — [Nibble](https://nibble-app.com/blog/fabulous-app-review)
- I Am Sober: pledge, urge log with triggers, daily review; users cite "CBT methods" — [iamsober.com](https://iamsober.com/en/site/home)
- one sec: friction + deliberation + dismiss option, validated in PNAS with Max Planck/Heidelberg — [PNAS](https://www.pnas.org/doi/10.1073/pnas.2213114120); [blok.so review](https://www.blok.so/resources/one-sec-app-review-does-adding-friction-actually-reduce-screen-time)
- Habi anchors habits to calendar events ("stretch after standup") — an event-based cue / habit stacking pattern — [Habi](https://habi.app/insights/best-habit-tracker-apps/) (vendor's own claim)
- HabitBox cites BJ Fogg's view that friction predicts sticking, and Lally et al. 2010's median 66 days to automaticity — [HabitBox](https://habitbox.app/blog/best-habit-tracker-app)

### Inferences
- "Backed by behavioural science" is mostly marketing: apart from one sec, I found no peer-reviewed evaluation of any named consumer habit app's outcomes.
- WOOP/mental contrasting and explicit "if-then" plan fields appear rare; Atoms is the closest to implementation intentions in mainstream apps.

### Gaps
- No evidence found of any mainstream app implementing WOOP explicitly.
- No published outcome trials for Atoms, Fabulous or Finch found.

## 3. What users complain about and why they quit

### Takeaway
The recurring story: setup and early enthusiasm, too many habits, then a miss produces guilt (red cross, lost health, broken chain), the streak becomes the goal and its loss feels like total failure, and the user abandons the app (and sometimes the habit). Second-tier complaints: subscription/billing friction, naggy notifications, updates that reset progress, widget/sync bugs and data loss.

### Cited Findings
- Streak anxiety: "the fear of breaking a streak becomes more stressful than the habit itself" — [r/getdisciplined](https://www.reddit.com/r/getdisciplined/comments/1vh27bf/why_streak_anxiety_makes_people_quit_habit/) (snippet)
- Guilt mechanics: day 5 a broken 4-day streak triggers "a big red cross or an annoying notification saying my character lost health" — [r/getdisciplined](https://www.reddit.com/r/getdisciplined/comments/1x9r7zl/why_does_every_habit_tracker_eventually_turn_into/) (snippet)
- Early abandonment: post titled "I've quit 12 habit trackers by Day 14" — [r/getdisciplined](https://www.reddit.com/r/getdisciplined/comments/1r3xzpp/ive_quit_12_habit_trackers_by_day_14_heres_what_i/) (title only; page not fetchable)
- Tracker as chore / goal displacement: "spending more energy maintaining the tracker than the actual habit. checking boxes became the goal" — [r/Habits](https://www.reddit.com/r/Habits/comments/1rigs2y/i_stopped_tracking_my_habits_and_ironically_got/); "more focused on not breaking streaks than on whether my..." — [r/Habits](https://www.reddit.com/r/Habits/comments/1q5si4s/i_stopped_tracking_habits_and_started_thinking/)
- Context-blind streaks: "Some days don't 'count' the same way — sleep quality, workload, stress" — [r/ProductivityApps](https://www.reddit.com/r/ProductivityApps/comments/1pfz3it/i_built_a_habit_tracker_that_doesnt_track_streaks/)
- Perfectionism: habit tracking "made my mental health worse" — [r/bulletjournal](https://www.reddit.com/r/bulletjournal/comments/zeo20y/perfectionism_habit_tracking_anxiety/)
- Billing: Fabulous cancellation friction and confusing payment — [Nibble](https://nibble-app.com/blog/fabulous-app-review), [ChoosingTherapy](https://www.choosingtherapy.com/fabulous-app-review/); Productive renewal jumps; Finch surprise renewals; Way of Life users balk at moving to subscription — [HabitBox](https://habitbox.app/blog/best-habit-tracker-app)
- Notifications: Fabulous nudges "cross the line" into nagging — [Nibble](https://nibble-app.com/blog/fabulous-app-review); Habitify can't silence summaries separately — [HabitBox](https://habitbox.app/blog/best-habit-tracker-app); HabitBox advice "One well-timed nudge beats five you learn to ignore" — [HabitBox](https://habitbox.app/blog/best-habit-tracker-app)
- Fragile progress: Productive schedule edits reset streaks; Finch and Loop data loss on phone switches — [HabitBox](https://habitbox.app/blog/best-habit-tracker-app)
- Retention context: health & fitness apps average ~3–4% day-30 retention per Statista/AppsFlyer figures (AppsFlyer 2.78%) — [Sendbird](https://sendbird.com/blog/app-retention-benchmarks-broken-down-by-industry); fitness apps 8–12% at day 30, top 25% — [Lucid](https://www.lucid.now/blog/retention-metrics-for-fitness-apps-industry-insights/) (aggregator; figures vary by source)
- Academic: in interviews with long-term users of the Lift (Coach.me) app, reminders and streaks were the most-cited helpful features, but created dependency: when users stopped using the app (moves, difficult periods), the behaviours also reduced or stopped — [Renfree, Harrison, Marshall, Stawarz, Cox, CHI 2016 LBW "Don't Kick the Habit"](https://discovery.ucl.ac.uk/1477627/1/Chi%202016%20LBW%202.1%20camera%20ready.pdf); participants tracked 3–15 behaviours simultaneously — same source

### Inferences
- The quit point is usually the first miss in weeks 1–3, which coincides with the fragile period before automaticity (median 66 days). The app's reaction to that first miss is likely the single most important retention and outcome moment.
- Tracking many habits at once (3–15 in Lift) multiplies miss events and setup burden.

### Gaps
- No quantitative habit-app-specific churn data found (only category-level benchmarks).
- Reddit threads could not be read in full; findings rest on titles/snippets.

## 4. Published analyses of commercial habit apps

### Takeaway
Research consistently finds that commercial habit apps rely on self-monitoring, goal setting and time-based reminders, and rarely support the mechanisms habit theory says matter (contextual/event cues, implementation intentions, automaticity). Reminders aid repetition but hinder automaticity; event-based cues helped automaticity.

### Cited Findings
- Stawarz, Cox & Blandford, CHI 2015: 4-week study plus review of 115 habit-formation apps. "Relying on reminders supported repetition but hindered habit development, while the use of event-based cues led to increased automaticity; positive reinforcement was ineffective." — [ACM DL](https://dl.acm.org/doi/10.1145/2702123.2702230)
- Same review: 14 feature categories identified; only 5 supported habit formation, and only one (routine creation) helped users find a trigger event; apps "provide functionality to enable tackling of task completion and reminders" rather than habit formation — [The Decision Lab summary](https://thedecisionlab.com/insights/health/quantified-self-lead-behaviour-change)
- Renfree et al., CHI 2016 LBW: dependency on reminders/streaks; behaviours lapse when app use stops; extrinsic rewards may undermine habit — [UCL PDF](https://discovery.ucl.ac.uk/1477627/1/Chi%202016%20LBW%202.1%20camera%20ready.pdf)
- Zhu et al., JMIR 2024 systematic review (41 studies, 2012–2022, physical activity DBCIs): most applied BCTs were self-monitoring, goal setting, prompts/cues; habit techniques built on intentions, cues and positive reinforcement; common methods: automatic monitoring, descriptive feedback, self-set goals, time-based cues, virtual rewards; context-aware cues investigated in only 3 studies; implicit interaction strategies lacking — [JMIR/PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11161714/)
- Self-tracking data alone is often ineffective at long-lasting change; wearables are "facilitators rather than drivers" (Patel, Asch & Volpp 2015) — [The Decision Lab](https://thedecisionlab.com/insights/health/quantified-self-lead-behaviour-change)
- SDT-based taxonomy of app features (IJHCS 2020) cites the Stawarz review — [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S1071581920300513)

### Inferences
- The 2015 critique still largely holds for 2026 apps: most trackers add forgiving streaks and nicer visuals, not event-based cues or automaticity support.

### Gaps
- No post-2020 content analysis specifically of consumer habit-tracker apps (as opposed to research DBCIs) was found in this pass.

## 5. Gaps: what no app does well

### Takeaway
Clear white space exists in (a) supporting the fragile first weeks with cue design rather than reminders, (b) a structured, shame-free recovery path after a lapse, (c) breaking bad habits for anything beyond addiction counters and phone friction, and (d) measuring automaticity and graduating habits off the tracker.

### Cited Findings
- (a) First weeks: apps default to time-based reminders, which research says hinder automaticity; event-based cues helped — [ACM DL](https://dl.acm.org/doi/10.1145/2702123.2702230). Only "routine creation" helped find a trigger — [Decision Lab](https://thedecisionlab.com/insights/health/quantified-self-lead-behaviour-change). Atoms' time-and-place commitment and Habi's calendar anchoring are partial exceptions — [Atoms](https://atoms.jamesclear.com/), [Habi](https://habi.app/insights/best-habit-tracker-apps/)
- (b) Lapse recovery: existing mechanisms are passive (skip states, shields, decay scores, pause) — [HabitBox](https://habitbox.app/blog/best-habit-tracker-app), [SingularityApp](https://singularity-app.com/blog/best-habit-tracker-apps-for-your-phone/). I Am Sober is the best example of an active recovery stance: reset preserves full history and reasons, plus daily review reflection — [I Am Sober FAQ](https://iamsober.com/en/site/faq)
- (c) Bad habits: general trackers offer "negative tasks" (Streaks) or count logs for cutting down (HabitBox) — [HabitBox](https://habitbox.app/blog/best-habit-tracker-app). Urge/trigger logging lives in sobriety apps — [iamsober.com](https://iamsober.com/en/tools/alcohol-app); friction interventions in phone apps — [PNAS](https://www.pnas.org/doi/10.1073/pnas.2213114120). Habit reversal was not found in the JMIR 2024 review — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11161714/)
- (d) Graduation: small apps advertise it — Keel lets you "mark a habit graduated rather than deleting it, keeping the history" — [Keel](https://keelhabits.com/dictionary/habit-formation); Goal4 advises graduating after 66+ days — [Goal4](https://goal4.app/blog/how-to-track-habits-effectively/); Motif blog: if the behaviour only happens because a notification interrupts you, it's still scaffolding — [Motif](https://www.usamakashif.me/motif/when-to-stop-tracking-a-habit/). Automaticity measures (e.g. SRBAI) were not found in reviewed interventions — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11161714/)
- Dependency is the flip side: when people stop using the app, behaviours lapse, which argues for designing the app to fade out — [UCL CHI 2016](https://discovery.ucl.ac.uk/1477627/1/Chi%202016%20LBW%202.1%20camera%20ready.pdf)

### Inferences
- A product that (1) asks for a cue ("after I X") instead of a time, (2) fades reminders as automaticity rises, (3) treats a miss as a planned "recovery" step ("never miss twice") with a short reflection rather than a reset, (4) asks a periodic 4-item automaticity check, and (5) graduates habits with a ceremony would occupy space no major app owns.
- For bad habits, the strongest evidence-backed UX pattern in the landscape is friction plus an explicit dismiss choice (one sec); urge logging with triggers (I Am Sober) is the main self-monitoring pattern.

### Gaps
- None of the major apps (Streaks, Habitify, Atoms, Productive) were confirmed to have a graduation feature; Keel/Goal4/Motif are small and their implementations were not verified.
- No evidence found on whether forgiving-streak mechanics (shields, skips) improve long-term outcomes versus hard resets.
