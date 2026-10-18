# Journey

What happened, what was decided and why. Newest last.

## 15 Oct: discovery and framing

- **The request:** an app to track books read, save books to read and recommend what's next; later
  a reading community, quick word definitions (the owner is a non-native English speaker), and
  notes and ideas while reading, all in one app. Goodreads feels clunky and old; the owner wants
  something modern and minimal, like Letterboxd.
- **Coaching: five jobs, not one product.** Claude split the idea into jobs by moment and
  frequency: remember what I read, decide what's next (both every few weeks), discuss with others
  (occasional), and understand words and take notes while reading (every session). Pushback:
  "holistic, all in one" is positioning, not a problem; a nicer UI alone is a weak reason to leave
  Goodreads (Moesta's switching forces), since StoryGraph, Literal and others are already modern.
  The differentiated edge looked like the while-reading moment. Community goes to the backlog:
  it needs other people (cold start) and a backend, so it can't be tested in a day.
- **Owner's answers:** reads **paper books** (so the word-lookup gap is real: no built-in
  dictionary), opens it most **in bed, mid-chapter**, and the biggest annoyances are dated UI,
  missed recommendations, nothing while reading, and **reviews too long to scan**: wants a
  one-sentence review on the overview with an optional paragraph behind a click.
- **Decision (owner): start after reading,** with search, shelves, half-star ratings, short reviews
  and recommendations, *because the owner wants to learn to build a recommendation system and
  evals*. A legitimate viability choice (Cagan's "does it work for me?"), logged as a known
  tension: the daily moment (in bed, mid-chapter) arrives in v2.
- **Name: Folio. Ratings: half stars.**
- **Teaching: recommendation fundamentals.** The owner asked to learn the field, not just get a
  build: popularity, content-based and collaborative filtering; the multi-stage shape companies
  run (retrieval, ranking, re-ranking; YouTube 2016); how Spotify's Discover Weekly blends them;
  where LLMs fit (embeddings, re-ranking, explanation, judging); offline metrics (hit rate@k,
  NDCG), beyond-accuracy (diversity, novelty, coverage), online A/B tests, and "always beat a
  baseline". Correction: a Goodreads export doesn't *train* Claude; it's the taste profile and,
  more valuable, the ground truth for offline evals. goodbooks-10k supplies the other readers
  that collaborative filtering needs.
- **Re-cut, said out loud:** this is no longer a one-day product. **Owner chose a multi-day
  ladder** (about four days): day 1 the app and import, then baseline and eval harness,
  content-based, collaborative filtering, hybrid with an LLM, each scored on the same eval.
- **Owner: experiments in Python notebooks** (the industry standard, a job skill) and **commit the
  Goodreads export** to the public repo for a reproducible eval. Recorded in decision 0012.
- **Setup snag:** PR 33 (Mallow wrap-up, code habits, Vitest in the starter) wouldn't merge
  because of a conflict in `docs/todo.md`: main had job items copied back in by the Job Coach
  sync; the PR points to Focus instead. Kept the Focus link (AGENTS.md: Focus is the single
  source), pushed, and cut Folio on top of the PR branch so it includes Vitest.

## 15 Oct: the Goodreads export

- **Owner exported their library** (macOS wouldn't let Claude read Downloads, so the owner moved it
  to `apps/06-folio/lab/data/`). Checked before committing to the public repo: no private notes,
  reviews or spoilers, so it's safe.
- **What's in it:** 352 books, 65 read and 287 want to read. Ratings only 3–5 stars. 46 read books
  have a date read, the last in 2024.
- **Eval redesigned:** a date-read split would test on 3 books, so the harness uses leave-one-out
  on 4–5-star books and a split on date added, which includes want-to-reads. Coaching point:
  want-to-read is *implicit feedback* (an action that shows intent) versus *explicit feedback*
  (a rating); most real recommenders run mostly on implicit signals.
- **Rating skew:** with no 1–2 stars, 3 stars is the "didn't love it" signal; treat 4–5 as liked.
- **Correction (owner, with screenshots):** Claude first read "no date read after 2024" as "the
  history stopped in 2024". Wrong: the owner's 2025–26 reads (*Four Thousand Weeks*, *When Breath
  Becomes Air*, *On Connection*, *Mindset*…) are all in the export, just without a date read;
  Goodreads only fills it when set by hand. Lesson: check a conclusion about the data with the
  person who made it before building on it. *Date added* is the fallback date (except for the
  bulk-added rows of 2018 and 2021).
- **Quirks found:** *Fellowship of the Ring* on both shelves (two editions); *Mindset* read but
  unrated, while a 3.5 sits on a want-to-read edition, likely the rating meant for the read book.
- **Mindset (owner):** the 3.5 is the rating for the edition they read. Fixed without touching
  the export: `apps/06-folio/lab/data/corrections.json` lists owner-confirmed merges (Mindset,
  Fellowship), which the lab applies on load. The app's import gets a general rule instead: rows
  that resolve to the same Open Library work merge, read wins, and a rating on either row is kept.
  Practice: keep raw data exactly as it came, and apply fixes in a separate, explained step.

