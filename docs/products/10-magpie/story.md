# Interview story: Magpie

Written at wrap-up (playbook step 4), from the brief, feedback and retro. STAR, tellable in about 2 minutes.

**Headline:** I designed a whole app with AI before writing a line of code, gave it a mascot with a job, and an AI squad built it overnight to that design.

**Themes:** Discovery, Craft, Working with AI, Technical, Ambiguity

## In 30 seconds

I kept forgetting the food and drink I loved: a plum hot shot in Taipei, a wine, a cheese. I
turned it into Magpie, a sticker book kept by Maggie the magpie: snap it at the table, and AI
turns the photo into a sticker. I agreed the features, explored ten design directions, picked one
and designed every screen in Claude Design, then handed it to an AI build team that worked
overnight. It passed all 12 requirements, the critic scored it 9/10, and I'm now building a
friends feed so I can share yums with my cousin in Japan.

## The story

**Situation.** Weeks after tasting something great I couldn't remember its name or where I'd had
it, so I couldn't order it again. Photos sat in the camera roll with no name, place or opinion.

**Task.** Make capture take under 30 seconds at the table, make a name findable in under 10, and
make the collection lovely enough to browse after a trip, without ever losing the original photo.

**Action.** I separated the problem from my first idea into two jobs, recall and relive. I chose
a name that could carry a character (Magpie, a bird that collects what it loves) after checking
the obvious one, Tastebud, was taken by several food apps. Design came before code: features
first, ten directions, a second round showing only where the mascot appears, then every key
screen. When I realised I'd mostly use it at home in London, I re-cut the shelf around kind
(wine, cocktails) and the restaurant instead of the country. I handed the canvas to a Founder-mode
PM with graders: a sticker eval, a design critic and a simulated user.

**Result.** All 12 requirements passed; capture took about 21 seconds and finding a wine about 6
in the user test; stickers were recognisable and on-style 12 of 12, at about $0.04 and 14 s each;
the critic went from 7 to 9 over three rounds. My own review caught a crash that only happened on
Vercel, fixed within the hour.

**What I learned.** Designing the peak moment and the mascot's job told me more than designing
every screen; and when an AI model won't follow a rule, move that rule into code.

## Assumptions: what I believed vs what was true

| I assumed | Turned out | How I found out |
| --- | --- | --- |
| Country would be the main way to browse | Kind and restaurant matter more; I'm in London most of the year | Looking at the designed shelf and picturing a normal week |
| A better prompt would make every sticker consistent | The model skipped the outer outline on a third of stickers whatever the prompt said | Sticker eval v2; fixed by drawing the edge in code (v3) |
| Graders passing meant the app worked | The deployed preview crashed on a native module | Opening the preview myself at the final review |
| The design would need many rounds of comments | A second round showing only the mascot's moments was enough to decide | Picking the sticker book after round 2 |

## Likely follow-ups

- Why design everything before building? (On Wont and Six AM, late design rebuilds cost hours;
  here the build matched the design and the critic ended at 9.)
- How did you judge the AI's stickers? (A fixed eval of 12 photos with bars for recognisable,
  consistent, time and cost, run by a grader that didn't build it.)
- What would you do differently? (Check the deployed preview before calling it ready.)
- What's next? (A friends feed, a Letterboxd for food, starting with my cousin in Japan.)

## Theme prompts

- **Discovery:** *Where did the real problem turn out different from the request?* My first idea was recipes; the real problem was forgetting what I loved, and later that home, not travel, is where most yums happen.
- **Prioritisation:** *What did I decide not to build, and why?* Recipes, a map, recommendations and sharing waited; capture and recall came first.
- **Metrics:** *How did I know it worked? Which number moved?* Capture about 21 s against a 30 s bar, find about 6 s against 10, stickers 12 of 12, critic 7 → 9.
- **Failure:** *What did I get wrong, and what did I change because of it?* Nobody opened the deployed preview before my review; it crashed. Now the PM checks the preview first.
- **Ambiguity:** *Which decision did I make with incomplete information, and how did I reduce the risk?* Whether AI stickers would be good enough: a spike and a 12-photo eval before building on it.
- **Trade-offs:** *What did I give up to get something else?* Option 2's "by place" view for option 3's smart shelves, which give an overview and room for recommendations.
- **Craft:** *Which detail made it feel great to use?* Maggie: she greets you, peeks in the camera, draws the sticker and cheers "Ooh, shiny!".
- **Technical:** *What technical problem did I solve, and how would I explain it simply?* Saving never waits for the AI: the yum saves in 2 s and the sticker is drawn after the response.
- **Working with AI:** *What did AI do well, and where did I have to correct or overrule it?* It designed, built and graded overnight; I overruled the coach's organisation pick and caught the deploy crash.
- **Speed:** *How did I ship fast without lowering the bar?* Design up front, then graders with fixed bars running overnight.

**Evidence:** [eval report](eval-report.md), design canvas https://claude.ai/artifact/X4hmxGD5oek8NvT7XbxgjE, PRs #88 and #89.
