# Journey

What happened, what was decided and why. Newest last.

## To carry over

For the shared pages (knowledge bank, problems, learnings, process changes), written once at wrap-up (AGENTS.md). **Written 25 Nov** (wrap-up commit).

- **Problems to solve:** add the row for this product (big fields, one-school deep dives, boredom) with status "Building: 11 Meander".
- **Knowledge bank, design and UX:** Shneiderman's mantra "overview first, zoom and filter, then details on demand" (1996, information visualisation).
- **Knowledge bank, customer insight / learning science:** Ausubel's advance organizer (a frame to hang new facts on); dual coding (Paivio: words plus picture beat words alone, for almost everyone); "learning styles" matching does not hold up in studies; interleaving and spacing (Robert and Elizabeth Bjork, desirable difficulties), strongest evidence in maths and category learning.
- **Knowledge bank, product strategy (added 25 Nov, after wrap-up):** competitive alternatives: list what people would use if your product didn't exist, including "do nothing" and "ask a chatbot", not only look-alike apps (April Dunford, *Obviously Awesome*, 2019). Met in Meander's market scan.
- **Process:** Wispr Flow dictation kept failing at kickoff; its connector only sees Scratchpad notes and Notetaker recordings, not dictation history. Workarounds: Mac dictation, Notetaker, or local Whisper.

## 12 Nov: kickoff

