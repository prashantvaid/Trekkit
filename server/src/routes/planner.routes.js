import { Router } from "express";
import { requireAuth } from "../auth.js";
import { getPlaceImages } from "../destinationImages.js";
import {
  categoryIconUrl,
  dedupeById,
  englishPlaceName,
  englishPlaceSubtitle,
  foursquarePhotoUrl,
} from "../placesUtil.js";

const router = Router();

const FOURSQUARE_PLACES_URL = "https://places-api.foursquare.com/places/search";
const FOURSQUARE_API_VERSION = "2025-06-17";
const LITEAPI_BASE = "https://api.liteapi.travel/v3.0";

function liteApiKey() {
  return process.env.LITEAPI_KEY || null;
}

function isLiteApiSandboxKey(key = liteApiKey()) {
  return !key || key.startsWith("sand_");
}

function liteApiHeaders() {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-API-Key": liteApiKey(),
  };
}

async function resolveAirportCode(query) {
  const key = liteApiKey();
  if (!key || !query?.trim()) return null;

  const trimmed = query.trim();
  if (trimmed.length === 3 && /^[A-Za-z]{3}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  const res = await fetch(
    `${LITEAPI_BASE}/data/flights/airports/?q=${encodeURIComponent(trimmed)}`,
    { headers: { Accept: "application/json", "X-API-Key": key } }
  );
  if (!res.ok) return null;

  const json = await res.json();
  const list = (json.data || []).flatMap((d) => d.airports || []);
  const hit =
    list.find((a) => a.hasAirlineService && a.iata?.length === 3) ||
    list.find((a) => a.iata?.length === 3) ||
    list.find((a) => a.iata);
  return hit?.iata?.toUpperCase() || null;
}

function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 1;
  const [y1, m1, d1] = checkIn.split("-").map(Number);
  const [y2, m2, d2] = checkOut.split("-").map(Number);
  const start = Date.UTC(y1, m1 - 1, d1);
  const end = Date.UTC(y2, m2 - 1, d2);
  return Math.max(1, Math.round((end - start) / 86400000));
}

function hotelSubtitle(h) {
  const parts = [];
  if (h.stars) parts.push(`${h.stars}★ hotel`);
  else if (h.rating != null) parts.push(`${Number(h.rating).toFixed(1)} guest rating`);
  const loc = [h.address, h.city_name || h.city].filter(Boolean).join(", ");
  if (loc) parts.push(loc);
  return parts.join(" · ") || "Hotel";
}

function mapLiteApiHotels(json, { checkIn, checkOut, cityName } = {}) {
  const hotelsById = Object.fromEntries((json.hotels || []).map((h) => [h.id, h]));
  const nights = nightsBetween(checkIn, checkOut);
  const results = [];

  for (const row of json.data || []) {
    const h = hotelsById[row.hotelId] || row.hotel || {};
    const rate = row.roomTypes?.[0]?.rates?.[0];
    const total =
      rate?.retailRate?.total?.[0] ||
      rate?.retailRate?.suggestedSellingPrice?.[0] ||
      rate?.net?.[0];
    if (!h.name && total?.amount == null) continue;

    const totalAmount = total?.amount != null ? Number(total.amount) : null;
    const pricePerNight =
      totalAmount != null ? Math.round((totalAmount / nights) * 100) / 100 : null;

    results.push({
      id: row.hotelId || h.id,
      title: h.name || "Hotel",
      subtitle: hotelSubtitle(h),
      lat: h.latitude ?? h.lat ?? null,
      lng: h.longitude ?? h.lng ?? null,
      price: pricePerNight,
      currency: total?.currency || "USD",
      rating: h.rating ?? h.stars ?? null,
      image: h.main_photo || h.thumbnail || h.images?.[0] || null,
      meta: {
        source: "liteapi",
        hotelId: row.hotelId || h.id,
        stars: h.stars ?? null,
        address: h.address || null,
        cityName: h.city_name || h.city || cityName || null,
        offerId: row.roomTypes?.[0]?.offerId,
        sandbox: json.sandbox === true,
        priceIsNightly: true,
        totalStayPrice: totalAmount,
        nights,
        checkIn: checkIn || null,
        checkOut: checkOut || null,
        roomName: rate?.name || row.roomTypes?.[0]?.name || null,
      },
    });
  }

  return results;
}

