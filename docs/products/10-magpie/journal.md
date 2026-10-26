# Journey

What happened, what was decided and why. Newest last.

## 26 Oct: finding the problem and the name

- **Looking for a problem.** The owner enjoyed Six AM and Wont most: both solve their own problem
  and both had a world to design. A first list of personal prompts didn't land, so we did a
  research round on "I wish there was an app" posts (Reddit, Hacker News, Quora, Instagram;
  snippets only, Reddit blocks scraping). Eight problems went into `docs/ideas.md`.
- **The spark.** Scattered recipes that never get cooked (an Instagram post) led the owner to the
  wider problem: forgetting the food and drink they loved (a plum hot shot in Taiwan, favourite
  wines and cheeses). It's the same shape as Selvedge, so its setup can be reused. A side idea,
  a music-moments diary, went to Six AM's backlog.
- **Problem before solution.** The owner's first description mixed in solutions (an AI
  illustration, ranking, country filter). We split it into one problem and two jobs: recall (find
  the name fast) and relive (look back at what I tasted). The owner wanted both; they share one
  screen, with the shelf as home and search on top.
- **The name.** The owner wanted a name a brand and mascot can grow from, like Wont's wonton
  (practice: name as promise plus character, Marty Neumeier's *The Brand Gap*). Five options; a
  quick brand sketch of Magpie and Tastebud; a web check found Tastebud used by several food and
  drink apps (two save dishes), while Magpie's only clash is an expense tracker. **Owner picked
  Magpie** and **Founder mode**.
- Kickoff pack drafted from the owner's calls; appetite, devices, rating scale, feel references
  and things to avoid are still open.

- **Devices and design process (owner).** Phone and laptop with one library, like Selvedge.
  Design first in Claude Design: 10 directions, the owner picks 3, iterates with canvas
  comments, picks 1, then every key screen is designed before code and handed to the PM session.
- **Features before screens.** Agreed the MVP feature list and six key screens first (Six AM's
  lesson: agree what the screen must hold before designing it). Share-to-Magpie went in as a
  safety net for the riskiest assumption (capture at the table).
- **10 shelf directions** on the canvas (https://claude.ai/artifact/X4hmxGD5oek8NvT7XbxgjE), all
  with the same six items: nest of treasures, cabinet of curiosities, passport stamps, sticker
  book, field journal, trading cards, bistro menu, polaroid wall, travel atlas, quiet gallery.

- **Round 2: four directions with the magpie.** The owner kept 2 (cabinet), 4 (sticker book), 9
  (atlas) and 10 (gallery), and asked how the brand story and the mascot show up. Instead of all
  screens four times, each direction got two screens: the shelf with the magpie living on it, and
  the "saved" moment (the emotional peak; Kahneman's peak-end rule, as Horizon's sunset taught).
  Four brand stories: the curator (cabinet), the greedy little friend (sticker book), the travel
  buddy (atlas), the quiet signature (gallery).

- **Owner picked the sticker book.** All key screens then designed in that direction: first run,
  access code, empty shelf, capture (photo, details, drawing the sticker), item page, search and
  filter, and the shelf on laptop as a two-page book spread. The phone shelf and the saved moment
  come from round 2.

- **Shelf organisation rethought (owner).** Country shouldn't lead: most yums happen in London
  (about three weeks of travel a year), so kind leads (Food, Drinks, Desserts; wine and cocktails
  matter most under Drinks) and "where" means the restaurant and city, with country secondary.
  Three options on the canvas: 1 kind tabs with sub-chips; 2 a book with "By kind" chapters and a
  "By place" view (restaurants inside cities, home vs away); 3 smart shelves the magpie fills
  (Latest, Your top wines, Around London) plus one filter sheet (kind, sub-kind, hearts, where).

- **Owner picked option 3, smart shelves**, for the overview and because recommendations can grow
  from it. The "every key screen" row became the final hand-off flow (A to L): the capture form
  gained a sub-kind picker and "Restaurant, bar or spot"; saved, item, filter sheet, filtered
  results and the laptop (filter panel always open) were redone to match.

## 26 Oct (evening): build, slice 1, the sticker spike

- **PM session started** (Founder mode) from the merged kickoff (PR #88). The design is final
  (canvas row "Final flow for hand-off", A–L), so the design-pick steps are skipped.
- **Ops (pre-approved, decision 0028 #7):** added a `[10-magpie]` section to the root secrets
  file (ACCESS_CODE = Selvedge's, T1; a new SANDBOX_ACCESS_CODE for graders) and filled
  `.env.local` with `pnpm env-bootstrap`.
- **Eval photos:** no photos of the owner's yet, so 12 freely licensed food and drink photos from
  Wikimedia Commons (`apps/10-magpie/evals/photos/SOURCES.md`).
- **Spike:** four image models through OpenRouter, the sticker prompt in words, then a flood-fill
  cut-out of the white outside the sticker. Gemini 2.5 Flash Image won: 12 of 12 drawn, median
  8.2 s, $0.039, an outer outline on every sticker (L1, decision 0029). Rounded squares work too.
  The sticker bar looks reachable; the formal eval is the data-evals grader's, once the app route
  exists.

## 26 Oct (night): slices 2–4, the MVP build

- **Database (pre-approved additive migration):** `magpie_yums` and the private `magpie` bucket in
  the shared Supabase project (`apps/10-magpie/supabase/schema.sql`). The access code picks the
  library: the owner's or the graders' `sandbox`.
- **Built** every final-flow screen A–L: first run and access code, camera with Maggie peeking (live
  viewfinder, with the phone camera as fallback), details with sub-kinds and the city from location,
  the drawing screen, "Ooh, shiny!", smart shelves, search, the filter sheet with removable chips,
  the item page with the sticker/photo toggle and Undo on remove, the laptop layout with the filter
  panel always open, and the Android share target (Selvedge's manifest and service worker).
- **Save before AI (R4):** the yum and photo save in ~2 s; the sticker is drawn on the server after
  the response (`after()`); the shelf checks every 3 s while one is drawing. Smoke test: sticker in
  ~14–16 s on the dev server.
- **Bug found in my own check:** my plain CSS (button reset, `.btn`) sat outside Tailwind's layers,
  so it beat the utilities: `lg:hidden` was ignored on the laptop and the toggle's text vanished.
  Moved into `@layer base` / `components`. (Knowledge bank: CSS cascade layers.)
- **Unit tests** named in the kickoff (new this month, latest order, home city) plus shelves and
  filters: 16 passing.
- **Grader sandbox seeded** with 12 yums (`apps/10-magpie/evals/seed.mjs`, sandbox code only).
- Persona and test plan written (`user-testing/`). The `data-evals` agent wasn't registered in this
  session, so its role file was given to a general-purpose agent instead.

- **Design-skill audit** (web-design-guidelines, break-ui, mobile-native, emil-design-eng, run by
  a subagent on the code): 20 findings, 19 fixed (feedback 1–19), one parked.
- **Ops (pre-approved):** created the Vercel project `magpie` (Root Directory `apps/10-magpie`, env
  keys for production and preview) with the same API calls as `pnpm ship`, but **without**
  deploying main, so production stays untouched until the owner says yes. Previews deploy from the
  branch with `pnpm ship 10-magpie --preview`.

## To carry over

For the shared pages (knowledge bank, problems, learnings, process changes), written once at wrap-up (AGENTS.md).

- Knowledge bank (technology): CSS cascade layers. Unlayered CSS always beats `@layer` rules, so a
  hand-written `.btn { display: inline-flex }` outside a layer silently overrides Tailwind's
  `lg:hidden`. Put resets in `@layer base` and component classes in `@layer components`.
- Knowledge bank (technology): `after()` in a Next.js route runs work after the response is sent,
  so a slow AI step never makes the user wait (Magpie's stickers).
- Process: the `data-evals` agent file existed but wasn't loadable as an agent type in a session
  started from another session; check `.claude/agents` registration.
