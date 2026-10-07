// Sun times, the live sky and time formatting for a place. All times are UTC instants, shown in
// the place's own time zone.
import { getPosition, getTimes } from "suncalc";

import type { LandmarkId } from "./landmarks";

export type Place = {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  tz: string;
  landmark: LandmarkId;
  terrainChecked?: boolean; // the terrain scene has been looked up (#22)
  population?: number;
  here?: boolean; // the device's own location
};



// Minutes east of UTC for a zone at an instant, e.g. +480 for Bali.
function utcOffset(tz: string, at: Date) {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "longOffset" })
    .formatToParts(at)
    .find((p) => p.type === "timeZoneName")?.value;
  const m = name?.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  return m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0)) : 0;
}

export type SunEvent = { kind: "sunrise" | "sunset"; at: Date };

export type SunDay = {
  sunrise: Date | null;
  sunset: Date | null;
  goldenStart: Date | null; // evening golden hour starts
  goldenEnd: Date | null; // morning golden hour ends
  alwaysUp: boolean;
  alwaysDown: boolean;
};

export function sunDay(place: Place, at: Date): SunDay {
  const t = getTimes(at, place.lat, place.lng, 0, utcOffset(place.tz, at));
  return {
    sunrise: t.sunrise,
    sunset: t.sunset,
    goldenStart: t.goldenHour,
    goldenEnd: t.goldenHourEnd,
    alwaysUp: !!t.alwaysUp,
    alwaysDown: !!t.alwaysDown,
  };
}

// The next sunrise or sunset after `now`. Polar summers and winters can last months, so this looks
// up to 200 days ahead.
export function nextEvent(place: Place, now: Date): SunEvent | null {
  for (let d = 0; d < 200; d++) {
    const day = sunDay(place, new Date(now.getTime() + d * 864e5));
    const events: SunEvent[] = [];
    if (day.sunrise) events.push({ kind: "sunrise", at: day.sunrise });
    if (day.sunset) events.push({ kind: "sunset", at: day.sunset });
    const next = events.filter((e) => e.at > now).sort((a, b) => +a.at - +b.at)[0];
    if (next) return next;
  }
  return null;
}

// A sunrise or sunset that happened in the last `minutes` (the moment, then the afterglow).
export function recentEvent(place: Place, now: Date, minutes = 25): SunEvent | null {
  const events: SunEvent[] = [];
  for (const d of [0, -1]) {
    const day = sunDay(place, new Date(now.getTime() + d * 864e5));
    if (day.sunrise) events.push({ kind: "sunrise", at: day.sunrise });
    if (day.sunset) events.push({ kind: "sunset", at: day.sunset });
  }
  const past = events.filter((e) => e.at <= now && +now - +e.at < minutes * 60000).sort((a, b) => +b.at - +a.at);
  return past[0] ?? null;
}

// The next sunrise, or the next sunset, specifically: after a polar day, "when does it set again?"
export function nextOf(place: Place, now: Date, kind: SunEvent["kind"]): Date | null {
  for (let d = 0; d < 200; d++) {
    const at = sunDay(place, new Date(now.getTime() + d * 864e5))[kind];
    if (at && at > now) return at;
  }
  return null;
}

export const altitude = (place: Place, at: Date) => getPosition(at, place.lat, place.lng).altitude;

// ---- The sky: a three-colour gradient keyed to the sun's altitude in degrees. ----

type RGB = [number, number, number];
const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;

// [altitude°, top, middle, horizon]. Morning and evening share colours (a rabbit hole otherwise).
const STOPS: [number, string, string, string][] = [
  [-18, "#05070f", "#0b1022", "#131b36"], // night
  [-10, "#0e1433", "#232a5c", "#4a3f73"], // blue hour
  [-4, "#1c2350", "#5a4a86", "#d77a6e"], // dusk / dawn
  [0, "#2d3a78", "#c86f74", "#ffad6a"], // sunset / sunrise
  [5, "#4f73b8", "#e79a7a", "#ffcf8f"], // golden hour
  [12, "#3f78c4", "#8bbbe6", "#f4d9b8"], // late afternoon
  [30, "#2a6bc4", "#6fb0ec", "#cfe7fb"], // day
  [60, "#2361bd", "#5ea3ea", "#bfe0fc"], // midday
];

// `ink` is for text over the middle of the sky (the countdown), `inkTop` for the top bar.
export type Sky = {
  top: string;
  mid: string;
  horizon: string;
  ink: string;
  inkSoft: string;
  inkTop: string;
  inkTopSoft: string;
  shadow: string;
  land: string;
  stars: number;
};