function mapCatalogHotels(hotels, { checkIn, checkOut, cityName } = {}) {
  const nights = nightsBetween(checkIn, checkOut);
  return (hotels || []).map((h) => ({
    id: h.id,
    title: h.name || "Hotel",
    subtitle: hotelSubtitle(h),
    lat: h.latitude ?? h.lat ?? null,
    lng: h.longitude ?? h.lng ?? null,
    price: null,
    currency: "USD",
    rating: h.rating ?? h.stars ?? null,
    image: h.main_photo || h.thumbnail || h.images?.[0] || null,
    meta: {
      source: "liteapi",
      hotelId: h.id,
      stars: h.stars ?? null,
      address: h.address || null,
      cityName: h.city || h.city_name || cityName || null,
      catalogOnly: true,
      priceIsNightly: true,
      nights,
      checkIn: checkIn || null,
      checkOut: checkOut || null,
    },
  }));
}

function normalizeHotelDatesServer(checkIn, checkOut) {
  if (!checkIn) return { checkIn: null, checkOut: null };
  let out = checkOut || checkIn;
  if (out <= checkIn) {
    const [y, m, d] = checkIn.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + 1);
    out = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  }
  return { checkIn, checkOut: out };
}

function inferCountryCode(lat, lng, city = "") {
  if (lat != null && lng != null) {
    if (lat >= 24 && lat <= 46 && lng >= 122 && lng <= 154) return "JP";
    if (lat >= 24 && lat <= 50 && lng >= -125 && lng <= -66) return "US";
    if (lat >= 35 && lat <= 72 && lng >= -10 && lng <= 40) return "GB";
    if (lat >= 41 && lat <= 51 && lng >= -5 && lng <= 10) return "FR";
    if (lat >= 36 && lat <= 47 && lng >= 7 && lng <= 19) return "IT";
    if (lat >= -10 && lat <= 6 && lng >= 95 && lng <= 141) return "ID";
    if (lat >= 5 && lat <= 21 && lng >= 97 && lng <= 106) return "TH";
  }
  const c = city.toLowerCase();
  if (/japan|tokyo|kyoto|osaka|jp|yokohama|sapporo|fukuoka|nara|hiroshima/.test(c)) return "JP";
  if (/bali|indonesia|jakarta/.test(c)) return "ID";
  if (/thailand|bangkok|phuket|chiang mai/.test(c)) return "TH";
  if (/france|paris|lyon|nice/.test(c)) return "FR";
  if (/italy|rome|milan|venice|florence|amalfi/.test(c)) return "IT";
  if (/spain|barcelona|madrid|seville/.test(c)) return "ES";
  if (/portugal|lisbon|porto/.test(c)) return "PT";
  if (/united states|usa|new york|los angeles|maui|hawaii|san francisco/.test(c)) return "US";
  if (/united kingdom|england|london|scotland|edinburgh/.test(c)) return "GB";
  return null;
}

const COUNTRY_LABELS = {
  JP: "Japan",
  US: "United States",
  GB: "United Kingdom",
  FR: "France",
  IT: "Italy",
  ES: "Spain",
  PT: "Portugal",
  TH: "Thailand",
  ID: "Indonesia",
  AU: "Australia",
  GR: "Greece",
};

const COUNTRY_SEARCH_DEFAULTS = {
  JP: { cityName: "Tokyo", lat: 35.6762, lng: 139.6503, iataCodes: ["HND", "NRT"] },
  US: { cityName: "New York", lat: 40.7128, lng: -74.006, iataCodes: ["JFK"] },
  FR: { cityName: "Paris", lat: 48.8566, lng: 2.3522, iataCodes: ["CDG"] },
  IT: { cityName: "Rome", lat: 41.9028, lng: 12.4964, iataCodes: ["FCO"] },
  ES: { cityName: "Barcelona", lat: 41.3874, lng: 2.1686, iataCodes: ["BCN"] },
  GB: { cityName: "London", lat: 51.5074, lng: -0.1278, iataCodes: ["LHR"] },
  TH: { cityName: "Bangkok", lat: 13.7563, lng: 100.5018, iataCodes: ["BKK"] },
  ID: { cityName: "Denpasar", lat: -8.6705, lng: 115.2126, iataCodes: ["DPS"] },
  PT: { cityName: "Lisbon", lat: 38.7223, lng: -9.1393, iataCodes: ["LIS"] },
  AU: { cityName: "Sydney", lat: -33.8688, lng: 151.2093, iataCodes: ["SYD"] },
  GR: { cityName: "Athens", lat: 37.9838, lng: 23.7275, iataCodes: ["ATH"] },
};