## 16 Oct: prototype round 1, the shelf

- **`/prototype` on the shelf screen** (the main screen for jobs 2 and 4), three directions on
  the owner's real shelves (24 most recent read, 18 want to read), behind a picker at
  `/prototypes/shelf`. The one-liners and two long reviews are **sample text** written for the
  prototype; the export has no reviews.
  - **Wall** (axis: covers first): Letterboxd's 3-column grid with half stars; the one-liner and
    the full review open in a bottom sheet. Wins on looks and density; costs a tap per opinion,
    so "say what I thought of three books" isn't possible without tapping.
  - **Diary** (axis: time-ordered text): month headers, small cover, title, stars, the
    one-liner cut to one line; tap a row to open the full review in place. Scans fastest; looks
    the least like a book app.
  - **Lines** (axis: the opinion as the hero): each one-liner set large in a serif, the book as
    its caption; books without a line fall into a small cover grid at the end. The most personal;
    only works if one-liners get written, and a fresh import has none.
- **Found while building:** Open Library has covers by ISBN for only about half the books (9 of
  18 on want to read), and many slowly (each redirects to archive.org, about 1.6 s). Some are
  library scans. So the import's title-search fallback is required, not optional, and the
  typographic fallback cover is part of the design.

## 16 Oct: a design-session skill (side quest)

- **Owner's request:** turn Anshu Chimala's article "How to turn your AI into a world-class
  designer" (Lenny's Newsletter) into a skill we use together; owner's first skill, so Claude
  walked through how skills work (a `SKILL.md` with a name and description; project vs personal;
  automatic vs called; a skill runs here, a subagent gets a fresh context).
- **Built:** `/design-session` (Discover, Define, Deliver with owner checkpoints), the
  `design-critic` subagent on Fable, a seed script and our own AI-tells list. Defaults taken
  while the owner didn't pick: full process, no image or video generation, critic on Fable,
  only when called. Decision 0013. Renamed from `design` because another installed skill already
  had that name.
- **Smoke test on the Diary prototype:** 6/10. Top gaps: stars next to the title cut titles
  short; one-liners clamped to one line, so no opinion is readable; missing covers read as
  broken; all-caps month headers feel templated; an unexplained "+"; gold stars are the loudest
  thing on screen. Useful input for the shelf pick.

## 16 Oct: prototype round 2, the owner's picks combined

- **Owner's picks:** **Diary** for Read, with clearer month headings to separate sections;
  **Wall** for Want to read, but smaller covers with readable titles, so it *feels like looking
  at a bookshelf*.
- **Scope widened (named, per the playbook):** the owner asked for recommendations in the
  prototype, two tabs (**Home** and **Shelf**), and a Home of three rows: **New releases**,
  **Popular this month**, **Folio's picks**, plus a **mascot**, a cute library animal with
  glasses (inspired by Duolingo), next to the name. The recommendations screen moved up from
  day 2 as UI only, with sample picks. New releases is new scope, but cheap: Open Library
  lists exist.
- **Built at `/prototypes/folio`** (round 1's `/prototypes/shelf` deleted):
  - **Read:** month headings now large sentence case with the year muted, a count and a
    hairline. Two of the critic's notes applied: titles wrap instead of being cut by the stars
    (stars moved to the author line), one-liners show two lines, the "+" mark is gone.
  - **Want to read:** four covers per row, titles under each, every row standing on a hairline
    "ledge". The shelf feel is evoked by rhythm and baseline, not drawn wood. Tap opens a sheet.
  - **Home:** three horizontal rows. *Popular this month* is Open Library's real trending list;
    *New releases* is real 2026 English releases by reading-log count; *Folio's picks* are hand
    picked samples with a "Because you loved…" reason.
  - **Mascot:** Folio, a small static owl with round glasses holding a green book, next to the
    name.
- **Teaching moments:**
  - **Popular and new are popularity recommenders,** the same for everyone. They're
    mostly romance and self-help, not the owner's taste, which is exactly why the personal row
    must beat them on the eval.
  - **Half of Claude's first-guess picks were already on the want-to-read shelf** (*Shuggie
    Bain*, *Inspired*, *Range*, *The Song of Achilles*, *Continuous Discovery Habits*, *On Earth
    We're Briefly Gorgeous*): a good sign for taste, and proof that the "not already on my shelf"
    filter is needed.
  - **Cover quality varies:** one library scan shows a "Withdrawn from collection" sticker.
- **Open questions for the owner:** where adding a book (search) lives with only two tabs; Home
  order (personal picks first or last); star colour (the critic found gold too loud).

## 16 Oct: a Search tab with browsing

- **Owner:** Search becomes the third tab, and asked whether Open Library can browse by genre,
  prizes (Nobel, Booker), release date and highest rated.
- **Tested each against the API:**
  - **Genre:** works, but subjects are reader-tagged and messy: "science fiction" returns
    *Harry Potter* first, and "memoir" alone returns *Atomic Habits*. Each chip is a hand-tuned
    query.
  - **Release year:** works, sorted by reading-log count; sorting by "new" returns German
    textbooks.
  - **Highest rated:** thin data. Open Library's ratings come from a small base (*Project Hail
    Mary*: 184 ratings), so the top skews to fantasy.
  - **Booker:** about 60 tagged books mixing winners and the shortlist, so we keep our own list
    of winners.
  - **Nobel:** the tag returns books *about* the prize, and the Nobel goes to authors, not
    books.
