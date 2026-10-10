# Brief

A one-page PRD, written before any code (playbook step 1). Short answers; the success check is filled in at wrap-up.

*Drafted by Claude from the owner's idea and answers, decisions by the owner, 8 Oct.*

## Problem

I want to become a better writer, but the formats I've tried feel too big to start. A movie or
book review feels like a project, so I don't keep it up. Journalling worked for a while, until my
perfectionism took over: every entry had to bring insight, so I froze. What does work is chatting
on WhatsApp with two friends who care about good communication: a few sentences, the topic comes
to me, someone reads it, and it feels like play. But that isn't practice with feedback, and it
doesn't grow into longer work.

## Who

Me: someone who has always been drawn to storytelling, humour and self-expression, and long
believed writing talent is something you're born with. Now treats it as a muscle. Journals,
writes on the phone, perfectionist, has 10 spare minutes here and there. Wants to grow seriously,
from a few sentences towards longer pieces. Full persona in [User testing](#03-scribble.testing).

## Moment of use and jobs to be done

**Main moment:** a spare moment on the bus, in bed or on a coffee break, on the phone (desktop
should work too). About 10 minutes, no plan for what to write.

1. "When I have a spare 10 minutes, I want something small to write about straight away, so I can
   start without deciding what to write or how good it has to be."
2. "When I've written something, I want constructive feedback on my craft, so I can see what
   worked and one thing to try next time."
3. "When I've written for a few weeks, I want to see my output and growth, and find the topics I
   care about, so I can believe the muscle is growing and take on longer pieces."

## Today's alternatives

| Alternative | Good | Annoying |
| --- | --- | --- |
| WhatsApp with friends | Topic comes to me, small, a reader who replies, feels like play | Not practice: no feedback on craft, doesn't grow into longer work |
| Journalling | Mine, private, I loved it | Blank page, and perfectionism: each entry had to be insightful |
| Reviews (Letterboxd, Goodreads, a blog) | A real form with readers | Feels like a big piece of work, so I don't start |
| ChatGPT "give me feedback on this" | Instant, free | Blank page first; long, generic feedback that rewrites my piece; no memory of my progress |
| Writing prompt sites, courses | Ideas; real teachers | Prompts without feedback; courses cost time and money and have a schedule |

**Why would I switch?** Nothing gives all four at once: a topic handed to me, permission to write
something small, a reader with constructive feedback, and a record of how I'm growing.

## Riskiest assumptions

| Risk | Assumption | How risky |
| --- | --- | --- |
| Value | Feedback helps me grow *without* adding perfectionism friction. Serious feedback is exactly what could turn writing into a performance again. | **Riskiest** |
| Value | A prompt and a reader in an app pull me back like a friend in WhatsApp does. | High |
| Feasibility | AI feedback can be specific, kind and useful (not generic praise, not a rewrite). An eval can check this. | Medium |
| Usability | Writing a few sentences on a phone is comfortable in 10 minutes. | Low |
| Viability | Small API cost per piece; key on the server; no accounts. My writing is precious, so it must not be lost easily (localStorage on one device is a risk). | Medium |

So the MVP must test **whether feedback helps me grow without making it harder to start**.

## Success: what good looks like

**Main outcome:** I write often, in small pieces, and each piece teaches me something, so writing
becomes a habit rather than a project.

| Signal | How I'll measure it | Target |
| --- | --- | --- |
| Output (main) | My own use: pieces finished | 4 or more in the first week |
| Easy to start | User test: open the app → first word typed | ≤ 60 s, no decisions needed |
| Small is allowed | User test: finish a piece in one sitting | ≤ 10 min |
| Feedback helps | User test and my own read: after feedback, can name one thing to try next time | Yes, every piece |
| Guardrail: kind and specific feedback | Today: I check the feedback on my first pieces against the checklist (quotes my words, one concrete suggestion, doesn't rewrite the piece, not discouraging). After the MVP: an eval on ~8 sample pieces | All pass |
| Guardrail: perfectionism | Started pieces that get abandoned | Fewer than 1 in 4 |

## MVP and stop line

**Ships today:** open the app → a prompt is waiting → write a few sentences → "Done" saves it →
ask for feedback if I want it → one strength and one thing to try → a weekly goal of dots fills up.
Everything is saved in a database and can be exported.

**Decided (owner, 8 Oct):**
- **Feedback on request**, not automatic. "Done" alone finishes a piece. This tests the riskiest
  assumption: do I ask for feedback, and does it make starting harder?
- **One strength and one thing to try**, quoting my own words. Short, actionable, not a grade.
- **A weekly goal as dots** (like CrossFit Log), not a daily streak: a missed day breaks nothing.
- **Claude Sonnet 5.5 on my API key for the MVP** (about $1 a month or less at my volume). The
  eval that compares Haiku, Sonnet and Opus moves to after the MVP, for speed (owner, 8 Oct).
- **A database, not localStorage:** I'll use this daily and can't lose pieces
  ([decision 0009](https://github.com/OAJohansson/build-sprint/blob/main/docs/decisions/0009-scribble-supabase-and-ai-feedback.md)).

**Design (owner, 8 Oct, after four prototype rounds):** the feeling of a typewriter without a
typewriter: the line holds still and the page rises, struck typewriter type, black and red ink,
manuscript habits (typed header, `###` end mark), soft key clicks. *Manuscript* (light) or
*Night* (dark), following the phone's setting; Night by default.

**Stop line:** anything not listed above goes to [backlog](#03-scribble.backlog): the feedback
character, choosing my own topics, longer forms, the weekly editor's letter, the model eval.

## Requirements

| # | Must | Check |
| --- | --- | --- |
| 1 | Opening the app shows a prompt with the writing area ready; no choices needed first | Open → first word typed in ≤ 60 s |
| 2 | I can swap the prompt for another one in one tap, or ignore it and write freely | Tap "another" → new prompt, text kept |
| 3 | The draft saves as I type; closing the app and reopening brings it back | Type, reload → text is there |
| 4 | "Done" saves the piece to the database, however short (no minimum) | One sentence → Done → it's in my pieces on another device |
| 5 | "Get feedback" on a piece returns one strength and one thing to try, quoting my words, and is saved with the piece | Feedback passes the checklist; reopen the piece → feedback is there |
| 6 | If feedback fails, the piece is still saved; retrying shows that it's working | Turn off the key → piece saved, friendly error, retry |
| 7 | A weekly goal (default 4) shows as dots that fill as pieces are finished | Finish a piece → a dot fills |
| 8 | All my pieces, newest first, with prompt and date; open one to reread it and its feedback | List matches what I wrote |
| 9 | "Export all" downloads every piece and its feedback | File opens and contains every piece |
| 10 | Only I can read or write (access code); works on phone and desktop | Without the code → no data, no AI calls |

**No-gos:** accounts or other users, sharing with friends, the feedback character, choosing or
discovering my own topics, longer forms, a daily streak, a rich-text editor, offline mode.

**Rabbit holes:**
- Perfecting the feedback prompt: timebox it to 30 minutes; the later eval is where it gets tuned.
- Writing a big prompt library: ~40 short, hand-written prompts (observation, memory, humour) is
  enough for weeks, and costs nothing.
- Making the editor fancy: a plain, beautiful text area is the product.

## Success check (at wrap-up)