/** Well-known hotels when LiteAPI catalog/rates are empty or rate-limited. */
const CURATED_HOTELS = [
  { id: "park-hyatt-tokyo", name: "Park Hyatt Tokyo", city: "Tokyo", countryCode: "JP", lat: 35.6855, lng: 139.6917, stars: 5 },
  { id: "ritz-tokyo", name: "The Ritz-Carlton, Tokyo", city: "Tokyo", countryCode: "JP", lat: 35.6664, lng: 139.7314, stars: 5 },
  { id: "hotel-gajoen-tokyo", name: "Hotel Gajoen Tokyo", city: "Tokyo", countryCode: "JP", lat: 35.6362, lng: 139.7144, stars: 5 },
  { id: "mimaru-ginza", name: "MIMARU Tokyo Ginza East", city: "Tokyo", countryCode: "JP", lat: 35.6698, lng: 139.7679, stars: 4 },
  { id: "shinjuku-granbell", name: "Shinjuku Granbell Hotel", city: "Tokyo", countryCode: "JP", lat: 35.6595, lng: 139.7004, stars: 4 },
  { id: "hotel-okura-kyoto", name: "The Okura Kyoto", city: "Kyoto", countryCode: "JP", lat: 35.0116, lng: 135.7595, stars: 5 },
  { id: "four-seasons-kyoto", name: "Four Seasons Hotel Kyoto", city: "Kyoto", countryCode: "JP", lat: 35.0167, lng: 135.7825, stars: 5 },
  { id: "conrad-osaka", name: "Conrad Osaka", city: "Osaka", countryCode: "JP", lat: 34.6937, lng: 135.5023, stars: 5 },
  { id: "cross-osaka", name: "Cross Hotel Osaka", city: "Osaka", countryCode: "JP", lat: 34.6723, lng: 135.5012, stars: 4 },
  { id: "marriott-paris", name: "Paris Marriott Opera Ambassador", city: "Paris", countryCode: "FR", lat: 48.8722, lng: 2.3324, stars: 4 },
  { id: "hoxton-paris", name: "The Hoxton, Paris", city: "Paris", countryCode: "FR", lat: 48.8833, lng: 2.3683, stars: 4 },
  { id: "london-shangri-la", name: "Shangri-La The Shard, London", city: "London", countryCode: "GB", lat: 51.5045, lng: -0.0865, stars: 5 },
  { id: "bali-munduk", name: "Munduk Moding Plantation", city: "Bali", countryCode: "ID", lat: -8.2756, lng: 115.0625, stars: 5 },
  { id: "bali-como", name: "COMO Shambhala Estate", city: "Bali", countryCode: "ID", lat: -8.4312, lng: 115.2798, stars: 5 },
  { id: "bangkok-mandarin", name: "Mandarin Oriental, Bangkok", city: "Bangkok", countryCode: "TH", lat: 13.7241, lng: 100.5133, stars: 5 },
  { id: "nyc-plaza", name: "The Plaza Hotel", city: "New York", countryCode: "US", lat: 40.7645, lng: -73.9745, stars: 5 },
];

function isCountryOnlyName(name, countryCode) {
  if (!name) return false;
  const n = name.toLowerCase().trim();
  if (COUNTRY_LABELS[countryCode]?.toLowerCase() === n) return true;
  return Object.values(COUNTRY_LABELS).some((label) => label.toLowerCase() === n);
}

function resolveHotelSearchArea({ cityName, lat, lng, countryCode }) {
  const rawName = cleanCityName(cityName);
  let cc =
    (countryCode || inferCountryCode(lat != null ? Number(lat) : null, lng != null ? Number(lng) : null, rawName) || "")
      .toUpperCase()
      .slice(0, 2) || null;

  let searchCity = rawName;
  let searchLat = lat != null ? Number(lat) : null;
  let searchLng = lng != null ? Number(lng) : null;
  let areaNote = null;
  let iataCodes = [];

  const countryDefault = cc ? COUNTRY_SEARCH_DEFAULTS[cc] : null;
  const treatAsCountry = isCountryOnlyName(rawName, cc) || (!rawName && countryDefault);

  if (treatAsCountry && countryDefault) {
    searchCity = countryDefault.cityName;
    searchLat = searchLat ?? countryDefault.lat;
    searchLng = searchLng ?? countryDefault.lng;
    iataCodes = countryDefault.iataCodes || [];
    areaNote = `${COUNTRY_LABELS[cc] || rawName || cc} is broad — showing hotels around ${searchCity}. Pick a specific city for tighter results.`;
  } else if (cc === "JP" && countryDefault) {
    iataCodes = countryDefault.iataCodes || [];
  }

  return {
    cityName: searchCity || rawName,
    rawName: rawName || searchCity,
    lat: searchLat,
    lng: searchLng,
    countryCode: cc,
    iataCodes,
    areaNote,
    broadSearch: treatAsCountry,
  };
}

