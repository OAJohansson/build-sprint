# Interview story: CrossFit Log

*Draft by Claude from the journal, feedback log and retro; edit it into your own words.*

**Headline:** I built a workout logger, realised it solved the wrong problem, and rebuilt it around
the moment that actually mattered: knowing my numbers mid-class in five seconds.

**Themes:** Discovery · Failure · Metrics · Working with AI

## In 30 seconds

At CrossFit the coach says "load 70% of your one-rep max", and I never remembered mine because I
never logged. My first version made logging easy (talk for 20 seconds, AI structures it), but it
still felt like homework. Stepping back to the moment of use showed the real job was *recall*, not
logging, so I rebuilt it as a PB board that answers "what's 70%?" in seconds. A simulated user test
then caught four bugs that showed wrong numbers, which I fixed before calling it done.

## The story

**Situation.** Years of CrossFit, no consistent record. Logging after class was too much friction,
so when the coach called a percentage, I guessed.

**Task.** Ship a working app in a day that removes the friction, and know whether it helped:
"Coach says 70% of your snatch, and I know what to load in 5 seconds."

**Action.**
- **v1 (logging first):** browser dictation, Claude turning a spoken note into structured lifts,
  one tap to save. It worked, but I called it "quite poor": it stored data and gave nothing back.
- **Discovery reset:** a one-hour needs brainstorm ranked the jobs. Recalling a PB in seconds came
  first; logging came fourth. That reordered everything.
- **Three designs, then a mix:** a numbers-first PB board, a journal with an AI summary, and a
  single ask-or-log box. I chose the board plus the journal's review and PB celebration.
- **Protected the AI cost** of a public app with an access code and a spend cap.
- **Tested before trusting my own review:** a simulated user (Sam, a CrossFitter) ran seven
  scenarios against the real app.

**Result.**
- v1 and the rebuilt v2 both went live on day 1; fixes and the progress view followed on day 2.
  12 pull requests, 21 feedback items, 17 fixed.
- The test found four wrong-number bugs I had missed: working sets saved as rep-max PBs,
  percentages silently switching base, "510" saved as 8:30, and sessions counted instead of days.
  All fixed.
- "See I'm progressing" scored 2 out of 5, so I added a progress view: a weekly goal and trend
  charts per lift.

**What I learned.** Frame the moment of use before building. An app that only stores data feels
like homework; give something back. And a simulated user catches the wrong numbers your own
review skims past.

## Assumptions: what I believed vs what was true

| I assumed | Turned out | How I found out |
| --- | --- | --- |
| Logging was the problem | Recall was; logging was a means | The needs brainstorm after v1 |
| My review would catch the bugs | It missed four wrong-number bugs | Simulated user test |
| Setup would be quick | Half a day lost to a wrong key type and Android dictation | Testing on a real phone |

## Likely follow-ups

- **"Why didn't you frame it first?"** I did, but around the feature I imagined. Now every product
  starts with the moment of use and the top three jobs, before code.
- **"How did you use AI?"** Claude parses the spoken note into lifts and helped me build. I kept the
  product calls: what to cut, what "done" means, and which bugs block shipping.
- **"What would you do next?"** Show the note while checking the AI's numbers, and test with
  people at my box.

## Theme prompts

Smaller examples beyond the main story; empty where this product has no real one.

- **Discovery:** v1 made logging easy, but the real job was recalling a PB mid-class.
- **Prioritisation:** parked accounts, estimated 1RM and per-set logging; the access code doubles as the login.
- **Metrics:** "see I'm progressing" scored 2/5 in the user test, so the progress view went in next.
- **Failure:** built v1 before framing the moment of use; four wrong-number bugs got past my review.
- **Ambiguity:**
- **Trade-offs:** a real API key on Vercel (cost risk, protected by an access code and spend cap) instead of hosting inside Claude, to learn the real deploy path.
- **Craft:** the "This week" card: three dots said more than dots plus a sentence (clean and minimal).
- **Technical:** Android Chrome re-sends earlier speech results, so dictation repeated; fixed by rebuilding the text and listening phrase by phrase.
- **Working with AI:** Claude turns a spoken note into lifts; the review screen lets me catch its mistakes before saving.
- **Speed:** live on day 1, but "one day" became two; that led to the stop line at kick-off.

**Evidence:** [live app](https://crossfit-log.vercel.app) · [journey](#01-crossfit.journey) ·
[user test](#01-crossfit.testing) · [retro](#01-crossfit.learnings)
