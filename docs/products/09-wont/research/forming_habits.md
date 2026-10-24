# Habit formation science for app design: forming new habits and making them stick

Research notes, 24 Oct 2026. Evidence grades used: **Strong** (meta-analysis or large preregistered field RCT), **Moderate** (single solid RCT/field study, or meta-analysis with known bias), **Weak/popular** (theory, small samples, practitioner books).

## 1. Habit formation mechanics (Lally, Wood & Neal, Gardner, Singh 2024, SRBAI)

### Takeaway
A habit is an action triggered automatically by a context cue after repeated performance in that same context; automaticity rises fast at first and then plateaus, with a median around 59-66 days but huge individual spread (4-335 days), and a single missed day does not reset it (Strong-to-Moderate: consistent across a small number of studies, all relying on self-reported automaticity).

### Cited Findings
- Lally et al. 2010 (Eur J Soc Psychol): 96 volunteers each chose one eating, drinking or activity behaviour to do daily in the same context for 12 weeks; 82 gave enough data for analysis — [Univ. of Surrey repository](https://openresearch.surrey.ac.uk/esploro/outputs/99783513802346); [BPS Research Digest](https://bps.org.uk/research-digest/how-form-habit)
- Lally 2010: median time to reach 95% of the automaticity plateau was 66 days, range 18-254 days; missing one opportunity did not materially affect the habit-formation process — [BPS Research Digest](https://bps.org.uk/research-digest/how-form-habit); [ISPA repository record](https://repositorio.ispa.pt/entities/publication/fae72a1c-b2b6-4991-9951-5d20b607f688/full)
- Lally 2010 limitation: entirely dependent on participants' self-reported automaticity — [BPS Research Digest](https://bps.org.uk/research-digest/how-form-habit). Note: a later replication preprint cites "39 participants", which conflicts with the 82 analysed; treat that figure with caution — [PCI Registered Reports preprint](https://rr.peercommunityin.org/download/t_recommendations.reply_pdf.8382af6b73bdd0f7.6d616e757363726970745f7072657072696e742e706466.pdf)
- Singh, Murphy, Maher & Smith 2024 (Healthcare 12:2488), systematic review and meta-analysis: 20 studies, 2,601 participants (mean ages 21.5-73.5). Only 4 studies reported time to habit: medians 59-66 days, means 106-154 days, individual range 4-335 days. Behaviours: physical activity, water drinking, eating, flossing, stretching, reducing sitting, vitamins, a food-safety task — [University of Adelaide repository](https://digital.library.adelaide.edu.au/items/fe6ba93e-1d6b-42b8-9ee7-a231a64ff006); [Earth.com summary](https://earth.com/news/forming-healthy-habits-takes-much-longer-than-21-days)
- Mean > median (106-154 vs 59-66 days) means a long right tail: some people take many months — [University of Adelaide repository](https://digital.library.adelaide.edu.au/items/fe6ba93e-1d6b-42b8-9ee7-a231a64ff006)
- Gardner, Lally & Wardle 2012, "Making health habitual" (Br J Gen Pract 62:664-666): habits are "actions that are triggered automatically in response to contextual cues"; once formed they need less conscious effort or motivation and can persist after interest fades — [PMC3505409](https://pmc.ncbi.nlm.nih.gov/articles/PMC3505409/)
- Gardner 2012 advice for clinicians: pick a simple action, repeat it in the same context (consistent time or place), keep going until automatic; varying the behaviour or setting works against automaticity; cues inside existing routines are good stable anchors; simpler actions become habitual faster, so start small; tell patients to expect about 10 weeks and ignore the anecdotal "21 days" — [PMC3505409](https://pmc.ncbi.nlm.nih.gov/articles/PMC3505409/)
- Gardner 2012 caveats: initiation still needs motivation and the learning phase needs effort; you cannot form a habit of *not* doing something (breaking habits needs other strategies); timeline evidence rests largely on one study — [PMC3505409](https://pmc.ncbi.nlm.nih.gov/articles/PMC3505409/)
- "10 top tips" habit leaflet trial cited by Gardner 2012: leaflet with 10 simple diet/activity behaviours led to ~2 kg loss at 8 weeks vs 0.4 kg in waitlist control; completers lost 3.8 kg on average at 32 weeks (early, small trial) — [PMC3505409](https://pmc.ncbi.nlm.nih.gov/articles/PMC3505409/)
- Gardner 2012 on motivation: self-chosen goals pursued for personal value (autonomous) are easier to make habitual than externally demanded ones — [PMC3505409](https://pmc.ncbi.nlm.nih.gov/articles/PMC3505409/)
- Gardner & Lally 2013 (n = 192, ages 18-30): past behaviour predicted habit strength more strongly among autonomously motivated people, and self-determined motivation also had a direct effect on habit strength — [UCL Discovery](https://discovery.ucl.ac.uk/id/eprint/1349432/)
- Intrinsic rewards (enjoyment, stress relief) predicted exercise frequency via stronger habits for people in maintenance (Phillips et al. 2016, as cited in a review); a COVID-lockdown study (N = 580) found positive intrinsic rewards more strongly associated with physical-activity habit strength over time than negative ones — [Frontiers in Psychology 2022](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2022.962150/epub)
- Measurement: the Self-Report Behavioural Automaticity Index (SRBAI) is a 4-item automaticity subscale of the 12-item Self-Report Habit Index (Gardner, Abraham, Lally & de Bruijn 2012, IJBNPA 9:102). It was reliable, correlated with behaviour, moderated the intention-behaviour link, and is recommended as a parsimonious way to track habit formation — [PMC3552971](https://pmc.ncbi.nlm.nih.gov/articles/PMC3552971/)

### Inferences
- An app should frame the journey as "about 2-3 months, often longer", not 21 or 30 days; a fixed 66-day finish line is also misleading given the 4-335 day spread.
- Because habit = cue + repetition in a stable context, the core data model should store a *cue/context* ("after I pour my morning coffee, in the kitchen") per habit, not just a name and a frequency.
- A cheap, periodic SRBAI check-in (4 items, e.g. weekly or every 2 weeks: "I do X automatically / without having to consciously remember / without thinking / before I realise I'm doing it") would let the app show an automaticity curve, which is the real outcome, rather than only a completion streak. The specific item wording here is from memory of the SRBAI; verify against PMC3552971 before shipping.
- Since one miss does not derail automaticity, streak-reset mechanics that punish a single miss conflict with the evidence.
- Emphasising enjoyment and self-chosen ("why does this matter to you?") goals is supported; external points/badges are not shown to build habit.

### Gaps
- Wood & Neal (2007, Psychological Review, "habit-goal interface") and Wood's later work on context cues were not retrieved in this session; no effect sizes from them are cited here.
- No data found on whether habits formed with app support differ from those formed without it.
- Whether "the plateau" is a real end point or an artefact of the asymptotic model fitted in Lally 2010 was not examined.

## 2. Implementation intentions, if-then planning, coping plans, habit stacking

### Takeaway
If-then plans ("When situation X arises, I will do Y") reliably improve goal attainment, with a medium-to-large average effect (d = 0.65 across 94 tests, Strong but likely inflated by publication bias); anchoring a new behaviour to an existing routine is recommended by habit researchers (Gardner), but direct evidence for "habit stacking" as a distinct technique is thin.

### Cited Findings
- Gollwitzer & Sheeran 2006 (Adv Exp Soc Psychol 38:69-119): meta-analysis of 94 independent tests from 63 reports, average d = 0.65 on goal attainment (the ">8,000 participants" figure appears only in secondary sources) — [Univ. of Konstanz publication page](https://www.socmot.uni-konstanz.de/publications/implementation-intentions-and-goal-achievement-meta-analysis-effects-and-processes); [Stafforini summary](https://stafforini.com/works/gollwitzer-2006-implementation-intentions-and/)
- Sheeran, Listrom & Gollwitzer, "The when and how of planning: Meta-analysis of the scope and components of implementation intentions in 642 tests", European Review of Social Psychology 36:162-194 (online 2024, issue 2025; DOI 10.1080/10463283.2024.2334563) — [KOPS Konstanz record](https://kops.uni-konstanz.de/handle/123456789/69905). Its overall effect size was not retrievable in this session.
- Milkman et al. 2021 megastudy used "planning prompts" (plan dates/times of each week's workouts) plus text reminders at those times plus ~US$0.22 per visit; this baseline raised gym visits by 0.14/week (+9%) vs placebo control (b = 0.14, 95% CI 0.04-0.23) — [Milkman et al. 2021, Nature (PDF)](https://Www.Gwern.net/doc/statistics/prediction/2021-milkman.pdf)
- In that megastudy, all 24 treatments that significantly raised exercise included the planning + reminders + incentive base; a "planning workouts encouraged" add-on alone was not among the top five performers — [Milkman et al. 2021](https://Www.Gwern.net/doc/statistics/prediction/2021-milkman.pdf)
- Gardner 2012 recommends cues "within existing routines" as stable starting points — i.e. the research basis for what popular books call habit stacking — [PMC3505409](https://pmc.ncbi.nlm.nih.gov/articles/PMC3505409/)
- Prestwich et al. 2015 is a further review of implementation intentions in health behaviour (details not extracted) — [Prestwich et al. 2015 PDF](https://bpb-us-e1.wpmucdn.com/wp.nyu.edu/dist/c/6235/files/2019/02/prestwich-et-al-2015-implementation-intentions.pdf)

### Inferences
- Habit creation in the app should *require* an if-then plan (cue + action, optionally place), since it is the single best-evidenced cheap technique and it also supplies the stable cue habit formation needs.
- An optional coping plan field ("If [obstacle], then I will [alternative]") is a natural extension; implementation intentions for obstacles are part of the same research line, but no separate effect size was retrieved here.
- d = 0.65 is on *goal attainment* over short horizons, not on long-term automaticity; do not market it as "makes habits stick".

### Gaps
- Effect size of the 2024 642-test meta-analysis and its moderators (plan format, motivation) — not retrieved.
- Direct experimental evidence on "habit stacking" (e.g. Judah, Gardner & Aunger 2013 flossing study on ordering relative to tooth brushing) was not retrieved; treat stacking-specific claims as plausible extrapolation.
- Separate meta-analytic effect sizes for coping planning were not found.

## 3. Mental contrasting / WOOP

### Takeaway
Mental contrasting with implementation intentions (MCII, the method behind WOOP: Wish, Outcome, Obstacle, Plan) has a small-to-medium effect on goal attainment (g = 0.34), stronger when delivered interactively, and likely somewhat inflated by publication bias (Moderate).

### Cited Findings
- Wang, Wang & Gai 2021 (Frontiers in Psychology, 12:565202): 21 studies, 24 effect sizes, 15,907 participants; overall g = 0.336 on goal attainment — [PMC8149892](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8149892/)
- Moderator: interventions with live experimenter interaction g = 0.465 vs written/document-based g = 0.277 — [PMC8149892](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8149892/)
- Authors flag publication bias, so true effects may be smaller, and few studies limit moderator conclusions — [PMC8149892](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8149892/)
- Note: this meta-analysis is by Wang, Wang & Gai, not Oettingen/Sheeran (Oettingen was a reviewer) — [Frontiers article page](https://www.frontiersin.org/articles/10.3389/fpsyg.2021.565202/full)

### Inferences
- A self-guided app is closer to the "written" delivery (g ≈ 0.28) than the interactive one; a short guided WOOP flow at habit setup (with prompts, not a blank form) is a reasonable, low-cost addition, especially the Obstacle step which feeds the coping plan.
- WOOP and if-then planning overlap: one setup flow can capture wish, obstacle and the if-then plan without separate features.

### Gaps
- No evidence retrieved on WOOP specifically for long-term habit automaticity, or on app-delivered WOOP outcomes.

## 4. Temptation bundling, fresh start, commitment devices, the 2021 gym megastudy

### Takeaway
The strongest field evidence (61,293 gym members, 54 interventions) shows simple digital nudges raise behaviour 9-27% while active, the best one being a tiny reward for *returning after a miss*, but only 8% of interventions had measurable effects after the programme ended; temptation bundling gives a modest durable lift (10-14%), the fresh-start effect is real for *starting*, and commitment contracts help a minority who opt in (Strong for short-term effects, weak for persistence).

### Cited Findings
- Milkman et al. 2021, Nature 600:478-483, "Megastudies improve the impact of applied behavioural science": 61,293 members of 24 Hour Fitness, 54 four-week digital programmes designed by 30 scientists from 15 universities; ≥455 per condition (mean 1,135) — [Milkman et al. 2021 PDF](https://Www.Gwern.net/doc/statistics/prediction/2021-milkman.pdf)
- 45% of interventions significantly raised weekly gym visits by 0.14-0.40 visits/week (9%-27%) vs placebo control (1.48 visits/week); no treatment reduced visits — [Milkman et al. 2021](https://Www.Gwern.net/doc/statistics/prediction/2021-milkman.pdf)
- Top intervention: a bonus of 125 points (US$0.09) for returning to the gym after a missed workout, +0.40 visits/week (+27%) vs placebo, +16% vs the planning/reminder/incentive base. Authors warn top-performer estimates are probably inflated by selection — [Milkman et al. 2021](https://Www.Gwern.net/doc/statistics/prediction/2021-milkman.pdf)
- Second: larger incentives (+0.28 visits/week, +19%). Third-ranked: sharing social norms that exercise is high and increasing — [Milkman et al. 2021](https://Www.Gwern.net/doc/statistics/prediction/2021-milkman.pdf)
- Persistence: only 8% of conditions had significant effects in the 4 weeks post-intervention (2.5% expected by chance); pooled, each extra visit during the intervention yielded 0.30 extra visits over the next 10 weeks (95% CI 0.13-0.54), consistent with earlier habit studies (0.16-0.46) — [Milkman et al. 2021](https://Www.Gwern.net/doc/statistics/prediction/2021-milkman.pdf)
- "Rigidity rewarded" (rewarding a consistent schedule) conditions were among the weaker performers (several outperformed 0-6% of other conditions) — [Milkman et al. 2021, Table 2](https://Www.Gwern.net/doc/statistics/prediction/2021-milkman.pdf)
- Impartial forecasters failed to predict which interventions worked best — [Milkman et al. 2021](https://Www.Gwern.net/doc/statistics/prediction/2021-milkman.pdf)
- Milkman framed the missed-workout bonus as preventing a string of misses from building up, not as a money effect — [Knowledge at Wharton](https://knowledge.wharton.upenn.edu/podcast/knowledge-at-wharton-podcast/how-science-can-help-you-keep-your-fitness-goal/)
- Temptation bundling, Milkman, Minson & Volpp 2014 (Management Science), n = 226: gym-only access to tempting audiobooks raised visits 51% (full treatment) and 29% (intermediate) vs control early on, with effects declining over time (notably after Thanksgiving); 61% would pay to have gym-only access to the audiobooks — [Penn repository](https://repository.upenn.edu/oid_papers/150); [Penn Today](https://penntoday.upenn.edu/2014-01-16/research/guilty-pleasures-and-obtaining-goals)
- Kirgios, Mandel, Park, Milkman, Gromet, Kay & Duckworth 2020 (OBHDP 161:20-35), N = 6,792, four-week programme: audiobook plus encouragement to temptation bundle raised the likelihood of a weekly workout by 10-14% and weekly workouts by 10-12%, during and up to 17 weeks after the intervention; encouragement added only a modest benefit over the audiobook alone — [Kirgios et al. 2020 PDF](https://faculty.wharton.upenn.edu/wp-content/uploads/2017/07/TemptationBundling.pdf)
- (The brief's "Kirgios/Milkman 2022 megastudy replication" could not be found; the large replication is Kirgios et al. 2020 above.)
- Fresh-start effect, Dai, Milkman & Riis 2014 (Management Science): Google searches for "diet", university gym visits and goal commitments on stickK all rise after temporal landmarks (new week, month, year, semester, birthdays, holidays) — [Dai et al. 2014 PDF](https://faculty.wharton.upenn.edu/wp-content/uploads/2014/06/Dai_Fresh_Start_2014_Mgmt_Sci.pdf); [APS summary](https://www.psychologicalscience.org/news/minds-business/why-monday-is-the-best-day-for-setting-new-goals.html)
- Commitment device, Giné, Karlan & Zinman 2010 (AEJ: Applied), CARES savings account for quitting smoking, ~2,000 smokers in the Philippines: only 11% offered took it up; those offered were 3 percentage points more likely to pass a 6-month urine test, and the effect held in surprise 12-month tests; unclear how much came from the money vs contact with deposit collectors — [IPA paper "Put Your Money Where Your Butt Is"](https://poverty-action.org/node/12726/pdf); [FTC conference paper](https://www.ftc.gov/sites/default/files/documents/public_events/first-annual-microeconomics-conference/dkarlan.pdf)

### Inferences
- The single most actionable finding for a habit app: design for the *comeback*. Reward or celebrate returning after a miss ("welcome back") rather than resetting to zero. This both matches Lally's "one miss doesn't matter" and the megastudy's top arm.
- Expect the app's effect to fade when the user stops opening it; most nudges stop working when they stop. The goal is to get enough repetitions in a stable context for automaticity to carry over (each induced repetition yielding ~0.3 extra later repetitions in the megastudy).
- Fresh starts: offer "start Monday / on the 1st" scheduling and frame restarts after a lapse as a fresh start, but the evidence is about *initiating* goals, not keeping them.
- Temptation bundling can be a small optional "pair it with" field (e.g. podcast only while walking); effect is modest (~10%).
- Monetary commitment contracts have low uptake and need real stakes and a referee; out of scope for a personal localStorage app. Soft commitment (a written pledge) did not stand out in the megastudy.
- Forecasters couldn't predict winners: the app owner's own intuitions about which features work are unreliable; build in a way to see which habits actually stick.

### Gaps
- Full ranking and effect sizes for all 54 megastudy arms (e.g. signed pledge, social norms details) were only partly extracted.
- No megastudy-grade evidence retrieved on streak counters, badges or push notifications in habit apps specifically.
- No evidence retrieved on stickK outcome data.

## 5. Start small, consistent time/place, rewards, flexible vs fixed timing

### Takeaway
Start with a simple behaviour and keep the *cue* stable (Gardner, Moderate), but don't force rigid timing: in an RCT, paying people for gym visits at any time beat paying them only within a fixed daily 2-hour window, both during and after the programme (Strong single study). Intrinsic enjoyment and autonomous motivation predict habit strength; external rewards help short-term.

### Cited Findings
- Beshears, Lee, Milkman, Mislavsky & Wisdom 2021 (Management Science 67(7):4139-4171; field period Mar 2015-Jan 2016; AEARCTR-0003471, NCT02346799): routine incentives (paid only for visits within a planned daily two-hour window) produced fewer gym visits than flexible incentives (paid for any daily visit), during the intervention and after incentives were removed; even when groups exercised at similar rates during the programme, the routine group dropped off more afterwards — [INFORMS](https://pubsonline.informs.org/doi/fpi/10.1287/mnsc.2020.3706); [AEA registry](https://www.socialscienceregistry.org/trials/3471)
- Consistent with this, "rigidity rewarded" arms in the 2021 megastudy were weak performers — [Milkman et al. 2021](https://Www.Gwern.net/doc/statistics/prediction/2021-milkman.pdf)
- Gardner 2012: same context repetition builds the cue-behaviour link; start with a simple action because simpler actions become habitual faster — [PMC3505409](https://pmc.ncbi.nlm.nih.gov/articles/PMC3505409/)
- Autonomy and intrinsic rewards: see Gardner & Lally 2013 and the 2022 Frontiers study in section 1 — [UCL Discovery](https://discovery.ucl.ac.uk/id/eprint/1349432/); [Frontiers 2022](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2022.962150/epub)
- Small incentives (~US$0.09-0.22) can move behaviour while active — [Milkman et al. 2021](https://Www.Gwern.net/doc/statistics/prediction/2021-milkman.pdf)

### Inferences
- Tension to resolve in the product: Gardner's "same context" vs Beshears' "flexible timing wins". A reconciliation: anchor to a *cue/event* (after breakfast, after arriving home) rather than a clock time, and count any completion that day. A cue moves with your day; a fixed clock window is brittle.
- A "minimum version" field (e.g. "1 push-up counts") operationalises starting small and supports the "never miss" spirit without perfectionism; this is extrapolation, no direct trial retrieved.
- Gamified rewards are fine as short-term scaffolding, but the reflection prompt worth having is "did you enjoy it?" since enjoyment predicts lasting habit.

### Gaps
- No RCT retrieved directly testing "tiny habits" / minimum viable dose against larger starting doses.
- No evidence on optimal reminder frequency or reminder fatigue.

## 6. Atomic Habits (James Clear): claims vs evidence

### Takeaway
The book's mechanics (cue-based repetition, if-then planning, environment design, making behaviour easy and rewarding, not catastrophising a miss) broadly align with habit research; its signature numeric and identity claims ("1% better = 37x", identity-first change) are popular extrapolations without direct experimental support, and no peer-reviewed critique of the book was found.

### Cited Findings
- Critics note the "1% better every day = 37x after a year" compounding chart misapplies a financial compounding idea to personal habits — [If Books Could Kill podcast notes](https://podpulse.ai/podcast-notes-and-takeaways/if-books-could-kill-atomic-habits)
- Critiques note reliance on anecdotes and some sources such as Reddit/Twitter — [Medium critique](https://baos.pub/why-i-will-not-be-reading-atomic-habits-a2715f698251) (blog, low authority)
- No peer-reviewed academic critique of Atomic Habits was found in this session's searches.

Claim-by-claim (evidence column draws on sections 1-5):

| Claim | Verdict | Basis |
|---|---|---|
| Law 1, Make it obvious (cues, implementation intentions) | **Supported** | d = 0.65 for if-then plans ([Gollwitzer & Sheeran 2006](https://www.socmot.uni-konstanz.de/publications/implementation-intentions-and-goal-achievement-meta-analysis-effects-and-processes)); habits are cue-triggered ([Gardner 2012](https://pmc.ncbi.nlm.nih.gov/articles/PMC3505409/)) |
| Habit stacking (after current habit X, I'll do Y) | **Plausible extrapolation, partly supported** | Recommended by Gardner 2012 ("cues within existing routines"); a specific form of implementation intention; no stacking-specific trial retrieved |
| Environment design (make cues visible, friction for bad habits) | **Plausible / partly supported** | Context-dependence of habit (Gardner 2012); Wood's context-cue research not retrieved here |
| Law 2, Make it attractive (temptation bundling) | **Supported, modest** | +10-14% in N = 6,792 ([Kirgios 2020](https://faculty.wharton.upenn.edu/wp-content/uploads/2017/07/TemptationBundling.pdf)); +51% early, fading, in n = 226 (Milkman 2014) |
| Law 3, Make it easy (two-minute rule, reduce friction) | **Plausible, partly supported** | Simpler behaviours become habitual faster (Gardner 2012); no direct trial of the two-minute rule retrieved |
| "Repetitions, not time, form habits" | **Supported** | Automaticity grows with repetitions in context (Lally 2010 model) |
| Law 4, Make it satisfying (immediate rewards, habit trackers) | **Mixed** | Immediate micro-rewards raise behaviour while active (Milkman 2021), but few effects persist after; intrinsic enjoyment is what predicts habit strength (Gardner & Lally 2013; Frontiers 2022). No evidence retrieved that tracking itself builds automaticity |
| "Never miss twice" | **Consistent with evidence** | One miss does not derail habit formation (Lally 2010); returning after a miss was the best megastudy arm (Milkman 2021). "Twice" as a threshold is not itself tested |
| "1% better every day" / 37x compounding | **Unsupported** | Arithmetic metaphor; habit automaticity follows a plateauing curve, not exponential growth (Lally 2010) |
| Identity-based habits ("become the type of person who...") | **Weak / untested here** | No direct experimental evidence retrieved; autonomous, self-endorsed motivation does help (Gardner & Lally 2013), which is the nearest support |
| Habit takes 21 days (popular myth, which Clear also rejects) | **Contradicted** | Median 59-66 days, range 4-335 ([Singh 2024](https://digital.library.adelaide.edu.au/items/fe6ba93e-1d6b-42b8-9ee7-a231a64ff006)) |
| Plateau of latent potential (results come late) | **Partly contradicted** | Automaticity gains are *largest early* and then plateau (Lally 2010), the opposite curve shape; visible outcomes (weight, fitness) may lag, which is a different claim |

### Inferences
- The defensible core to build on: if-then cue plans, environment/anchor, start small, comeback-friendly tracking, enjoyment. Skip "1% better" compounding visuals and identity slogans as primary mechanics.
- Habit trackers (the book's Law 4 tool) are not themselves shown to create automaticity; the tracker is a scaffold for repetitions, so the app should measure automaticity (SRBAI) to check if it is working.

### Gaps
- No peer-reviewed critique of Atomic Habits; the verdict table is the researcher's mapping of book claims onto the cited evidence, not an external review.
- Identity-based change (e.g. "noun vs verb" framing studies such as Bryan et al. on voting) not retrieved; cannot cite.
- Wood & Neal's work on environment/context cues, and Wood's "Good Habits, Bad Habits" (2019), not retrieved in this session.