function pickCuratedHotels({ countryCode, cityName, lat, lng, limit = 24 }) {
  const city = (cityName || "").toLowerCase();
  let list = CURATED_HOTELS.filter((h) => {
    if (countryCode && h.countryCode === countryCode) return true;
    if (city && h.city.toLowerCase().includes(city)) return true;
    if (city && city.includes(h.city.toLowerCase())) return true;
    return false;
  });

  if (!list.length && countryCode === "JP") {
    list = CURATED_HOTELS.filter((h) => h.countryCode === "JP");
  }

  if (lat != null && lng != null && list.length > 6) {
    list = [...list].sort((a, b) => {
      const da = (a.lat - lat) ** 2 + (a.lng - lng) ** 2;
      const db = (b.lat - lat) ** 2 + (b.lng - lng) ** 2;
      return da - db;
    });
  }

  return list.slice(0, limit);
}

function mapCuratedHotels(hotels, dateContext) {
  const nights = nightsBetween(dateContext.checkIn, dateContext.checkOut);
  return hotels.map((h) => ({
    id: `curated-${h.id}`,
    title: h.name,
    subtitle: hotelSubtitle({ stars: h.stars, address: h.city, city: h.city }),
    lat: h.lat,
    lng: h.lng,
    price: null,
    currency: "USD",
    rating: h.stars ?? null,
    image: null,
    meta: {
      source: "curated",
      hotelId: h.id,
      stars: h.stars ?? null,
      address: h.city,
      cityName: h.city,
      catalogOnly: true,
      priceIsNightly: true,
      nights,
      checkIn: dateContext.checkIn || null,
      checkOut: dateContext.checkOut || null,
    },
  }));
}

function cleanCityName(city) {
  if (!city) return "";
  return city.split(",")[0].trim();
}

const HOTEL_SEARCH_CACHE_TTL_MS = 12 * 60 * 1000;
const HOTEL_CATALOG_CACHE_TTL_MS = 60 * 60 * 1000;
const LITEAPI_RATE_LIMIT_BACKOFF_MS = 5 * 60 * 1000;

const hotelSearchCache = new Map();
const hotelCatalogCache = new Map();
let liteApiRateLimitUntil = 0;

