# Brief

A one-page PRD, written before any code (playbook step 1). Short answers; the success check is filled in at wrap-up.

*Drafted by Claude from the owner's idea and answers, decisions by the owner, 15 Oct.*

## Problem

I read paper books, and my reading history (years of it) sits in Goodreads. Goodreads feels
clunky and old. Its reviews are walls of text, so I can't scan what anyone thought of a book. Its
recommendations miss my taste. Logging is a chore, so my record goes stale, and picking the next
book is guesswork.

## Who

Me: a non-native English speaker who reads paper books, mostly in bed in the evening, with a long
Goodreads history I'd rather not abandon. Full version in [User testing](#06-folio.testing).

## Moment of use and jobs to be done

**MVP moments:** just after finishing a book (log it and say what I thought), and between books
(choose what's next).
**Most frequent moment, served in v2 (owner, 15 Oct):** in bed, mid-chapter, with the book in
one hand: a word I half-know, or an idea worth keeping. The MVP deliberately starts *after*
reading so the owner can practise building and evaluating a recommender first; the
while-reading features lead the [backlog](#06-folio.backlog).

1. "When I'm between books, I want suggestions that fit my taste, each with a reason, so I pick
   the next one with confidence instead of scrolling."
2. "When I finish a book, I want to rate it and say what I thought in one line, so I remember it
   and my taste record grows without effort."
3. "When I hear about a book I might like, I want to save it in a couple of taps, so it's there
   when I'm choosing."
4. "When I look back, I want to scan my shelf and one-liners at a glance, so I can see my reading
   and remember what each book meant."

## Today's alternatives

| Alternative | Good | Annoying |
| --- | --- | --- |
| Goodreads | Huge catalogue, my whole history, friends | Clunky, dated UI; long reviews you can't scan; recommendations miss |
| StoryGraph | Mood and pace tags, stats, imports Goodreads | Busy screens; recommendations still miss for me |
| Literal, Fable, Bookly | Modern UI | Social or club-first, or about reading time; no clear edge for me |
| Asking Claude or ChatGPT | Good taste talk, explains itself | Forgets my history; can invent books; nothing is saved |
| Notes app | Fast, private | No covers, no structure, no suggestions |

**Why would I switch?** Folio imports my Goodreads history in one step (no fresh start), makes
the shelf scannable with one-line reviews (Letterboxd's pattern, with the long paragraph behind a
tap), and recommends with a reason, from a recommender measured against my own reading.

## Riskiest assumptions

| Risk | Assumption | How risky |
| --- | --- | --- |
| Value | Recommendations built from my own history beat Goodreads' and beat a popularity baseline: I'd want to read several of the top 10 | **Riskiest** |
| Value | I'll write one-line reviews, and a shelf of them is worth scanning | Medium |
| Feasibility | My Goodreads export maps cleanly onto Open Library (covers, IDs), even when ISBNs are missing | High |
| Feasibility | Each recommender level fits in about a day, with the eval harness in place first | Medium |
| Usability | Logging a finished book (rating and one-liner) takes ≤ 30 s | Low |
| Viability | Costs stay near zero (Open Library is free; Claude only at the last level); the export is public in the repo (owner, 15 Oct); Python is new to this repo | Low |

**What the export showed (15 Oct):** 352 books: 65 read, 287 want to read. Ratings on read
books are only 3, 4 and 5 stars (16, 32, 16), so there's little signal about dislikes. No reviews
or private notes. Only 46 of 65 read books have a *date read* (none after 2024), but the owner's
recent reads are there: Goodreads leaves "date read" empty unless it's set by hand, so for 19
books the only date is *date added* (six of them from 2025–26). The want-to-read shelf is the
richest signal (implicit feedback: intent rather than a rating). Data quirks the import must
handle: *The Fellowship of the Ring* is on both shelves as two editions; a 3.5-star rating sits on
a want-to-read edition of *Mindset* while the read edition is unrated (the export does carry half
stars); old rows were bulk-added on the same day (Oct 2018, Jun 2021), so date added isn't a read
date for them. The eval therefore uses leave-one-out on liked books, plus a split on date added.

So the MVP must test **whether my history makes better recommendations**. That's why the eval
harness (step 2) comes before any clever recommender, and why every level is scored on it.

## Success: what good looks like

**Main outcome:** I pick my next book from Folio's recommendations, and I know *why* the
recommender suggested it.

| Signal | How I'll measure it | Target |
| --- | --- | --- |
| Recommendations land (main) | Owner judgment on the final top 10: how many I'd actually want to read and hadn't considered | ≥ 3 of 10 |
| Better than the baseline | Offline eval, per level: leave-one-out on books I rated 4–5 stars, plus a time split on *date added* that hides my newest want-to-reads; hit rate@10 and NDCG@10 | Best level beats popularity on both |
| Import works | Goodreads CSV → Folio: rows with title, author, rating and shelf; rows with a cover | ≥ 95% imported, ≥ 80% with a cover |
| Logging is quick | User test: log a just-finished book with a rating and a one-liner | ≤ 30 s, ≤ 5 taps |
| The shelf is scannable | User test: from the shelf, say what I thought of three books | ≤ 10 s, no taps |
| Guardrail: real books only | Every recommendation exists in Open Library and isn't already on my shelf | 0 failures |
| Guardrail: exact ratings | Imported ratings and dates match the CSV | Exact |

## MVP and stop line

**Appetite (owner, 15 Oct):** a multi-day ladder, about four days. Each step ships and is scored
on the same eval, so the end result is a table: popularity X, content Y, CF Z, hybrid W.
Re-bet at the end of day 3: if collaborative filtering ran long, the hybrid and LLM step becomes
day 5 or goes to the backlog.

| Day | Ships | Learns |
| --- | --- | --- |
| 1 | The app: search, shelves (read, want to read), half-star ratings, one-line review with the paragraph behind a tap, Goodreads CSV import | Product, data model, the test set |
| 2 | Python lab, eval harness (leave-one-out and a date-added split, hit rate@10, NDCG@10, diversity), popularity baseline, recommendations screen | Measure before you build |
| 3 | Content-based: embeddings of book descriptions, my taste as the weighted average of what I liked | Embeddings, vector similarity |
| 4 | Collaborative filtering (matrix factorization on goodbooks-10k with me added), then a hybrid blend with Claude re-ranking and explaining, and an LLM judge for the reasons | The Netflix technique, cold start, where LLMs fit |

**Decided (owner, 15 Oct):**
- **After reading first,** to practise recommenders and evals; the while-reading features come next.
- **Name: Folio.**
- **Half-star ratings,** 0.5 to 5, like Letterboxd.
- **One-line review on the overview; the longer paragraph behind a tap.** The thing Goodreads gets
  most wrong for me.
- **A real recommender, built in stages and evaluated,** not one prompt. Learning the fundamentals
  (how Spotify, Netflix and YouTube do it) is a goal in itself.
- **Recommender experiments in Python notebooks,** the industry standard (decision
  0012).
- **My Goodreads export is committed** to the public repo, so the eval can be reproduced.

**Design references (owner, 15 Oct):** Letterboxd: dark, covers as the grid, half stars,
one-line reviews, calm. Modern, sleek, minimal. Not: Goodreads' dense, dated pages; walls of
review text; "bookish" decoration (wood shelves, paper textures, quill icons). A feel is evoked,
not drawn.

**Stop line:** anything not above goes to [backlog](#06-folio.backlog): word lookup and saved
words, notes and ideas while reading, community and discussion, a "reading now" shelf with
progress, stats, accounts and sync, and other people's reviews.

## Requirements

Day 1 (the app). The recommender steps get their own requirements on the day they start.

| # | Must | Check |
| --- | --- | --- |
| 1 | Search by title or author (Open Library) shows covers, title, author and year | "piranesi" → Susanna Clarke's in the top 3 |
| 2 | From a search result, save to Want to read in one tap | Search → saved in ≤ 2 taps |
| 3 | Log as read: half-star rating, a one-line review, an optional longer paragraph, date read (defaults to today) | Done in ≤ 30 s; all fields saved word for word |
| 4 | The shelf shows covers with ratings and one-liners; long reviews never show on the shelf | Scan three books in ≤ 10 s; no paragraph visible |
| 5 | The book page shows the one-liner, and the long review opens with a tap; everything can be edited, moved between shelves or removed | Edit → the shelf updates |
| 6 | Goodreads CSV import: read and to-read shelves, ratings (0 = unrated), review into the long paragraph, date read; covers by ISBN, then by title search; importing again doesn't duplicate | Counts match the CSV; second import adds 0 |
| 7 | Data stays on the device (localStorage); only book searches and cover requests leave it | No personal data in requests |

**No-gos:** community and other people's reviews, accounts and sync, word lookup and notes (v2),
reading progress, stats and charts, social sharing, training or fine-tuning a model.

**Rabbit holes:**
- Matching editions vs works in Open Library: match on ISBN, then title and author; unmatched
  rows import without a cover and can be fixed later.
- The recommender ladder: one level per day; don't tune a level once it beats the one before.
- Deep learning: pretrained embeddings only, no training neural networks.
- Design: covers do the visual work. Use the `/prototype` round for the shelf and stop there.

## Unit tests

- **Goodreads date parsing and the date-added split** (Vitest in the app, pytest in the lab):
  normal `2023/05/14`; a missing "date read" (19 of my 65 read books: fall back to date added);
  a book added on the split date itself (lands on exactly one side); an empty export.
- **Import merging:** the same book on both shelves (read wins); a rating on a want-to-read row
  (keep it); a re-import adds nothing.
- **Rating mapping:** Goodreads `0` means unrated, not zero stars; the export writes ratings as
  `4.0` and can hold halves (`3.5`); all map exactly and round-trip.
- **Eval metrics** (pytest): hit rate@10 and NDCG@10 against small hand-worked cases (hit at
  rank 1, hit at rank 10, no hit, empty list).

## Success check (at wrap-up)
