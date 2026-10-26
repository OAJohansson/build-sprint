# Interview story: Wont

Written at wrap-up (playbook step 4), from the brief, feedback and retro. STAR, tellable in about 2 minutes.

**Headline:** Most habit apps punish a missed day; I built one around the morning after.

**Themes:** Discovery, Metrics, Failure, Trade-offs, Craft, Working with AI

## In 30 seconds

I was five days into waking at 7am and two days off nicotine pouches, and I knew from experience
that one bad morning usually ends the attempt. Research says the slip isn't what kills a habit:
the feeling that the whole thing is ruined is. So instead of a streak that resets to zero, Wont
counts what you kept, logs a slip honestly in two taps, and treats the next good day as a
comeback, marked by a winking wonton. Simulated user tests passed every scenario, and the real
test is my own four weeks of use.

## The story

**Situation.** Habit trackers are one of the most crowded app categories, yet most health apps
keep only about 3–4% of users after a month. I had two fragile habits at once: getting up at 7am
(when nothing forces me to, I sleep in and then feel bad all day) and quitting nicotine pouches,
which I'd stopped the day before.

**Task.** Build something I'd actually keep using, grounded in behaviour science rather than in
habit-app conventions, in one day, in Founder mode: I write the kickoff pack, and a squad of AI
agents builds and grades it.

**Action.**
- **Researched before deciding.** I commissioned a deep research report: five researchers covering
  COM-B, habit-formation studies, quitting, digital interventions and 15 competitor apps. Its
  headline became the product: design the comeback, not the streak. The evidence was concrete:
  - a broken streak lowers motivation even when your record is the same (Silverman & Barasch)
  - the best of 54 gym interventions rewarded coming back after a miss (Milkman's megastudy)
  - time-based reminders make the phone the cue instead of your routine (Stawarz)
- **Pushed back on my own first idea.** My MVP sketch had notifications, a morning motivation
  message and lots of animation. The evidence said reminder effects fade within weeks and rewards
  don't build automaticity, so I cut all three and kept a short intro instead, as a deliberate
  learning goal.
- **Kept the taste calls.** I rejected two whole contact sheets, chose wontons as a pun on the
  name, and pushed the character from "childish" to adult-but-cute. Then I made the comeback
  wonton wink, so the brand's mascot carries the product's core idea. I also changed the operating
  model, so the final design pick is always mine.
- **Let graders who didn't build it find the bugs.** A simulated user, a break-the-UI audit and a
  design critic tested it. I overruled the critic where it asked to remove things the research
  supports, like the if-then anchor on each card.

**Result.**
- **Simulated user test:** every scenario passes. Logging the wake-up takes one tap in about
  3 seconds; a slip takes two taps. The persona's verdict: "Nothing has made a slip feel this small
  before."
- **Bugs caught before shipping:** the graders found four that mattered. One was a message that
  claimed slips on days I hadn't slipped, but only if the app was left open over several days.
  Another meant coming back after a long absence showed no comeback message at all, the exact
  moment the product exists for.
- **Shipped on day two**, at wont-peach.vercel.app. The real measure, still running: logging 14 of
  14 days, a comeback after every slip, 7am at least 5 days a week, checked on 21 Nov.

**What I learned.** The research didn't just justify features; it removed them. And on design, the
calls that mattered most were taste calls a brief couldn't carry, so they stay with me.

## Assumptions: what I believed vs what was true

| I assumed | Turned out | How I found out |
| --- | --- | --- |
| A habit app needs reminders and a morning motivation message | Reminders build repetition but not automaticity, and their effect fades by about week 4 | The deep research (Stawarz 2015, HeartSteps trial) |
| Lots of positive animation would keep me motivated | Rewards didn't make habits more automatic; one small moment is enough | Research, then the design-restraint rule |
| Showing the comeback message once per run of misses was enough | Coming back after a longer absence showed nothing, the "lost week" case | The simulated user resumed the app across several days |
| An AI design critic would converge on a great board | It scored 6/10 five times, because it kept asking to remove requirements it never saw | Five critic rounds; the process changed |
| The icon was purple | It was a warm near-black that read as purple on my screen | A side-by-side comparison |

## Likely follow-ups

- *"How will you know it worked?"* Three signals from the app's own history over four weeks: days
  logged, comebacks ÷ slips, and 7am kept days per week. Plus my own check: did a slip ever feel
  like punishment?
- *"Why not streaks? Duolingo's work."* Streaks work while they're intact. The research shows a
  broken streak does more harm than the streak did good, especially when you blame yourself. Wont
  keeps the motivation (you can see your progress) without a counter that drops to zero.
- *"What did the AI get wrong?"* It wrote a comeback rule that looked tidy and missed the main
  case, and it kept a harsh dark header the critic had flagged. A simulated user and I caught
  them.
- *"Why wontons?"* "Wont" is an old word for habit, and a wonton is the pun. A steamer filling up
  shows progress without numbers, and the winking wonton marks a comeback.

## Theme prompts

- **Discovery:** I asked what went wrong last time, not what I'd like; "I sleep in when I have no commitments, then feel bad" pointed straight at the slip moment.
- **Prioritisation:** Cut notifications, morning motivation and heavy animation on evidence; parked the comebacks line and "not today" past the stop line.
- **Metrics:** Days logged, comebacks ÷ slips, 7am kept per week; daily active use is explicitly *not* the goal.
- **Failure:** The comeback rule (once per run) failed the lost-week case; replaced after the user test.
- **Ambiguity:** Decided the day boundary (04:00) and "an unlogged day is a miss, shown as not logged" without data; logged both as reversible decisions.
- **Trade-offs:** Overruled the critic's 9/10 path (remove the numbers and anchors) to keep the research's strongest technique on every card.
- **Craft:** The winking matcha wonton on a comeback day.
- **Technical:** A bug that only appeared when a phone kept the app open across days; fixed at the root, with a test that replays the user's week.
- **Working with AI:** Ran a squad of agents (research, design, build, graders) as PM, and kept the taste calls; changed the operating model so the final design pick is always mine.
- **Speed:** 

**Evidence:** `research.md`, `eval-report.md`, `decisions.md`, `user-testing/report-2026-10-25*.md`
