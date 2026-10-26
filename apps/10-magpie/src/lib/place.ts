"use client";

// "Where": the city and country are suggested from where the phone is (reverse geocoding, no
// places API, kickoff's rabbit holes), and remembered so the next yum starts with the last city.

export type Spot = { city: string; country: string };
const LAST = "magpie-last-city";

export function lastSpot(): Spot | null {
  try {
    const s = JSON.parse(localStorage.getItem(LAST) ?? "null");
    return s && typeof s.city === "string" ? s : null;
  } catch {
    return null;
  }
}

export function rememberSpot(s: Spot) {
  try { if (s.city) localStorage.setItem(LAST, JSON.stringify(s)); } catch {}
}

/** Where the phone is now, as a city and country, or null (no permission, no signal, 8 s). */
export async function spotHere(): Promise<Spot | null> {
  if (!("geolocation" in navigator)) return null;
  const pos = await new Promise<GeolocationPosition | null>((resolve) =>
    navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { timeout: 8000, maximumAge: 10 * 60 * 1000, enableHighAccuracy: false }),
  );
  if (!pos) return null;
  try {
    // BigDataCloud's free client-side endpoint: no key, made to be called from the browser.
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude.toFixed(3)}&longitude=${pos.coords.longitude.toFixed(3)}&localityLanguage=en`;
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const j = (await r.json()) as { city?: string; locality?: string; countryName?: string };
    const city = j.city || j.locality || "";
    const country = (j.countryName ?? "").replace(/ \(the\)$/, "").replace(/^United Kingdom of Great Britain and Northern Ireland$/, "United Kingdom");
    return city ? { city, country } : null;
  } catch {
    return null;
  }
}
