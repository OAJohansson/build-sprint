# To do

Sprint-wide work to come back to: process, tools and skills, not features (those go in a
product's backlog) or new products (those go in [ideas](ideas.md)).

| # | What | When | Notes |
| --- | --- | --- | --- |
| 1 | **Start learning evals.** Add a small eval to a product, to learn how evals work. | **Next up:** product 02 has shipped | Not extensive. A first candidate: CrossFit Log's AI parsing (spoken note → lifts), with a handful of notes and their correct parse, scored automatically. |
| 2 | ~~**Judge the design skills** (decision 0008): keep or drop.~~ | Done 7 Oct | Kept: `/prototype` and the audit earned their place; no "feels off on the phone" findings. See decision 0008. |
| 3 | **Playwright smoke test from the user test** (maybe). Turn the test agent's passing main flow into a committed test that runs on every change. | When a product gets a second round of changes | No new skill needed; the `user-tester` agent and Playwright are already set up. |
| 4 | **Try Anthropic's `webapp-testing` skill** (maybe). The obvious next testing skill if `user-tester` leaves gaps. | If a product needs browser tests `user-tester` can't do | Mostly overlaps with `user-tester`. It runs Python scripts, which need approval each time in cloud sessions. |
| 5 | **Test with one real person.** Show a product to an actual user, not just the simulated one. | Any product, once its core flow works | No skill replaces this. On day 1 the biggest finds came from using the app on a real phone. |

## Testing: what's covered today

No new testing skills for now (7 Oct); the main pieces are in place:

- **Simulated user testing:** the `user-tester` agent drives the real app in a phone-sized browser
  as the persona. It does what most "QA" skills do.
- **Edge cases and audits:** the `break-ui` and `web-design-guidelines` skills.
- **The gap is regression tests:** nothing checks that a change didn't break yesterday's main flow
  (item 3).
- **Real users:** item 5.
