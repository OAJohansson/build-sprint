# Interview story: Meander

Written at wrap-up (playbook step 4), from the brief, feedback and retro. STAR, tellable in about 2 minutes.

**Headline:** I built a map of philosophy you can trust, by treating AI-written content like code that needs tests: 282 unsupported claims down to zero.

**Themes:** Discovery, Metrics, Working with AI, Trade-offs, Failure

## In 30 seconds

I kept diving into one school of philosophy, staying for weeks, getting bored and dropping it. I built Meander, a globe of 23 schools where whichever one you pick turns to face you, showing what it built on, what it pushed against and what grew from it, so you can hop between connected ideas. AI wrote the content, so I set up a pipeline: a saved corpus of encyclopedia entries, a citation on every item, and a separate AI grader checking 2,800 claims. That took the content from 3 wrong claims and 282 unsupported ones to zero.

## The story

**Situation.** I learn philosophy on my own with Claude's Socratic modules, which work well for depth. But I'd go deep into one school (existentialism) for weeks, get bored and drop the subject, because I had no picture of the whole field and nothing suggested where to go next.

**Task.** I wanted to test one bet: that a visual map of the field makes me hop between connected areas in small pieces and keep going. Success meant picking a second connected school in my first session and touching 2+ areas on 3+ days in week one. The guardrail was accuracy, because an AI-drawn history can be confidently wrong.

**Action.**
- **Problem first.** I started from a solution ("a mind map"). Coaching pushed me back to the problem, and the real cost came out: boredom from going too deep, not a lack of overview.
- **A small MVP.** I kept live AI out of it: one fixed philosophy map, so the test was only about value.
- **Design.** I picked from ten directions, rejected most of them (too dense), refined three, and chose "Clew", a calm ball of thread. Then I commented on the final screens before any code, which removed four elements.
- **Content as a pipeline.** A research agent built the school list from the Stanford and Internet Encyclopedias of Philosophy and saved the full text. A writer produced every summary with citations. A separate grader checked each claim against the cited section. Four rounds of fixes followed.

**Result.**
- **Shipped:** live in two working days. 23 schools, 88 thinkers, 56 sourced links.
- **Content:** 0 wrong and 0 unsupported of 855 items, down from 3 wrong and 282 unsupported, and 20 of 20 on a hand spot-check.
- **Simulated user:** answered "where does existentialism sit?" correctly in 1.5 minutes and hopped 3 of 3 times.
- **Not proven yet:** whether I keep going for weeks. That's my own day-7 check.

**What I learned.** Trustworthy AI content comes from the process around the model: sources, citations, and a grader that didn't write the content.

## Assumptions: what I believed vs what was true

| I assumed | Turned out | How I found out |
| --- | --- | --- |
| I'm a "visual learner", so the map is for people like me | Learning-styles matching doesn't hold up in research; words plus pictures (dual coding) help almost everyone | Coaching at kickoff |
| The problem is not having an overview | The real cost is boredom from going too deep; the overview is what lets me vary | Asking what went wrong in my existentialism weeks |
| An AI writer with sources in hand writes accurate content | About 1 in 10 claims weren't supported by the cited text, and 3 were wrong | Independent claim-by-claim grading |
| Ten design directions give the most choice | Ten at once came out dense and gave me a headache; three calm ones were better | My own reaction to round 1 |
| The overview alone shows the shape of the field | The shape only appears after a click; the overview needs a sense of time | Simulated user test (job 1 scored 3/5) |

## Likely follow-ups

- **How do you know the grader is right?** A hand spot-check of 20 random claims each round, and the grader's verdicts sampled by hand. Some of the later rounds were graded in-session after the API hit its limit; I'd re-run those through the separate judge.
- **Why not generate maps live for any topic?** That would bet on two things at once. I wanted to test value first; live maps are the next rung.
- **What would you build next?** "Next on your thread": suggest a connected school from where I've been, with a reason. It's the most direct test of the hop.
- **What did it cost?** About $28 of grading calls, against two days of work.

## Theme prompts

- **Discovery:** *Where did the real problem turn out different from the request?* "A visual overview" turned out to be about boredom from going too deep; the map's job became showing what's connected and where I've been.
- **Prioritisation:** *What did I decide not to build, and why?* No live AI, no other fields, no free zoom: test the hop first.
- **Metrics:** *How did I know it worked? Which number moved?* Content: 282 unsupported → 0. Hop: 3 of 3 in the user test. The week-one check is still mine to do.
- **Failure:** *What did I get wrong, and what did I change because of it?* Asking for ten directions at once gave dense, headache-inducing designs; first-round briefs now set density rules.
- **Ambiguity:** *Which decision did I make with incomplete information, and how did I reduce the risk?* How many schools counts as "comprehensive": I tested the layout at 24 before the list existed.
- **Trade-offs:** *What did I give up to get something else?* Well-known thinkers without encyclopedia entries (Butler, Fraser) were left out to keep every item sourced.
- **Craft:** *Which detail made it feel great to use?* The globe turns to face whatever school you pick, and the neighbours light up with a verb and a reason.
- **Technical:** *What technical problem did I solve, and how would I explain it simply?* Each school has a fixed spot on a sphere; label placement is tuned with a grid and a script so no names overlap from any angle.
- **Working with AI:** *What did AI do well, and where did I have to correct or overrule it?* AI wrote and graded the content well, but it slipped in an unsourced famous quote and a web summary invented a fact. Separate builder and grader roles caught both.
- **Speed:** *How did I ship fast without lowering the bar?* A writer and an engineer worked in parallel, joined by a re-runnable import.

**Evidence:** `eval-report.md`, `eval-content-2026-11-13*.md`, `user-testing/report-2026-11-13.md`, the canvas at https://claude.ai/artifact/XRe4mnoXGdpbgX8xteM3qv, live app https://meander-virid.vercel.app.
