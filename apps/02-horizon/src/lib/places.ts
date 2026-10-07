// Finding places: city search (Open-Meteo geocoding) and naming the device's location
// (BigDataCloud's free client-side lookup). Both are free, keyless and called from the browser.
import { landmarkFor, type LandmarkId } from "./landmarks";
import type { Place } from "./sun";

type GeoResult = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  population?: number;
  country?: string;
  admin1?: string;
};

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const data: { results?: GeoResult[] } = await res.json();
  return (data.results ?? [])
    .filter((r) => r.timezone)
    .map((r) => ({
      id: String(r.id),
      name: r.name,
      region: [r.admin1, r.country].filter((x) => x && x !== r.name).join(", "),
      lat: r.latitude,
      lng: r.longitude,
      tz: r.timezone!,
      landmark: landmarkFor(r.latitude, r.longitude),
      population: r.population,
    }));
}

// No landmark nearby: pick a scene from the terrain (#22). One call to Open-Meteo's elevation
// service for the point and four points about 6 km away: low ground with sea next to it is coast,
// high ground is mountains, a big city gets a skyline (even a high one, like Mexico City).
// Anything unclear stays as gentle hills.
export async function terrainFor(place: Place): Promise<LandmarkId> {
  if ((place.population ?? 0) >= 1_000_000) return "city";
  const d = 0.055; // ≈ 6 km
  const lats = [place.lat, place.lat + d, place.lat, place.lat - d, place.lat];
  const lngs = [place.lng, place.lng, place.lng + d, place.lng, place.lng - d];
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lats.join(",")}&longitude=${lngs.join(",")}`);
    if (!res.ok) throw new Error(`Elevation failed: ${res.status}`);
    const { elevation }: { elevation: number[] } = await res.json();
    const [here, ...around] = elevation;
    if (here >= 900 || (here >= 450 && Math.max(...around) - Math.min(...around) > 400)) return "mountains";
    if (here < 60 && around.some((e) => e <= 1)) return "coast";
  } catch (e) {
    console.warn("[horizon] terrain lookup failed", e);
  }
  return "none";
}

// The device's location as a place. The name is a nice-to-have: if the lookup fails, it's
// "My location". The time zone is the device's own.
export async function herePlace(lat: number, lng: number): Promise<Place> {
  const base: Place = {
    id: "here",
    name: "My location",
    region: "",
    lat,
    lng,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    landmark: landmarkFor(lat, lng),
    here: true,
  };
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
    );
    if (!res.ok) return base;
    const d: { locality?: string; city?: string; principalSubdivision?: string; countryName?: string } = await res.json();
    const name = d.locality || d.city;
    return name ? { ...base, name, region: d.principalSubdivision || d.countryName || "" } : base;
  } catch {
    return base;
  }
}

export function currentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 }),
  );
}
