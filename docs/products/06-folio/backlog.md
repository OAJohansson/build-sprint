# Backlog

| Idea | Why | Status |
| --- | --- | --- |
| **Word lookup while reading:** type a word, get a short definition, save it to the book; a list of my words to revisit | Paper books have no built-in dictionary; as a non-native speaker I guess from context and never look words up. The most frequent moment: in bed, mid-chapter | Next (v2) |
| **Notes and ideas while reading,** per book | Read intentionally, not passively; keep what a book made me think | Next (v2) |
| Current read shelf | The container for words and notes in v2 | Done (16 Oct): built in the MVP, with Start reading / I've finished it; Goodreads' currently-reading imports here |
| Review my saved words (spaced repetition, a word a day) | Words looked up once are forgotten; remembering them is the outcome | Later |
| Reading community: discuss a book I've finished with people who read it, with little friction | No easy way to talk about books today; needs other users, accounts and a backend, so cold start makes it a product of its own | Later; maybe its own product |
| Other people's one-line reviews on a book page | The scannable overview I wanted from Goodreads; needs a community or a review source | Later |
| Recommendations in the app, live (an API route), instead of a JSON file the lab exports | Recs refresh as I log books, without running the notebook | After the ladder |
| Online evaluation: track which recommendations I save, start and finish | Offline metrics often disagree with real behaviour | After the ladder |
| Stats: books a year, ratings spread | Nice to look back on; not a job today | Later |
| Browse Nobel laureates (literature): our own list of authors, then their best-known books | Prize lists are a trusted way to find serious books; Open Library's Nobel tag returns books *about* the prize | Later (owner, 16 Oct) |
| Browse highest rated, per genre | Open Library ratings are thin; would need a minimum count, or another source | Maybe |
| Browse by release year | Home's New releases covers the main case | Maybe |
| Prefer English-edition covers (e.g. *Prophet Song* shows the German one) | Covers are the design's main visual | With the real import |
| **Reading tracker:** books finished this week, month and year at a glance, with a simple way to look back at any period | See how much I read and keep momentum; date logic needs unit tests (decision 0011), and 19 imported books have only a date added, so counts must say what they're based on | Next after the MVP (owner, 16 Oct) |
| **Reading goals:** set a monthly or yearly target and see progress toward it | A light push to read more intentionally; Goodreads' yearly challenge is a feature people miss | With the tracker (owner, 16 Oct) |
| **After the MVP: review these Home and design ideas** (from critic round 1 and the 16 Oct talk) | Owner kept the MVP Home as is, with Folio's picks first; revisit once it has been used | Review after ship |
| Home: **Up next from your shelf**, the top 3 of my 285 want-to-read books ranked by how much I'll probably like them, each with a reason | My own list is the biggest source for "what next"; changes as I log; a measurable recommender job | Review after ship |
| Home: **rediscover old saves** ("Saved in 2021, still waiting: *East of Eden*") | Brings back books I forgot I wanted | Review after ship |
| Home: **your year in reading** (a count, later "4 of 12" with goals) | Momentum at a glance; pairs with the tracker and goals | Review after ship |
| Home: **your taste in one line** ("Mostly literary fiction and memoir; you rate queer fiction highest") | Makes Home feel like mine; shows what the recommender learned | Review after ship |
| Home: **on this day** ("A year ago you finished *Four Thousand Weeks*") | A small, personal return reason | Review after ship |
| Home: **your latest reads** (last two diary rows) and, with v2, **reading now** (cover, progress, last note) | The critic's "home for my reading"; a shortcut to log or edit | Review after ship |
| Home: **one discovery row** with a switch (Popular, New, NYT bestsellers) instead of separate rows | Less bookshop window, more room for my own reading | Review after ship |
| Book page: **synopsis** (Google Books), **NYT review link**, **reader rating and count** and genre tags voted by readers (Hardcover), **prize badges** (Wikidata), "people reading now" (Open Library) | Richer than Goodreads' book page without walls of text; check in the data test which fields are really there | Review after ship |
| Other readers' reviews from Hardcover, if its API returns them | The scannable "what people think" I wanted; unconfirmed | Check in the data test |
| Home or Search: **prize winners you haven't read** (Wikidata), **NYT bestsellers** row | More literary than Open Library's trending list | Review after ship |
| Search: plain search screen (field and recent searches), genres as a quiet text list, Booker moved to Home (critic) | Critic: neither a search nor a browse screen; owner kept the browse layout for the MVP | Review after ship |
| Want to read: covers only, title on tap (critic, Letterboxd's poster grid) | Owner wants readable titles for now | Review after ship |
| Owl and name on Home only; Search and Shelf start with their own content (critic) | Saves about 50px per screen | Review after ship |
| Read: lighter month headings (critic: heavier than book titles) | Owner asked for more defined headings; revisit with real use | Review after ship |
| **Automated import check:** a test that imports a fixture export through the real routes and checks that books + merges + skipped = rows, merges are real duplicates, unrecognised books are reported, and every field reads back from the API exactly as in the file | The owner's rule: once others use Folio, nobody may lose a book on import (feedback 2). Fits sprint to-do #3 (a regression test) | Before anyone else uses Folio |
| **Fix a match:** for a book Open Library didn't recognise, search and link the right book (or another edition) to get its cover and genres | 15 of my books are unmatched (translations, a boxed set, a typo); a looser automatic match picks the wrong books (feedback 3) | Next |
| Try Google Books and Hardcover for unmatched books in the data test | Translations and new books may be in other catalogues | With the keys |
| **Import from other apps' CSV exports** (StoryGraph, LibraryThing, Hardcover…): one adapter per known format → the same import rows; later a "match your columns" step for any other CSV | Switchers bring their history from anywhere, not only Goodreads. Each format differs in column names, date formats, rating scales (StoryGraph allows quarter stars) and shelf words ("to-read", "want to read", "did not finish"); the no-book-lost check applies to each | Later, before anyone else uses Folio (owner asked, 16 Oct) |
| **Recommender, after the four-step ladder:** learning to rank (LightGBM LambdaMART on features from every level), diversity re-ranking (MMR), sequence models that predict the next book from reading order (SASRec), two-tower retrieval, LLM-based recommenders (semantic ids, conversational picks) | The owner's long-term goal: the most advanced book recommender, built in iterations, each one beating the last on the same eval | Long term (owner, 16 Oct) |
| **Online evaluation in Folio:** log what was shown and what I did (saved, started, finished, dismissed), interleave two recommenders in one list, and a thumbs up or down per pick | Offline metrics often disagree with real use; one user can still compare recommenders by interleaving | After step 2 |