function cacheGet(map, key) {
  const hit = map.get(key);
  if (!hit || Date.now() > hit.expires) {
    map.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(map, key, value, ttlMs) {
  map.set(key, { value, expires: Date.now() + ttlMs });
}

function isLiteApiRateLimited() {
  return Date.now() < liteApiRateLimitUntil;
}

function markLiteApiRateLimited() {
  liteApiRateLimitUntil = Date.now() + LITEAPI_RATE_LIMIT_BACKOFF_MS;
}

function parseLiteApiFailure(status, body) {
  let message = body || `LiteAPI hotels error ${status}`;
  let rateLimited = status === 429;
  try {
    const json = JSON.parse(body);
    const err = json?.error || json;
    if (err?.code === 4290 || /too many requests|request limit/i.test(err?.message || "")) {
      rateLimited = true;
    }
    message = err?.description || err?.message || message;
  } catch {
    if (/429|too many requests|request limit/i.test(body || "")) rateLimited = true;
  }
  return { rateLimited, message };
}

function friendlyHotelError(message = "") {
  if (/429|too many requests|request limit|4290/i.test(message)) {
    return "Hotel price lookup is temporarily busy. You can still browse hotels and check rates on Google Hotels.";
  }
  if (message.length > 160) return "Hotel search failed. Please try again in a moment.";
  return message;
}

async function postLiteApiRates(body, dateContext = {}) {
  if (isLiteApiRateLimited()) {
    return { ok: false, rateLimited: true, results: [], json: null };
  }

  const apiRes = await fetch(`${LITEAPI_BASE}/hotels/rates`, {
    method: "POST",
    headers: liteApiHeaders(),
    body: JSON.stringify(body),
  });

  if (!apiRes.ok) {
    const err = await apiRes.text();
    const parsed = parseLiteApiFailure(apiRes.status, err);
    if (parsed.rateLimited) {
      markLiteApiRateLimited();
      return { ok: false, rateLimited: true, results: [], json: null };
    }
    throw new Error(parsed.message || `LiteAPI hotels error ${apiRes.status}`);
  }

  const json = await apiRes.json();
  return {
    ok: true,
    rateLimited: false,
    json,
    results: mapLiteApiHotels(json, dateContext),
  };
}

async function fetchHotelCatalog({ countryCode, cityName, lat, lng, radius = 25000, broadSearch = false }) {
  const cacheKey = `${countryCode || ""}|${cityName || ""}|${lat ?? ""}|${lng ?? ""}|${radius}|${broadSearch}`;
  const cached = cacheGet(hotelCatalogCache, cacheKey);
  if (cached) return cached;

  if (isLiteApiRateLimited()) return [];

  const geoRadius = broadSearch ? 80000 : radius;
  const attempts = [];

  if (lat != null && lng != null) {
    attempts.push({ latitude: lat, longitude: lng, radius: geoRadius, countryCode });
  }
  if (cityName && countryCode && !isCountryOnlyName(cityName, countryCode)) {
    attempts.push({ cityName, countryCode, latitude: lat, longitude: lng, radius: geoRadius });
  }
  if (countryCode) {
    attempts.push({ countryCode, latitude: lat, longitude: lng, radius: geoRadius });
  }

  for (const params of attempts) {
    const url = new URL(`${LITEAPI_BASE}/data/hotels`);
    if (params.countryCode) url.searchParams.set("countryCode", params.countryCode);
    if (params.cityName) url.searchParams.set("cityName", params.cityName);
    if (params.latitude != null && params.longitude != null) {
      url.searchParams.set("latitude", String(params.latitude));
      url.searchParams.set("longitude", String(params.longitude));
      url.searchParams.set("radius", String(params.radius || geoRadius));
    }
    url.searchParams.set("limit", "30");

    const res = await fetch(url, { headers: { Accept: "application/json", "X-API-Key": liteApiKey() } });
    if (res.status === 429) {
      markLiteApiRateLimited();
      return [];
    }
    if (!res.ok) continue;

    const json = await res.json();
    const data = json.data || [];
    if (data.length) {
      cacheSet(hotelCatalogCache, cacheKey, data, HOTEL_CATALOG_CACHE_TTL_MS);
      return data;
    }
  }

  return [];
}

async function catalogFallbackResults({ countryCode, cityName, lat, lng, dateContext, rateLimited, searchArea }) {
  const catalog = await fetchHotelCatalog({
    countryCode,
    cityName,
    lat,
    lng,
    broadSearch: searchArea?.broadSearch,
  });

  if (catalog.length) {
    const results = mapCatalogHotels(catalog.slice(0, 24), dateContext);
    const note = rateLimited
      ? "Live rates are temporarily unavailable — browse hotels below and open one to check prices on Google Hotels or Booking.com."
      : searchArea?.areaNote ||
        "Showing hotels in the area. Live nightly rates may be unavailable for these dates — open a hotel to check prices online.";
    return { results, note };
  }

  const curated = pickCuratedHotels({
    countryCode: searchArea?.countryCode || countryCode,
    cityName: searchArea?.cityName || cityName,
    lat,
    lng,
  });

  if (curated.length) {
    return {
      results: mapCuratedHotels(curated, dateContext),
      note:
        searchArea?.areaNote ||
        (rateLimited
          ? "Hotel lookup is busy — showing well-known properties you can view and book online."
          : "Showing recommended hotels in this area — open one to check live rates."),
    };
  }

  return { results: [], note: null };
}

function mapLiteApiFlightJourney(journey) {
  const offer = journey.cheapestOffer || journey.offers?.[0];
  const segs = journey.segments || [];
  const first = segs[0];
  const last = segs[segs.length - 1];
  const pricing = offer?.pricing?.display;
  const total =
    typeof pricing?.total === "number" ? pricing.total : pricing?.total?.amount;

  const stops = Math.max(0, segs.length - 1);
  const subtitleParts = [
    first?.carrier?.marketingName,
    first?.flight?.marketingNumber ? `#${first.flight.marketingNumber}` : null,
    first?.departureTime?.replace("T", " ").slice(0, 16),
    stops === 0 ? "Non-stop" : `${stops} stop${stops > 1 ? "s" : ""}`,
  ].filter(Boolean);

  return {
    id: offer?.offerId || journey.journeyKey,
    title: first && last ? `${first.originCode} → ${last.destinationCode}` : "Flight",
    subtitle: subtitleParts.join(" · "),
    price: total != null ? Number(total) : null,
    currency: pricing?.currency || "USD",
    meta: {
      source: "liteapi",
      offerId: offer?.offerId,
      journeyKey: journey.journeyKey,
      provider: offer?.provider?.code,
    },
  };
}

function foursquareHeaders(apiKey) {
  return {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
    "Accept-Language": "en",
    "X-Places-Api-Version": FOURSQUARE_API_VERSION,
  };
}

async function foursquareSearch(apiKey, params) {
  const qs = new URLSearchParams(params);
  const fsRes = await fetch(`${FOURSQUARE_PLACES_URL}?${qs}`, {
    headers: foursquareHeaders(apiKey),
  });
  if (!fsRes.ok) {
    const err = await fsRes.text();
    throw new Error(err || `Foursquare error ${fsRes.status}`);
  }
  const data = await fsRes.json();
  return data.results || [];
}

function mapFoursquarePlace(p) {
  const categories = p.categories || [];
  const icon = categoryIconUrl(categories);
  return {
    id: p.fsq_place_id || p.fsq_id || p.fsqId,
    title: englishPlaceName(p.name, categories, p),
    subtitle: englishPlaceSubtitle(p, categories),
    lat: p.latitude ?? null,
    lng: p.longitude ?? null,
    rating: p.rating ?? null,
    price: p.price ?? null,
    image: foursquarePhotoUrl(p.photos?.[0]) || icon,
    meta: {
      source: "foursquare",
      categories: categories.map((c) => c.name),
      originalName: p.name,
      distance: p.distance ?? null,
    },
  };
}

async function enrichPlaceImages(results, limit = 24) {
  const slice = results.slice(0, limit);
  await Promise.all(
    slice.map(async (r) => {
      if (r.image && !r.image.includes("categories_v2")) return;
      const imgs = await getPlaceImages(
        r.meta?.originalName || r.title,
        r.subtitle,
        r.image
      );
      if (imgs[0]) r.image = imgs[0];
      if (imgs.length > 1) r.meta = { ...r.meta, images: imgs.slice(0, 3) };
    })
  );
  return results;
}

async function searchFoursquarePlaces({ apiKey, lat, lng, type, q, sort, radius, limit }) {
  const base = {
    ll: `${lat},${lng}`,
    limit: String(Math.min(Math.max(Number(limit) || 24, 1), 50)),
    sort: sort || "RELEVANCE",
    radius: String(radius || 10000),
  };

  let rawResults = [];

  if (q?.trim()) {
    const params = { ...base, query: q.trim() };
    if (type === "restaurant") params.categories = "13000";
    rawResults = await foursquareSearch(apiKey, params);
  } else if (type === "restaurant") {
    const queries = ["restaurant", "food", "cafe", "sushi", "ramen"];
    const batches = await Promise.all(
      queries.map((query) =>
        foursquareSearch(apiKey, { ...base, categories: "13000", query })
      )
    );
    rawResults = dedupeById(batches.flat());
  } else {
    const queries = ["museum", "attraction", "landmark", "temple", "park", "gallery"];
    const batches = await Promise.all(
      queries.map((query) => foursquareSearch(apiKey, { ...base, query }))
    );
    rawResults = dedupeById(batches.flat());
  }

  return rawResults;
}

// Foursquare Places search (restaurants / POIs)
router.get("/places", requireAuth, async (req, res) => {
  const { q, lat, lng, type = "restaurant", sort, radius, limit } = req.query;
  const apiKey = process.env.FOURSQUARE_API_KEY;

  if (!apiKey) {
    return res.status(503).json({
      error: "Foursquare API key not configured. Set FOURSQUARE_API_KEY on the server.",
      results: [],
    });
  }

  if (!lat || !lng) {
    return res.status(400).json({ error: "lat and lng are required", results: [] });
  }

  try {
    const rawResults = await searchFoursquarePlaces({
      apiKey,
      lat,
      lng,
      type,
      q,
      sort,
      radius: radius || 10000,
      limit,
    });

    let results = rawResults.map(mapFoursquarePlace);
    results = await enrichPlaceImages(results, 24);
    res.json({ results });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: e.message, results: [] });
  }
});

