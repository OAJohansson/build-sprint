# Brief

Written before any code (playbook step 1). Short answers; the success check is filled in at wrap-up.

*Drafted by Claude from the owner's idea, decisions by the owner, 7 Oct. Open: the name.*

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

**Decided:** job 1 is the main job, so the home screen is "how long until sunrise or sunset
where I am". Searching another place (job 2) is one step away. Sunrise matters as much as sunset,
so the app and its name cover both.

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
| Feasibility | A landmark for "any place in the world" can't be hand-made or found reliably in one day. A hand-drawn set for famous places, with a calm generic horizon everywhere else, can. | Medium |
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
| Sense of place | User test: show the background (city name hidden) for 5 of the landmark places → which city is it? | 4 of 5 recognised |
| Guardrail: readable | The countdown stays readable on every sky and landmark, in bright sun (contrast check) | Contrast 4.5:1 or better |
| Guardrail: correct times | 5 places vs timeanddate.com, including one with no sunset (Tromsø in June) | Within 2 min; polar case handled |

**Decided:** these five plus the landmark. A feature can be a success signal when you measure
what it's *for*, not that it exists: the landmark is for a sense of place, so the test is whether
people recognise the city without reading its name. Live usage (Vercel Analytics) is skipped for
now.

## MVP and stop line

**Ships today (decided):**
- Auto-locate, with search as the fallback if location is blocked.
- Home: a countdown to the next sunrise or sunset, its time, and the golden hour.
- **A sky that is the place's sky right now:** night, dawn, sunrise, morning, midday, afternoon,
  golden hour, sunset and dusk, blending smoothly from one to the next and computed from the sun's
  real height for that place. A few purposeful animations (the sun easing toward the horizon, the
  countdown ticking).
- **A landmark on the horizon:** hand-drawn silhouettes for about 10 famous places (Paris: the
  Eiffel Tower; Bali: a temple gate; and so on), shown when you're in or search for one. Every
  other place gets a calm generic horizon. Silhouettes keep one style and stay readable on every
  sky; photos wouldn't.
- Search any city; times in that city's local time.

**Backlog:** saved places, cloud forecast ("will it be a good one?"), reminders, sun direction and
compass, blue hour, map, share card.

**Backlog too:** landmarks for more places, a landmark found automatically for any city.

## Success check (at wrap-up)
