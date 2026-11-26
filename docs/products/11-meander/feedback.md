# Review feedback

Status: `open` · `fixing` · `fixed` · `parked` · `won't do`

| # | Type | Feedback | Status |
| --- | --- | --- | --- |
| 1 | Critic, built app | Resting underline on the first neighbour ("German Idealism" desktop, "Romanticism" phone) makes one school look pre-selected; show only on hover or keyboard focus | fixed |
| 2 | Critic, built app | Absurdism and Phenomenology dots and threads tangle on the main screen (also in the approved design) | fixed |
| 3 | Critic, built app | "Classical Greek" label hangs outside the globe near the screen edge; flip it inside | fixed |
| 4 | Critic, built app | "N" badge bottom-left covers text on the phone (Next.js dev indicator; confirm it's absent in production) | open |
| 5 | Critic, built app | Faint banding in the dark background near the top; check on a real screen | fixed |
| 6 | Critic, built app | Numerals in "4 schools on 4 days" render thinner than the words | fixed |
| 7 | User test F1 (major) | Overview has no era cue; shape appears only after a click | open: hover lights a school's threads now; era cues to the gate |
| 8 | User test F2 (major) | Link reasons, description, reacted-against text never shown | fixed |
| 9 | User test F3 | "pushed back" vs "pushed against" ambiguous | fixed |
| 10 | User test F4 | Busy schools light 6–8 neighbours | parked, gate question |
| 11 | User test F5 | "Your thread" suggests nothing next | parked, gate question (tests the hop bet) |
| 12 | User test F6 | Esc steps back one level, R6 says overview | won't do: stepwise Esc kept, R6 reworded (T20) |
| 13 | User test F7 | Thinker in two schools: no "Also in" link | fixed |
| 14 | User test F8 | Phone targets under 44 px | fixed |
| 15 | User test, R2 | Feminist Philosophy: 2 themes without thinkers; one Utilitarianism theme is 1 sentence | fixed |
| 16 | Owner, own use (25 Nov) | Picking a school gets busy: every unrelated school stays labelled. Show only the school and its direct neighbours, hide the rest | fixed (L23), on branch |
| 17 | Owner, own use | You can study a thinker but not a whole school; is a "study this school" prompt worth having? | open |
| 18 | Owner, own use | The school card isn't easy to read; headings look smaller than the body. Confirmed: section headings are 13.5 px grey, body 14.5–15.5 px, so the card has no clear hierarchy | open |
| 19 | Owner, own use | No way to see where information comes from; every item needs a visible source from trusted references (the sources exist in the data, the UI doesn't show them) | open |
| 20 | Owner, own use | The card is too sparse (one sentence per theme, about 5 minutes to read all). Aim for closer to a Wikipedia article on the school, still easy to navigate, from several reliable sources, all referenced | open |
| 21 | Owner, own use | First open: "what am I supposed to do with this?" Some light guidance, keeping it simple | open |
| 22 | Owner, own use | "Your thread" records every click, so it's unclear what value it adds; rethink it | parked (backlog, owner's call) |
| 23 | Owner, own use | "Built on", "pushed against" and "grew from it" are unclear: does "built on" over Marxism mean Marxism built on Critical Theory? | fixed (T26), on branch |
| 24 | Owner, pilot review (26 Nov) | The Existentialism pilot gives a good overview. It's missing the part they care about most: how to apply the ideas to your own life, School of Life style, grounded in real sources rather than invented advice | open, sourcing question to the owner |
| 25 | Owner, pilot review | Footnote numbers piling up at the end of paragraphs look messy. Keep every reference, but show them lightly (for example, one small mark that reveals the sources on hover or tap) | open, goes into the card design |
| 26 | Owner, pilot review (26 Nov) | The text assumes prior reading: terms like "the view from nowhere" are name-dropped without explanation. Write for someone new to philosophy: explain every term at its first use | fixing (T27) |
| 27 | Owner, pilot review | Some sentences list several things and feel dense; use bullet lists for those, and make the whole draft lighter to read | fixing (T27) |
| 28 | Owner idea (26 Nov) | Inside a school, show its key ideas visually as well, so you get a sense of how big it is and what themes and questions it holds. A mind map or a dashboard? Are six themes too few? | open, discussing; folds into the card design. Owner (26 Nov): all three kinds of size matter: how much there is to learn (ideas, questions, time), how far it reaches (when and where it sits), and how much room is inside it (thinkers, how far apart). The product's job is a learning framework: a skeleton of a subject before the details, to hang new learning on. Asked for research on the learning theory, then an MVP cut. Decided L26: skeleton only first |
