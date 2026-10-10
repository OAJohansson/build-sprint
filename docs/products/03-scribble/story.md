# Interview story: Scribble

*Draft by Claude from the brief, feedback log, test report and retro; edit it into your own words.*

**Headline:** I wanted to write more but kept freezing, so I built a writing practice designed around
my own riskiest assumption, perfectionism, and an AI reader that teaches one craft lesson per piece.

**Themes:** Discovery · Failure · Working with AI · Metrics · Trade-offs · Craft

## In 30 seconds

I love writing but stalled twice: reviews felt too big to start, and journalling turned into
perfectionism. The one format that stuck was WhatsApp with two friends: a topic comes to you, it's
small, and someone replies. I built Scribble around that: a prompt waiting when you open it, a few
sentences, and on request a reader (Claude) that quotes your words, gives one thing to try and
explains the craft behind it. The next day, that lesson comes back as one quiet line. I tested it
with a simulated user and on my own phone, fixed two major findings, and I'm writing in it daily.

## The story

**Situation.** I wanted to grow as a writer, but every format I tried either felt like a project
(reviews) or turned into performance (journalling). ChatGPT can give feedback, but it starts from a
blank page and rewrites your work.

**Task.** Ship in a day or two something that makes starting effortless and gives feedback that
teaches, without feeding the perfectionism. Success decided up front: first word in under 60
seconds, a piece in under 10 minutes, feedback that quotes me, gives one suggestion and never
rewrites, and, longer term, 4 pieces a week.

**Action.**
- **Discovery first:** I worked out *why* WhatsApp worked (topic given, small, a reader, play) and
  named perfectionism as the riskiest assumption. That made feedback opt-in, one lesson per piece,
  and the weekly goal forgiving.
- **Design through four prototype rounds:** three drew a literal typewriter and looked childish. The
  fix was the feeling without the object: typewriter type, black and red ink, the line holding still
  while the page rises, a `###` end mark. Manuscript by day, Night by night.
- **Never lose a piece:** a real database with two-layer autosave, tested by wiping the device copy
  and closing mid-sentence.
- **The learning loop:** structured output from Claude (strength, try next, the craft, a short
  lesson), the last lesson fed forward into the next page and back to the reader.
- **Testing in order:** an accessibility audit, a worst-case data pass, then a simulated user.

**Result.** Live at scribble-notebook.vercel.app and used daily. First word in about 20 seconds
the first time, 6–8 after (target 60). The first real reply passed every feedback check and taught
me something concrete ("keep the detail in rather than summarising"). The test found two majors,
both fixed the same day: the reader was unreachable once you left the finished screen, and the red
ink measured 2.9:1 at night (now about 4.9:1).

**What I learned.** The riskiest assumption can be emotional rather than technical, and then the
design has to serve it. And "make it feel like X" is usually best answered by evoking X, not
drawing it.

## Assumptions: what I believed vs what was true

| I assumed | Turned out | How I found out |
| --- | --- | --- |
| A tip before writing would help me learn | It would add a step and raise the bar; carrying the last lesson forward does the same job quietly | Critique against the riskiest assumption before building |
| "Typewriter feel" means showing a typewriter | Drawing the machine looked childish; type, ink and rhythm carried the feel | Three prototype rounds and my own reaction |
| Feedback would be the hard part to get right | The first real reply was strong; findability (reader only on the finished screen) and contrast were the real problems | Simulated user test with measured contrast |
| Light vs dark needed a decision | Both serve different moments; following the phone's setting made it a non-decision | Pros and cons against moments of use |

## Likely follow-ups

- *How do you know it actually makes you a better writer?* Not yet proven: output per week and the
  lessons list are the leading signals; a real eval of feedback quality is next.
- *Why not just use ChatGPT?* Blank page first, long generic feedback, rewrites your work, no memory
  of your progress.
- *What would you do with more time?* The model eval, a craft curriculum, a native Mac app.

## Theme prompts

- **Discovery:** *Where did the real problem turn out different from the request?* The request was "a writing app"; the problem was starting friction and perfectionism, and the clue was why WhatsApp worked.
- **Prioritisation:** *What did I decide not to build, and why?* No pop-up tips, no daily streak, no character yet, no accounts: each either added friction or wasn't needed to test the bet.
- **Metrics:** *How did I know it worked? Which number moved?* Time to first word (~20 s vs a 60 s target), contrast 2.9 → 4.9:1, the feedback checklist; weekly output still to come.
- **Failure:** *What did I get wrong, and what did I change because of it?* Four design rounds drawing a typewriter; the playbook now asks for references and "evoked, not literal" up front.
- **Ambiguity:** *Which decision did I make with incomplete information, and how did I reduce the risk?* Which AI model: started on Sonnet, checked the first real replies, and kept an eval in the backlog.
- **Trade-offs:** *What did I give up to get something else?* A shared database for both apps (free, simple) against a bigger blast radius, written down with when to split.
- **Craft:** *Which detail made it feel great to use?* The reply types itself out in red ink; the next page says "last time: end on an image, not a feeling".
- **Technical:** *What technical problem did I solve, and how would I explain it simply?* Never losing a piece: save on the device instantly, to the database after a pause, and immediately when the app closes.
- **Working with AI:** *What did AI do well, and where did I have to correct or overrule it?* Claude built and tested fast, but kept drawing literal typewriters and carried a design rule into the build without asking; I overruled both.
- **Speed:** *How did I ship fast without lowering the bar?* Deploy early, test in a fixed order, fix data-risk and broken-looking issues straight away, park the rest.

**Evidence:** [brief](#03-scribble.brief) · [feedback](#03-scribble.feedback) · [test report](#03-scribble.testing) · [retro](#03-scribble.learnings)
