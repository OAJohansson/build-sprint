# Test plan: Scribble

## How to run the app for testing

- Start: `pnpm -F 03-scribble build && pnpm -F 03-scribble start`, opened at the machine's
  address. Needs `ACCESS_CODE`; with Supabase and Anthropic keys unset in development, the
  in-memory store and a fixed sample feedback stand in.
- Viewport: 390 × 844 (phone); one check at desktop width.
- Seed data: "first run" = empty store; "returning" = 6 pieces over the last 10 days, 3 with
  feedback, 2 finished this week.
- Simulated parts: the tester types the pieces (keyboard instead of a phone keyboard). For
  feedback quality, the tester judges real Claude feedback when a key is available, else the
  eval's results.

## Scenarios

### S1 · Bus, first time
- **Moment:** on the bus, ten minutes, never opened the app.
- **Task:** "Just write something."
- **Success:** first word typed in ≤ 60 s with no decisions; a 2–4 sentence piece finished
  with "Done" in ≤ 10 min.

### S2 · Ask for feedback
- **Moment:** just finished a piece, curious how it landed.
- **Task:** "Tell me what worked and what to try."
- **Success:** feedback in ≤ 10 s; it quotes their words, names one strength and one concrete
  thing to try, doesn't rewrite the piece; the tester can say what they'd try next time.

### S3 · Don't like the prompt
- **Moment:** in bed, the prompt doesn't spark anything.
- **Task:** "Give me something else, or let me write my own thing."
- **Success:** a new prompt in one tap, or writing freely, without losing text already typed.

### S4 · Interrupted
- **Moment:** halfway through a piece, the bus arrives; app closed.
- **Task:** reopen later and carry on.
- **Success:** the draft is back exactly as it was.

### S5 · How am I doing this week?
- **Moment:** returning user, coffee break.
- **Task:** "Am I on track? What did I write on Monday?"
- **Success:** reads the week's progress at a glance (≤ 5 s); finds and opens Monday's piece and
  its feedback in ≤ 3 taps.

## Guardrails to measure (with numbers)

- Time from open to first word (S1).
- Feedback checklist on every piece seen: quotes, one strength, one suggestion, no rewrite, kind.
- Data safety: pieces after reload and on a second browser; export contains every piece.
- Text contrast of body and muted text ≥ 4.5:1.

## Value questions

- Would Robin open this on the bus tomorrow instead of WhatsApp or Notes? Why?
- Did asking for feedback feel inviting or like being graded? Did it make the next piece harder
  to start?
- Did the weekly dots motivate, or create pressure?
- What's missing that would make them come back tomorrow?

## Out of scope

The feedback character, choosing own topics, longer forms, sharing; deep visual polish beyond
"does it feel calm and pleasant".
