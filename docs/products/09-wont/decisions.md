# Decision log

Every decision except ops (decision 0026): L-numbers for learning decisions, T-numbers for toil. Veto any T-number at any time ("veto T7"). Read at the retro.

| # | Date | Decision | Who | Gate or step | Outcome |
| --- | --- | --- | --- | --- | --- |
| L1 | 24 Oct | Habits in scope: build (sleep, reading, writing) and stop (nicotine pouches); self-doubt to backlog | owner | kickoff | |
| L2 | 24 Oct | No notifications or email in the MVP; comeback message shows in the app | owner | kickoff | |
| L3 | 24 Oct | Short intro animation in the MVP as a learning goal (15–20 s, skippable, three research messages) | owner | kickoff | |
| L4 | 24 Oct | Stop habits in the MVP: clean days counted, slips and urges logged, no reset to zero | owner | kickoff | |
| L5 | 24 Oct | Name: Wont | owner | kickoff | |
| L6 | 24 Oct | Appetite: one day; animation capped at ~1.5 h, cut order named in the pack | owner | kickoff | |
| L7 | 24 Oct | Feel: a drawing board of big, bold cards, not a checkbox list; references in design/references | owner | kickoff | |
| T1 | 24 Oct | Feel sentence worded by the PM from the owner's words; streak and trophy parts of the references excluded (A1, A5) | PM | kickoff | |
| L8 | 24 Oct | Design calls are the owner's in Founder mode too, and for every future product: shortlist 3 of 8–10 sketches, then pick 1 of 3 prototypes (decision 0026 amended, playbook, AGENTS.md, designer agent) | owner | design | |
| L9 | 24 Oct | Day boundary 04:00 local for every habit (a log at 00:30 belongs to the evening before); calendar-date maths, safe over the 25 Oct clock change | PM (discovery) | discovery | |
| L10 | 24 Oct | A finished day with no log counts as not kept and triggers the comeback; history shows it as "not logged", never "failed" | PM (discovery) | discovery | |
| L11 | 24 Oct | Stop habit: a day is clean once it is over with a clean tap and no slip; a slip overrides; clean days are a total, not consecutive; "clean" counts as kept | PM (discovery) | discovery | |
| L12 | 24 Oct | Rolling rate over the last 7 days (or the habit's age if younger) | PM (discovery) | discovery | |
| L13 | 24 Oct | Wake-up kept is self-reported by the tap; tap time never judges it (A8, P12) | PM (discovery) | discovery | |
| L14 | 24 Oct | Comeback message once per comeback per habit, never stacked | PM (discovery) | discovery | |
| L15 | 24 Oct | R9: today and yesterday can be re-logged, habit wording edited with history kept, delete asks first | PM (discovery) | discovery | |
| L16 | 24 Oct | Pouches goal is quit (owner said "quit", "days without nicotine"); cut-down to backlog | PM | discovery | |
| T2 | 24 Oct | "Ride it out" lasts 60 s, exit in one tap; persona's job-hunt detail kept | PM (discovery) | discovery | |
| T3 | 24 Oct | Board sketches: the card is the tap target; stop habit has three taps (clean, slip, urge); main number always a rolling rate or clean-day total; not-logged days drawn light, never red | PM (designer) | design | |
| T4 | 24 Oct | Draft comeback copy: "Friday's page stayed empty. That's part of it. Today, after your coffee: one sentence is enough." (owner rewrites at review) | PM (designer) | design | |
| T5 | 24 Oct | Sheet 2: one card anatomy per board (name+number, anchor, comeback slot, tap slot); week strip shows share kept per day; no red; no full-bleed saturated cards or wide display faces | PM (designer) | design | |
| T6 | 24 Oct | Sheet 3: one card per line and light boards everywhere; Soft fill colours follow the order of the day (dawn rose to dusk teal) so neighbours never repeat | PM (designer) | design | |
| L17 | 24 Oct | Shortlist: one layout (Jars, one card per line, container on the left) in three variants: jar of marbles, wontons, seed sprout | owner | design | |
| T7 | 24 Oct | The three go straight to working prototypes, no fourth sketch sheet (one-day appetite) | PM | design | |
| T8 | 24 Oct | Prototypes: the one celebration is the new marble, wonton or leaf arriving (420 ms ease-out, off with reduced motion) plus "Kept. N of last N."; tap again to undo; a slip asks its size and leaves clean days untouched; sprout leaves green (illustration only) | PM (designer) | design | |
| L18 | 24 Oct | Design pick: Wontons (critic 6/10). Intended aesthetic stays the pack's feel sentence | owner | design | |
| L19 | 24 Oct | Critic overruled on two points: keep the rolling number (R6, P6) and the week strip (owner's request), both quieter | PM | design | |
| T9 | 24 Oct | Wontons v2: every card one tap target (nicotine tap = clean so far; slip and urge as quiet text buttons); kept = whole-card honey wash (200 ms fade); number muted under the name; comeback as one plain line | PM (designer) | design | |
| L20 | 24 Oct | No "missed" event: an unlogged finished day is the miss (L10) | PM (engineer) | build | |
| L21 | 24 Oct | Grace first day: an unlogged first day is neither a miss nor in the rate | PM (engineer) | build | |
| L22 | 24 Oct | Rate window ends yesterday until today is logged; "clean so far" counts as kept today; clean-day total counts finished days only | PM (engineer) | build | |
| L23 | 24 Oct | A slip counts as a miss for the comeback message; undoing a slip restores the earlier clean tap | PM (engineer) | build | |
| T10 | 24 Oct | Slip size 1 / 2 / 3+, one per day; urges only on the current day; comeback message keyed by the first missed day of the run | PM (engineer) | build | |
| L24 | 24 Oct | The mark: Dough on ink, closed content eyes; the comeback wonton winks (Plum wink's eyes) as a little extra motivation | owner | design | |
| T11 | 24 Oct | Board v3: ink header band with the week strip, dough and paper cards; clean so far shares the kept wash, a slip turns the stop card cool oat-grey; app icon full-bleed square in public/ | PM (designer) | design | |
| T12 | 25 Oct | Round 4: slip keeps the stop card on paper; no ghost seat; 124 px steamer; week key "share kept each day"; "Slipped" / "Had an urge"; "Tap if clean so far" | PM (designer) | design | |
| T13 | 25 Oct | Other screens: intro ~18 s in three scenes (comeback wonton winks), "Done when" chips on new habit, optional friction step "do it once, today", 60 s full-screen urge pause with one-tap exit, slip size in a sheet | PM (designer) | design | |
| L25 | 25 Oct | Icon stays Dough on ink (#2a2420); header: no band, ink for type only, week strip on a soft dough card | owner | design | |
| T14 | 25 Oct | Intro Skip goes straight to the board; the empty board carries "Make my first promise"; replay is a quiet footer link | PM (engineer) | build | |
| T15 | 25 Oct | No dark band on form and habit screens either; intro and ride-out stay on ink | PM (engineer) | build | |
| T16 | 25 Oct | Edit, delete, re-log yesterday and 14-day history live on /habit/[id], reached by "⋯" on each card | PM (engineer) | build | |
| T17 | 25 Oct | Comeback line marked seen when the app is hidden or closed; an urge is logged on tap, even if the pause is left early; tapping a stop card with a slip opens the slip sheet | PM (engineer) | build | |
| T18 | 25 Oct | Status bar cream to match the board; web app manifest with the ink icon; new habit's title is its action | PM (engineer) | build | |
| T19 | 25 Oct | Fix pass: card keeps " · goal"; stop line "Usually {trigger}. Instead: {replacement}"; comeback line names the last missed day as what it was; "ridden out" lasts the visit only; muted text ink at 70% | PM (engineer) | fixes | |
| L26 | 25 Oct | Comeback message rule changed (supersedes L14): due whenever today opens with yesterday missed and today not yet kept; "seen" keyed on the run's last missed day; one message per habit, not repeated the same day | PM | fixes | |
| T20 | 25 Oct | Card titles shown with a capital first letter (display only); morning-after-slip message gets one next step | PM | fixes | |
| T21 | 25 Oct | Preview: Vercel project `wont` created without a GitHub link; branch deployed from the CLI (went to Production by mistake, wont-peach.vercel.app) | PM | ops | |
| L27 | 26 Oct | v1.1: sync phone and laptop through the shared Supabase project with an access code (Selvedge pattern, decision 0021); lifts the kickoff's "one device, no backend" no-go | owner | v1.1 kickoff | |
| L28 | 26 Oct | Merge rule: last change wins per habit and per habit-day (each stamped with the time it changed on the device); a delete or an undo is a stamped change too, so it never comes back; equal stamps keep whichever side has data, so legacy unsynced history always survives the first connect | PM | v1.1 build | |
| L29 | 26 Oct | One JSON document per space on the server (`wont_docs`), merged with the same pure function as the client, saved with a revision check so two devices can't overwrite each other | PM | v1.1 build | |
| T22 | 26 Oct | Seeding (`?seed=`, `wontSeed`) refused on a device synced to the owner's board, so a test state can never replace the real one everywhere | PM (engineer) | v1.1 build | |
| T23 | 26 Oct | Way in: a second footer link on the board, "Use on another device" (reads "Synced" / "Offline, saved here" once on); Sync screen in the habit form's style; "Stop syncing on this device" keeps the device's data | PM (engineer) | v1.1 build | |
| L30 | 26 Oct | Offline shell: a small network-first service worker (production only) caches pages and assets, never `/api`, so the board opens with no signal (feedback 44) | PM | v1.1 fixes | |
| L31 | 26 Oct | A seen comeback message is per device (supersedes syncing it): the phone in the morning still shows what the laptop showed last night; still once per device per run (L26) | PM | v1.1 fixes | |
| T24 | 26 Oct | Critic fixes: one phrase end to end ("Use on another device", button "Share this board", "This board is shared"); "nothing on this device is lost" in the subtitle; code typed in the open; a dot between footer links; a line after stopping; field frame and radii kept (approved form style) | PM | v1.1 fixes | |
| T25 | 26 Oct | Offline, the board's footer status is plain text, not a link | PM | v1.1 fixes | |
| T26 | 26 Oct | Critic round 2 (7.5/10): no duplicate field hint (the code is given, not made up, so "make one up" skipped); "Up to date, 16:27"; offline "kept here and shared when you're back"; the stop line in the paper status card, regular weight. Design rounds stopped: the remaining gaps were copy only | PM | v1.1 fixes | |