- **Coaching:** browsing is discovery, the same job as recommendations, and new scope past the
  stop line, so it was cut to the smallest useful set.
- **Owner's MVP set:** title and author search, genre chips (literary fiction, memoir,
  psychology and self, business and product, plus "Queer stories" suggested from the shelf's
  strongest thread), and the **Booker winners** (60 books, 1969–2025, ours, matched to Open
  Library: 58 with covers). Nobel laureates go to the backlog; highest rated and release year
  aren't in.
- **Built in the prototype:** search with a 300 ms debounce and loading, empty and error
  states; genre lists; a Booker row plus the full list; "Want to read" on each result, and
  "Read" or "On your list" for books already on the shelf. Brief check: "piranesi" returns
  Susanna Clarke's first.
- **Bug found while testing:** shelf matching on title alone marked every "Piranesi" as on the
  list. Fixed with title plus author surname for now; the real app matches Open Library work ids.
- **Cover quirk:** *Prophet Song* shows the German edition's cover. Prefer English-edition
  covers in the real import (backlog).

## 16 Oct: genre filter on Want to read

- **Owner:** filter the Want to read shelf by genre ("I'm in the mood for a classic"), using
  Open Library's genre data.
- **What the data holds:** of all 285 want-to-read books, 271 match Open Library and 241 (85%)
  have subjects; 254 (89%) have a cover once the lookup falls back from ISBN to title. That
  clears the brief's 80% cover target. The newest books are the worst-tagged (9 of the 18 most
  recent have none), because new books haven't been tagged by readers yet. Google Books
  refuses requests without an API key.
- **Subjects are messy:** 600+ different tags, mixed languages ("romans, nouvelles", "ficción")
  and noise ("large type books", "reading level-grade 11"). Claude wrote **mapping rules** from
  raw tags to 10 shelf genres, several allowed per book: Classics (tagged classic, or fiction,
  poetry or drama from before 1950), Literary fiction, Queer stories, Fantasy & sci-fi,
  Poetry & drama, Memoir, Psychology & self, Business & product, History & ideas, Children's.
  Result: 212 books sorted, **73 in "No genre yet"**, shown as the last chip so the gap stays
  visible.
- **Built:** a row of genre chips above the shelf (most common first, one at a time, tap again
  for all), and genres in the book sheet. The prototype now holds the whole want-to-read list.
- **For the owner:** fill the 73 with Claude (it classifies from title and author into the same
  10 genres, with an eval that checks it against the books Open Library already tags), tag them
  by hand, or leave them. Also: "Children's" (28 books, e.g. *The Wonderful Wizard of Oz*) as a
  chip, or fold it into Classics and Fantasy.
- **Owner:** the chips took too much room. Moved behind a filter icon beside the Read / Want to
  read tabs, opening a sheet of genres with counts. The active genre shows as a small line under
  the tabs with a clear button, and the icon turns bright. First try put the active genre next
  to the icon, which made "Want to read" wrap on a phone; moved below.
