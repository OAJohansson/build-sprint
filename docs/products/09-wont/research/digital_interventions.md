# Digital and app-based habit and behaviour-change interventions: what helps, and why habit apps lose users

Scope: peer-reviewed evidence first (CHI/UbiComp, JMIR, Psych Bulletin, Health Psychology, Annals Beh Med, JAMA IM), industry data flagged as weaker. Research done October 2026; nothing newer than ~2023 surfaced on these specific questions.

Evidence strength key used below: **STRONG** = meta-analysis or large RCT; **MODERATE** = single RCT / micro-randomised trial / well-designed lab experiments; **WEAK** = qualitative, small-n, app review, or company/podcast data.

## 1. Reminders vs habits: Stawarz, Cox & Blandford and follow-ups

### Takeaway
Time-based reminders make people *repeat* a behaviour but stop it becoming *automatic*: the phone becomes the cue, so the behaviour depends on the app and collapses when the app is dropped. Event-based cues (tying the behaviour to an existing routine, i.e. implementation intentions "after I X, I will Y") built more automaticity. Simple positive reinforcement (congratulation messages) added nothing measurable.

### Cited Findings
- **Stawarz, Cox & Blandford 2014, CHI ("Don't forget your pill!")** (WEAK–MODERATE, app review + review mining): functionality review of 229 medication reminder apps and thematic analysis of 1,012 user reviews. Existing apps relied on timer-based reminders even though literature shows daily routines support remembering; they proposed design requirements for reminders that support routines and individual differences — [UCL Discovery](https://discovery.ucl.ac.uk/1418104/)
- Stawarz's later thesis argues adherence apps could support long-term regimens by helping form routines anchored on multiple contextual cues — [UCL Discovery (as summarised)](https://discovery.ucl.ac.uk/id/eprint/1418104)
- **Stawarz, Cox & Blandford 2015, CHI ("Beyond self-tracking and reminders")** (MODERATE, 4-week field study + review of 115 habit apps): reminders supported repetition but *hindered* habit development; event-based cues increased automaticity; positive reinforcement was ineffective. Most of the 115 reviewed apps focused on self-tracking and reminders and did not support event-based cues. Design guidelines: contextual (event-based) cues and implementation intentions — [UCL Discovery](https://discovery.ucl.ac.uk/id/eprint/1468224/); [ResearchGate PDF](https://researchgate.net/profile/Katarzyna-Stawarz/publication/278405715_Beyond_Self-Tracking_and_Reminders_Designing_Smartphone_Apps_That_Support_Habit_Formation/links/55803b6c08ae15c822d24253/Beyond-Self-Tracking-and-Reminders-Designing-Smartphone-Apps-That-Support-Habit-Formation.pdf)
- **Renfree, Harrison, Marshall, Stawarz & Cox 2016, CHI EA ("Don't kick the habit")** (WEAK, qualitative study of the Lift app): reminders *and streaks* helped people repeat new behaviours but created dependence on continued app use; this makes change fragile — users abandon the app and then drop the behaviour. Notes the paradox that habit apps rarely implement the psychological concept of habit yet are rated well in app stores — [Northumbria research portal](https://researchportal.northumbria.ac.uk/en/publications/dont-kick-the-habit-the-role-of-dependency-in-habit-formation-app/)
- **Pinder, Vermeulen, Cowan & Beale 2018, ACM TOCHI 25(3)** (review/theory): most digital interventions fail to take habitual (nonconscious) behaviour into account, partly because of overlapping behaviour-change theories that ignore habit. Combines Dual Process Theory, modern habit theory and Goal Setting Theory into the "Habit Alteration Model" — [Aarhus Univ. portal](https://pure.au.dk/portal/en/publications/digital-behaviour-change-interventions-to-break-and-form-habits/); [Crossref](https://api.crossref.org/works/10.1145%2F3196830)

### Inferences
- The core design tension: an app that is *needed* every day to trigger the behaviour is, by this research, working against habit formation. A habit tracker should aim to become less necessary over time (e.g. reminders that fade, or no reminders by default once a cue is set).
- Concrete pattern: at habit creation, ask for an anchor ("After I ___"), store it and show it on the habit row instead of (or before) offering a clock-time reminder. Clock reminders can be offered as scaffolding with an explicit plan to remove them.
- "Well done!" messages alone should not be expected to build habits; feedback is better spent on making the cue-behaviour link visible.

### Gaps
- Stawarz 2015 is a small field study (sample size not captured in the sources I could open); the automaticity differences have not, as far as I found, been replicated in a large RCT of habit apps.
- I found no peer-reviewed trial of "fading" reminders (gradually withdrawing prompts) in a habit app, though it follows logically from the findings.

## 2. Self-monitoring: does tracking change behaviour, and when does it backfire?

### Takeaway
Monitoring progress reliably helps people reach goals (d≈0.40 across 138 RCTs), more so when the record is physical/written and when it is reported or public. But tracking has costs: it can lower enjoyment of intrinsically enjoyable activities, and most people lapse — often for mundane reasons like burden or a life change — rather than "fail."

### Cited Findings
- **Harkin et al. 2016, Psychological Bulletin 142(2)** (STRONG, meta-analysis of 138 randomised studies, N=19,951): interventions increased monitoring frequency (d+=1.98, 95% CI 1.71–2.24) and goal attainment (d+=0.40, 95% CI 0.32–0.48). Changes in monitoring frequency mediated the effect. Effects were larger when outcomes were reported or made public and when information was physically recorded — [White Rose eprints](https://eprints.whiterose.ac.uk/id/eprint/91437/); [APA press release](https://www.apa.org/news/press/releases/2015/10/progress-goals.aspx)
  - Unverified: a secondary blog reports a publication-bias-adjusted estimate around d=0.19; not confirmed against the paper — [Science for Work summary](https://scienceforwork.com/blog/goal-monitoring/)
- **Michie et al. 2009, Health Psychology 28(6)** (STRONG, meta-regression of 122 evaluations, N=44,747, healthy eating and physical activity): pooled effect 0.31 (95% CI 0.26–0.36, I²=69%). Self-monitoring explained the most between-study heterogeneity (13%). Interventions combining self-monitoring with at least one other control-theory technique (goal setting, feedback, review of goals) were more effective: 0.42 vs 0.26 — [PubMed](https://pubmed.ncbi.nlm.nih.gov/19916637/); [Exeter repository](https://ore.exeter.ac.uk/repository/handle/10871/13754)
- **Etkin 2016, Journal of Consumer Research 42(6)** (MODERATE, six experiments): measurement increased how much people did an activity (walking, reading) but reduced how much they enjoyed it, by drawing attention to output and making enjoyable activities feel like work (undermining intrinsic motivation). A Duke summary adds people may do less once they stop tracking — [Wharton-hosted paper](https://marketing.wharton.upenn.edu/wp-content/uploads/2016/10/Etkin-Jordan-11-12-15-Hidden-Cost.pdf); [Duke Fuqua summary](https://www.fuqua.duke.edu/duke-fuqua-insights/etkin-counting-steps)
  - Secondary (not verified): framing activities as work-like attenuated the enjoyment loss — [Brainscape flashcards](https://brainscape.com/flashcards/etkin-j-2016-the-hidden-cost-of-personal-17080366/packs/22360151)
- **Epstein, Ping, Fogarty & Munson 2015, UbiComp ("A lived informatics model")** (WEAK–MODERATE, surveys of 105/99/83 trackers + 22 interviews): prior models were rooted in behaviour-change goals and did not capture how tracking fits everyday life; the model adds deciding to track, tool selection, and explicit *lapsing and resuming*. Won a UbiComp 2025 10-Year Impact runner-up award — [paper PDF](https://my.eng.utah.edu/~cs5540/au16/readings/PersonalInformatics-Epstein2015.pdf); [UW HCDE news](https://www.hcde.washington.edu/index.php/news/article/2025-10-15/professor-sean-munson-and-collaborators-recognized-10-year-impact-award)
- **Epstein et al. ("Beyond abandonment to next steps")** (WEAK, survey of 193 + 12 interviews): identified six reasons people stop tracking and five perspectives on life after tracking; argues designs keep influencing people after abandonment — [Self Research library](https://library.selfresearch.org/research/beyond-abandonment-to-next-steps-understanding-and-designing-for-life-after-personal-informatics-tool-use/)
- Reviews of personal informatics note abandonment is not necessarily failure; people lapse and resume as life priorities shift (Epstein 2016 "Reconsidering the device in the drawer," UbiComp) — [UW PDF](https://homes.cs.washington.edu/~jfogarty/publications/ubicomp2016.pdf); [Ayobi et al. review](https://discovery-pp.ucl.ac.uk/id/eprint/1490266/2/Ayobi_Reflections%20on%205%20Years%20of%20Personal%20Informatics%20-%20Rising%20Concerns%20and%20Emerging%20Directions.pdf)

### Inferences
- Tracking is worth having, but the active ingredient is monitoring *plus* goal/feedback/review (Michie's control-theory combination), not logging alone.
- Keep logging to one tap. Burden is a top abandonment driver and logging frequency is the mediator in Harkin.
- For habits the person already enjoys (e.g. reading), heavy quantification (minutes, pages, scores) may sap enjoyment (Etkin); a done/not-done check is gentler than measuring output.
- Design for lapse and return as normal: no shaming empty states, an easy "pick back up" path, and history that survives gaps.

### Gaps
- Precise breakdown of the six abandonment reasons in Epstein's "Beyond abandonment" not captured (full text not opened).
- No meta-analysis found specifically on *app-based* habit tracking (as opposed to progress monitoring in general).

## 3. Reminders, notifications and just-in-time prompts

### Takeaway
Prompts work, but modestly and with fast decay: HeartSteps' walking suggestions roughly doubled steps in the next 30 minutes on day 1, but the effect was gone by about day 28 (habituation — participants called them boring after 2–4 weeks). Timing matters a little (weekend midday best in one large MRT). JITAI theory says prompts should fire at decision points when the person is receptive and the behaviour is possible, but effectiveness evidence is thin.

### Cited Findings
- **Klasnja et al. 2018/2019, Annals of Behavioral Medicine (HeartSteps MRT)** (MODERATE, micro-randomised trial; 44 recruited, 37 analysed, 6 weeks, 5 decision points/day): any suggestion vs none raised 30-minute step count by 14% (≈35 steps over 253 baseline, p=.06); walking suggestions alone +24% (59 steps, p=.02); anti-sedentary suggestions no significant effect. Effect was strongest early: any suggestion ≈+66% (167 steps) day 1, declining ≈2%/day, undetectable by day 28; walking suggestions ≈+107% day 1, gone by day 29. Authors attribute decline to habituation (participants found suggestions boring after 2–4 weeks) and say long-term use needs a schedule that reduces habituation — [PMC6401341](https://pmc.ncbi.nlm.nih.gov/articles/PMC6401341)
- **Bidargaddi et al. 2018, JMIR mHealth & uHealth ("To prompt or not to prompt?")** (MODERATE, MRT, 1,255 users, 89 days): a tailored push message raised app use within 24 h by ≈3.9% (RR 1.039, 95% CI 1.01–1.08); strongest at 12:30 on weekends (≈11.8% more likely to engage). Effect attenuated over time (not significant) — [JMIR mHealth](https://mhealth.jmir.org/2018/11/e10123)
- **Nahum-Shani et al. 2018, Annals of Behavioral Medicine (JITAI framework)** — per secondary reviews: six components (distal outcome, proximal outcome, decision points, intervention options, tailoring variables, decision rules); support delivered at moments of vulnerability *or receptivity* — [PMC review citing JITAI components](https://pmc.ncbi.nlm.nih.gov/articles/PMC11583291); primary article not retrieved.
- **Perski et al. 2021/2022, Addiction** (systematic review of JITAIs for substance use): JITAIs mostly rely on active measurement and static decision rules; studies on effectiveness are lacking — [UCL Discovery PDF](https://discovery.ucl.ac.uk/id/eprint/10133803/9/Perski_Addiction%20-%202021%20-%20Perski%20-%20Technology%E2%80%90mediated%20just%E2%80%90in%E2%80%90time%20adaptive%20interventions%20%20JITAIs%20%20to%20reduce%20harmful%20substance.pdf)

### Inferences
- Expect any daily reminder to lose most of its effect within ~4 weeks. Combined with Stawarz (reminders block automaticity), a personal habit tracker should treat reminders as optional and temporary, not the core loop.
- If reminders exist: user-chosen time near the anchor event, at most one per habit per day, varied or silent-by-default, and easy to turn off. Fewer, better-timed prompts beat many.
- A cheap "context-aware" proxy without sensors: fire the reminder at the time the user usually completes the habit (learned from their logs) rather than a fixed time.

### Gaps
- I did not retrieve quantitative peer-reviewed data on "notification fatigue" (e.g. dismissal rates rising with volume) within this budget; Pielot/Mehrotra-style receptivity studies were not checked.
- HeartSteps' daily-planning component (closest to implementation intentions) was not evaluated in the 2018 paper.
- No evidence found on whether HeartSteps effects differ by location/context (not analysed in the 2018 paper).

## 4. Gamification and streaks

### Takeaway
Gamification has a small-to-medium short-term effect on physical activity (g≈0.42), roughly halved against a non-gamified active control (g≈0.23) and very small after the intervention ends (g≈0.15). Streaks are powerful motivators (people treat keeping a logged streak as a goal in itself) but broken streaks cause drop-off, especially when people blame themselves — unless the streak can be repaired.

### Cited Findings
- **Mazeas et al. 2022, JMIR 24(1):e26779** (STRONG-ish, meta-analysis of 16 RCTs, N=2,407): gamified PA interventions g=0.42 (95% CI 0.14–0.69); vs inactive controls g=0.58 (0.08–1.07); vs active non-gamified controls g=0.23; long-term (follow-up averaging 14 weeks after intervention end) g=0.15 (0.07–0.23) — [JMIR](https://jmir.org/2022/1/e26779)
- **Johnson, Deterding et al. 2016, Internet Interventions 6:89–106** (systematic review, 19 papers): 59% positive, 41% mixed effects; mostly moderate or lower quality evidence; clearer for health behaviours than cognitive outcomes; few comparisons against non-gamified versions of the same intervention — [PMC6096297](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6096297/)
- **Silverman & Barasch 2023, Journal of Consumer Research 49(6) ("On or off track")** (MODERATE, seven studies): highlighting intact streaks in behavioural logs increases subsequent engagement relative to broken streaks, even holding past behaviour constant; consumers treat maintaining a logged streak as a goal in itself. Effect amplified when people attribute the break to themselves, attenuated when they can "repair" the streak. Barasch: messaging that highlights a recent failure typically doesn't work; people drop off once streaks break; offer a new goal instead — [Univ. Delaware repository](https://udspace.udel.edu/handle/19716/34160); [CU Boulder news](https://www.colorado.edu/business/news/2023/04/20/research-streaks-marketing-tech-barasch)
- **Renfree et al. 2016**: streaks, like reminders, supported repetition but created app dependence (see section 1) — [Northumbria](https://researchportal.northumbria.ac.uk/en/publications/dont-kick-the-habit-the-role-of-dependency-in-habit-formation-app/)
- **Duolingo (company data, WEAK/not peer-reviewed)**: A/B test separating the daily goal from the streak raised Day-14 retention by 3.3% (relative), DAU by 1%, and share of daily learners on a streak by 10.5% — [Duolingo blog](https://blog.duolingo.com/improving-the-streak). Retention PM on Lenny's podcast: streaks are Duolingo's most impactful feature, 9M+ users on year-plus streaks, 600+ streak experiments in four years — [Lenny's Newsletter](https://lennysnewsletter.com/p/behind-the-product-duolingo-streaks)

### Inferences
- Streaks are a double-edged lever: strong while intact, and a cliff when broken. For a personal tracker, build repair/forgiveness in from day one (e.g. a rest day or "freeze", or a weekly-target streak such as 5 of 7 days), and on a break show the longer-term record ("24 of the last 30 days") and a fresh goal, not "streak lost."
- Points/badges have weak long-term evidence; for a minimal personal tool they are likely not worth the complexity. The effect that persists most (competition in STEP UP, below) needs other people.
- Note the tension with Etkin: streaks quantify, which can turn an enjoyable habit into work.

### Gaps
- No published data found on Duolingo Streak Freeze's effect on retention.
- No peer-reviewed study found directly comparing strict daily streaks vs forgiving/weekly streaks in a habit app.
- Specific study designs and effect sizes in Silverman & Barasch not captured (full text not opened).

## 5. Engagement and retention

### Takeaway
Most health/habit apps are effectively abandoned within two weeks: median 15-day retention of 3.9% and 30-day of 3.3% for popular mental-health apps, with tracker apps somewhat better (6.1% at day 30). The goal is not maximal engagement but "effective engagement": enough use of the right parts to produce change.

### Cited Findings
- **Baumel, Muench, Edan & Kane 2019, JMIR 21(9):e14567** (MODERATE, panel usage data, 93 Android apps with 10k+ installs): median 15-day retention 3.9% (IQR 10.3%), 30-day 3.3% (IQR 6.2%). At day 30, peer-support (8.9%, n=2), mindfulness (4.7%) and tracker apps (6.1%, IQR 20.4%) retained better than breathing apps (0.0%) — [PMC6785720](https://pmc.ncbi.nlm.nih.gov/articles/PMC6785720)
- **Yardley et al. 2016, Am J Prev Med 51(5):833–842** (consensus/overview): distinguishes engagement in general from "effective engagement" — enough engagement with the intervention to achieve intended outcomes; covers tailoring and combining digital and human support; recommends user-centred, iterative, mixed-methods development — [UCL Discovery](https://discovery.ucl.ac.uk/id/eprint/1528600/); [UEA eprints](https://ueaeprints.uea.ac.uk/id/eprint/62088/)
- HeartSteps and Bidargaddi both show prompt effects decaying over weeks, consistent with general engagement decay (section 3) — [PMC6401341](https://pmc.ncbi.nlm.nih.gov/articles/PMC6401341); [JMIR mHealth](https://mhealth.jmir.org/2018/11/e10123)
- Reasons for abandoning trackers (lived informatics): lapses and life changes, with resumption common — [Epstein 2015](https://my.eng.utah.edu/~cs5540/au16/readings/PersonalInformatics-Epstein2015.pdf); [Beyond abandonment](https://library.selfresearch.org/research/beyond-abandonment-to-next-steps-understanding-and-designing-for-life-after-personal-informatics-tool-use/)

### Inferences
- For a habit tracker, a user who stops opening the app because the habit has become automatic is a *success*, not churn. Success metrics should be habit-level (completion rate, self-reported automaticity) rather than DAU.
- The first 2 weeks are where nearly all loss happens: day-one setup (anchor, small habit) and the first missed day are the critical moments.

### Gaps
- Baumel's data is mental-health apps, not habit trackers specifically; I found no comparable peer-reviewed retention figures for habit-tracker apps.
- The "80% lost within 10 days" figure attributed to Baumel by a secondary source was not verified.

## 6. Social features: accountability, comparison, public commitment

### Takeaway
Social elements add measurable effect: making progress reported or public strengthens monitoring effects (Harkin), and in the STEP UP RCT competition beat support and collaboration and was the only arm that persisted after incentives stopped. Evidence on harms of social comparison was not found within this budget.

### Cited Findings
- **Harkin et al. 2016**: progress monitoring had larger effects when outcomes were reported or made public — [White Rose](https://eprints.whiterose.ac.uk/id/eprint/91437/)
- **Patel et al. 2019, JAMA Internal Medicine (STEP UP)** (STRONG, RCT, N=602 adults with BMI ≥25 in 40 US states; 24-week intervention + 12-week follow-up): vs control, daily steps rose by 920 in competition arm (95% CI 513–1328, p<.001; groups of three with leaderboard), 689 in support arm (sponsor sees progress), 637 in collaboration arm. In follow-up only competition stayed significant (+569, p=.009); support +428 and collaboration +126 not significant — [Penn CHIBE](https://chibe.upenn.edu/publications/effectiveness-of-behaviorally-designed-gamification-interventions-with-social-incentives-for-increasing-physical-activity-among-overweight-and-obese-adults-across-the-united-states); [Penn Acceleration Lab](https://accelerationlab.upenn.edu/step-up)
- Baumel 2019: peer-support apps had the highest 30-day retention (8.9%), but n=2 apps — [PMC6785720](https://pmc.ncbi.nlm.nih.gov/articles/PMC6785720)
- Patel group BE FIT (2017, JAMA IM; 200 adults from 94 families): gamification with social incentives significantly increased physical activity vs control — [Healio](https://www.healio.com/news/primary-care/20171002/gamification-increases-physical-activity-among-families)

### Inferences
- For a *personal* tracker, the cheapest social lever with evidence is a lightweight "share progress with one person" (support-sponsor style) or simply recording commitment; leaderboards need a group and conflict with a calm personal tool.
- STEP UP's effects come bundled with points/levels and a behaviourally designed program, so they do not isolate social features alone.

### Gaps
- No peer-reviewed evidence retrieved on harms of social comparison or public commitment in habit apps (e.g. discouragement from upward comparison); this is a real gap in these notes, not evidence of no harm.

## 7. Reflection and review

### Takeaway
Personal informatics models put reflection between collection and action, and barriers at early stages (e.g. burdensome collection) cascade into reflection and action. Meta-analytic evidence supports "review of behavioural goals" and feedback as part of the effective self-regulation bundle, but I found no RCT isolating weekly review or insights screens in habit apps.

### Cited Findings
- **Li, Dey & Forlizzi 2010, CHI ("A stage-based model of personal informatics")** (WEAK–MODERATE, surveys + interviews): five stages (preparation, collection, integration, reflection, action) with barriers at each; barriers cascade to later stages; process is iterative; can be user- or system-driven — [UW course PDF](https://courses.cs.washington.edu/courses/cse440/15au/readings/PersonalInformatics-Li2010.pdf)
- **Epstein et al. 2015** extends Li's model with deciding to track, tool selection, lapsing and resuming — [paper PDF](https://my.eng.utah.edu/~cs5540/au16/readings/PersonalInformatics-Epstein2015.pdf)
- **Michie et al. 2009**: self-monitoring combined with other control-theory techniques (which include feedback and goal review) outperformed other interventions (0.42 vs 0.26) — [PubMed](https://pubmed.ncbi.nlm.nih.gov/19916637/)

### Inferences
- A short weekly look-back (what got done, which anchor worked, adjust the habit) is the app equivalent of Michie's "review goals" and Li's reflection→action step; it is also the natural place to shrink or re-anchor a failing habit rather than nagging.
- Keep collection trivially easy, since Li's cascade means a heavy logging step starves reflection.

### Gaps
- No controlled trial found isolating the effect of a weekly review or insights screen in a habit app.
- Journaling evidence for habit change not researched within budget.

---

## Design implications summary (for a daily phone habit tracker)
1. **Anchor, don't alarm**: make "After I [existing routine], I will [habit]" the primary cue (Stawarz 2015; Pinder 2018). Clock reminders optional, temporary, one per habit.
2. **One-tap logging, done/not-done**: tracking works (Harkin d≈0.40) but burden drives lapse and output-measurement can sap enjoyment (Etkin).
3. **Forgiving streaks**: show streaks but allow repair or a weekly target; on a break, show the long-run rate and offer a fresh goal (Silverman & Barasch 2023).
4. **Expect decay**: prompt effects fade within ~4 weeks (HeartSteps); don't rely on notifications to hold users.
5. **Weekly review**: pair tracking with feedback and goal review (Michie 2009; Li 2010).
6. **Measure habits, not DAU**: an app no longer needed is the intended outcome (Renfree 2016; Yardley 2016).
7. **Social, if any, small**: one accountability partner or public commitment has support; leaderboards need a group (STEP UP).
