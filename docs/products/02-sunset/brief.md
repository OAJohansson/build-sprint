# Brief

Written before any code (playbook step 1). Short answers; the success check is filled in at wrap-up.

*Draft by Claude from the owner's idea, 7 Oct. Items marked **Your call** are open decisions.*

## Problem

It's late afternoon in Bali and I want to catch the sunset, but I don't know when it is, or
whether I still have time to get somewhere good. Finding out means a search or digging through a
weather app. For other places (planning a sunrise hike, a trip), it's the same hunt plus a time
zone to work out.

## Who

A traveller who chases sunsets: someone like me in Bali, out and about, phone in hand, wants the
moment more than the data. Not a pro photographer (they have PhotoPills). Full persona in
[User testing](#02-sunset.testing).

## Moment of use and jobs to be done

**Main moment:** outside, late afternoon, deciding whether to head to the beach now. Glances at
the phone for a few seconds.

1. "When it's getting late in the day, I want to know how long until sunset where I am, so I can
   decide whether to go now."
2. "When I'm planning a morning or a trip, I want sunrise and sunset for another place in its local
   time, so I can plan around them."
3. "When I'm about to watch it, I want a calm, beautiful moment, so checking the sunset feels like
   part of the ritual, not a chore."

**Your call:** is job 1 (here, now) really the main job, and job 2 (somewhere else, later)
secondary? It decides the home screen.

## Today's alternatives

| Alternative | Good | Annoying |
| --- | --- | --- |
| Google "sunset Bali" | Instant, free, no install | Just a time: no countdown, no golden hour, no "do I have time?" |
| Phone weather app | Already installed; shows sunrise and sunset | Buried in a tile; only places you've saved; plain |
| timeanddate.com | Accurate, any place, golden hour | Dense, ad-heavy, desktop-feeling |
| PhotoPills, Sun Seeker | Everything: sun path, AR, golden and blue hour | Paid, complex, for pros |

**Why would anyone switch?** Google answers "what time is sunset?" in 3 seconds, so that alone
isn't enough. The edge has to be:
- **"Do I have time?"**, not "what time?": a live countdown and the golden hour that starts before
  sunset, open-and-read with no typing (auto-located).
- **Feel:** the only one that's beautiful. The sky on screen matches the real sky right now. This
  is the bet behind your "focus on aesthetics": a real differentiation strategy (like Carrot
  Weather or Calm), not decoration.

## Riskiest assumptions

| Risk | Assumption | How risky |
| --- | --- | --- |
| Value | People will open a dedicated app instead of Googling, because a countdown, golden hour and a beautiful screen are worth it. | **Riskiest** |
| Usability | Allowing location and searching a place is quick on a phone; the countdown is readable at a glance. | Medium |
| Feasibility | Times computed in the browser (the SunCalc formula, no API); place search and the place's time zone from a free geocoding API (Open-Meteo, no key). | Low |
| Viability | No backend, no costs, no accounts. | Low |

So the MVP must test **value**: does it beat Google for the main job, and does it feel delightful?

## Success: what good looks like

**Main outcome:** at a glance, I know whether I can still make the sunset (or sunrise), and
checking feels like a small pleasure rather than a search.

| Signal | How I'll measure it | Target |
| --- | --- | --- |
| Answer at a glance | User test: open the app with location allowed → reads "time left until sunset" | ≤ 5 s, no taps |
| Another place | User test: search a city → sees its sunrise and sunset in local time | ≤ 15 s |
| Delight | User test rating, and one real person: "would you show this to a friend?" | 4/5 or better; a real yes |
| Beats Google | Ask the tester and one real person which they'd use tomorrow, and why | They pick this app, with a reason |
| Guardrail: correct times | 5 places vs timeanddate.com, including one with no sunset (Tromsø in June) | Within 2 min; polar case handled |

**Your call:** do these feel like the right definition of "good"? Is there one you'd drop or add?
Live usage (Vercel Analytics: returning visitors) is optional for a one-day product.

## MVP and stop line

**Ships today (proposal):**
- Auto-locate (with a fallback: search, if location is blocked).
- Home: a countdown to the next sunset or sunrise, its time, and the golden hour.
- A sky that matches the time of day, with a few purposeful animations (the sun easing toward the
  horizon, the countdown ticking).
- Search any city; times shown in that city's local time.

**Backlog:** saved places, cloud forecast ("will it be a good one?"), reminders, sun direction and
compass, blue hour, map, share card.

**Your call:** anything on the backlog that must ship today, or anything above you'd cut?

## Success check (at wrap-up)
