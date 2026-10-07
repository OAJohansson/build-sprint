// The 10 MVP landmark places (brief, R7). A place within `km` of one shows its silhouette;
// anywhere else gets the generic horizon.
export type LandmarkId =
  | "bali"
  | "paris"
  | "london"
  | "newyork"
  | "sydney"
  | "rome"
  | "agra"
  | "tokyo"
  | "rio"
  | "cairo"
  | "none";

const LANDMARKS: { id: Exclude<LandmarkId, "none">; lat: number; lng: number; km: number }[] = [
  { id: "bali", lat: -8.4, lng: 115.19, km: 90 },
  { id: "paris", lat: 48.8566, lng: 2.3522, km: 40 },
  { id: "london", lat: 51.5074, lng: -0.1278, km: 40 },
  { id: "newyork", lat: 40.7128, lng: -74.006, km: 40 },
  { id: "sydney", lat: -33.8688, lng: 151.2093, km: 50 },
  { id: "rome", lat: 41.9028, lng: 12.4964, km: 35 },
  { id: "agra", lat: 27.1767, lng: 78.0081, km: 30 },
  { id: "tokyo", lat: 35.6762, lng: 139.6503, km: 50 },
  { id: "rio", lat: -22.9068, lng: -43.1729, km: 40 },
  { id: "cairo", lat: 30.0444, lng: 31.2357, km: 40 },
];

function km(aLat: number, aLng: number, bLat: number, bLng: number) {
  const rad = Math.PI / 180;
  const h =
    Math.sin(((bLat - aLat) * rad) / 2) ** 2 +
    Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(((bLng - aLng) * rad) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export function landmarkFor(lat: number, lng: number): LandmarkId {
  return LANDMARKS.find((l) => km(lat, lng, l.lat, l.lng) <= l.km)?.id ?? "none";
}
