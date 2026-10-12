# Test plan: Inkling (polish sprint)

## How to run the app for testing

- Target: the public demo at `<BASE_URL>/demo` (the preview deployment, or the local dev server
  if that isn't up). Start page: `<BASE_URL>/login` (no sign-in in this test).
- Viewport: 390 × 844 (phone), deviceScaleFactor 2.
- Chromium: `~/Library/Caches/ms-playwright/chromium-1234/` (macOS). Install `playwright-core`
  with pnpm in the scratch folder if it isn't available.
- Seed data: the demo is Maya's made-up journal (8 earlier entries). A reload resets it.
- Simulated parts: the AI. Replies in the demo are scripted, and Maya's words are pre-filled in
  the writing box; the tester may edit them but the reply stays scripted. Say so in the report.

## Scenarios

### S1 · Tonight's question, in bed (Maya)
- **Moment:** 10.30 pm, in bed, wound up about the course.
- **Task:** Answer today's question and get to the end.
- **Success:** reaches the takeaway in ≤ 2 min and ≤ 8 taps, without help; can say in their own
  words what the idea was and whether it felt like a gift or homework (rate usefulness 1–5).

### S2 · Something on my mind (Maya)
- **Moment:** between lectures, something specific on her mind, no patience for a question.
- **Task:** Write about it without answering a question.
- **Success:** finds and finishes a free write in ≤ 2 min; it shows in the Log book as a free write.

### S3 · What have I figured out? (Maya)
- **Moment:** Sunday afternoon, curious.
- **Task:** Look back at what you've learned about yourself, and find the words of yours behind
  one idea.
- **Success:** reaches an idea's page and its "In your words" in ≤ 4 taps from Today.

### S4 · First look (Sam, the hiring manager)
- **Moment:** phone, two minutes between interviews, opening the link cold at `/login`.
- **Task:** Work out what this is, try it, and decide if it's more than a ChatGPT wrapper.
- **Success:** within 2 minutes, says unprompted what makes it different from ChatGPT ("it names
  and keeps the idea", "it helps you step back"); no dead ends; knows the data is made up.

## Value questions

- Which parts would Maya use weekly? Which never?
- How is this different from ChatGPT, in the persona's own words? (Ask after the run.)
- Does the idea moment feel like learning about yourself, or like a lesson?
- Can they see they're progressing? What would make them come back tomorrow?
- Anything that feels childish, school-like or clinical?

## Guardrails to measure

- The demo makes zero requests to Supabase, OpenRouter or `/api/*` (check network).
- No horizontal scroll at 390 px; tap targets ≥ 44 px on the main actions.

## Out of scope

Real sign-in and real AI replies; desktop layout; the AI's writing quality beyond the script.