- **Start.** Owner asked to start product 11 while another session reworks 07 Six AM (don't touch it; both sessions may need the owner at once). New Anthropic key is in `.env.secrets.local`; `pnpm ship` fills it. A stale `11-kickoff` worktree from an earlier attempt had no commits of its own; left alone, new branch `claude/11-meander` cut from `origin/main`.
- **Problem, in the owner's words (dictated, summarised).** "I'm a visual learner; things I see stick." Broad interests (psychology, philosophy, history). Wants a visual overview of a big field before digging in: start high level, zoom into an area, see its key themes, questions and thinkers, go deeper. Starts with philosophy (a few weeks on existentialism: Sartre, Nietzsche). Wants to try Fable on a creative, visual problem.
- **Coaching given.** Named Shneiderman's mantra and the advance organizer. Pushed back on "visual learner" (learning-styles matching doesn't hold up; dual coding does), on "mind map" as a solution, and flagged accuracy (an AI-drawn history can be confidently wrong) as a risk.
- **Today's alternative.** Claude Socratic training modules with quizzes on existentialism: good, keep them. The gap is before them: no picture of the whole field.
- **The cost (the turn).** Without an overview they stay in one school for weeks, obsess, get bored and drop it. What keeps them engaged is variety: small pieces across connected areas, the same way they now mix job search, building and interview practice through the day. They named the trade-off themselves: switching has a cost. So the map's job is also "where could I go next, and where have I been", not only "the big picture". Learning science: interleaving and spacing (Bjork).
- **Problem statement (default, owner can change):** When I get curious about a big field like philosophy, I dive into one school and stay there for weeks, because I have no picture of the whole field to show me what's connected and where else I could go. So I go deep, get bored and drop the subject, when what keeps me going is variety: small pieces across connected areas.
- **Two motives, both named:** the learning gap, and building something creative with Fable (playbook goal A). At the MVP cut, each feature says which it serves.
- **Mode: Streamlined (L1).** Recommended because the problem was still moving (it shifted twice in the conversation), too early for a fixed Founder pack, and the creative design part is one of the owner's gates anyway. Owner: "let's try streamlined".
- **Name: Meander (T1),** a working name for wandering between connected ideas.
- **Scaffolded** with `pnpm new meander "Meander" --mode streamlined`. Brief drafted (problem, who, jobs, alternatives, risks) for the kickoff gate, asked one question at a time.
- **Gate Q1, moment of use (L3):** laptop at a desk, sit-down study; phone secondary.
- **Gate Q2, riskiest assumption (L4):** value, "I'll hop". Feasibility (Fable's accuracy) becomes a guardrail. Success measures drafted around it.
- **Gate Q3, success measures (L5):** approved as drafted. MVP cut drafted next.
- **Gate Q4, MVP cut (L6):** approved. Fable writes the map once at build time; live maps of any topic are the next rung. Drill-down, requirements, unit-test pick and backlog drafted.
- **Gate Q5, feature drill-down (L7):** "All good". **Kickoff gate closed.** Asked one question per message (owner's preference) instead of one sheet; decisions L1–L7, toil T1 (name). Next: merge the empty starter and ship it, then the design pick gate.
- **Shipped the empty starter:** PR #97 merged on the owner's yes after 8 green checks; `pnpm ship 11-meander` created the Vercel project "meander", live at https://meander-virid.vercel.app (no env keys needed yet: no live AI in the MVP).
- **Persona and test plan written** (Sam, based on the owner; five scenarios from the jobs and success measures). **Design round 1 started:** owner asked for ten rough, genuinely varied mockups, each its own branded design system with a personality, Fable being creative but UX-minded, to pick 3 to refine before choosing one. Designer agent running on Fable.
- **Design round 1 delivered:** ten rough branded directions on Fable (Transit, River, Departures, Night chart, Wall text, Yes but, Stamps, Strata, Rooms, Orbit), contact sheet in `design/round-1/`. Sample content not yet accuracy-checked. Owner picks 3.
- **Round 1 verdict (owner):** "most of these are quite terrible, I get a headache looking at them". Orbit is the right track: the mind map, wherever you are is the centre. But it looked basic. Asked for three distinct, visually elevated options in Orbit's direction; at least one a big web or globe of threads floating as if in space, without literal space (it would look geeky), with a branded concept and calm, not sparkly, colours. Logged as L8. Lesson for the brief to designers: ten directions at once pushed every mockup to be dense and wordy; the headache is a density problem, not only a style one.
- **Design round 2 delivered:** three elevated webs in Orbit's spirit, each with field and thinker screens plus a brand board: A Clew (a ball of thread in a dim room, pine and brass), B Red thread (editorial page, your path is the one red thread), C Mobile (paper discs hanging in daylight). Craft skills run; no thread crosses a label on the sample data. Sent to the design critic.
- **Critic, round 2:** A Clew 6/10 (only one with the floating globe, calmest mood; meaningless sphere arcs, split centre, faint far labels), B Red thread 7/10 (strongest hierarchy; a timeline not a web, the red thread points backwards), C Mobile 7/10 (best hop affordance; nothing hangs, thinkers crowd the centre, tips toward cute). Fix pass sent to the designer, written to `design/round-2b/` beside the originals.
- **Round 2b (fix pass) delivered** beside round 2: A's globe holds every school with three faint arcs; B rebuilt as a word-web centred on the school with knots for the past and red loose ends for next hops; C rebuilt as a hanging mobile (reads close to a tree diagram now). Themes removed by the critic's point; T2 brings them back one click in. Sent back to the critic for a re-score.
- **Critic re-score, round 2b:** A Clew 9/10 (+3; left: lopsided globe, tiny relation verbs, loose centre), B Red thread 8/10 (+1; still a page, fragile Bodoni hairlines), C Mobile 8/10 (+1; now reads as a family tree, history upside down). Final pick goes to the owner with a recommendation for A.
- **Final design pick (L9): A · Clew.** Next: the designer closes the critic's last gaps and draws every state the build needs, then the screens go on a Claude Design canvas for the owner's sign-off before any UI code (decision 0028, amended 27 Oct).
- **Round 3 (Clew, all states) delivered:** the globe is now computed, not hand-placed: each school has a fixed place on a sphere and focusing one turns the sphere to face it, which fixed the lopsided globe and makes any focus work. Nine states (main, thinker, copied, themes popover, Stoicism focus, first visit, worst case, phone, brand board) plus `handoff.md` with tokens, the position rule and interactions. Designer's calls logged as T3–T8.
- **Critic final check, round 3:** main state 9/10 (score held; rounds stop here). Left: neighbour threads stop short of the centre, bright doesn't always mean "one step away" (Stoicism looks like a neighbour; six bright schools on the Stoicism view), dimmest far labels, the themes box covers neighbours, copied state loses the thinker row, first visit not centred, a wrong "over 3 days", the phone's vertical line reads as a sequence.
- **Sign-off canvas live:** https://claude.ai/artifact/XRe4mnoXGdpbgX8xteM3qv (private), the nine round-3 screens plus a note with the critic's open points. The owner's comments and the critic's points go into one fix round, then back on the canvas; no UI build before the owner approves it.
- **Canvas comments, 13 Nov:** progress tracker off the globe into a "Your thread" panel (L10). Open: the "Whole field" pill (suggested removing it), themes in the card and clickable (suggested), the school list (suggested a checked list of 18–20), the welcome line out of the threads (suggested bottom-left).
- **Canvas comments, 13 Nov (cont.):** welcome line to bottom-left (L13). Owner asked for a proper research pass on trusted sources, a comprehensive overview, and evals against hallucination (L14). Open question back to the owner: how big "comprehensive" is (the globe stays readable to about 24 schools).
- **Sign-off round started (13 Nov):** owner's comments done. Designer on round 4 (L10–L13 plus the critic's last points, tested at about 24 schools, provisional until the owner confirms the count). In parallel, a research agent builds the sourced school list and links from the Stanford and Internet Encyclopedias of Philosophy (L14), into `content/`.
- **Round 4 delivered:** L10–L13 and the critic's points done; 24 sample schools hold with no label overlaps, but busier (more threads behind labels, a label past the rim in 7 of 24 focuses, Phenomenology's label cuts Absurdism's thread on the main view). Designer's calls T9–T16 in its report; L10 vs L13 wording conflict resolved as L10 (Your thread in the top bar, only the first-visit line bottom left).
- **Round 4 on the canvas** beside round 3 (right-hand block, titled "Round 4: with your changes"), with a teal note listing what changed and what's still open. Content research still running.
- **Design approved (L16).** Build plan: the engineer builds the app from `design/round-4/handoff.md` on the designer's sample data, with the content kept in data files so the sourced content drops in later. In parallel: the owner approves the sourced school list, then a writer produces full content per school from the encyclopedias, and a separate grader (data-evals) checks it for hallucination before the first working version gate.
- **Sourced school list delivered (research):** 24 schools, 58 links (42 built on, 16 pushed against), all from SEP/IEP with quotes script-checked against the downloaded entries; 86 of 89 thinker dates sourced. Firecrawl summaries hallucinated early (Kant's chair at Jena), so nothing relies on them: lesson for the evals, never trust a summary, check against full text. Seven open questions go to the owner with defaults.
- **MVP app built on sample data** (engineer): all states match the approved screens; build, lint and 7 visit tests pass (also under two other time zones). Only Existentialism, Stoicism and Beauvoir have content until the sourced content lands. Known: label placement limits (past the rim in some focuses, Phenomenology/Absurdism), no arrow keys, focus not in the URL (`// shortcut:`).
- **Critic on the built app:** 9/10, same as the approved mockup ("the build loses nothing"). Six findings logged in feedback.md (#1–6) for the fix round.
- **Full content written** (writer, four parallel batches from the saved SEP/IEP corpus): 23 schools, 69 questions, 115 themes, 88 thinkers with 264 key ideas and 88 study prompts, 57 links; 784 sourced objects, validator 0 errors. One invented Mill quote caught and removed; known date conflicts and thin cards listed in sources.md. Next: an independent grader (data-evals) checks every claim against the corpus while the engineer wires the content in.
- **Real content wired in** (engineer): re-runnable import from `full.json`, 23 schools with sources on every item, embedding re-tuned (L19), label placement reworked: no overlaps in any focus, 10 small rim pokes, one ambiguous pair on the Enlightenment. Critic fixes a–e done. Not shown in the UI: sources, the full reacted-against sentence, descriptions (queued for the gate). Grader still running.
- **Content grader (data-evals, claude-opus-5-5 judge + hand checks):** 2,825 claims: 2,540 supported (89.9%), 282 unsupported, 3 wrong (Skepticism as negative dogmatism, Erasmus/Luther split, Dasein). 100% sourced; links 56/57 (Rationalism → Skepticism only 'some interpreters'); study prompts 52/88; hand spot-check 20/20. About 89 failures fix by re-citing. Run cost about $23. Fix round to the writer, then re-grade the changed items.
- **User test (Sam, simulated):** S1–S5 pass; jobs 3/4/4. Findings F1–F8 logged as feedback #7–15. Fix round: F2, F3, F7, F8 and hover-lit threads (L20); evals reconciled (T20); F4 (mark 2–3 to try first), F5 ("next on your thread") and era cues go to the gate as questions.
- **Content fix pass (writer):** 218 items changed (106 re-cited, 171 rewritten, 23 cut and replaced with sourced ones), the 3 wrong claims fixed, Rationalism → Ancient Skepticism cut (56 links), dates made honest where sources disagree. Validator 0 errors. Re-grade of the changed items next.
- **UI fix round done** (engineer): description in the card, link reasons on hover/focus, overview hover lights a school's threads, two-way verbs, "Also in", phone targets 44 px. Fixed content re-imported (56 links), positions recomputed; build, lint, 7 tests pass. Open: descriptions run 3–4 lines (need short taglines), link labels read from one end only; both go to the writer after the re-grade.
- **Content re-grade (round 2):** 0 wrong (from 3), 16 unsupported (from 282), links 56/56, prompts 78/88, spot-check 20/20. The API judge hit the account's usage limit (access back 1 Dec) after 115 of 229 items; the grading agent graded the other 114 in-session against the same rubric (marked in the log). Cost about $28 for both rounds. Last content pass next: the 16 claims, 10 prompts, ~90-character taglines, link labels that read from both ends.
- **Last content pass (writer):** 81 items: the 16 claims and 10 prompts fixed, 23 taglines (≤ 87 characters), 34 link labels rewritten to read from both ends. Re-imported. Final grade of these 81 next.
- **Final content grade (round 3, in-session; API judge over its limit until 1 Dec):** 7 of 855 items failing (1 wrong: Stoicism→Aristotle label; 5 taglines; 1 prompt citation). Prompts 88/88, links 56/56, sourced 100%, spot-check 20/20. About 195 items were last graded in-session by the grading agent, not the API judge: a method caveat for the report.
- **Content passes every bar (round 4):** 0 wrong, 0 unsupported of 855 items; prompts 88/88; links 56/56; sourced 100%; spot-check 20/20. Caveat kept: ~195 items last graded in-session (API judge over its limit until 1 Dec); a judge re-run after 1 Dec would close it. Backlog: re-run the judge; 7 link labels longer than 4 words.
- **Globe layout re-tuned (L21):** 0 overlaps, 0 labels over dots, 0 swapped pairs in every focus; 8 rim pokes. Date line wraps at 340 px; hovered reason paints above other labels. Final content re-imported.
- **First working version gate (13 Nov):** preview https://meander-igcr33bd9-mimirswell.vercel.app, eval report in `eval-report.md`. Owner asked to run straight through to the merge ("don't stop for me until the merge"), so the gate's open questions go with the merge ask: F5 "next on your thread" (tests the hop bet), F4 mark 2–3 neighbours to try first, era cues in the overview (job 1 scored 3/5). All three are in the backlog as the next phase's candidates.
- **Merged and live (25 Nov):** PR #100 merged on the owner's yes, live at https://meander-virid.vercel.app; notebook republished (page + 7 files).
- **Wrap-up (25 Nov):** success check, retro (three process changes), story, card shipped; shared pages written once: knowledge bank (Shneiderman, advance organizers and dual coding, interleaving and spacing, grading AI content against a corpus, with quiz questions), Problems to solve, learnings and the process changelog, playbook steps 1 and 3b.

## 25 Nov: market scan (after wrap-up)

- **Ask.** The owner wants to try launching an app for other people as a learning exercise: finding users, pricing, maybe freemium. First they want to iterate on Meander until it's worth using, and to know whether anything similar exists. They're also thinking about fields beyond philosophy, such as world history and wine.
- **Scan** (`market-scan.md`):
  - The closest look-alike is a free hobby site, Map of Philosophy (map.ebarakos.com). The closest commercial player is Kinnu: free, map-based pathways across many fields, 1.2M users.
  - Wine is crowded (the Wine Folly app launched Aug 2026; Sommo has a globe with a "wine journey").
  - No product found combines connections with reasons, checkable sources, a memory of where you've been, and a hand-off to an AI tutor.
- **Coaching.** Named competitive alternatives (Dunford). Pushed back on starting with marketing and pricing: the hop is still unproven even for the owner, so the day-7 check (about 2 Dec) comes first.

## 25 Nov: the owner's own-use feedback (phase 2 starts)

- **Brain dump after using the live app:**
  - Focus is too busy.
  - There's no way to study a whole school.
  - The card is hard to read.
  - No sources are visible.
  - The content is too thin ("the value isn't there"; aim closer to a Wikipedia article).
  - The first open leaves you asking "what do I do?"
  - "Your thread" counts every click (parked by the owner).
- Logged as feedback #16–22. I proposed an order, asked the owner to confirm it, and started no work.
- **Order agreed** (focus mode, then the school card as one job, then the first open; "Your thread" parked). **Subscription only (L22):** the owner doesn't want to spend on the API, so grading runs in fresh subagents with a fixed rubric, a second-grader sample and a hand spot-check.
- **Focus mode built (L23):** unrelated schools become faint dots with no label, and their threads are hidden. Checked: 0 label overlaps in all 23 focuses; faint dots that land under a label are hidden.
- **Link words unclear (#23, T26):** the old words flipped subject depending on direction. Now the neighbour is always the subject, the name comes first and "it" is the school in the centre: "Marxism / inspired it", "Post-structuralism / provoked it", "Feminist Philosophy / grew from it".
- **Depth decided (L24):** option A, piloted on Existentialism. The old saved source copies were wiped with the scratch folder, and the repo is public, so new copies go to the git-ignored `apps/11-meander/.corpus/`. The writer agent is gathering sources and writing; graders come after.

- **Pilot written:** 1,621 words of school text. It draws on 11 sources: 7 SEP, 3 IEP and the OpenStax open textbook. Britannica blocked automated fetching, so it was skipped. The writer's self-check passed. Three graders are now running in parallel: two split the 28 items between them, and a second grader re-checks a random 8.
- **Pilot graded (subscription only):** round 1 checked 141 claims: 0 wrong, 0 unsupported and 4 drifting items, which the writer fixed. Round 2 checked the 10 changed items: 51/51 supported. The second grader agreed on 7 of 8 sampled items (it was more lenient on one), and my hand spot-check held 6/6. The readable review page is `content/pilot/existentialism.md`. Next: the owner reads it and decides whether to roll it out to the other 22 schools.

## 26 Nov: the owner reviews the pilot

- **Verdict:** "much better", with a real overview of the school. Two asks:
  - **Apply it to your life (#24).** This is the part the owner finds most interesting, and it has to be grounded, not "AI slop". They named the School of Life as the model.
  - **Lighter references (#25).** Keep every source, but replace the strings of footnote numbers with something quieter. This goes into the card design.
- **Source check:**
  - The School of Life has essays on Sartre, Camus, Heidegger, "Kierkegaard on Love" and "Existentialism and Dating".
  - Existential therapy has evidence behind it: Vos, Craig & Cooper (2015) is a meta-analysis of existential therapies, which found the clearest effects for meaning-centred ones.
  - Practice named: *philosophy as a way of life* (Pierre Hadot), the tradition of asking exactly this question.
- **Open (owner's call):** how to source the apply section. Roll-out to the other 22 schools waits until the pilot includes it.
- **Apply section written and graded (L25):**
  - Three practices: Sartre's student and the adviser, Frankl's "what does this moment ask of you", and Nietzsche's "would you live it all again?".
  - Sources: Sartre's lecture, *Gay Science* §341, the Vienna and US Frankl institutes, and the Vos 2015 meta-analysis.
  - The School of Life is paywalled, so it isn't cited.
  - Graded over three rounds: from 1 unsupported and 1 misattributed down to 18 of 18 supported. See `eval-pilot/README.md`.
  - I made the round-3 wording fixes myself, so a grader re-checked them.
  - Next: the owner reads the section.

## 26 Nov: readability pass

- **Owner:** "a good first MVP for what I want this product to do", but at times they felt lost. Two problems:
  - Terms are name-dropped without explanation ("the detached view from nowhere"), so a reader new to philosophy can't follow (#26).
  - Long lists sit inside sentences, such as Frankl's three avenues (#27).
- **Decided (T27):** a beginner style rule for all school content, applied to the whole pilot. Then two checks:
  - A fresh "newcomer" reader flags any term still unexplained.
  - Graders check that the rewrite didn't change any facts.
- Practice named: *plain language* and the *curse of knowledge* (Heath brothers, *Made to Stick*). Once you know a term, it's hard to notice that others don't.

## 26 Nov: the skeleton idea (#28)

- **Owner:** inside a school, show visually how big it is. All three kinds of "big" matter:
  - how much there is to learn (ideas, questions, time);
  - how far it reaches (when and where);
  - how much room is inside it (thinkers, and how far apart they stand).
- In the owner's words, the product is "a framework for learning": before you study any subject, you get a skeleton of it, then you connect new details back to it. They want research-backed learning theory to guide this, then an MVP cut. "Get it right from the beginning", but with scope kept small.
- **Coaching:**
  - This is a sharper statement of the product than "a map of philosophy". It also says what would make the hop worth it.
  - I pushed back on a mind map inside a school: most idea-to-idea links would be invented, with no source behind them.
  - Next: a research brief, then one question at a time.
- **Content, second pass:**
  - 2,109 words and 13 people named.
  - The newcomer still felt lost (3 of 5).
  - The repeats now come from the structure: the timeline, key works and themes cover the same books. A structural pass comes next.
- **Research brief** (`research-learning.md`), on overviews before details:
  - **Advance organisers** help modestly (d ≈ 0.2–0.66), and most for newcomers.
  - **Pre-training and signalling** are well supported: name the main parts first, then show where you are in the structure.
  - **Concept maps:** building one beats studying one (about 0.75 vs about 0.4).
  - **Showing size or progress:** evidence is thin and mixed. A big number up front could put people off, so test it.
  - **Timelines for adults:** untested.
  - Next: the owner picks the MVP cut for the school skeleton.
- **Readability done (T27):** four passes, from 2,573 to about 2,020 words and from about 32 to 11 people named. The newcomer's "how lost" score went from 3 to 2. Every changed claim is re-graded, with 0 wrong or unsupported left. See the table in `eval-pilot/README.md`.
  - **Lesson:** sentence fixes didn't move "how lost". The structure did: the same books repeated across sections.
  - A writer cut an attribution label to save words; I restored it. Guardrail labels should be checked by script in the roll-out.
  - Next: the owner reads the final draft, then the skeleton design (L26).

## 26 Nov: skeleton design starts (design-session, Discover)

- **Owner:** "Yes, start design" after reading the final draft.
- **Screen:** the school view (L26): zoom from the globe into a short skeleton, with the article below it.
- **Brief:** set for calm, following the Meander retro: few words, large type, one focal point.
- **Directions:** 4 seed strings drawn. 8 one-line directions written (seed-derived, far-away references, and one that sounds wrong) for the owner to react to before anything is built.
- **Round 1 rejected:** the owner said "I kind of hate all of them". The current app is nicer than any of the eight.
  - **Why it missed (my read):** every sketch replaced the globe with a standalone page of flat diagrams. What the owner likes is the globe and a side card in one view.
  - **Their ask:** keep the globe on the side as now, bring the school to life in the card area, and get 10 very different sketches from a different model (Fable 5.2).
  - **Approach:** a fresh designer subagent on Fable (subscription, no API), briefed to keep the current layout and the Clew look, with the current card as baseline. Ten sketches, each a full screen, built for calm.
- **Round 2 (Fable designer):** ten directions, every one keeping the globe (`design/skeleton-r2/contact-sheet.png`).
  - The designer's own strongest three: 3 the spine, 2 the knot opens, 5 index cards.
  - **Sketch gaps:** the link words are the old ones from before T26. Heidegger was added as the sixth person, though he has no thinker card yet.
  - Waiting on the owner's pick of three.
- **Owner pick (L27): the knot opens.** "Bang on… really nice and tidy"; the full-globe versions look too messy. Next: 3 versions of how the knot opens × 3 ways to present the information beside it.
- **Round 3:** 3 knot forms (A) and 3 side panels (B), built by the Fable designer.
  - Critic: A3 clew 8, A2 7, A1 radial 5; B1 one big line 7, B2 tag 4, B3 route 4. It recommends A3 with B1 (`design/skeleton-r3/critic.md`).
  - Tension: the critic marks A1 down for its neighbour labels and radial reading order, but A1 is closest to what the owner called "bang on". The pick is the owner's.
- **Owner on round 3 (#29):** likes A1 most ("zooms in on the ball of thread… more immersive") and asked why the critic preferred A3. None of the B panels work for them yet; B1 at most, and stills make the interaction hard to judge. Agreed order: settle A first, then a new B round.
  - My read: the critic scores stills, so A1's main strength, the zoom into the knot, never reaches it. Its A1 complaints (neighbour labels, arcs crossing labels, no reading order) are clutter that can be fixed. A3's weakness, the globe shrinking to a ball on the side so the ideas read as a list, is built into the form. Recommended A1 with those fixes, plus a short motion clip so the next B round can show the interaction, not just stills.
- **L28: A1, fixed.** Owner said yes. Round 4 is next: the fixed A1 plus about 6 very different side panels, each as a clickable prototype (click a school, the knot opens, pick an idea), so the owner can try the interaction rather than guess it from stills.
- **Round 4 (on L28):** six clickable panel prototypes (P1 open loop, P2 along the thread, P3 editorial column, P4 caption strip, P5 margin note, P6 first page), each in three states, plus worst-case checks. Critic: P2 8, P6 8, the rest 7; pick P2 (the question sits on the thread). Shared fixes include making thread 1 equal until picked and making the knot less like a mind map (`design/skeleton-r4/critic.md`). Review page: `design/skeleton-r4/index.html`. Waiting on the owner's pick.
- **L29: P6, mirrored.** The owner prefers P6 but wants the knot on the left and the overview on the right, and asked to see a prototype first. The designer is building P7 (P6 mirrored) with the critic's shared fixes: no thread looks picked at the start, a less diagram-like knot, readable small text, the place and dates moved up next to the size line, and "Back to Existentialism" always spelled out.
- **P7 built:** P6 mirrored, with the shared fixes in. I checked the screenshots: nothing overlaps, and no idea looks picked at the start. In the picked state the summary is the big text, so the idea title is set only once, on the knot. Waiting on the owner's look.
- **#30:** at the owner's request, P7's picked state sets the idea title again on the right, above the summary, to help recall. The summary went down to 22px. I checked the worst case (a three-line title) and nothing collides.
- **L30: P7 is final.** Next comes the canvas sign-off (decision 0028): P7's screens go on a Claude Design canvas for the owner to comment on in place.
- **Canvas sign-off opened:** P7's three states and two worst cases are on a private Claude Design canvas (https://claude.ai/artifact/1JdsXNBxYx9etM8ZhriYhm). Waiting for the owner's comments and approval before the UI build. Phone layout isn't designed yet; it gets designed during the build, mobile-native.
- **Canvas #31:** the owner wants every globe label inside the rim. The live app has this too: the rim rule is weaker than the rule that keeps a name next to its dot. It goes into the build: make the rim rule near-hard, then check all 23 views and show before and after.
- **Canvas #32:** the threads pull the eye. Three line options are on the canvas next to the originals: A hairline brass, B quiet bone (brass only on the picked thread, my pick), C stitched. Files: `design/skeleton-r4/P7-L*`.
- **Canvas #33:** the facts block feels clustered. Three options are on the canvas: three numbers, labelled lines (my pick), two groups. Files: `design/skeleton-r4/P7-F*`.
- **L31:** the owner picked line B. It's built into P7 (`_src/build_p7.py`) and the prototype is reshot.
- **L32:** the owner picked facts 2. It's built into P7, and the worst case wraps cleanly.
- **L33: canvas signed off.** The owner asked how much the build will cost against their weekly limit. Usage now: 33% of the weekly limit, 9% of the Fable limit. Finding: all 23 schools already have sourced questions, taglines, 5 themes with thinkers, and dates, so the skeleton can be built with no new writing. Only the places and the key-works count are missing. The full articles for 22 schools are the heavy part.
- **Skeleton build started (owner: skeleton first, articles later in batches).** The engineer is porting P7 into the app, adding a phone layout and the rim fix (#31). A sourcing agent is finding places and a numeric span for each school. Other schools have 5 ideas; 'Read it' stays hidden until articles exist (T28: show only the facts we have; key-works count only for Existentialism).
- **Places graded:** 88 claims; 67 supported, 16 drift, 3 unsupported, 2 wrong. Existentialism's 1843–1949 was wrong: 1949 is Beauvoir's feminist book, and her existentialist work runs to 1970. Several spans were one man's lifetime. Fixes are going back to the sourcing agent, then a re-grade.
- **Places round 2:** 18 of 24 re-graded claims supported, 6 drift. I applied the grader's fixes myself: Epicureanism '307/6 BCE–1st century BCE and later'; Scholasticism's Spain quote quoted in full; Rationalism's Germany cited from Leibniz's Hanover years; Marxism's places set to null (the SEP has no biography, so the Where row is hidden); Existentialism 'mid-20th century (roots in the 1840s)'. Every quote was checked verbatim by the grader or by me with curl. Note: this changes the 1843–1949 the owner saw on the canvas.
- **Skeleton built (first working version).** Desktop knot plus first page, the picked state, a phone screen, and the rim fix (0 labels past the rim in 24 views, down from 2). Lint, test and build are green. The places import has been re-run with the graded file. Known: the long Existentialism date line under the globe title crosses a neighbour's thread; phone summaries are the theme's first sentence and still use the old wording (they'll be rewritten when the articles are).
- **Title cutout:** threads no longer cross the title or its date line in any focus (20 of 23 before, 0 after). Threads stop with a hard edge at the title, the same way they do at labels. No user-tester or critic run on the build yet, to save the owner's weekly limit; the owner tries it first.
- **Owner tried the skeleton (27 Nov): "It's good".** Feedback #34–#40: the card's type hierarchy (headings smaller than the body, lists with no markers, inconsistent sizes); rethink Your thread as progress (in progress / done after reading all articles; quizzes later); a menu bar; further reading vs the lost Claude prompt; and a bigger idea: a music globe and, one day, a paid public product. All logged in feedback.md and the backlog.
- **Owner (27 Nov):** go in the proposed order: card type fix, then merge and end the phase; Your thread and the menu in a fresh session. New ideas logged: a timeline mode (#41) and non-Western philosophy (#42), the latter after this batch.
- **Card type fixed (T34)** for #34–#36, desktop and phone, with screenshots `design/skeleton-build/card-type-*.png`. Lint, test and build are green.

## Phase 3 (27 Nov): run on my own while the owner is away

**Ops:** PR #105 merged on the owner's yes, and the notebook was republished from main (version 216). New branch `claude/11-meander-phase3`, cut from origin/main.

**The owner's brief:** work through the feedback without stopping, make the calls, and report the decisions at the end. So this phase runs like Founder mode. I make the product calls inside the owner's stated direction and log each one as an L-number; merging still waits for the owner's yes.

**Plan, in order.** One branch and one PR, with a preview link at the end.
1. **Further reading per school (#39).** Show the sources we already have, labelled "Start here" (the encyclopedia overview) and "Go deeper" (the others). No new content.
2. **Menu bar, and Your thread as progress (#37, #38).**
   - A small top menu: Globe, Timeline, Your thread.
   - Progress per school: not started, then in progress (opened the school or stepped inside), then explored (opened every idea).
   - "Done" (read all the articles) waits for the articles. Until then "explored" is the top state, marked as a shortcut.
3. **Timeline mode (#41).** A second view of the same schools, laid out by their sourced spans from earliest to latest, so "where did it start?" has an answer. Clicking a school opens it, as on the globe.
4. **Eastern philosophy, first batch (#42).** Four traditions written in the same sourced way as the others: Buddhist philosophy, Vedānta (Hindu), Confucianism, Daoism. Each gets a writer, a grader and fixes, and only real, sourced links to the existing schools. They go onto the globe and the timeline.
5. **Close out.** A user test on the whole batch, fixes, a PR, a preview deploy, then the owner's review.

**Budget guard:** the weekly limit was at 35% at the start. I stop new work and report if it reaches 70%. The full articles for the other schools are not in this phase, as agreed (a heavy job, done in batches later).

**Not now:** the music globe and the paid-product strategy (#40). Both get a session of their own.
- **Slices 1–2 built:** further reading (L34), the menu bar (L35) and Your thread as progress (L36). 14 tests (7 new for the progress logic), lint and build are green. Screenshots are in `design/phase3/`. Open question for the owner: with every school explored, the whole globe turns brass. Is that a reward, or too loud?
- **Slice 3 built: the timeline (L37).** 20 tests, lint and build are green. Screenshots are in `design/phase3/timeline-*`. The modern end is dense at 27 rows; hovering helps.
- **Eastern schools graded:** 279 claims; 254 supported, 21 drift, 1 unsupported, 1 wrong; plus 12 newcomer and 15 fairness flags. L38: cut the Enlightenment → Confucianism link (the sources describe praise and projection, not building on) and mention the reception in Confucianism's debatable line instead. L39: the living traditions (Buddhism, Confucianism, Daoism) don't end their spans as if they died. Fixes are with the writer; then a re-grade.
- **Eastern re-grade (round 2):** all 23 round-1 items are now supported. I fixed the last 4 claims myself (the Xunzi Heaven gloss, Wang Bi's li gloss, Zhuangzi's relativism sentence, 'Catholic' cut) and 2 flags (Sāṃkhya dualism glossed; Śaṅkara's three texts named in one plain sentence), each from the grader's sourced fix.
- **Eastern schools in the app (L40):** 27 schools, 58 links, 21 tests, lint and build green, 0 label problems across 28 views. Screenshots are in `design/phase3/eastern-*`. Known: one label sits 70px from its dot in the Analytic Philosophy view; the Yogācāra reading title has no diacritics.