const mix = (a: RGB, b: RGB, t: number): RGB => a.map((v, i) => Math.round(v + (b[i] - v) * t)) as RGB;
const css = (c: RGB) => `rgb(${c[0]} ${c[1]} ${c[2]})`;
const DARK: RGB = [13, 20, 36];
const WHITE: RGB = [255, 255, 255];
const contrast = (a: RGB, b: RGB) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
// Whichever of white or near-black reads better on this background (R9).
const inkOn = (bg: RGB) => (contrast(WHITE, bg) >= contrast(DARK, bg) ? WHITE : DARK);
const soft = (c: RGB) => `rgb(${c[0]} ${c[1]} ${c[2]} / 0.85)`;

function lum(c: RGB) {
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function sky(alt: number): Sky {
  const a = Math.max(STOPS[0][0], Math.min(STOPS[STOPS.length - 1][0], alt));
  let i = 0;
  while (i < STOPS.length - 2 && a > STOPS[i + 1][0]) i++;
  const [a0, ...c0] = STOPS[i];
  const [a1, ...c1] = STOPS[i + 1];
  const t = (a - a0) / (a1 - a0);
  const [top, mid, horizon] = [0, 1, 2].map((k) => mix(hex(c0[k]), hex(c1[k]), t));
  // Ink is picked against the sky right behind each piece of text, not the sky as a whole.
  const ink = inkOn(mix(mid, horizon, 0.2));
  const inkTop = inkOn(mix(top, mid, 0.1));
  return {
    top: css(top),
    mid: css(mid),
    horizon: css(horizon),
    ink: css(ink),
    inkSoft: soft(ink),
    inkTop: css(inkTop),
    inkTopSoft: soft(inkTop),
    // A soft shadow under white text helps on the few mid-blue skies where contrast is borderline.
    shadow: ink === WHITE ? "0 1px 2px rgb(0 0 0 / 0.22)" : "none",
    land: css(mix(mix(horizon, [8, 10, 22], 0.82), top, 0.08)),
    stars: Math.max(0, Math.min(1, (-alt - 6) / 8)),
  };
}

export const gradient = (s: Sky) => `linear-gradient(to bottom, ${s.top} 0%, ${s.mid} 55%, ${s.horizon} 100%)`;

// ---- Formatting, always in the place's own time zone. ----

export const shortDate = (d: Date, tz: string) => d.toLocaleDateString("en-GB", { timeZone: tz, day: "numeric", month: "short" });

export const clock = (d: Date | null, tz: string) =>
  d ? d.toLocaleTimeString("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit" }) : "—";

export function until(ms: number) {
  const min = Math.max(0, Math.ceil(ms / 60000));
  const h = Math.floor(min / 60);
  const m = min % 60;
  return { h, m, short: h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m} min`, long: h ? `${h} h ${m} min` : `${m} min` };
}


// Everything a variant needs for one place at one moment.
export function view(place: Place, now: Date) {
  const day = sunDay(place, now);
  const event = nextEvent(place, now);
  const alt = altitude(place, now);
  const noon = getTimes(now, place.lat, place.lng, 0, utcOffset(place.tz, now)).solarNoon;
  return {
    day,
    event,
    left: event ? until(+event.at - +now) : null,
    alt,
    sky: sky(alt),
    morning: now < noon,
    localTime: clock(now, place.tz),
    tomorrow: event ? localDay(event.at, place.tz) !== localDay(now, place.tz) : false,
  };
}

const localDay = (d: Date, tz: string) => d.toLocaleDateString("en-CA", { timeZone: tz });

export function phaseName(alt: number, morning: boolean) {
  if (alt < -12) return "Night";
  if (alt < -0.8) return morning ? "Dawn" : "Dusk";
  if (alt < 2) return morning ? "Sunrise" : "Sunset";
  if (alt < 6) return "Golden hour";
  if (alt < 45) return morning ? "Morning" : "Afternoon";
  return "Midday";
}

// Where the sun is between sunrise (0) and sunset (1); outside daylight, between sunset (0) and
// the next sunrise (1). Used to place the sun across the screen.
export function dayFraction(place: Place, now: Date) {
  const d = sunDay(place, now);
  if (d.sunrise && d.sunset && now >= d.sunrise && now <= d.sunset) {
    return { daylight: true, f: (+now - +d.sunrise) / (+d.sunset - +d.sunrise) };
  }
  const prevSet = now < (d.sunrise ?? now) ? sunDay(place, new Date(+now - 864e5)).sunset : d.sunset;
  const nextRise = now > (d.sunset ?? now) ? sunDay(place, new Date(+now + 864e5)).sunrise : d.sunrise;
  if (prevSet && nextRise) return { daylight: false, f: (+now - +prevSet) / (+nextRise - +prevSet) };
  return { daylight: !!d.alwaysUp, f: 0.5 };
}