// LiteAPI hotel rates
router.get("/hotels", requireAuth, async (req, res) => {
  const { city, adults = 1, lat, lng, countryCode, q } = req.query;
  const { checkIn, checkOut } = normalizeHotelDatesServer(req.query.checkIn, req.query.checkOut);
  const key = liteApiKey();

  if (!key) {
    return res.status(503).json({
      error: "LiteAPI key not configured. Set LITEAPI_KEY on the server.",
      results: [],
    });
  }

  if (!checkIn || !checkOut) {
    return res.status(400).json({ error: "checkIn and checkOut are required", results: [] });
  }

  const cityName = cleanCityName(city);
  const searchArea = resolveHotelSearchArea({
    cityName,
    lat: lat != null ? Number(lat) : null,
    lng: lng != null ? Number(lng) : null,
    countryCode,
  });
  const cc = searchArea.countryCode;

  if (!searchArea.cityName && searchArea.lat == null && searchArea.lng == null) {
    return res.status(400).json({
      error: "city or lat/lng are required",
      results: [],
    });
  }

  try {
    const cacheKey = [
      searchArea.rawName,
      searchArea.cityName,
      cc,
      searchArea.lat,
      searchArea.lng,
      checkIn,
      checkOut,
      adults,
      q || "",
    ].join("|");
    const cached = cacheGet(hotelSearchCache, cacheKey);
    if (cached) return res.json(cached);

    const baseBody = {
      checkin: checkIn,
      checkout: checkOut,
      currency: "USD",
      guestNationality: "US",
      occupancies: [{ adults: Number(adults) || 1 }],
      maxRatesPerHotel: 1,
      timeout: 15,
      limit: 24,
      sort: [{ field: "price", direction: "ascending" }],
    };

    function buildSearchBody(extra = {}) {
      const body = { ...baseBody, ...extra };
      if (searchArea.lat != null && searchArea.lng != null) {
        body.latitude = searchArea.lat;
        body.longitude = searchArea.lng;
        body.radius = searchArea.broadSearch ? 80000 : 25000;
      }
      if (searchArea.cityName && !isCountryOnlyName(searchArea.cityName, cc)) {
        body.cityName = searchArea.cityName;
      }
      if (cc) body.countryCode = cc;
      if (q?.trim()) body.hotelName = q.trim();
      return body;
    }

    let note = searchArea.areaNote || null;
    let sandbox;
    let rateLimited = false;
    let results = [];
    const dateContext = { checkIn, checkOut, cityName: searchArea.cityName };
    const catalogCtx = {
      countryCode: cc,
      cityName: searchArea.cityName,
      lat: searchArea.lat,
      lng: searchArea.lng,
      dateContext,
      searchArea,
    };

    const rateAttempts = [buildSearchBody()];
    for (const iata of searchArea.iataCodes || []) {
      rateAttempts.push(buildSearchBody({ iataCode: iata }));
    }

    for (const body of rateAttempts) {
      if (rateLimited) break;
      const out = await postLiteApiRates(body, dateContext);
      if (out.rateLimited) {
        rateLimited = true;
        break;
      }
      sandbox = out.json?.sandbox;
      if (out.results.length) {
        results = out.results;
        break;
      }
    }

    if (!results.length && !rateLimited) {
      const catalog = await fetchHotelCatalog({
        countryCode: cc,
        cityName: searchArea.cityName,
        lat: searchArea.lat,
        lng: searchArea.lng,
        broadSearch: searchArea.broadSearch,
      });
      if (catalog.length) {
        const ids = catalog.slice(0, 24).map((h) => h.id).filter(Boolean);
        if (ids.length) {
          const out = await postLiteApiRates({ ...baseBody, hotelIds: ids, limit: 24 }, dateContext);
          if (out.rateLimited) rateLimited = true;
          else {
            sandbox = out.json?.sandbox;
            if (out.results.length) results = out.results;
          }
        }
      }
    }

    if (!results.length) {
      const fallback = await catalogFallbackResults({ ...catalogCtx, rateLimited });
      results = fallback.results;
      if (fallback.note) note = note ? `${note} ${fallback.note}` : fallback.note;
    }

    if (!results.length) {
      note =
        note ||
        (rateLimited
          ? "Hotel search is temporarily busy. Wait a minute and try again, or search on Google Hotels."
          : `No hotels found near ${searchArea.rawName || searchArea.cityName || "this area"}. Try a specific city like Tokyo, Kyoto, or Osaka.`);
    } else if (checkOut !== req.query.checkOut && req.query.checkOut === req.query.checkIn) {
      note = note || "Used a 1-night stay — checkout must be after check-in.";
    }

    const payload = {
      results,
      note,
      rateLimited: rateLimited || undefined,
      sandbox: sandbox ? "Sandbox rates from LiteAPI" : undefined,
    };
    cacheSet(
      hotelSearchCache,
      cacheKey,
      payload,
      results.length ? HOTEL_SEARCH_CACHE_TTL_MS : 60 * 1000
    );
    res.json(payload);
  } catch (e) {
    console.error(e);
    try {
      const searchArea = resolveHotelSearchArea({
        cityName: cleanCityName(city),
        lat: lat != null ? Number(lat) : null,
        lng: lng != null ? Number(lng) : null,
        countryCode,
      });
      const dateContext = { checkIn, checkOut, cityName: searchArea.cityName };
      const fallback = await catalogFallbackResults({
        countryCode: searchArea.countryCode,
        cityName: searchArea.cityName,
        lat: searchArea.lat,
        lng: searchArea.lng,
        dateContext,
        searchArea,
        rateLimited: /429|too many requests|request limit/i.test(e.message || ""),
      });
      if (fallback.results.length) {
        return res.json({
          results: fallback.results,
          note: [searchArea.areaNote, fallback.note].filter(Boolean).join(" ") || friendlyHotelError(e.message),
        });
      }
    } catch (fallbackErr) {
      console.error(fallbackErr);
    }
    res.status(502).json({ error: friendlyHotelError(e.message), results: [] });
  }
});

