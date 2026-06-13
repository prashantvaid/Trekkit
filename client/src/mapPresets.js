export const MAP_PRESET_LABELS = {
  basemap: { bright: "Colorful city", liberty: "Classic city", apple: "Apple Maps" },
  view: { city3d: "3D city" },
  routeStyle: { animated: "Animated route", solid: "Solid route", hidden: "Hide route" },
  hillshade: { off: "No terrain" },
};

/** Default 3D city map — vector buildings, pitched camera, no terrain warp. */
export const CITY_MAP_PRESETS = {
  basemap: "bright",
  view: "city3d",
  routeStyle: "animated",
  hillshade: "off",
};

const VALID_BASEMAPS = new Set(["bright", "liberty", "apple"]);

export function migrateBasemap(key) {
  if (key === "streets" || key === "satellite") return "bright";
  if (key === "outdoors") return "liberty";
  return VALID_BASEMAPS.has(key) ? key : "bright";
}

export const DEFAULT_MAP_PRESETS = { ...CITY_MAP_PRESETS };

const COUNTRY_KEYS = {
  japan: ["japan"],
  iceland: ["iceland"],
  switzerland: ["switzerland"],
  canada: ["canada"],
  "new zealand": ["new zealand"],
  norway: ["norway"],
  nepal: ["nepal"],
  indonesia: ["indonesia"],
  thailand: ["thailand"],
  australia: ["australia"],
  usa: ["united states", "usa", "u.s.", "america"],
  france: ["france"],
  italy: ["italy"],
  spain: ["spain"],
  portugal: ["portugal"],
  greece: ["greece"],
  morocco: ["morocco"],
  "south africa": ["south africa"],
  india: ["india"],
  brazil: ["brazil"],
  mexico: ["mexico"],
  uk: ["united kingdom", "uk", "great britain", "england", "scotland", "wales"],
  germany: ["germany"],
  netherlands: ["netherlands"],
  vietnam: ["vietnam"],
  peru: ["peru"],
  chile: ["chile"],
  argentina: ["argentina"],
};

const COUNTRY_PRESETS = Object.fromEntries(
  Object.keys(COUNTRY_KEYS).map((key) => [key, { ...CITY_MAP_PRESETS }])
);

export const POPULAR_COUNTRIES = [
  { name: "Japan", code: "JP", lat: 36.2, lng: 138.25 },
  { name: "United States", code: "US", lat: 39.8, lng: -98.5 },
  { name: "France", code: "FR", lat: 46.6, lng: 2.2 },
  { name: "Italy", code: "IT", lat: 41.9, lng: 12.5 },
  { name: "Thailand", code: "TH", lat: 15.8, lng: 100.9 },
  { name: "Iceland", code: "IS", lat: 64.9, lng: -19.0 },
  { name: "Australia", code: "AU", lat: -25.3, lng: 133.7 },
  { name: "Canada", code: "CA", lat: 56.1, lng: -106.3 },
];

function matchCountryKey(name) {
  const n = (name || "").toLowerCase().trim();
  for (const [key, aliases] of Object.entries(COUNTRY_KEYS)) {
    if (aliases.some((a) => n === a || n.includes(a))) return key;
  }
  return null;
}

export function normalizeCityPresets(presets) {
  const p = { ...CITY_MAP_PRESETS, ...presets, view: "city3d", hillshade: "off" };
  p.basemap = migrateBasemap(p.basemap);
  return p;
}

export function getMapPresetsForCountry(countryName) {
  const key = matchCountryKey(countryName);
  return normalizeCityPresets({ ...DEFAULT_MAP_PRESETS, ...(key ? COUNTRY_PRESETS[key] : {}) });
}

export function parseStoredMapPresets(raw) {
  if (!raw) return null;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== "object") return null;
    return normalizeCityPresets({ ...DEFAULT_MAP_PRESETS, ...parsed });
  } catch {
    return null;
  }
}

export function formatPresetSummary(presets) {
  const p = presets || DEFAULT_MAP_PRESETS;
  return [
    MAP_PRESET_LABELS.basemap[p.basemap] || "3D city",
    "3D buildings",
    MAP_PRESET_LABELS.routeStyle[p.routeStyle],
  ].filter(Boolean);
}

export function getMapRegion(trip) {
  if (!trip) return null;
  if (trip.country && Number.isFinite(trip.country_lat) && Number.isFinite(trip.country_lng)) {
    return {
      name: trip.country,
      lat: trip.country_lat,
      lng: trip.country_lng,
      presets: parseStoredMapPresets(trip.map_presets) || getMapPresetsForCountry(trip.country),
      confirmed: true,
    };
  }
  return null;
}

export function hasMapRegion(trip) {
  return !!getMapRegion(trip);
}
