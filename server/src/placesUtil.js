const COUNTRY_EN = {
  JP: "Japan", US: "United States", FR: "France", IT: "Italy", ES: "Spain",
  GB: "United Kingdom", DE: "Germany", TH: "Thailand", KR: "South Korea",
  CN: "China", IN: "India", AU: "Australia", CA: "Canada", MX: "Mexico",
  PT: "Portugal", GR: "Greece", TR: "Turkey", MA: "Morocco", ZA: "South Africa",
  AR: "Argentina", CL: "Chile", PE: "Peru", CO: "Colombia", DK: "Denmark",
  NO: "Norway", IS: "Iceland", CH: "Switzerland", AT: "Austria", CZ: "Czech Republic",
  HR: "Croatia", ID: "Indonesia", VN: "Vietnam", KH: "Cambodia", AE: "UAE",
  NZ: "New Zealand", EC: "Ecuador", TZ: "Tanzania", UG: "Uganda", CU: "Cuba",
  GE: "Georgia", PF: "French Polynesia", IN_OCEAN: "Indian Ocean",
};

const CJK = /[\u3040-\u30ff\u4e00-\u9faf\uac00-\ud7af]/;

export function hasCJK(text) {
  return CJK.test(text || "");
}

/** Prefer English; for CJK-only names use category + neighborhood */
export function englishPlaceName(name, categories = [], place = null) {
  if (!name) return categories[0]?.name || "Place";

  const paren = name.match(/^(.+?)\s*\([^)]+\)\s*$/);
  if (paren?.[1] && /[A-Za-z]/.test(paren[1])) return paren[1].trim();

  if (/[A-Za-z]/.test(name)) return name.trim();

  const cat = categories[0]?.name;
  const loc = place?.location || {};
  const hood = loc.neighborhood || loc.locality || loc.region;
  const hoodEn = hood && !hasCJK(hood) ? hood : null;
  if (cat && hoodEn) return `${cat} · ${hoodEn}`;
  if (cat) return cat;

  return name.trim();
}

export function englishPlaceSubtitle(place, categories = []) {
  const loc = place.location || {};
  const cat = categories[0]?.name || "Place";
  const cc = (loc.country || "").toUpperCase();
  const country = COUNTRY_EN[cc] || loc.country || "";
  const city = loc.locality || loc.region || "";

  const formatted = loc.formatted_address || "";
  if (formatted && !hasCJK(formatted)) {
    const dist = formatDistance(place.distance);
    return dist ? `${formatted} · ${dist}` : formatted;
  }

  const parts = [cat];
  if (city && !hasCJK(city)) parts.push(city);
  else if (city) parts.push(country || city);
  if (country) parts.push(country);
  const dist = formatDistance(place.distance);
  if (dist) parts.push(dist);
  return parts.filter((p, i, arr) => p && arr.indexOf(p) === i).join(" · ");
}

function formatDistance(meters) {
  if (meters == null || !Number.isFinite(Number(meters))) return null;
  const m = Number(meters);
  if (m < 1000) return `${Math.round(m)} m away`;
  return `${(m / 1000).toFixed(1)} km away`;
}

export function categoryIconUrl(categories) {
  const icon = categories?.[0]?.icon;
  if (icon?.prefix && icon?.suffix) {
    return `${icon.prefix}300${icon.suffix}`;
  }
  return null;
}

export function foursquarePhotoUrl(photo) {
  if (!photo?.prefix || !photo?.suffix) return null;
  return `${photo.prefix}400x300${photo.suffix}`;
}

export function dedupeById(places) {
  const seen = new Set();
  const out = [];
  for (const p of places) {
    const id = p.fsq_place_id || p.fsq_id;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(p);
  }
  return out;
}
