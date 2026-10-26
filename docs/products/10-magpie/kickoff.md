# Kickoff pack: Magpie

The owner's kickoff for a product (decision 0026). In Founder mode the owner writes it alone and
the PM session builds from it. Drafted by Claude from the owner's calls in the kickoff
conversation (26 Oct), in the owner's words where possible; the owner can edit any line. Lines
settled by the owner on 26 Oct; nothing is open.

**Mode:** founder
**Appetite:** the whole designed flow, however long it takes (owner, 26 Oct: "I want to make
this a nice app"; overnight runs are fine). Not a day cap. If something must give, cut in this
order: the share target falls back to "pick from photos", the laptop filter panel falls back to
the phone's filter sheet.
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
- The shelf as the home screen, phone and laptop, as **smart shelves** (owner, 26 Oct, option 3
  of three): rows the magpie fills (Latest, Your top wines, Around London, …) plus one Filter
  button opening kind (Food, Drinks, Desserts), sub-kind (Drinks: Wine, Cocktail, Beer, Coffee and
  tea; Food: one "Dishes" bucket to start), how much I loved it, and where (London, Away, a
  restaurant or bar). Kind leads, not country: most yums happen at home in London (relive).
- "Where" is the restaurant, bar or spot plus its city; country is secondary.
- Search pinned at the top of the shelf: name, restaurant, note (recall).
- Item page: illustration, photo, all details, edit, delete.
- The magpie mascot in the empty shelf and the first-run moment.
- An access code on each device, like Selvedge.

**Key screens (designed before code, in Claude Design):** the shelf (phone and laptop), the
capture flow (photo, details, saved with the illustration appearing), the item page, search and
filter results, the empty shelf and first run, the access code. Canvas:
https://claude.ai/artifact/X4hmxGD5oek8NvT7XbxgjE

**Rating:** 1–5 hearts (the design).

**Out (to `backlog.md`):** recipes, a map, sharing with friends, recommendations, a "want to
try" list, recommendations built on the smart shelves. The music-moments diary lives in Six AM's backlog.

## Requirements

The design is the spec: the "Final flow for hand-off" row (A–L) on the canvas,
https://claude.ai/artifact/X4hmxGD5oek8NvT7XbxgjE. Exploration rows above it are history.

| # | Must | Check |
| --- | --- | --- |
| R1 | First run introduces Maggie once; the access code is asked once per device (A, B) | Fresh install shows both; reload skips them |
| R2 | Capture from the camera, from the photo library, or with no photo (D) | Each path reaches the details screen |
| R3 | Details: name, kind, sub-kind, restaurant/bar/spot, city and country suggested from location and editable, 1–5 hearts, optional note; date saved automatically (E) | Every field saved word for word and shown on the item page |
| R4 | Saving never waits for the AI: the item is saved first, the drawing screen can be closed, the sticker appears when ready, the original photo is always kept (F, K) | Close during drawing: item on the shelf with photo, sticker arrives later; photo toggle on the item page |
| R5 | Share a photo from the camera roll or Instagram into Magpie and land in capture with it (Android share target, as Selvedge) | Share from Photos opens E with that photo |
| R6 | The saved moment: Maggie's "Ooh, shiny!" with the new sticker and its chips (G) | Shown after every save |
| R7 | Home is smart shelves: Latest, Your top [sub-kind] (5 hearts), Around [home city]; a row shows only when it has items (H) | Rows match the data; empty rows hidden |
| R8 | Search covers name, restaurant and note (H, J) | "noble" finds Barolo by restaurant; a word from a note finds its item |
| R9 | Filter sheet: kind, sub-kind, hearts, where (home, away, a restaurant); results show active filters as removable chips (I, J) | Each filter narrows correctly; removing a chip widens again |
| R10 | Item page: sticker/photo toggle, details, note, edit, remove with a way back (K) | Edit saves; remove asks or offers undo |
| R11 | One library on phone and laptop; laptop layout with the filter panel always open (L) | Save on the phone, see it on the laptop after reload |
| R12 | Empty shelf with Maggie and the share tip (C) | Fresh library shows C, not empty rows |

**No-gos:** accounts or sign-up, a social feed or public sharing, recommendations (backlog),
a map, nutrition or calories.

**Rabbit holes:** perfect sticker consistency (spike it first and set a bar, don't chase it);
a places API for restaurants (free text plus reverse geocoding for the city is enough); offline
sync.

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

**The feel in one sentence (owner: "follow the design, it's great"):** A cheerful sticker book of
everything I've tasted, kept by Maggie, a greedy little magpie who gets excited about every shiny
new yum. The final-flow screens are the visual references; the critic scores against them.

## Things to avoid

Proposed by Claude from the design and past products; the owner asked for suggestions and said
go (26 Oct).

- Streaks, points, badges, "you haven't logged in a while" guilt
- Motion on every tap: one celebration (the saved moment), nothing per keystroke (design rule)
- Maggie talking too much: at most one short line per screen, never blocking a task
- Glossy or photoreal AI images: stickers stay flat, thick-outlined and in one style
- Capture waiting on the AI, or the original photo ever lost
- Country as the main way in: kind leads, place means the restaurant
- Gradients, glass effects, stock food photos
- Restaurant-review language (stars for the venue, "best in town"): it's my taste, not a review

## Decisions already made

- Mascot name: **Maggie** (owner, 26 Oct).
- Home city for "Around [city]": the city with the most yums, no setting (Claude's default;
  provisional, the PM may revisit).

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

- "New this month" count for Maggie's line: start of month, last day of month, month with no
  yums, a yum saved at 23:59 on the last day.
- Latest order and date saved: two yums the same day, a yum edited later keeps its date.
- Home city: a tie between two cities, empty history.
