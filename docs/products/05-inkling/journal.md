# Journey

What happened, what was decided and why. Newest last. The detailed running log is
`docs/product/polish-sprint/journal.md` in the kids-app repo.

## 12 Oct: a polish sprint on an existing app

### Kick-off: a few hours, before a possible Enthuse interview
Inkling (a reflective journal for 16–25s, built before the sprint in its own repo) looked and felt
like a chatbot window. The owner wanted a real journey, nicer UX and some wow, with a 2-minute demo
that shows product thinking. Worked the playbook, adapted to a few hours; docs kept in kids-app.

### Found the discovery, and its limits
A large discovery piece already existed (`docs/product/01-discovery/`): 16 competitor write-ups,
problems and opportunities, a brainstorm pack. It was desk research only (no interviews), the
brainstorm was never held, and most of it wasn't even committed to git. Synthesised it into 5
learnings and 3 gaps: the selling point is invisible, there is no journey, it looks like ChatGPT.

### Decided: all three gaps through one thin journey
The owner wanted all three gaps. Coach's pushback: three projects won't fit, so cover them through
one journey (question → write → meet an idea → takeaway) in a new look. Problem framing (coach's
suggestion): direction is the situation, going round in circles is the mechanism, learning the idea
is how. Persona: Maya, 19, first-year law. A public demo mode for recruiters, demo data only.

### Brief and scope
Brief with three success signals and two guardrails; stop line at demo mode, fixes, writing page,
idea card, takeaway. Owner's change: every feature must also work on real data, so screens are
built once over two data sources.

### Prototype: four directions, Steps picked
References and no-gos first (no chat bubbles, nothing childish, school-like or clinical, no literal
ink). `/prototype` gave Page, Steps and Dusk; the owner asked for Steps in Dusk's colours
(Nightfall), then picked **Steps (light)**: "warmer, with the orange light as the brand nudge".

### The design grew to the whole app
The owner asked to see progression and learnings too. Progression was framed as thinking that
changes over time, never streaks (the Children's Code covers 16–17s). Added Start, Today, Log book
and Ideas, then, at the owner's request, free writes separate from today's question. Scope re-cut to
option A (no thread card yet); every carried behaviour listed as an owner decision.

### Build: one data shape, two sources
Light theme and demo-breaking fixes (a font that pointed at itself, an unlabelled wordmark); the app
shell and a public `/demo` that makes no network calls; real data through one new endpoint; free
writes (a migration plus a "listen first" AI stance with tests); the old chat UI removed (lint
errors 16 → 0). Real data exposed two things the design assumed but didn't have (a "next step" and
idea sources), so the demo was changed to show only what the app can really do.

### Deploy: rename, previews and a 500
The Vercel project became `inkling` at inkling-journal.vercel.app (old address redirects). The
preview returned 500 on every page: the session check ran first and needed a key that Preview
didn't have. Fixed in code (the demo skips the check) and in config (keys copied to Preview).

### Testing: audit, break-ui and two simulated users
Ran the two simulated users first (Supabase was blocked), then the audit and break-ui. Both users
passed: the hiring manager named the difference from ChatGPT at ~1:10 and would interview; Maya
named both target phrases and rated the idea moment 4/5. Blockers fixed the same hour: saved entries
were cut short, and the demo didn't say its replies were scripted. Then the owner's pick of five
polish fixes, including "That's enough for now" so a free write can be a dump, not a quiz.

### Switched to the Claude API, and evals caught two rules
Owner's call: Sonnet 5.5 for replies, Haiku 5.5 for questions and insights, one helper instead of
six copies, voice transcription removed. First eval run 6/8: every safety scenario passed, but a
reply ended on two questions and a closing poem was itself a question. Two sentences tightened in
the prompt: 8/8.

### Demo script and wrap-up
A 2-minute demo script (learning → decision → screen, likely questions, honesty notes). The owner
ran the migration and a signed-in pass on the preview. Wrapped up here as product 05.
