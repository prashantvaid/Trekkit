import { Router } from "express";
import { requireAuth } from "../auth.js";

const router = Router();

function roundCoord(n) {
  return Math.round(n * 10000) / 10000;
}

function dedupeKey(lat, lng, primary) {
  return `${roundCoord(lat)},${roundCoord(lng)}|${(primary || "").toLowerCase()}`;
}

function photonResult(feature) {
  const [lng, lat] = feature.geometry.coordinates;
  const p = feature.properties || {};
  const primary = p.name || p.street || p.city || p.country || "Place";
  const secondaryParts = [p.housenumber && p.street ? `${p.housenumber} ${p.street}` : p.street, p.city, p.state, p.country]
    .filter(Boolean)
    .filter((part, i, arr) => arr.indexOf(part) === i && part !== primary);
  const secondary = secondaryParts.join(", ");
  const category = p.osm_value || p.type || null;
  return {
    name: secondary ? `${primary}, ${secondary}` : primary,
    primary,
    secondary,
    lat: Number(lat),
    lng: Number(lng),
    type: category,
    category,
    country_code: p.countrycode?.toUpperCase() || null,
    source: "photon",
  };
}

function nominatimResult(d) {
  const parts = d.display_name.split(",");
  const primary = parts[0]?.trim() || d.display_name;
  const secondary = parts.slice(1).join(",").trim();
  return {
    name: d.display_name,
    primary,
    secondary,
    lat: Number(d.lat),
    lng: Number(d.lon),
    type: d.type,
    category: d.type,
    country_code: d.address?.country_code?.toUpperCase() || null,
    source: "nominatim",
  };
}

async function searchPhoton(q, { lat, lng } = {}) {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "8");
  url.searchParams.set("lang", "en");
  if (lat != null && lng != null) {
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
  }
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Photon responded ${r.status}`);
  const data = await r.json();
  return (data.features || []).map(photonResult);
}

async function searchNominatim(q, { type } = {}) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "6");
  if (type === "country") url.searchParams.set("featuretype", "country");
  const r = await fetch(url, {
    headers: {
      "User-Agent": "Trekkit/0.1 (travel tracker)",
      "Accept-Language": "en",
    },
  });
  if (!r.ok) throw new Error(`Nominatim responded ${r.status}`);
  const data = await r.json();
  return data.map(nominatimResult);
}

function mergeResults(lists) {
  const seen = new Set();
  const out = [];
  for (const list of lists) {
    for (const item of list) {
      const key = dedupeKey(item.lat, item.lng, item.primary);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
  }
  return out.slice(0, 10);
}

// POI-aware place search (Photon + Nominatim) with optional map bias.
router.get("/search", requireAuth, async (req, res) => {
  const q = (req.query.q || "").toString().trim();
  if (!q) return res.json({ results: [] });

  const lat = req.query.lat != null ? Number(req.query.lat) : null;
  const lng = req.query.lng != null ? Number(req.query.lng) : null;
  const type = req.query.type?.toString();

  try {
    if (type === "country") {
      const results = await searchNominatim(q, { type: "country" });
      return res.json({ results });
    }

    const bias = Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : {};
    const [photon, nominatim] = await Promise.allSettled([
      searchPhoton(q, bias),
      searchNominatim(q),
    ]);

    const results = mergeResults([
      photon.status === "fulfilled" ? photon.value : [],
      nominatim.status === "fulfilled" ? nominatim.value : [],
    ]);

    res.json({ results });
  } catch (err) {
    res.status(502).json({ error: "Geocoding failed", detail: String(err.message) });
  }
});

// Road-following route geometry via OSRM (falls back to straight lines client-side).
router.get("/route", requireAuth, async (req, res) => {
  const raw = (req.query.coords || "").toString().trim();
  if (!raw) return res.json({ geometry: null });

  const pairs = raw.split(";").map((part) => part.split(",").map(Number));
  if (pairs.length < 2 || pairs.some(([lng, lat]) => !Number.isFinite(lng) || !Number.isFinite(lat))) {
    return res.status(400).json({ error: "coords must be lng,lat pairs separated by semicolons" });
  }

  try {
    const coordStr = pairs.map(([lng, lat]) => `${lng},${lat}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson&steps=false`;
    const r = await fetch(url, { headers: { "User-Agent": "Trekkit/0.1" } });
    if (!r.ok) throw new Error(`OSRM responded ${r.status}`);
    const data = await r.json();
    if (data.code !== "Ok" || !data.routes?.[0]?.geometry) {
      return res.json({ geometry: null });
    }
    res.json({
      geometry: data.routes[0].geometry,
      distance: data.routes[0].distance,
      duration: data.routes[0].duration,
    });
  } catch (err) {
    res.status(502).json({ error: "Routing failed", detail: String(err.message) });
  }
});

export default router;
