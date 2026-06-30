// Straight-line (haversine) distance and a rough time estimate from it. This is NOT a
// routing engine — no roads, traffic, or turns are considered, just "as the crow flies"
// distance divided by an assumed average city-riding speed. Good enough for a rider to
// gauge "is this pickup close or far" without needing a paid routing API; swap for a real
// directions API (Google/Mapbox) before this needs to be production-accurate.

const EARTH_RADIUS_KM = 6371;
const ASSUMED_AVG_SPEED_KMH = 22; // mixed motorbike/car city riding, including stops

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function etaMinutes(km: number): number {
  return Math.max(1, Math.round((km / ASSUMED_AVG_SPEED_KMH) * 60));
}

export function formatDistanceEta(km: number): string {
  return `${km.toFixed(1)} km · ${etaMinutes(km)} min`;
}