// LiteAPI flight rates
router.get("/flights", requireAuth, async (req, res) => {
  const {
    origin,
    destination,
    date,
    returnDate,
    adults = 1,
    nonStop,
    travelClass,
    maxPrice,
    countryCode,
  } = req.query;

  const key = liteApiKey();

  if (!key) {
    return res.status(503).json({
      error: "LiteAPI key not configured. Set LITEAPI_KEY on the server.",
      results: [],
    });
  }

  if (!origin || !destination || !date) {
    return res.status(400).json({
      error: "origin, destination, and date are required",
      results: [],
    });
  }

  try {
    const originCode = await resolveAirportCode(origin);
    const destCode = await resolveAirportCode(destination);

    if (!originCode || !destCode) {
      return res.json({
        results: [],
        sandbox: isLiteApiSandboxKey(key),
        note: "Could not resolve airport codes — try city names or 3-letter codes (e.g. JFK, CDG).",
      });
    }

    // LiteAPI sandbox returns simulated airlines (e.g. "Nuitée Air"), not real flights.
    if (isLiteApiSandboxKey(key)) {
      return res.json({
        results: [],
        sandbox: true,
        originCode,
        destCode,
        note:
          "Your LiteAPI sandbox key only returns test data, not real airlines. Use the booking sites below for live prices. Swap to a production LiteAPI key when ready.",
      });
    }

    const legs = [
      {
        origin: originCode,
        destination: destCode,
        date,
        direction: "OUTBOUND",
      },
    ];

    if (returnDate) {
      legs.push({
        origin: destCode,
        destination: originCode,
        date: returnDate,
        direction: "INBOUND",
      });
    }

    const body = {
      legs,
      adults: Number(adults) || 1,
      children: 0,
      infants: 0,
      currency: "USD",
      country: (countryCode || "US").toUpperCase().slice(0, 2),
      sort: { sortBy: "price", sortOrder: "asc" },
    };

    if (nonStop === "true") {
      body.filters = { maxStops: 0 };
    }
    if (travelClass) {
      body.cabinClass = travelClass;
    }

    const apiRes = await fetch(`${LITEAPI_BASE}/flights/rates`, {
      method: "POST",
      headers: liteApiHeaders(),
      body: JSON.stringify(body),
    });

    if (!apiRes.ok) {
      const err = await apiRes.text();
      throw new Error(err || `LiteAPI flights error ${apiRes.status}`);
    }

    const json = await apiRes.json();
    let results = (json.data || [])
      .flatMap((batch) => batch.journeys || [])
      .map(mapLiteApiFlightJourney);

    if (maxPrice) {
      const cap = Number(maxPrice);
      results = results.filter((r) => r.price == null || r.price <= cap);
    }

    results = results.slice(0, 24);

    res.json({
      results,
      originCode,
      destCode,
      note: json.sandbox !== false ? "Sandbox fares from LiteAPI" : undefined,
    });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: e.message, results: [] });
  }
});

