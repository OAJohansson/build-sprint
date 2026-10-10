# To do

Sprint-wide work to come back to: process, tools and skills, not features (those go in a
product's backlog) or new products (those go in [ideas](ideas.md)).

## In flight

Everything on the go right now, sprint and job hunt, in priority order. Claude keeps this current
until the tracking tool (#10) exists. Ask "where are we?" for an update.

**Scribble (product 03)**
1. Rename the Vercel project to `scribble` and add a `.vercel.app` domain; send Claude the URL. *(me)*
2. Live check on the phone; URL on the card.
3. Build step 3: real Claude feedback (`ANTHROPIC_API_KEY` in Vercel).
4. Testing: audit and `break-ui`, then the simulated user test.
5. Wrap-up: success check, retro, interview story, learnings, `status: shipped`; push the wrap-up branch.

**Before product 04**
6. To-do #8: `pnpm ship`.
7. To-do #10: one place to stay on track.

**Job hunt**
8. Book the Montu UK interview. *(me)*
9. Look at what Montu UK offers patients today (15 min), before building for them.
10. Prepare for the charity interview. *(me)*
11. Keep applying for roles. *(me, ongoing)*

**Later:** to-do #9 (Scribble for Mac), #5 and #6 (a real user; stories in my own words), Scribble's model eval (#1).

## Sprint to-do

| # | What | When | Notes |
| --- | --- | --- | --- |
| 1 | **Start learning evals.** Add a small eval to a product, to learn how evals work. | **Next up:** product 02 has shipped | Not extensive. A first candidate: CrossFit Log's AI parsing (spoken note → lifts), with a handful of notes and their correct parse, scored automatically. |
| 2 | ~~**Judge the design skills** (decision 0008): keep or drop.~~ | Done 7 Oct | Kept: `/prototype` and the audit earned their place; no "feels off on the phone" findings. See decision 0008. |
| 3 | **Playwright smoke test from the user test** (maybe). Turn the test agent's passing main flow into a committed test that runs on every change. | When a product gets a second round of changes | No new skill needed; the `user-tester` agent and Playwright are already set up. |
| 4 | **Try Anthropic's `webapp-testing` skill** (maybe). The obvious next testing skill if `user-tester` leaves gaps. | If a product needs browser tests `user-tester` can't do | Mostly overlaps with `user-tester`. It runs Python scripts, which need approval each time in cloud sessions. |
| 5 | **Test with one real person.** Show a product to an actual user, not just the simulated one. | Any product, once its core flow works | No skill replaces this. On day 1 the biggest finds came from using the app on a real phone. |
| 6 | **Make the interview stories mine.** Rewrite the drafts for 01 CrossFit Log and 02 Horizon in my own words, and practise the 30-second version out loud. | This week | Interviewers can hear a borrowed story; rewriting is also how I'll remember it. |
| 7 | **Fill the story bank's gaps.** No strong main story yet for *Ambiguity*, *Technical* and *Speed*. Pick future products that stretch these, and use each story's theme prompts. | Ongoing, check at each wrap-up | Horizon has smaller examples for all three in its theme prompts. The story bank page lists the current gaps. |
| 8 | **Automate the daily deploy setup: `pnpm ship NN-slug`.** One-time `vercel login`; then a script creates the Vercel project with the right Root Directory, copies env vars from the app's `.env.local` (I run it myself, so keys never pass through Claude), deploys, and writes the URL into the card. Plus a `vercel.json` in the starter (and apps 01–03) that skips builds when the app's folder didn't change. | Right after Scribble's wrap-up, before product 04 | Today's setup took ~10–15 min of clicks a day. Check the exact Vercel CLI commands while building (setting the Root Directory is the unknown). Log as a process change in `learnings.md`. |
| 9 | **Rebuild Scribble as a native Mac app in Swift.** Learn SwiftUI by rebuilding something I use daily: same writing flow and look, same Supabase data so web and Mac stay in sync. | After the sprint, or as a later sprint product | Questions to answer first: its own public repo (open source) or inside `build-sprint`; how to sync (same API with the access code, or Supabase directly). **Showcasing to recruiters:** an open-source GitHub repo with a clear README, a short demo video/GIF and the download in GitHub Releases. Most recruiters won't install an app, so the README and video matter most. A download that opens without warnings needs Apple notarization (Apple Developer Program, $99/year); without it, macOS warns about an unidentified developer. |
| 10 | **One place to stay on track: an executive-assistant view.** A simple list of everything in flight across the sprint and the job hunt: ongoing tasks, a backlog, and what to prioritise next, so nothing gets lost while jumping between tasks. | After Scribble's wrap-up (with #8) | Also in Problems to solve; could be a sprint product. Until then, Claude keeps a "plates in the air" summary when asked. |

## Testing: what's covered today

No new testing skills for now (7 Oct); the main pieces are in place:

- **Simulated user testing:** the `user-tester` agent drives the real app in a phone-sized browser
  as the persona. It does what most "QA" skills do.
- **Edge cases and audits:** the `break-ui` and `web-design-guidelines` skills.
- **The gap is regression tests:** nothing checks that a change didn't break yesterday's main flow
  (item 3).
- **Real users:** item 5.
