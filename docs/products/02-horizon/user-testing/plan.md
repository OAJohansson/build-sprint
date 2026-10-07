# Test plan: Horizon

Scenarios come from the jobs in the [brief](#02-horizon.brief); success bars from its success table.

## How to run the app for testing

- **App:** the live site, https://horizon-beta-wine.vercel.app (or `pnpm -F 02-horizon dev -p 3270`
  for local changes). Playwright's `playwright-core` at `/opt/node-tools/node_modules/playwright-core`.
- **From the cloud sandbox:** launch Chromium with the proxy (`proxy: { server: process.env.HTTPS_PROXY }`
  and `--ignore-certificate-errors`). The two lookup services (Open-Meteo search, BigDataCloud
  place name) are blocked there, so stub them with real-shaped answers (`page.route`); a helper
  that does both is passed in the task.
- Viewport: 390 × 844, deviceScaleFactor 2, `timezoneId` of the persona's place.
- **Location:** grant geolocation in the browser context and set it to Bali (Seminyak, about
  −8.69, 115.16). For the "blocked" case, don't grant it.
- **Time:** fix the clock (`page.clock.setFixedTime`) so each scenario happens at its moment, e.g.
  16:45 Bali time (08:45 UTC) for S1.
- **First run:** a fresh browser context, nothing stored. The app remembers your choice in
  localStorage (`horizon:last`).

## Scenarios

### S1 · Do I have time?
- **Moment:** Bali, 16:45, at a café, glancing at the phone in bright light.
- **Task:** Open the app (location allowed). How long until sunset?
- **Success:** Time left until sunset, and when golden hour starts, read in ≤ 5 s with no taps.

### S2 · Location blocked
- **Moment:** Same, but Noor said no to location.
- **Task:** Get to the same answer.
- **Success:** Clear why location helps, and search works instead. Answer in ≤ 20 s.

### S3 · Sunrise somewhere else
- **Moment:** Evening, planning next week in Lisbon, and tomorrow's sunrise hike.
- **Task:** When is sunrise in Lisbon? When is it in Bali tomorrow?
- **Success:** Times in each place's local time, found in ≤ 15 s each, no time-zone maths.

### S4 · Sense of place
- **Moment:** Browsing for fun.
- **Task:** Look at the background for 5 landmark places with the city name hidden. Which city?
- **Success:** 4 of 5 recognised. Countdown readable on every one.

### S5 · The sky through the day
- **Moment:** Open at dawn, midday, golden hour, sunset, dusk and night (clock moved each time).
- **Task:** Does the screen feel like the sky outside right now?
- **Success:** Each looks right for its time; changes feel smooth, never a jump; text always
  readable.

### S6 · Edge places
- **Task:** Tromsø in June (no sunset), Tromsø in December (no sunrise), a small town with no
  landmark.
- **Success:** No broken numbers; polar cases say so plainly; the generic horizon looks
  intentional.

## Value questions

- Would Noor use this tomorrow instead of Googling? Why, or why not?
- Would they show it to a friend? What would they show?
- Which part is the delight: the sky, the landmark, the countdown, the motion?
- What's missing that would make it part of their evening?

## Out of scope

Exact accuracy of times (checked separately against timeanddate.com); landmarks beyond the
hand-drawn set.
