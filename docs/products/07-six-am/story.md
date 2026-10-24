# Interview story: Six AM

Written at wrap-up (playbook step 4), from the brief, feedback and retro. STAR, tellable in about 2 minutes.

**Headline:** I threw away my own design when the first user didn't understand it, and shipped a
music app a beginner can make house tracks with in two days.

**Themes:** Discovery, Failure, Working with AI

## In 30 seconds

I love house music but music software looks like a cockpit. In two days I built Six AM: drag
loops from a record-crate onto a timeline, everything always in key and in time, saved to the
cloud. My first design, a jam grid, made no sense to the first user, so I switched to the
timeline they already knew from GarageBand. Then I made the sound in the browser instead of
curating samples, so the riskiest question, "does this feel like making music?", could be
answered on day one.

## The story

**Situation.** Day 7 of a 20-products-in-20-days sprint. I wanted to make house and techno but
had never produced; Ableton and FL Studio overwhelm a beginner, and GarageBand isn't built for
dance music.

**Task.** Find the smallest product that gets a beginner from nothing to a track they'd play to
a friend, in one sitting, and test the riskiest assumption: that arranging ready-made loops
feels like making music, not playing someone else's.

**Action.** I wrote the brief first, problem, jobs and risks, and even pivoted from a first idea
when the theme felt repetitive. My first design, a live jam grid, failed with the user before
any code: they expected a timeline. So I listed the features from the apps they knew
(GarageBand's layout, rekordbox's look), built a contact sheet of ten directions to choose from
pictures, prototyped three, and ran an AI design critic on screenshots; the user overruled one
critic note and kept the rest. For sound I chose browser synthesis over sample libraries: 48
loops as recipes in one key and tempo, scheduled on the audio clock so timing never drifts.
Then autosave to Supabase so tracks open on any device.

**Result.** A working studio in two days: timeline, crate with a spinning turntable, mute,
filter, undo, drag-to-bin, 48 loops, and saving. The user's verdict: "sounds great." What isn't
proven: a beginner other than the user hasn't tried it yet.

**What I learned.** Use the user's mental model, not mine (Jakob's law), and get to the real
experience, here sound, as early as possible; that's where the riskiest assumption lives.

## Assumptions: what I believed vs what was true

| I assumed | Turned out | How I found out |
| --- | --- | --- |
| A jam grid of lanes is the simplest way in | The user expected a timeline; lanes made no sense | First design review, before code |
| The owner would pick from ten one-line directions | Too abstract; they wanted to blend them all | Their reply; a contact sheet of pictures fixed it |
| A real sample library is needed to sound good | Synthesis sounds "great" for house, and is always in key | The owner's first listen |
| The owner's taste (solid colour blocks) was settled | They chose the critic's darker version once side by side | Comparing both in the prototype picker |

## Likely follow-ups

- *Why not real samples?* Curation, licences and tempo matching would have taken the day; the
  riskiest assumption needed sound first. Samples are next in the backlog.
- *How do you keep timing tight in a browser?* Book notes slightly ahead on the audio clock; the
  screen only reads where the music is.
- *What would you test next?* A beginner who isn't me, with the plan's scenarios: time to first
  sound and to a 2-minute track.

## Theme prompts

- **Discovery:** *Where did the real problem turn out different from the request?* The request was "GarageBand for EDM with samples"; the real problem was a cockpit-free path to a first track.
- **Prioritisation:** *What did I decide not to build, and why?* Live jamming, humming, sample library, song analysis: all to the backlog to protect the core loop.
- **Metrics:** *How did I know it worked?* Weakest theme here: no user test yet, only the owner's verdict.
- **Failure:** *What did I get wrong, and what did I change because of it?* The jam-grid design; switched to the timeline.
- **Ambiguity:** *Which decision did I make with incomplete information, and how did I reduce the risk?* Synthesis over samples, without knowing if it would sound good; decision record and a quick ear test.
- **Trade-offs:** *What did I give up to get something else?* Supabase for any-device saving, at the cost of a shared database and an access code.
- **Craft:** *Which detail made it feel great to use?* The turntable that spins the previewed loop, and the bin that appears exactly when you hold a loop.
- **Technical:** *What technical problem did I solve, and how would I explain it simply?* Tight timing in a browser: a lookahead scheduler on the audio clock.
- **Working with AI:** *What did AI do well, and where did I have to correct or overrule it?* A design critic on screenshots raised real gaps; the owner overruled it on the turntable.
- **Speed:** *How did I ship fast without lowering the bar?* Synthesised sound, copied save pattern from earlier products; the checks were skipped to ship, and logged.

**Evidence:** journal, feedback 1–9, decisions 0019–0020, design contact sheets in `design/`.

---

# Interview story: Six AM Ears and Mentor (Founder mode)

**Headline:** I let an AI squad build my music analyser and mentor overnight from a written brief;
the code and the evals held up, and the one thing they got wrong was design, which taught me where
a human still has to look early.

**Themes:** Working with AI, Evals, Failure, Prioritisation

## In 30 seconds

I wanted Six AM to tell me what a SoundCloud track is and help me learn the genres. I wrote the
brief and the success checks, and ran an AI "squad" (a PM plus specialist agents that build,
test and critique) mostly unattended. In two days it shipped track analysis from streamed audio,
my own genre tags with filters, and a mentor chat with memory, all graded by agents that never
graded their own work. The code passed; my first look at the mentor didn't: "too much going on".
One review rebuilt it into a single chat, and I changed the process so I see pictures first next
time.

## The story

**Situation.** Day 7's product, a loop studio, worked, but I couldn't name the genres of the tracks
I loved, and SoundCloud tags are unreliable. Analysis tools need downloadable files; my music is
streamed edits.

**Task.** Analyse streamed tracks without storing audio, get genre and BPM right on 10 reference
tracks, and add a mentor that explains, suggests and learns my taste, while trying the new Founder
mode: I write the kickoff and evals, the squad builds and reports.

**Action.** Spikes first: tab capture of the SoundCloud player (passed), then the genre model in a
browser worker. My own test runs showed the first 60 s is the DJ intro, so the squad switched to
four snippets across the track and added a queue. For the mentor I banned built-in taste data so it
would work for anyone, required sources on every answer and no claims of having heard the music,
and graded it on honesty, links, cost and memory. When the genre eval stalled at 7/10, I stopped
the prompt loop rather than fit the test.

**Result.** Three PRs live. BPM matched every public reference; genre 7/10; the mentor's every job
scored ≥ 4/5 for a simulated user, answers in ~5 s for about a cent. Design never passed its bar
(6/10), and my late review rejected the first mentor, which cost a rebuild.

**Learned.** AI squads are strong on correctness and honesty checks and weak on taste and scope;
the fix is an early two-minute look at screenshots, a remove-first rule, and visual references.

## Assumptions: right and wrong

| Assumption | Turned out |
| --- | --- |
| Tab capture can hear a cross-origin player | Right, first try |
| A genre model can name my sub-genres | Partly: BPM and the hard styles yes, house sub-genres mostly "House" |
| A written feel sentence is enough for design | Wrong: the squad built every requirement as a button |
| One final review is enough in Founder mode | Wrong for design; fine for logic |

## Likely follow-ups

- *How did you stop the agents gaming their own evals?* Builders never grade; graders get the artefact and the checks; rubrics fixed before runs; I stopped iterating on E1 when changes started fitting the test.
- *What would you do differently?* Look at three screenshots after the first prototype round, and cut slices smaller.
- *What did it cost?* About $6–7 of Claude usage, mostly testing the mentor.
