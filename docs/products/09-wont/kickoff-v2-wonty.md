# Kickoff pack: v2, Wonty on Android

Streamlined-mode phase opened 28 Nov by the owner's call (L32). Builds on `kickoff.md`,
`kickoff-v1.1-sync.md` and `research.md` (P = principle, A = anti-pattern); the comeback bet and
the evidence still hold. **Draft:** Claude drafted it from the 28 Nov conversation; the owner decides
it at the kickoff gate (open questions at the end). Lines marked *(provisional)* are Claude's most
reversible guess until the gate.

**Mode:** streamlined (owner decides at four gates: kickoff, design pick, first working version,
final review)
**Appetite:** *(provisional)* about 5 weeks to a closed test on Google Play with ~12 testers, ideally
live by 1 Jan (the fresh-start window, P17); public launch after the 14-day test
**Evals:** `evals-v2.md` (written after the gate)

## Why this phase

Primarily for learning: build and publish a real app from scratch, find and onboard real users
(even if free), and set it up as a small business (data, security, accounts, pricing later). A
successful business is a welcome by-product, not the goal.

## Problem

People set goals (often at New Year) and the habits that should get them there fade within weeks.
One missed day feels like failure, the streak resets to zero, and the bad feeling turns one slip
into a lost attempt (A1, A3). Encouragement from a person who believes in you works (the owner's
cousin Oli: honest that it's hard, sure you can do it, curious about setbacks), but most people
don't have someone checking in every day.

## Who

*(provisional)* First the owner, then ~12 closed-test users. A narrow first audience is still open
(gate question 1): the product stays general (any habit, linked to yearly goals), but the first
posts and testers need a specific person in mind.

## Moment of use and jobs to be done

On the phone: a daily check-in with Wonty, and the morning after a miss.

1. When I miss a habit, I want to be met with honesty and belief, and helped to learn what got in
   the way, so I come back today instead of giving up. *(P5, P7, P1)*
2. When I set goals for the year, I want habits linked to them, so each small action has a reason.
   *(P11 "why this matters", P17)*
3. When I keep a habit, I want to log it in one tap and give something to Wonty, so progress feels
   shared and visible without a streak to lose. *(P2, P6)*

## Today's alternatives

Finch (self-care pet), Habitica (RPG habits), streak apps (Streaks), and the web Wont itself.
Teardown: `research.md`, section "Today's alternatives: Finch and Habitica (28 Nov)".

## Riskiest assumptions

- **Value (riskiest):** a cartoon wonton can feel like an accountability partner (encouraging and
  honest) without turning into guilt or decoration. Test: closed-test users' week-2 return and what
  they say about Wonty.
- **Viability:** the owner can find ~12 testers and a first audience organically.
- **Feasibility:** a first native app (Expo), Play Store setup and the art pipeline fit the appetite.
- **Usability:** a reflection after a miss feels supportive, not like homework.

## Success: what good looks like

The owner and the testers still use it in week 3. Signals: testers who log in week 2 (target: half);
testers who come back the day after a miss; one unprompted mention of Wonty's personality.
Guardrail: nobody reports feeling guilt or nagging.

## MVP and stop line

*(provisional, gate question 3)*

- Android app (Expo), built so iOS is a later build, not a rewrite.
- Habits as if-then commitments (carried over from Wont) linked to optional yearly goals.
- Wonty: a small fixed set of poses (idle, happy, comeback, thinking), personality mostly in words.
- After a miss: normalise → believe → "what got in the way?" (one tap) → a smaller version or an
  if-then plan for today.
- Giving to Wonty: logging adds to Wonty's world; misses never take anything away.
- Anonymous start, save with Google sign-in; sync across devices; delete account in the app.
- Closed test on Google Play.

**Stop line:** no payments, no social or friends, no notifications beyond one optional daily
check-in (gate question 4), no iOS build yet, no web app changes.

## Requirements

Filled in after the gate, one row per MVP item, each with a check (then `evals-v2.md`).

**No-gos:** a pet that suffers, sickens or leaves when you miss; any reset to zero; red failure
states; asking for an account before the first habit; collecting data the app doesn't use.

**Rabbit holes:** a big art library (outfits, rooms) before the core loop works; a custom
animation engine; building pricing before retention.

## Feel references

- Finch's bird, for warmth only (not its look or mechanics).
- Wont's wontons (L18, L24): dough on ink, the comeback wink.
- A friend like Oli: honest, sure of you, curious about setbacks.

**The feel in one sentence:** *(provisional)* an absurdly cute, honest friend who believes you can
do it and helps you come back.

## Things to avoid

- Streak guilt, scolding, sad-pet guilt-tripping.
- Generic cheerleading ("You've got this! 🎉") with no honesty.
- Faux-Asian fonts, accents or stereotypes for a Chinese-food mascot.
- Copying Finch's look, features or currency system.

## Decisions already made

- Mode: Streamlined (L32).
- Name: Wonty, store title "Wonty: Habit Tracker" (L33, provisional until the say-it test and a
  trademark check).
- Domain `wonty.app` (Cloudflare Registrar); `hello@wonty.app` forwards to a separate Wonty Gmail
  (L34). That Gmail owns Wonty's Google services (Play Console, Google Cloud).
- Wonty gets its own infrastructure, separate from the sprint apps (L35).
- Devices: Android phone first; iOS later from the same code.

## Setup decisions for the gate (Claude's recommendations)

| Area | Recommendation | Cost | When |
| --- | --- | --- | --- |
| App stack | Expo (React Native, TypeScript); reuse Wont's `src/lib` day logic and tests | free (EAS free tier) | now |
| Backend | Own Supabase organisation, EU region (Stockholm), two projects: production and test sandbox | free, then Pro ~$25/mo at public launch (no pausing, daily backups) | now |
| Accounts | Anonymous start, link Google sign-in later; Sign in with Apple when iOS comes | free | now |
| Security | Row-level security on every table; secrets only server-side | — | now |
| Privacy | Minimum data (habit names can be health data under GDPR); privacy policy on wonty.app; Play Data safety form; account deletion in app and on web (Play requires it) | — | before closed test |
| Play Console | Personal developer account on the Wonty Gmail (organisation needs a company and D-U-N-S) | $25 once | after the gate |
| Analytics and crashes | PostHog (EU, free tier) and Sentry (free tier) | free | before public launch |
| Email from the app | Avoid by using Google sign-in; else a sending service | free | later |
| Payments | Play Billing via RevenueCat; check whether a sole-trader registration is needed | — | not this phase |
| Code home | `apps/09-wonty` in this repo, its own Expo app; move to its own repo only if it outgrows the sprint | — | now |

## Unit tests

Carried over: the day logic (day boundary, rolling rate, comeback due). New: goal ↔ habit links
and the "misses never take anything away" rule for Wonty's world.

## Open questions for the kickoff gate

1. Who is the first audience (beyond the owner) and where do they spend time online?
2. Appetite: closed test by 1 Jan, or a calmer target?
3. The MVP cut above: keep, cut or add?
4. Notifications: one optional daily check-in from Wonty, or none in the MVP?
5. Stack and setup table: accept as recommended?
6. What does the user give Wonty? (Can wait for the design gate.)
