import { LANDMARK_CATALOG, PLACE_TYPE_SHAPES, wikimediaThumb } from "./catalog.js";

function norm(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function haversineM(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function nameScore(stopName, catalogNames) {
  const n = norm(stopName);
  if (!n) return 0;
  for (const c of catalogNames) {
    const cn = norm(c);
    if (n === cn || n.includes(cn) || cn.includes(n)) return 1;
    const words = cn.split(" ").filter((w) => w.length > 3);
    if (words.length && words.every((w) => n.includes(w))) return 0.9;
    const head = cn.split(" ")[0];
    if (head.length > 4 && n.includes(head)) return 0.8;
  }
  return 0;
}

/** Resolve a trip stop to landmark render metadata. */
export function resolveLandmark(stop) {
  if (!stop || !Number.isFinite(stop.lat) || !Number.isFinite(stop.lng)) return null;

  let best = null;
  let bestScore = 0;

  for (const entry of LANDMARK_CATALOG) {
    const ns = nameScore(stop.name, entry.names);
    const dist = haversineM(stop.lat, stop.lng, entry.lat, entry.lng);
    const distScore = dist < 120 ? 1 : dist < 400 ? 0.85 : dist < 1200 ? 0.5 : 0;
    const score = ns * 0.7 + distScore * 0.3;
    if (score > bestScore && (ns >= 0.5 || dist < 200)) {
      bestScore = score;
      best = entry;
    }
  }

  if (best) {
    return {
      id: best.id,
      shape: best.shape,
      heightM: best.heightM,
      spanM: best.spanM,
      color: best.color,
      lat: stop.lat,
      lng: stop.lng,
      name: stop.name,
      imageUrl: wikimediaThumb(best.image, 220),
      catalog: true,
    };
  }

  const type = stop.place_type;
  const typeDef = type && PLACE_TYPE_SHAPES[type];
  if (typeDef) {
    return {
      id: `poi-${stop.id || stop.name}`,
      shape: typeDef.shape,
      heightM: typeDef.heightM,
      spanM: typeDef.spanM,
      color: typeDef.color,
      lat: stop.lat,
      lng: stop.lng,
      name: stop.name,
      imageUrl: null,
      catalog: false,
    };
  }

  const n = norm(stop.name);
  const landmarkWords = ["tower", "bridge", "cathedral", "palace", "temple", "mosque", "castle", "monument", "memorial", "museum", "falls", "mountain", "peak"];
  if (landmarkWords.some((w) => n.includes(w))) {
    return {
      id: `name-${stop.id || n}`,
      shape: n.includes("bridge") ? "bridge" : n.includes("mountain") || n.includes("peak") ? "mountain" : "tower",
      heightM: n.includes("bridge") ? 70 : 90,
      spanM: n.includes("bridge") ? 280 : undefined,
      color: "#a8a098",
      lat: stop.lat,
      lng: stop.lng,
      name: stop.name,
      imageUrl: null,
      catalog: false,
    };
  }

  return null;
}

export function landmarksFromStops(stops) {
  const out = [];
  const seen = new Set();
  for (const stop of stops) {
    const lm = resolveLandmark(stop);
    if (!lm || seen.has(lm.id)) continue;
    seen.add(lm.id);
    out.push(lm);
  }
  return out;
}