- **Mapping bug found by looking:** novels tagged "fiction, psychological" (*Giovanni's Room*,
  *The Heart's Invisible Furies*) sat in Psychology & self. Rules now keep fiction out of the
  nonfiction genres: Psychology & self fell from 75 to 34 books, History & ideas rose to 53, and
  66 books are unsorted. Still imperfect (*Yellow Face* isn't tagged as fiction), so hand-written
  rules on messy tags have a ceiling. That's the case for Claude classifying, with an eval.
- **Owner:** keep "No genre yet" as its own filter for now (it already was the sheet's last
  option); solving the unsorted books comes later.
- **Owner:** sort Read by rating, highest first. Added a sort icon beside the tabs on Read,
  opening the same kind of sheet: Date read (default) or Highest rated. By rating, sections
  become star groups (5 stars 16, 4 stars 32, 3½ stars 1, 3 stars 16, matching the export) and
  each row shows month and year instead of the day. The prototype now holds all 65 read books.
  Both sheets share one component.

## 16 Oct: which book data service?

- **Owner:** is Open Library the best base, or would Google Books (or another) give more books
  and reviews? Wants a solid base, as they expect to use Folio a lot. Asked for web research on
  the biggest and richest databases, free or paid, before deciding.
- **Findings:**
  - Goodreads closed its API in 2020; StoryGraph has none.
  - **Free:**
    - **Open Library:** 20M+ records, no key, subjects, trending, reading-log counts; messy
      tags, thin ratings, slow covers.
    - **Google Books:** tens of millions of titles; descriptions, categories, good covers,
      average rating and count; needs a key, about 1,000 requests a day.
    - **Hardcover:** a modern Goodreads alternative with a GraphQL API: reader ratings,
      genre tags ordered by votes, read counts and reviews. Free, but in beta, with a personal
      token, 60 requests a minute and tokens reset every year.
    - **NYT Books:** weekly bestseller lists and review links; free key, 500–1,000 requests a
      day, non-commercial.
    - **Wikidata:** prize winners (Booker, Nobel) as open data.
  - **Paid:** ISBNdb (110M+ records, from about $15 a month, metadata only, no ratings or
    reviews); Nielsen BookData and OCLC WorldCat are enterprise or library deals.
  - **Nobody offers Goodreads-style public reviews through an API;** Hardcover comes closest.
- **Recommendation for the owner to decide:** combine free sources behind one swappable layer.
  Open Library stays the free base, Hardcover is tested as the rich source (ratings, genres,
  popularity, the best signal for recommendations), Google Books fills gaps (descriptions,
  covers), and NYT or Wikidata cover lists and prizes. Keys stay on a server route, which also
  caches. Decide between Hardcover and Google Books with a bake-off on the owner's 350 books.
  ISBNdb isn't worth paying for: more records, but not the data Folio needs.
- **Decision (owner): build on all the free sources** (Open Library, Hardcover, Google Books,
  NYT, Wikidata) behind one swappable layer, with keys on server routes that also cache.
  Decision 0014. This gives Folio a small backend, needed to keep keys secret; the reading data
  stays in localStorage. `.env.example` lists the three keys with where to get each. Owner
  creates the keys (only they can); design carries on meanwhile, and the bake-off runs once the
  keys are in.

## 16 Oct: critic round 1 (design-session, Define)

- **Score 6/10:** "a Letterboxd-style book diary whose Home and Search have drifted into a
  generic bookstore front". Keep: the Read diary row and the restrained palette.
- **Applied (no conflict with owner calls):** tighter spacing between Home rows; on Read, no
  per-month count, and the day number aligned with the title in the author's colour.
- **Held for the owner (they contradict earlier owner decisions):**
  1. Home: lead with my own reading (latest reads), at most one discovery row.
  2. Read: month headings are heavier than book titles; make them smaller.
  3. Want to read: drop titles under real covers (poster-only grid, title on tap).
  4. Search: just a search field and recent searches; Booker to Home; genres as a plain list.
  5. The owl and name only on Home, not on every tab.
  6. One placeholder-cover style everywhere (letter on Read, title on Want to read).
- **Owner asked what the critic meant** (one discovery row, "your latest reads", what else could
  make Home less generic, whether the data sources have longer reviews). Claude explained:
  - Home is the first thing seen on every open, and nothing on it was the owner's.
  - "Latest reads" gives continuity, but barely changes between visits.
  - No source offers Goodreads-style public reviews. NYT gives review links, Google Books
    synopses; Hardcover's other-reader reviews are unconfirmed.
  - The most personal ideas come from Folio's own data: up next from my 285 want-to-reads,
    rediscovered saves, year count, taste line, on this day.
- **Decision (owner): keep the MVP as it is, with Folio's picks moved to the top of Home.** Every
  other suggestion goes to the backlog, to review after shipping: the Home ideas, book page data,
  and the critic's notes on Search, cover titles, the owl header and month headings. Round 2 of
  the critic isn't needed for the MVP; the design is frozen.
- **Storage (owner): the existing Supabase project.** Claude laid out the options: the shared
  Supabase project, Neon through Vercel's Storage tab, or localStorage for the MVP. localStorage
  doesn't sync, gets wiped with the browser, and Safari deletes it after 7 days without a visit.
  Folio gets one table, `folio_books`, in the project CrossFit Log and Scribble share, with an
  access code, following their pattern. Decision 0015, with the cost named: three apps now share
  one secret key. Schema written; `.env.example` now also lists `SUPABASE_URL`,
  `SUPABASE_SECRET_KEY` and `ACCESS_CODE`.
- **Owner asked why `.env.example` gets copied to `.env.local`:** the example is a public template
  with names only; the local file holds the real keys and git ignores it. Added to the knowledge
  bank.
- **Setup (owner, 16 Oct):** the apps had no local keys files (they only lived in Vercel), so the
  owner took the Supabase URL and secret key from the dashboard, chose to reuse the CrossFit and
  Scribble secret key rather than a Folio-only one, and ran the schema. Claude checked without
  printing values: both set, a secret key, and `folio_books` answers (empty). The book-service
  keys are next.
- **Owner asked whether Folio needs an access code,** since it doesn't use Claude. Claude: yes.
  The code isn't about AI costs. Folio's server routes read and write the shelves with a secret
  key, and the app is on a public URL, so without it anyone could read, change or delete the
  shelves, or spend the book-service quotas (Hardcover's token is the owner's account). Claude
  will come later anyway: the hybrid recommender's re-ranking and explanations, the LLM judge,
  and possibly sorting the unsorted genres.

## 16 Oct: building the real app

- **Built from the prototype** (prototype surface deleted):
  - **Screens:** Home, Search and Shelf (Read diary with sort, Want to read with the genre
    filter), a book sheet for adding, logging as read (half stars, one-liner, optional longer
    review, finish date), editing and removing, an import and backup sheet, and the access-code
    screen.
  - **Server:** routes for books, the batch import, search and Home's lists. Keys and the
    database stay on the server (decisions 0014, 0015); Open Library is the only source so far.
- **Unit tests (16, Vitest):** Goodreads CSV parsing, dates (month end, year end, just after
  midnight, empty export), ratings (0 = unrated, halves) and the merge rule.
- **Tested against an in-memory store,** not the owner's Supabase. A separate launch config
  blanks the Supabase values; Claude checked the real table stayed empty before testing.
- **Full import of the real export:** 352 rows became 349 books in about 2 minutes:
  - **Merges:** *Mindset* (read, 3.5, by the general merge rule, so the lab's corrections file
    isn't needed in the app), *Fellowship of the Ring* (read), and two *Odyssey* editions.
  - **Ratings** match the export (16 / 32 / 1 / 16); covers 312/349 (89%, target 80%); genres
    271/349.
  - **Importing again adds 0.**
- **Browser flow at phone size:** a wrong code is refused with a message; Home loads real lists
  (and *Giovanni's Room* drops out of the picks because it's on my list); search finds *Tomorrow,
  and Tomorrow, and Tomorrow* first; Want to read takes one tap; logging it read with 4½ stars and
  a line moves it to Read without a duplicate, saved word for word.
- **Shortcuts left in the code** (`grep -r "shortcut:" apps/06-folio`): Folio's picks are still
  the hand-picked sample, Open Library is the only source, the genre rules miss some books, the
  Booker list is static, and the trending list's English filter is rough.

## 16 Oct: the owner's first real import

- **Owner imported their export into the live data:** "Added 349 books; 3 were already on your
  shelves. 15 not found on Open Library." They read it as 15 books missing and asked which.
- **Checked against the real table:** nothing missing. 352 rows became 349 books (three
  duplicate editions merged); the 15 are on the shelves without cover or genre: Swedish, Dutch and
  Indonesian editions, a John Boyne boxed set, "Farenheit 451" (typo in Goodreads) and a few new
  books.
- **Tried a looser search:** it would match most of the 15, but to the wrong books, and a wrong
  match can merge two different books, which really would lose one. Kept strict matching
  (precision over recall); a "fix a match" feature goes to the backlog.
- **Fixed the message:** it now says every book from the file is on the shelves, explains
  merges, and lists the unrecognised books by name.
- **Owner's rule for testing:** no one may lose a book on import. Added as a brief guardrail and
  a test-plan trust check; an automated test is in the backlog. Feedback 1–3 logged.
- **Owner asked whether any CSV export would work.** Not today: the import requires Goodreads'
  column names and refuses other files. Supporting others means one small adapter per known
  format (StoryGraph, LibraryThing…) mapping to the same import rows, with its own tests for
  dates, rating scales and shelf words; a generic "match your columns" screen comes after. It
  matters for other users switching to Folio, not for the owner's MVP, so it goes to the backlog.
- **Owner: test that the CSV's data shows correctly.** Writing field-by-field tests found two
  gaps. Goodreads reviews weren't imported at all, so anyone with reviews would lose them; they
  now become the longer review, as plain text with line breaks kept. And rows on other Goodreads
  shelves (currently-reading, or custom ones like did-not-finish) were skipped silently; they're
  now named on screen as not imported, and where they go is the owner's call. 21 unit tests (the
  repo's rule is unit tests for date logic only; the owner asked for these). The test plan gets a
  field-by-field check, and the backlog's automated import test now covers fields too.
- **Decision (owner):** Goodreads' currently-reading books go to Want to read until v2 adds a
  Reading now shelf; books on custom shelves (e.g. did-not-finish) stay named on screen as not
  imported. Tests updated (21 pass).
- **Owner changed their mind: a third shelf, Current read.** It's the base for v2's
  while-reading features (words, notes). Named as scope widening; about an hour, so taken in.
  - **Built:** a `reading` shelf with a `started_on` date. Goodreads' currently-reading imports
    there, and when two rows are the same book the furthest shelf wins (read, reading, want).
    The book sheet's next step is the filled button: Want to read, Start reading, I've finished
    it. The Shelf opens on Current read when it has books, with larger covers there.
  - **Fit:** with the real counts the three tabs overflowed a 375px phone by ~10–35px; tightened
    the spacing and count size until they fit exactly.
  - **Database:** needs migration `002-current-read.sql`, which the owner runs once in Supabase.
  - 22 tests pass.
- **Owner: Remove shouldn't be the only way off a shelf.** Added "Move to" links in the book sheet
  and made delete explicit ("Remove from Folio", confirmed with "Delete it and what you wrote?").
  The API now keeps rating, line and dates on every shelf (shown on Read only), so a book can
  move away from Read and back without losing anything; checked by moving a rated book
  read → want → reading → read. Feedback 7.
- **Migration 002 run by the owner and checked:** the `started_on` column exists, the database
  accepts a book on the Current read shelf (a temporary test row, deleted straight after), and
  all 349 books are untouched.

## 16 Oct: shipping

- The owner's merges hadn't gone through (both PRs still open) and the first ship hadn't run.
  On the owner's request Claude merged PR 33, pointed PR 34 at main and merged it, then ran
  `pnpm ship 06-folio`. **Exception to decision 0010** (the owner runs ship so keys never pass
  through Claude), at the owner's request; the script sends keys from `.env.local` to Vercel and
  never prints them.
- **Project "folio" created** on Vercel (root `apps/06-folio`, GitHub connected, 6 env vars set),
  but the **deploy was refused: the free plan's 100 deployments a day were used up**, because
  every push today built previews. Retry `pnpm ship 06-folio` within 24 hours; it updates the
  project and deploys.
- **Lesson:** on the free plan, pushes are a budget. Push in batches at the end of a step, not
  after every small doc change.
- **Why 100 deployments?** The account showed 123 in 24 hours: every push to the `06-folio`
  branch started a build in each of the four older apps, which their `ignoreCommand` cancelled,
  but cancelled builds still count. **Decision 0016 (owner):** every app, the portfolio and the
  starter deploy from `main` only, so branch pushes cost nothing; the trade-off is no branch
  previews. Committed locally and held back until the limit frees up (about 11:50 on Sat 17
  Oct by the rolling count; fully clear about 15:00), then pushed in one batch with Folio's
  deploy.

## 16 Oct: the recommender goal

- **Owner's goal:** short term, learn how recommendation systems work inside out and build a
  strong eval system for whatever Folio ends up using. Long term, through iterations, build the
  most advanced book recommender there is.
- **Coaching:** "most advanced" needs a definition, or it can't be reached. Here it means the
  best on Folio's eval: offline metrics on a public dataset plus my own history, an LLM judge for
  the reasons, and my real behaviour in the app, under the guardrails (real books only, nothing
  already on my shelf, enough variety). So the eval comes before every model, and each new level
  has to beat the last one on it. Advanced levels and online evaluation added to the backlog.

## 17 Oct: recommender step 1, data and the exam design

Worked as a mentor session: theory, then the owner reasons out the next move before Claude
explains (owner's request: "help me start thinking about this, not just you telling me").

- **Orientation:** the five families (popularity, content-based, collaborative filtering, hybrid,
  LLM), retrieval → ranking → re-ranking, explicit vs implicit feedback, cold start, and the
  roadmap. Cold-start onboarding parked in the backlog: Folio has one user, who isn't cold.
- **Lab set up:** uv (installed with Homebrew), Python 3.12, pandas, pytest, Jupyter in
  `apps/06-folio/lab/`; goodbooks-10k downloaded by `scripts/download_goodbooks.py`, not committed.
- **"A book I liked" = 4–5★, with 5★ worth more (owner).** 3★ is "decent", not a target. That's
  a relevance threshold plus graded relevance, which NDCG supports. Want-to-reads are intent, not
  satisfaction: input for the taste profile, not proof of liking. Taste drifts (most dated reads
  are 2021–22; recent taste lives in 46 want-to-reads added 2025–26).
- **Leakage found by the owner** (with a hint): letting the model see *Circe* while hiding *The
  Song of Achilles* is "Thursday's newspaper". So test on the future, train on the past.
- **Why two levels:** a few hidden books can't separate two models (penalty kicks: 3 vs 1,000),
  so the exam runs on goodbooks readers, with the owner's shelf as a personal check. Decision 0012's
  time split on the owner's shelf alone is replaced (decision 0017).
- **Dataset: goodbooks-10k (owner),** because it's clean, has reader ids, and is the research
  benchmark, so scores compare with papers. Its catch: a 2017 snapshot of popular books.
  Considered: Amazon Reviews 2023 (fresher, messier), Open Library dumps (2026, but no reader id,
  so useless for "readers like you"; useful later for fresh popularity). Goodreads closed its API
  in Dec 2020, so no fresh Goodreads data exists.
- **Overlap, measured (owner guessed 70%):** 16 of 48 books rated 4–5★ are in goodbooks (33%;
  5★ only: 10 of 16), and just 11 of 66 want-to-reads added since 2023 (17%). Matching ladder:
  Goodreads id (131), ISBN-10 (0 extra; goodbooks' ISBN-13s are rounded floats, unusable), title
  + author surname (12 extra, all checked correct). Known miss: *If This Is a Man* is
  *Survival in Auschwitz* in goodbooks. Meaning: crowd models will be weak for the owner's recent
  taste; content-based and LLM steps can cover books outside goodbooks.
- **Two personal-check slices (owner):** the 16 in goodbooks (fair to the model's judgment) and
  all 48 (what Folio's experience would be, catalog gaps included).
- **Correction by Claude:** goodbooks has no dates, but its ratings file is in time order
  (verified: no 2016–17 book is rated before row 1.1M of 6M). So the Sams get leave-last-out.
- **Hide each reader's last 1 liked book and, separately, the last 5 (owner: both).** Last 1 is
  the research standard; last 5 is closer to "the coming months" and allows recall.
- **K = 10 (owner):** Folio will show 10 picks; the owner researches before choosing (a
  "maximiser", Schwartz), and 10 is also what papers report. Mood (fiction vs non-fiction) noted
  as context for step 4's re-ranking (backlog).

## 18 Oct: the exam built, baselines scored

- **More exam calls (owner):** score order, not just "found it", even though the owner reads all
  10 ("you are not your user"): headline **NDCG@10**, 5★ = 2 points, 4★ = 1. Beyond accuracy
  (coverage, novelty, author spread), found by the owner with hints from a thought experiment
  (1,000 bestseller lists laid side by side). Owner's trust rule "never a book I'd rate 3★"
  can't be checked in advance, so it became the **regret grade**; **no quality floor**, to keep
  polarising books. Recorded in decision 0017.
- **Built** in `apps/06-folio/lab/`: `splits.py` (leave-last-out, owner's time-aware check),
  `metrics.py`, `evaluate.py` (guardrails stop the run), `baselines.py`, `results.py`,
  `scripts/run_eval.py` (8 seconds), notebook `01_data_and_baselines`. 28 pytest cases with
  hand-worked answers; one caught a real bug (bestsellers could run out of books).
- **Results** (10,000 readers, hide last 1): random NDCG@10 0.0003, hit rate 0.1%; **bestsellers
  NDCG@10 0.010 (0.008–0.011), hit rate 2.0%**, regret 31% (= the base rate of 3★-or-lower
  ratings), coverage 0.6% (about 60 books), author spread 0.59. Owner's 48: 0 found by both.
- **Walk-through:** why so low? Readers have already read 3.3 of the top 10, and only 9% of
  hidden books are in the top 100: experienced readers live in the long tail. Why 0 of 48? Three
  causes, found together: 32 books aren't in goodbooks (data), bestsellers can't reach the tail
  (*Animal Farm* is #18, just outside the 10; *Design of Everyday Things* #8,973) (model), and 48
  kicks can't separate baselines (exam).
- **Big picture, at the owner's request:** the eval is the referee, not a player. Training =
  studying, evaluating = the exam. Each step: build a model, train it on goodbooks (and later
  descriptions), take the exam, and if it beats the bar it becomes Folio's picks (your shelf → 10
  books → the JSON file Home reads). Online evaluation in Folio comes later.
- **The bar for step 2, agreed before building it (owner: "lets go for it"):** NDCG@10 range
  entirely above bestsellers' (above 0.011), regret ≤ 31%, coverage ≥ 6% with higher novelty,
  guardrails, and the owner would save at least one of its 10 picks. In decision 0017.
- **Step 1 done.** Next: step 2, content-based (TF-IDF on descriptions and tags, then sentence
  embeddings), scored with `scripts/run_eval.py`.

## 18 Oct: step 2, TF-IDF, then the MVP cut to an LLM recommender

- **TF-IDF on Goodreads shelf tags** (`lab/folio_lab/content.py`): each book becomes a fingerprint
  over its shelf names, with ~120 generic shelves dropped ("to-read", "owned", "kindle",
  "read-in-2015"…); a reader is a weighted blend of their books (5★ = 2, 4★ = 1, 3★ = 0, 1–2★ =
  −1, want-to-reads 0, no recency fade: starting settings, not yet the owner's calls). Fits in
  1 s. **10,000 readers, hide last 1: NDCG@10 0.023 (0.021–0.025)**, 2.3× bestsellers, regret
  21%, coverage 55%, novelty 5.8: passes bar items 1–4. Caveat: 70% of its hits are by an author
  already on the shelf (sequels); 0 of the owner's 48 (32 aren't in the catalogue).
- **Owner stepped back: time to scale down to an MVP** (20 products in 20 days). First proposal:
  ship TF-IDF's picks as a static file. Owner asked what TF-IDF is, what a live version would
  cost (about half a day; only books in the 2017 catalogue count) and whether an LLM is a better
  MVP for learning AI evals and for interviews. **Decision (owner): the LLM is the MVP
  recommender**, TF-IDF and bestsellers stay as its baselines, the rest goes to the backlog.
  Coaching note: a solution switch, justified by the problem (the owner's books are mostly
  newer than 2017; the learning goal is evals).
- **Built:** `lab/folio_lab/llm.py`: Claude reads the shelf (latest 100 rated books with stars,
  latest 40 want-to-reads) and names 15 books as JSON (structured outputs); code matches them to
  the catalogue and drops anything on the shelf, repeated or unknown, then pads to 10 with
  bestsellers. Its raw mistakes are counted separately (`results/llm-errors.md`). Calls go
  through the Batch API (half price) with a disk cache, so reruns are free. The owner level now
  includes the 32 books outside goodbooks (ids from 100,001), so a model that knows them can find
  them. A fixed sample of **500 readers** for the costly models; every model has rows on it.
- **Cost (owner asked to minimise it):** the first plan (Opus on everything, ~$13) became
  **Haiku 5.5 on the full exam, Opus 5.5 on the owner's 48 only: actual ≈ $1.20** (Haiku 3.3M
  input and 2.0M output tokens; Opus 0.11M and 0.03M; batch prices). Owner asked why the test
  is needed at all: an LLM's list always *reads* well; only the exam shows whether it finds what
  people went on to love, and it measures the LLM-only errors (made-up books, books already
  owned).
- **Results (500 readers):** hide last 1, Haiku NDCG@10 **0.025 (0.014–0.038)**, the same as
  TF-IDF (0.025, 0.014–0.036), bestsellers 0.009 (0.003–0.016): 500 readers is too few to prove
  the gap on hide-1. Hide last 5: **Haiku 0.040 (0.032–0.050)**, TF-IDF 0.035, bestsellers 0.019
  (0.012–0.026): clearly above bestsellers. Regret 23% (≤ 31%), coverage 15.8% of the catalogue
  (bestsellers 0.4%), novelty 4.9, author spread 0.95 (the most varied lists). Raw errors: 90% of
  named books are in the catalogue, 7% were already on the shelf (dropped), 2% of slots padded.
- **The owner's 48 books, where the LLM can see everything:** **Opus found 7 of 48** (NDCG 0.098,
  range 0.029–0.181), Haiku 3, TF-IDF and bestsellers 0. Opus put *Circe* first right after *The
  Song of Achilles*, and found *Humankind*, *Prisoners of Geography*, *When Breath Becomes Air*,
  *Fellowship of the Ring*, *Man's Search for Meaning* and *Sapiens*. Regret 8% (Haiku 18%).
  Caveat: the LLM read the internet, so it may "know" famous pairings (data contamination), and
  48 cases give wide ranges.
- **Live in the app:** `/api/picks` sends the shelf to Claude (same prompt as the lab), checks each
  name on Open Library, drops shelf books, and caches per shelf for a week, so picks change when
  a book is logged. 7 s on the real shelf; 8 picks survived the checks (backlog: always 10). The
  hand-picked samples are gone.
- **Hallucination check** (`lab/scripts/check_unmatched.py`, Open Library): of Claude's names
  that aren't in the catalogue (about 10% of all), a sample was looked up. The first run flagged
  real books (*The Body Keeps the Score*, *Deep Work*) because full subtitles break Open Library's
  title search: **the checker itself needed checking**. With short titles: Haiku 7–10% of
  out-of-catalogue names not found, Opus 3 of 31. By eye about half of those are real (*Rock
  Chick Rebel*, *Specters*) and half made up or mashed up (*The Ides of Rome* by Rick Riordan,
  *Girls in Tights*): roughly **0.5% of all named books are invented**. A second failure type:
  Opus at low effort sometimes corrects itself *inside* the title ("Homo Faber... no: The Silent
  Patient"); the Open Library check drops those in the app.
- **Decision (owner): Opus 5.5 powers Folio's picks** (found 7 of the owner's 48 vs Haiku's 3;
  about $1.50 a month vs $0.05). Bar check, honestly: item 1 not proven on the 500-reader sample
  (hide-1 ranges overlap bestsellers'), items 2–4 pass, item 5 is the owner's look at the live
  picks. Decision 0018.
- **Shipping the picks:** owner added `ANTHROPIC_API_KEY` in Vercel as a Sensitive variable.
  Vercel flagged the other keys "Needs Attention" because `pnpm ship` uploaded them as plain
  encrypted variables (readable by anyone with project access); `ship.mjs` now uploads them as
  Sensitive, and the owner re-saves the existing ones by hand. Merged to main and pushed (with
  the held-back decision 0016 commits) so Vercel deploys.
- **Deploy:** the push was skipped twice by the shared deploy rule (it looked only at the last
  commit, a README sync). Fixed in every app's `vercel.json` and the template: skip only if the
  app is unchanged since its last successful deploy (decision 0016 update). Folio is live at
  folio-iota-jade.vercel.app; `/api/picks` answered in 9 s with 6 picks, a different list from
  the local run (LLM non-determinism) and one odd match (*Adam Kay Bundle*): both in the backlog.
- **Bar item 5 passes (owner):** "I would definitely read *Klara and the Sun*." *A Little Life*
  is "my kind of taste" but "feels like a long commitment": the right book can still be the wrong
  pick for now, so length is a signal the recommender doesn't see yet (backlog). All of decision
  0017's bar is now checked: items 2–5 pass; item 1 is unproven on the 500-reader sample.