// Ollama AI planner (streaming NDJSON)
router.post("/ai", requireAuth, async (req, res) => {
  const { tripContext, prompt: userPrompt } = req.body || {};
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3";

  const systemContext = `You are an expert travel planner. Be specific and methodical.
Suggest neighborhoods to stay in, optimal day ordering, restaurants with meal times, must-see sites with timing, and local tips.
When mentioning hotels, restaurants, or activities, prefix with [HOTEL], [RESTAURANT], or [ACTIVITY] so they can be parsed.

Trip context:
${JSON.stringify(tripContext, null, 2)}`;

  const prompt = userPrompt?.trim()
    ? `${systemContext}\n\nUser request: ${userPrompt}`
    : `${systemContext}\n\nSuggest a detailed day-by-day plan for this trip.`;

  try {
    const ollamaRes = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: true }),
    });

    if (!ollamaRes.ok) {
      const err = await ollamaRes.text();
      return res.status(502).json({
        error: `Ollama unavailable (${ollamaRes.status}). Start Ollama locally or set OLLAMA_URL. ${err}`,
      });
    }

    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = ollamaRes.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
    res.end();
  } catch (e) {
    console.error(e);
    if (!res.headersSent) {
      res.status(502).json({
        error: "Could not reach Ollama. Run `ollama serve` and pull a model (e.g. llama3).",
      });
    }
  }
});

export default router;
