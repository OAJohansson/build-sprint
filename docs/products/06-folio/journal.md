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
