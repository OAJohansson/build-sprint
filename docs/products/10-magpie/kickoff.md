# Kickoff pack: Magpie

The owner's kickoff for a product (decision 0026). In Founder mode the owner writes it alone and
the PM session builds from it. Drafted by Claude from the owner's calls in the kickoff
conversation (26 Oct), in the owner's words where possible; the owner can edit any line. Lines
marked **Open** are still the owner's to decide before the PM session starts.

**Mode:** founder
**Appetite:** **Open** (suggested: one day; cuts in order if it runs out: the AI illustration
falls back to the photo, then the country filter falls back to search only)
**Evals:** `evals.md` (agent-checkable part) · owner-only checks kept outside the repo

## Problem

I taste something I love (a plum hot shot in Taiwan, a wine, a cheese) and weeks later I can't
remember its name or where I had it, so I can't order it again or recommend it. The food memories
from a trip fade with everything else: the photo sits somewhere in the camera roll, but the name
and the feeling are gone.

## Who

Me. I travel, I like food and drink, and I have favourite wines and cheeses whose names I keep
forgetting. I take photos of good dishes but never look at them again. "Worth it" = when I want
to remember something I loved, it's on the shelf, and after a trip I can look back at
everything delicious I tried.

## Moment of use and jobs to be done

At the table or the bar, right after the first taste (phone, one hand, often with friends, a
little distracted). Later: in a shop or restaurant when I need a name, and at home after a trip
when I want to look back.

1. **Recall:** When I'm in a shop or restaurant and want something I loved before, I want to find
   its name in seconds, so I can order or buy it again.
2. **Relive:** When I'm back from a trip (or just remembering), I want to see everything
   delicious I tried there, so I can enjoy it again and show friends.
3. **Capture:** When I taste something I love, I want to save it in under 30 seconds with a
   photo, a name, a rating and a note, so it's not lost in the camera roll.

## Today's alternatives

- **The camera roll:** the photo is there, but no name, no place I can search, no feeling.
- **Vivino (wine), Untappd (beer):** good at recall, but only for one drink type each.
- **Beli:** ranks restaurants by comparing them in pairs, but it's about places, not dishes.
- **Notes app:** fast, but a list I never reopen.

Why switch: one collection across all food and drink, lovely enough to browse that I'd open it
for fun, and searchable when I need a name.

## Riskiest assumptions

- **Usability (riskiest):** that I'll actually capture at the table, in under 30 seconds, instead
  of taking a photo and forgetting it. Everything depends on capture happening.
- Value: that a collection that's beautiful to look back on (the illustrations, the shelf) makes
  me want to keep adding to it.
- Feasibility: that an image model turns a phone photo into a simple illustration that's
  recognisable and consistent across items, fast enough not to spoil capture.
- Viability: none, it's for me.

## Success: what good looks like

Outcome: when I want to remember something I loved, it's on the shelf.

- Signal: I capture at least 10 things in the first two weeks (count of items).
- Signal: capture takes under 30 seconds from opening the app to saved (timed).
- Signal: I find a saved item by name or country in under 10 seconds (timed).
- Guardrail: the AI illustration never loses or replaces my original photo.

## MVP and stop line

**In (feature list agreed by the owner, 26 Oct):**
- Capture: take a photo or pick one from the camera roll; name; type (food, drink, dessert);
  place and country, the country suggested from where I am; a small rating; a short note; the
  date saved automatically.
- An AI-made simple illustration of the photo, made in the background, saved as the item's
  picture; the original photo kept too.
- Share into Magpie from the camera roll or Instagram (Selvedge's share target), as a safety net
  for the riskiest assumption: a moment missed at the table isn't lost.
- The shelf as the home screen, phone and laptop: the collection, with filters by country and
  type (relive).
- Search pinned at the top of the shelf: name, place, note (recall).
- Item page: illustration, photo, all details, edit, delete.
- The magpie mascot in the empty shelf and the first-run moment.
- An access code on each device, like Selvedge.

**Key screens (designed before code, in Claude Design):** the shelf (phone and laptop), the
capture flow (photo, details, saved with the illustration appearing), the item page, search and
filter results, the empty shelf and first run, the access code. Canvas:
https://claude.ai/artifact/X4hmxGD5oek8NvT7XbxgjE

**Open:** the rating scale.

**Out (to `backlog.md`):** recipes, a map, sharing with friends, recommendations, a "want to
try" list. The music-moments diary lives in Six AM's backlog.

## Requirements

Filled in once the open calls above are settled.

| # | Must | Check |
| --- | --- | --- |
| R1 | | |

**No-gos:**

**Rabbit holes:**

## Feel references

**Direction picked by the owner (26 Oct): the sticker book**, out of 10 directions and a round 2
of four (canvas: https://claude.ai/artifact/X4hmxGD5oek8NvT7XbxgjE, row "Sticker book: every key
screen" is the design to build).

- **A sticker book from your travels** — every taste becomes a die-cut sticker on a country page;
  chunky dark outlines, warm cream paper, coral, butter yellow and teal.
- **A round cartoon magpie** (the owner's favourite touch) — the greedy little friend who gets
  excited about every shiny new taste: greets you on the shelf, peeks in the camera, draws the
  sticker, cheers on the saved moment ("Ooh, shiny!").
- **Fredoka**, rounded type, friendly copy ("yums", "Stick it in my book").

**The feel in one sentence (draft, owner to confirm):** A cheerful sticker book of everything I've
tasted, kept by a greedy little magpie who gets excited about every shiny new yum.

## Things to avoid

- **Open**

## Decisions already made

- Name and brand: Magpie, with a magpie mascot (owner, 26 Oct). Tastebud was dropped because
  several food apps already use it.
- Reuse Selvedge's setup where it fits: phone capture and image AI (owner, 26 Oct). Selvedge
  uses Supabase, an access code and image models through OpenRouter (decisions 0021, 0022).
- Phone and laptop, one shared library, like Selvedge (owner, 26 Oct).
- Design first, in Claude Design: the owner picks 3 of 10 directions, iterates on them with
  comments on the canvas, picks 1, and every key screen and flow is designed before any code. Then
  the owner hands off and the PM session builds from the finished design (owner, 26 Oct).
- Both jobs in the MVP, on one screen: the shelf is home (relive), search sits on top (recall)
  (owner, 26 Oct).

## Unit tests

**Open** (likely none: no date or streak logic so far).
