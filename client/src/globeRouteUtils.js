import { transportArcAltitude } from "./transportModes.js";
import { hasOriginCoords } from "./tripOrigin.js";

export function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function routePoints(stops = [], origin = null) {
  const points = [];
  for (const s of stops) {
    if (Number.isFinite(s?.lat) && Number.isFinite(s?.lng)) {
      points.push({ lat: s.lat, lng: s.lng });
    }
  }
  if (hasOriginCoords(origin)) {
    points.push({ lat: origin.lat, lng: origin.lng });
  }
  return points;
}

/** Max distance between any two route points, including origin. */
export function routeSpanKm(stops, origin = null) {
  const points = routePoints(stops, origin);
  if (points.length < 2) return 0;
  let max = 0;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      max = Math.max(
        max,
        haversineKm(points[i].lat, points[i].lng, points[j].lat, points[j].lng)
      );
    }
  }
  return max;
}

/** @deprecated Use routeSpanKm — kept for older call sites. */
export function stopSpanKm(stops) {
  return routeSpanKm(stops);
}

/** Center the globe on all stops plus origin when present. */
export function globeViewCenter(stops, origin = null) {
  const points = routePoints(stops, origin);
  if (!points.length) return { lat: 20, lng: 0 };
  return {
    lat: points.reduce((sum, p) => sum + p.lat, 0) / points.length,
    lng: points.reduce((sum, p) => sum + p.lng, 0) / points.length,
  };
}

/** react-globe.gl pointOfView altitude — lower values zoom closer. */
export function globeViewAltitude(stops, { origin = null, zoomed = false } = {}) {
  const points = routePoints(stops, origin);
  if (points.length < 2) return zoomed ? 0.2 : 1.2;

  const span = routeSpanKm(stops, origin);
  let alt;
  if (span < 25) alt = 0.35;
  else if (span < 80) alt = 0.48;
  else if (span < 200) alt = 0.62;
  else if (span < 600) alt = 0.82;
  else if (span < 1500) alt = 1.15;
  else alt = 1.6;

  return zoomed ? alt * 0.36 : alt;
}

export function arcAltitudeForSegment(distanceKm, transport) {
  const base = transportArcAltitude(transport);
  if (distanceKm < 5) return Math.max(base, 0.07);
  if (distanceKm < 25) return Math.max(base, 0.11);
  if (distanceKm < 120) return Math.max(base, 0.17);
  if (distanceKm < 400) return Math.max(base, 0.24);
  return base;
}

export function arcStrokeForSegment(distanceKm) {
  if (distanceKm < 25) return 1.05;
  if (distanceKm < 120) return 0.9;
  return 0.7;
}
