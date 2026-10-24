# Founder run report: Six AM Ears and Mentor (23–24 Oct)

The owner asked for "what happened in all these review sessions and why it took so long", and
how to improve the design process "to remove friction and issues to get to better more high
quality results quicker". This is the PM's account, from the journal, the decision log (L0–L97,
T1–T39), the eval files and the commit history. Times are from commits; costs are Claude usage
estimates. Nothing in `PLAYBOOK.md` or `AGENTS.md` is changed here: the owner decides from this.

## In one paragraph

Three slices shipped in about 27 hours of wall-clock time: Ears v1 (PR 77), Ears v1.1 (PR 78)
and the Mentor (PR 79). The engineering and the evals worked: every slice met its user-test bar in
the end, honesty and privacy held, and the agents caught most bugs before the owner saw them. The
design did not work: no screen ever reached the 9/10 bar (scores stayed between 4 and 8), and the
owner's first real look at the Mentor rejected it as "too much going on". That one late review
cost a full rebuild of the panel. The root causes are process, not effort: the owner saw pictures
only at the end, the critic changed every round, nothing told the squad to remove before adding,
and each slice was too big to look at in one sitting.

## Timeline

| When (approx.) | Phase | What happened | Rounds / scores | Cost |
| --- | --- | --- | --- | --- |
| 23 Oct 19:57–22:31 | Ears kickoff | Brief transcribed into the pack; 5 gaps sent to the owner, answered one by one over ~2.5 h | 21 decisions | – |
| 20:05–22:19 | Step 0 capture spike | Built in minutes; waited ~2 h for the owner's hands in Chrome | PASS first try | – |
| 22:37 | Step 1 model spike | Discogs-EffNet in a worker; 3 owner runs found a 2:3 BPM error and the "first 60 s is the intro" problem | owner caught both | ~$0 |
| 22:52–23:12 | Ears design | 3 directions, then 4 more rounds on C | 7.5 → 7 → 8 → 8 → 7 (fresh critic each time) | – |
| 23:40–00:54 | Ears build, tests | Analyse view, validation run (owner's Chrome, 10 tracks), data-evals, user test, 2 fix passes | genre 7/10, BPM 5/5, user test pass; critic 7, 7, 7 | – |
| 24 Oct ~01:00 | PR 77 merged | Owner: "happy with this as a first pass" | – | – |
| 09:38–10:09 | Ears v1.1 | My genre + filters; user test, critic, fix pass | user test 4 → 5/5; critic 7 → 7 | – |
| ~10:15 | PR 78 merged | – | – | – |
| 10:21–10:49 | Mentor kickoff, backend | 10 owner calls written into a pack; discovery; backend in parallel with design | – | ~$0.03 |
| 10:49 | Mentor design | 3 prototypes | A 5, B 7, C 6 (picked B) | – |
| 10:49–11:46 | Migration blocked | The permission check refused the Supabase migration as a production change; waited for the owner's yes | ~3 h until the yes | – |
| 11:36–12:32 | Mentor UI build, first graders | Network cut and resume; listen-next search bug; user test 4,4,3,3,4,3; critic 6/10 | 2 fix passes | ~$0.6 |
| 12:49–15:00 | E1 genre loop | data-evals 3/10 → 7 → 6+5 → 5+5 → reverted to the 7/10 method | 4 grading runs | ~$4 |
| 13:48 | Real-DB re-test | E9 pass on Supabase; Studio start re-tempoed the owner's track (not saved) | jobs 4,3,4,4,3,4 | ~$0.2 |
| ~14:30 | PR 79 opened | Eval report, preview | critic 6/10 | – |
| 15:22 | **Owner review: "too much going on"** | 9 owner calls (L85–L94): one chat, nothing under the input, memory, Settings in a corner, locked profile | – | – |
| 15:22–21:40 | Simplified rebuild | Network cut and resume; one chat, memory, help, settings, profile lock | – | ~$0.1 |
| 21:40–22:48 | Reviews of the simplified panel | Emil pass, web guidelines, critic clutter check 6, user test (5,4,4,3,4,3 → all ≥ 4), honesty spot check, PM's own check (key-clash bug), owner's list feedback | 4 fix passes | ~$0.6 |
| ~23:00 | PR 79 merged | Owner chose merge + clean start | – | – |

Total Claude usage for testing and building the Mentor: about $6–7. Ears used none.

## Where the time went, and why

1. **Waiting for the owner's hands or answers (~6–7 h of the 27).** Kickoff gaps answered one at a
   time (~2.5 h), the Chrome capture spike (~2 h), the migration yes (~3 h, overlapping other
   work), and the review itself. Some of this is unavoidable (only the owner can share tab audio),
   but the migration wait and the one-at-a-time kickoff were not.
2. **Design loops that didn't converge (~3–4 h across slices).** 5 rounds on Ears, 4 on v1.1, 4 on
   the Mentor before the owner's review, 3 after. Each round moved a few pixels; none removed a
   whole idea. Scores bounced (7.5, 7, 8, 8, 7) because each round had a new critic with new taste.
3. **The late rejection (~7 h).** The Mentor was built, tested and fixed to "every job ≥ 4" before
   the owner saw it. One look undid the information architecture (tabs, job links, legend, cost
   line, long profile). Everything graded before that point was graded against the wrong design.
4. **The genre eval loop (~2 h, ~$4).** Four grading runs chased one bar (E1 ≥ 8/10) with prompt
   changes that scored worse (3 → 7 → 5.5 → 5). The lesson came late: without the owner's taste
   profile, the model uses the web's genre words, not the owner's; no prompt fixes that.
5. **Interruptions and environment.** Two network cuts killed long agent runs (resumed, but
   restarted context), the dev server had to be juggled between in-memory and real Supabase, and
   shared real data (one `main` chat) meant graders' tests mixed with each other.

## What the agents caught vs what only the owner caught

| Caught by agents (before the owner) | Caught only by the owner |
| --- | --- |
| 30 s SoundCloud previews (L16) | The first 60 s is the intro, so analyse snippets across the track (L26) |
| Model host has no CORS (L18) | The queue was worth bringing into the MVP (L27) |
| BPM 2:3 error fixed and confirmed (owner's run showed it) | **"Too much going on"**: the whole Mentor layout (L85) |
| Playlists list only ~20 tracks; skip-walk fix | One chat instead of tabs; memory across chats (L86, L88) |
| Half-time BPM sent to the Studio as 72.5 | The help answer should be a list (L97) |
| Listen-next invented nothing, but links were wrong; download sites | Needing a phone notification when needed |
| Setup could wipe the profile; stale group reasons | The design process itself ignored clean-and-minimal (L93) |
| Studio start re-tempoing the owner's saved track | |
| Studio start claiming an A# minor track fits A minor loops (PM's own check) | |
| Ear-training timestamps had to come from Ears (owner's session asked; agents verified 5/5) | |

The split is clear: the squad is good at correctness, honesty and edge cases. It is poor at
taste, scope and "is this the right thing on screen", which only the owner judged, and only at
the end.

## Why design scores stayed at 4–8

1. **Critic churn.** A fresh critic each round (by design, to avoid anchoring) meant a new list of
   gaps each time, sometimes contradicting the last ("put % next to the name" vs "split into a %
   column"; "keep the serif title" vs "drop it"). Scores measured the critic's taste of the day,
   not progress. There was no fixed rubric to score against.
2. **Words instead of pictures.** The feel was a sentence ("rekordbox in the Six AM warehouse").
   The owner picked directions from sketches only for Ears; for the Mentor the "design pick" was
   the PM's from the critic's scores. The owner never saw a Mentor picture until PR 79.
3. **No remove-first rule.** Every critic gap was fixed by adding or rearranging (a legend, a key,
   an "All jobs" row, a cost line). Clean and minimal (decision 0007) was in the rules but not in
   the critic's rubric or the designer's checklist, so nothing pushed toward fewer elements.
4. **The designer worked from requirements lists.** The Mentor pack listed 10 jobs, sources on
   every fact, cost, warnings, setup, groups, sessions: the first design tried to show all of it.
   The owner wanted one input. Requirements became UI elements one to one.
5. **The owner's look came last.** Founder mode's single final review is fine for logic but too
   late for layout: by then every grader had optimised the wrong thing.
6. **The 9/10 bar had no anchor.** With no reference screen scored 9, "9/10" meant whatever each
   critic thought; the bar was unreachable by construction.

## Proposal: a new design process and Founder-mode changes

Each item has options and a recommendation. The owner decides; nothing is changed yet.

1. **An early owner design check.**
   - A. 2-minute look at 3 screenshots after the first prototype round, pick one or say "none". ←
     recommended: one look at minute 30 would have saved the ~7 h Mentor rebuild.
   - B. Keep Founder's single final review. Cheapest for the owner, as this run showed: costly.
   - C. Owner picks from sketches at kickoff. Earlier, but sketches hide clutter.
2. **Visual references instead of feel words.**
   - A. The owner pins 2–3 real screenshots ("like Claude's chat", "like rekordbox's list") in the
     kickoff pack; the critic scores against them. ← recommended: pictures beat words (a lesson
     from 07's first run too).
   - B. Keep the one-sentence feel, add an avoid-list. What we had.
3. **A remove-first rule.**
   - A. Designer and critic must list what they removed before what they added; a round that
     adds more elements than it removes needs a reason. The critic's first question: "what on
     screen did the user not ask for?" ← recommended: the clutter check that finally worked asked
     exactly this.
   - B. A hard element budget per screen (e.g. ≤ 5 controls). Simple but crude.
4. **One fixed critic and a fixed rubric.**
   - A. One critic for the whole slice, scoring a fixed 5-line rubric (clutter, hierarchy,
     legibility, feel vs references, honesty of copy), each 0–2. ← recommended: scores become
     comparable, and churn stops.
   - B. Fresh critic each round (today). Avoids anchoring, but scores don't converge.
   - C. Two critics, average. Twice the cost, still no anchor.
5. **Smaller slices, one PR each.**
   - A. A slice is one screen or one job; the owner sees each in a 2-minute preview. The Mentor
     would have been 3–4 slices (chat + explain; genre + accept; listen next; profile and memory).
     ← recommended.
   - B. One phase, one PR (today). Fewer merges, but each review is huge and late.
6. **A fresh session per phase.**
   - A. The PM session ends at each merge and a new one starts from the journal and decision log.
     ← recommended: this session ran 27 h, survived two network cuts and grew a context that made
     every resume slower.
   - B. One long PM session. Keeps context, but fragile.
7. **Pre-approve routine ops at kickoff.**
   - A. The kickoff pack lists pre-approved actions (e.g. "additive Supabase migrations for this
     app's `sixam_` tables", "Vercel env keys for this project"), and the permission settings allow
     them. ← recommended: removes the ~3 h migration wait.
   - B. Ask each time (today).
8. **Better design skills or tools.**
   - A. Try a design skill that renders and compares screenshots against references (or a
     "taste" reference library), on one slice, before adopting. ← recommended as a trial.
   - B. Keep the current skills, but make the designer actually run emil-design-eng,
     web-design-guidelines and break-ui before the critic (this run did so only at the end).
     ← do this regardless.
9. **Evals that test the right thing.**
   - A. Set AI-quality bars only where the method can reach them; for taste-dependent jobs (genre
     in the owner's words), run the eval after the owner's profile exists, as an owner check. ←
     recommended: would have saved the ~$4 genre loop.
   - B. Keep fixed bars and iterate. What we did.
10. **Test data and real data.**
    - A. A sandbox access code / Supabase schema for graders, so tests never touch the owner's
      chat and memory. ← recommended: the owner's real chat filled with ~60 test turns.
    - B. Test on the real store and clean up after (today).
11. **Phone notifications.** Turn on mobile push in the Claude app (`/config` in a terminal
    session). The setting was off, so none of the "needs you" pushes arrived. ← recommended, owner
    action.

**Suggested order:** 1, 2, 3, 4 and 7 cost nothing and fix most of the design friction; 5 and 6
change how phases are cut; 8–10 are trials.

## Numbers

- 3 PRs, 3 merges; 97 learning decisions and 39 toil decisions logged; 0 toil decisions vetoed.
- Design critic runs: Ears 9, v1.1 3, Mentor 8. Highest 8/10 (Ears round 3); final Mentor 6/10.
- User tests: 9 runs. Final: every job ≥ 4/5 on all three slices.
- data-evals runs: 6. Ears genre 7/10, BPM 5/5; Mentor E1 7/10 (bar 8), E2–E9 pass.
- Owner hands-on: capture spike, model spike, 10-track validation, kickoff answers (~20 short
  messages), one big review, one small one.
