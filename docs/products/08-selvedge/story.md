# Interview story: Selvedge

Written at wrap-up (playbook step 4), from the brief, feedback and retro. STAR, tellable in about 2 minutes.

**Headline:** I planned an app that would generate my moodboard; one look at the board I'd made
by hand showed I wanted to make it myself, so I built an editor instead, and shipped it in three days.

**Themes:** Discovery, Trade-offs, Craft

## In 30 seconds

My fashion saves were scattered across Instagram, Pinterest and screenshots, and a moodboard took
an evening. I built Selvedge: share from any app into one Inspo, then lay out a board. The plan was
an auto-generated collage; when my own hand-made board finally came through, it was clearly
something I wanted to *make*. I pivoted to an editor (crop, cut-outs that run in the browser,
shapes, undo, download), tested it live in seven rounds, and shipped it.

## The story

**Situation.** I like dressing well but don't speak fashion. What I like lives in three apps and
nothing reads it back to me. Building a moodboard by hand in Canva took an evening, so I'd done it
once.

**Task.** Make saving as quick as a screenshot, get every save into one place on both phone and
laptop, and make a board take minutes, with an AI style read to follow.

**Action.** I probed before designing: an hour-long share-target spike showed Instagram and
Pinterest send only a link, so the server fetches the picture (Instagram's embed page; its preview
is a square crop and sometimes its logo). I built capture with an offline queue so nothing is lost.
For the board I explored ten collage directions with real saves; none landed. Then my own
Spring / Summer board arrived: photos edge to edge, cut-outs on top, colour squares, one title pill.
That changed the product from "generate" to "make". I built an editor and chose in-browser
background removal over a paid API: free, private, two models (quick by default, careful for the
hard ones). Then I used it live and sent seven batches of feedback: naming, layout, undo, a menu
that stays on screen, a pipette.

**Result.** Live at selvedge-sandy.vercel.app as an installable app: three taps to save from
Android, one Inspo on both devices, and I rebuilt my own Spring / Summer board in it in one
sitting. The AI style read, the riskiest value bet, is next.

**What I learned.** Look at what the user actually makes before designing what they asked for.
And name things by what they mean: "Today" and "Days" became "Inspo", "Inbox" and "Folders".

## Assumptions: what I believed vs what was true

| I assumed | Turned out | How I found out |
| --- | --- | --- |
| I wanted the app to lay the board out for me | I wanted to make it; the auto-draft got in the way | My own hand-made moodboard, after ten directions missed |
| A shared link carries its picture | Instagram and Pinterest send only a link; Instagram's preview is a crop, sometimes its logo | The share-target probe, then live shares |
| Background removal needs a paid API | A model in the browser is good enough; a second, careful model fixes the hard ones | Side-by-side on my own photos |
| Picking photos before making a board helps | It made me choose before I could see them together | Using it live, then going back for more photos |

## Likely follow-ups

- Why not just use Pinterest or Cosmos? (Neither reads my saves back as a style, and the
  moodboard has to be mine.)
- Why run AI in the browser? (Free, private, no key; the trade-off is a 44 MB download and speed.)
- How will you know the style read works? (An answer key I wrote before building: four of five
  sections "that's me".)
- What would you do differently? (Show the real artefact earlier; agree the nouns first.)

## Theme prompts

One line per theme where this product has a real example; leave the rest empty.

- **Discovery:** *Where did the real problem turn out different from the request?* "Generate my board" was really "let me make it quickly": the owner's own moodboard showed it.
- **Prioritisation:** *What did I decide not to build, and why?* The AI read moved to day 2 so capture and the board could be right first; rotation, loose text and phone editing were cut.
- **Metrics:** *How did I know it worked?* Three taps to save (target two, accepted); the Spring / Summer board rebuilt in one sitting.
- **Failure:** *What did I get wrong, and what did I change because of it?* The critic loop rewrote a design I'd just picked; it was restored from git, and now a pick is a keep.
- **Ambiguity:** *Which decision did I make with incomplete information, and how did I reduce the risk?* Whether Android would hand shares to a web app at all: a one-hour probe before any design.
- **Trade-offs:** *What did I give up to get something else?* A paid cut-out API's quality for a free, private one in the browser, with a slower careful model for the hard photos.
- **Craft:** *Which detail made it feel great to use?* A tick on photos already on the board, a menu that never runs off screen, undo that steps back a whole drag at once.
