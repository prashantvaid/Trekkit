import { getCountryCode } from "./countryFlags.jsx";

const KEY = "trekkit:last-origin";

export function tripToOrigin(trip) {
  if (!trip?.origin_country) return null;
  if (!Number.isFinite(trip.origin_country_lat) || !Number.isFinite(trip.origin_country_lng)) {
    return null;
  }
  return {
    name: trip.origin_country,
    lat: trip.origin_country_lat,
    lng: trip.origin_country_lng,
    code: getCountryCode(trip.origin_country),
  };
}

export function hasOriginCoords(origin) {
  return origin && Number.isFinite(origin.lat) && Number.isFinite(origin.lng);
}

export function loadLastOrigin() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY));
    if (
      stored?.name &&
      Number.isFinite(stored.lat) &&
      Number.isFinite(stored.lng)
    ) {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function saveLastOrigin(country) {
  if (!country?.name) return;
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        name: country.name,
        lat: country.lat,
        lng: country.lng,
        code: country.code ?? null,
      })
    );
  } catch {
    /* storage unavailable */
  }
}
