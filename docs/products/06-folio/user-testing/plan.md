# Test plan: Folio

## How to run the app for testing

- Start: `pnpm -F 06-folio dev` (port 3000). No keys needed for day 1; Open Library is public.
- Viewport: 390 × 844 (phone).
- From the cloud sandbox: test a production build at the machine's address, and allow
  `*.openlibrary.org` and `covers.openlibrary.org` in the environment's network settings
  (playbook step 1b).
- Seed data: "first run" = cleared localStorage. "Returning user" = the owner's Goodreads export
  (`apps/06-folio/lab/data/goodreads_library_export.csv` once committed) imported through the app.
- Simulated parts: none on day 1. From day 2, recommendations come from a JSON file the Python lab
  exports; say so in the trust check.

## Scenarios

Written as the persona's real moments. Each has a success bar.

### S1 · Bring my Goodreads history
- **Moment:** first open, on the sofa, curious.
- **Task:** "Get my Goodreads books in here."
- **Success:** the shelf fills, with counts matching the CSV (read and to-read), ratings exact,
  ≥ 80% with covers, in ≤ 60 s, without help. Importing again adds nothing.

### S2 · Log the book I just finished
- **Moment:** in bed, just closed the book, one hand free.
- **Task:** "Mark *Piranesi* as read, 4.5 stars, one line on what I thought."
- **Success:** ≤ 30 s, ≤ 5 taps plus typing the line; saved word for word; shows on the shelf.

### S3 · Save a book someone mentioned
- **Moment:** a friend mentions a title over coffee.
- **Task:** "Save *Tomorrow, and Tomorrow, and Tomorrow* for later."
- **Success:** found and on Want to read in ≤ 20 s, ≤ 2 taps after typing.

### S4 · Scan what I thought
- **Moment:** someone asks "have you read anything good lately?"
- **Task:** "What did I think of my last three books?"
- **Success:** answered from the shelf in ≤ 10 s, no taps; no long review text visible until asked
  for.

### S5 · Pick my next book (from day 2)
- **Moment:** between books, evening.
- **Task:** "What should I read next?"
- **Success:** finds the recommendations in one tap; each has a reason that mentions books I
  actually read; saves one to Want to read; no recommendation is already on my shelf.

## Value questions

- Would this replace opening Goodreads? What's still missing to switch for good?
- Would you write a one-liner for every book, or skip it?
- Of the top 10 recommendations, how many would you actually read? Which feel generic?

## Trust checks

- After S1 and S2, compare saved ratings, dates and review text with the CSV or what was typed,
  word for word.
- **Every field shows correctly** (owner, 16 Oct): for 5 books, including one with a review, one
  with a non-English title and one with an estimated date, compare the app with the CSV: title,
  author, rating, date read (or "Added"), shelf and review, word for word.
- **No book lost on import** (owner, 16 Oct): count the export's read and to-read rows; shelves
  + merged duplicates must equal that number exactly, every merge must be a real duplicate (same
  book, another edition), and every book Open Library didn't recognise must be named on screen.
- From day 2: ask "Where do you think the recommendations come from?", and check the answer
  matches what the app says.

## Out of scope

Words and notes while reading, community, stats, accounts. Recommendation *quality* is judged by
the offline eval and the owner, not by the simulated user.
