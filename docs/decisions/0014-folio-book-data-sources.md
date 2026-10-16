# 0014 — Folio's book data: free sources behind one swappable layer

- **Date:** 2026-10-16
- **Status:** accepted

## Context

Folio started on Open Library alone. It's free and needs no key, but its tags are messy, its
ratings thin and its covers slow. The owner expects to use Folio often and asked for a solid
base, after web research into the biggest book databases, free and paid (journal, 16 Oct).
Goodreads closed its API in 2020 and StoryGraph has none. No service offers Goodreads-style
public reviews through an API.

## Decision

Use all the useful free sources, each for what it's best at, behind one interface (the adapter
pattern from 05 Inkling), so any of them can be swapped or dropped:

| Source | Used for | Key |
| --- | --- | --- |
| Open Library | Search, covers, subjects, monthly trending, reading-log counts; the free base | None (send a User-Agent naming the app) |
| Hardcover | Reader ratings, genre tags by votes, read counts: the richest signal for recommendations | Personal token, beta |
| Google Books | Descriptions, cleaner categories, covers Open Library lacks | Free API key |
| NYT Books | Bestseller lists | Free key, non-commercial |
| Wikidata | Prize winners (Booker, Nobel), replacing hand-made lists | None |

- Keys live in `apps/06-folio/.env.local` and Vercel, and are used only in Next.js server routes,
  never in the browser. The routes also cache, so daily limits (Google Books about 1,000 a day,
  Hardcover 60 a minute) aren't hit by normal use.
- Which source wins for each field (cover, genre, rating) is decided by a bake-off on the
  owner's 350 books: match rate and coverage of cover, genres, description and ratings.
- No paid source: ISBNdb has more records but not the data Folio needs (ratings, genres, reader
  signal).

## Alternatives considered

- **Open Library only:** simplest and fully open, but thin ratings and messy genres limit both
  the shelf filters and the recommender.
- **ISBNdb (paid, 110M+ records):** metadata built for booksellers, no ratings or reviews.
- **API.market "Similar Books" (freemium):** recommendations out of the box, but a black box,
  against the goal of learning how recommenders work.

## Consequences

- Folio gets a backend after all (server routes for keys and caching), not just localStorage.
  The reading data itself stays on the device for now.
- Hardcover is in beta and the token belongs to the owner's account: if it breaks, Folio falls
  back to Open Library. Revisit before anyone else uses Folio, since a personal token can't
  serve other users.
- NYT's free terms are non-commercial; fine for a personal app, revisit if Folio ever earns
  money.
