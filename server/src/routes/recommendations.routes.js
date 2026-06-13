import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../auth.js";
import { hydrateTrip } from "./trips.routes.js";

const router = Router();

// Curated destinations tagged with the same interest vocabulary used at signup.
const DESTINATIONS = [
  { id: "bali", name: "Bali", country: "Indonesia", emoji: "🏝️", blurb: "Beaches, temples, and emerald rice terraces.", tags: ["Beaches", "Culture", "Nature", "Diving"], popularity: 9 },
  { id: "kyoto", name: "Kyoto", country: "Japan", emoji: "⛩️", blurb: "Ancient temples and timeless lantern-lit streets.", tags: ["Culture", "History", "Food & drink", "Photography"], popularity: 9 },
  { id: "banff", name: "Banff", country: "Canada", emoji: "🏔️", blurb: "Turquoise lakes beneath the Canadian Rockies.", tags: ["Mountains", "Hiking", "Nature", "Skiing"], popularity: 8 },
  { id: "lisbon", name: "Lisbon", country: "Portugal", emoji: "🚋", blurb: "Hills, tiles, and fresh seafood by the sea.", tags: ["City breaks", "Food & drink", "Culture", "Nightlife"], popularity: 8 },
  { id: "queenstown", name: "Queenstown", country: "New Zealand", emoji: "🪂", blurb: "The adventure capital of the world.", tags: ["Mountains", "Hiking", "Nature", "Skiing"], popularity: 7 },
  { id: "marrakech", name: "Marrakech", country: "Morocco", emoji: "🕌", blurb: "Souks, spices, and gateways to the desert.", tags: ["Culture", "History", "Food & drink", "Photography"], popularity: 7 },
  { id: "reykjavik", name: "Reykjavik", country: "Iceland", emoji: "🌋", blurb: "Waterfalls, geysers, and the northern lights.", tags: ["Nature", "Photography", "Hiking", "Road trips"], popularity: 8 },
  { id: "capetown", name: "Cape Town", country: "South Africa", emoji: "🦓", blurb: "Table Mountain where two oceans meet.", tags: ["Nature", "Wildlife", "Beaches", "Hiking"], popularity: 7 },
  { id: "barcelona", name: "Barcelona", country: "Spain", emoji: "🎨", blurb: "Gaudí, city beaches, and late-night tapas.", tags: ["City breaks", "Beaches", "Food & drink", "Nightlife", "History"], popularity: 8 },
  { id: "chiangmai", name: "Chiang Mai", country: "Thailand", emoji: "🐘", blurb: "Temples, jungles, and legendary street food.", tags: ["Culture", "Food & drink", "Nature", "Wildlife", "Backpacking"], popularity: 7 },
  { id: "patagonia", name: "Patagonia", country: "Chile & Argentina", emoji: "🏞️", blurb: "Glaciers, granite peaks, and endless trails.", tags: ["Hiking", "Mountains", "Nature", "Road trips"], popularity: 7 },
  { id: "neworleans", name: "New Orleans", country: "USA", emoji: "🎷", blurb: "Jazz, festivals, and Creole flavors.", tags: ["Festivals", "Food & drink", "Nightlife", "Culture", "History"], popularity: 6 },
  { id: "maldives", name: "Maldives", country: "Indian Ocean", emoji: "🤿", blurb: "Overwater villas above glowing coral reefs.", tags: ["Beaches", "Diving", "Nature"], popularity: 7 },
  { id: "interlaken", name: "Interlaken", country: "Switzerland", emoji: "🚠", blurb: "Paraglide between two alpine lakes.", tags: ["Mountains", "Hiking", "Skiing", "Nature"], popularity: 6 },
  { id: "rome", name: "Rome", country: "Italy", emoji: "🏛️", blurb: "Ancient ruins and unbeatable plates of pasta.", tags: ["History", "Culture", "Food & drink", "City breaks"], popularity: 8 },
  { id: "serengeti", name: "Serengeti", country: "Tanzania", emoji: "🦁", blurb: "Witness the great migration up close.", tags: ["Wildlife", "Nature", "Photography"], popularity: 7 },
  { id: "santorini", name: "Santorini", country: "Greece", emoji: "🌅", blurb: "Whitewashed cliffs and sunsets over the caldera.", tags: ["Beaches", "Photography", "Food & drink", "Culture"], popularity: 8 },
  { id: "seoul", name: "Seoul", country: "South Korea", emoji: "🏙️", blurb: "Neon nights, palaces, and legendary street food.", tags: ["City breaks", "Food & drink", "Culture", "Nightlife"], popularity: 8 },
  { id: "mexicocity", name: "Mexico City", country: "Mexico", emoji: "🌮", blurb: "Museums, markets, and tacos on every corner.", tags: ["Food & drink", "Culture", "History", "City breaks"], popularity: 7 },
  { id: "sydney", name: "Sydney", country: "Australia", emoji: "🌉", blurb: "Harbour views, surf beaches, and coastal walks.", tags: ["Beaches", "City breaks", "Nature", "Photography"], popularity: 8 },
  { id: "machupicchu", name: "Machu Picchu", country: "Peru", emoji: "☁️", blurb: "Cloud forests and an ancient city in the sky.", tags: ["History", "Hiking", "Nature", "Photography"], popularity: 8 },
  { id: "dubai", name: "Dubai", country: "UAE", emoji: "🏙️", blurb: "Desert dunes, skyline views, and luxury escapes.", tags: ["City breaks", "Beaches", "Nightlife", "Photography"], popularity: 7 },
  { id: "amalfi", name: "Amalfi Coast", country: "Italy", emoji: "🍋", blurb: "Cliffside villages above the Tyrrhenian Sea.", tags: ["Beaches", "Food & drink", "Road trips", "Photography"], popularity: 8 },
  { id: "hanoi", name: "Hanoi", country: "Vietnam", emoji: "🍜", blurb: "Old Quarter chaos and bowls of pho at dawn.", tags: ["Food & drink", "Culture", "History", "Backpacking"], popularity: 7 },
  { id: "buenosaires", name: "Buenos Aires", country: "Argentina", emoji: "💃", blurb: "Tango, steakhouses, and European-style boulevards.", tags: ["Food & drink", "Culture", "Nightlife", "City breaks"], popularity: 7 },
  { id: "porto", name: "Porto", country: "Portugal", emoji: "🍷", blurb: "Riverfront tiles, port wine, and hillside alleys.", tags: ["Food & drink", "Culture", "City breaks", "Photography"], popularity: 7 },
  { id: "copenhagen", name: "Copenhagen", country: "Denmark", emoji: "🚲", blurb: "Design, canals, and the coziest bakeries in Europe.", tags: ["City breaks", "Food & drink", "Culture"], popularity: 7 },
  { id: "vancouver", name: "Vancouver", country: "Canada", emoji: "🌲", blurb: "Mountains, ocean, and forest trails minutes apart.", tags: ["Nature", "Hiking", "City breaks", "Photography"], popularity: 7 },
  { id: "zanzibar", name: "Zanzibar", country: "Tanzania", emoji: "🌴", blurb: "Spice islands with powder-white Indian Ocean beaches.", tags: ["Beaches", "Culture", "Diving", "Nature"], popularity: 6 },
  { id: "dubrovnik", name: "Dubrovnik", country: "Croatia", emoji: "🏰", blurb: "Walled old town and Adriatic sunsets.", tags: ["History", "Beaches", "Culture", "Photography"], popularity: 7 },
  { id: "galapagos", name: "Galápagos", country: "Ecuador", emoji: "🐢", blurb: "Wildlife encounters you cannot find anywhere else.", tags: ["Wildlife", "Nature", "Diving", "Photography"], popularity: 7 },
  { id: "petra", name: "Petra", country: "Jordan", emoji: "🏜️", blurb: "Rose-red canyons and a lost Nabataean city.", tags: ["History", "Culture", "Photography", "Hiking"], popularity: 7 },
  { id: "sapporo", name: "Sapporo", country: "Japan", emoji: "❄️", blurb: "Snow festivals, ramen alleys, and nearby ski hills.", tags: ["Food & drink", "Skiing", "Culture", "Festivals"], popularity: 6 },
  { id: "medellin", name: "Medellín", country: "Colombia", emoji: "🌺", blurb: "Spring weather year-round and vibrant city culture.", tags: ["City breaks", "Culture", "Nightlife", "Nature"], popularity: 6 },
  { id: "edinburgh", name: "Edinburgh", country: "Scotland", emoji: "🏴", blurb: "Castle views, whisky, and festival-season magic.", tags: ["History", "Culture", "Festivals", "City breaks"], popularity: 7 },
  { id: "nashville", name: "Nashville", country: "USA", emoji: "🎸", blurb: "Live music on every block and Southern comfort food.", tags: ["Festivals", "Food & drink", "Nightlife", "Culture"], popularity: 6 },
  { id: "bora", name: "Bora Bora", country: "French Polynesia", emoji: "🛶", blurb: "Lagoon blues and overwater bungalow dreams.", tags: ["Beaches", "Diving", "Nature"], popularity: 6 },
  { id: "istanbul", name: "Istanbul", country: "Turkey", emoji: "🕌", blurb: "Where continents meet — bazaars, mosques, and Bosphorus views.", tags: ["History", "Culture", "Food & drink", "Photography"], popularity: 8 },
  { id: "kruger", name: "Kruger", country: "South Africa", emoji: "🐘", blurb: "Classic African safari drives at sunrise.", tags: ["Wildlife", "Nature", "Photography"], popularity: 7 },
  { id: "hokkaido", name: "Hokkaido", country: "Japan", emoji: "🌸", blurb: "Volcanic lakes, lavender fields, and fresh seafood.", tags: ["Nature", "Food & drink", "Skiing", "Photography"], popularity: 7 },
  { id: "athens", name: "Athens", country: "Greece", emoji: "🏛️", blurb: "The Acropolis above a buzzing modern capital.", tags: ["History", "Culture", "Food & drink", "City breaks"], popularity: 7 },
  { id: "mumbai", name: "Mumbai", country: "India", emoji: "🎬", blurb: "Bollywood energy, coastal drives, and spice markets.", tags: ["Culture", "Food & drink", "City breaks", "Photography"], popularity: 6 },
  { id: "havana", name: "Havana", country: "Cuba", emoji: "🚗", blurb: "Classic cars, salsa rhythms, and Caribbean color.", tags: ["Culture", "History", "Photography", "Nightlife"], popularity: 6 },
  { id: "lofoten", name: "Lofoten", country: "Norway", emoji: "🎣", blurb: "Arctic peaks rising straight from fjord waters.", tags: ["Nature", "Photography", "Hiking", "Road trips"], popularity: 7 },
  { id: "maui", name: "Maui", country: "USA", emoji: "🌺", blurb: "Road to Hana, whale season, and golden Pacific shores.", tags: ["Beaches", "Nature", "Road trips", "Hiking"], popularity: 8 },
  { id: "prague", name: "Prague", country: "Czech Republic", emoji: "🌉", blurb: "Gothic spires, beer halls, and fairy-tale squares.", tags: ["History", "Culture", "City breaks", "Nightlife"], popularity: 7 },
  { id: "siemreap", name: "Siem Reap", country: "Cambodia", emoji: "🛕", blurb: "Angkor Wat at dawn and jungle temple ruins.", tags: ["History", "Culture", "Photography", "Backpacking"], popularity: 7 },
  { id: "azores", name: "Azores", country: "Portugal", emoji: "🌋", blurb: "Volcanic lakes and whale watching in the Atlantic.", tags: ["Nature", "Wildlife", "Hiking", "Photography"], popularity: 6 },
  { id: "salzburg", name: "Salzburg", country: "Austria", emoji: "🎻", blurb: "Alpine charm, Mozart, and Sound of Music scenery.", tags: ["Culture", "Mountains", "History", "City breaks"], popularity: 6 },
  { id: "cartagena", name: "Cartagena", country: "Colombia", emoji: "🌺", blurb: "Colorful walled city on the Caribbean coast.", tags: ["Beaches", "Culture", "History", "Photography"], popularity: 7 },
  { id: "lakecomo", name: "Lake Como", country: "Italy", emoji: "⛵", blurb: "Villa-dotted shores beneath the Italian Alps.", tags: ["Nature", "Photography", "Food & drink", "Road trips"], popularity: 7 },
  { id: "phuket", name: "Phuket", country: "Thailand", emoji: "🏖️", blurb: "Island hops, night markets, and Andaman sunsets.", tags: ["Beaches", "Diving", "Food & drink", "Nightlife"], popularity: 7 },
  { id: "tbilisi", name: "Tbilisi", country: "Georgia", emoji: "🍇", blurb: "Sulfur baths, wine country, and mountain day trips.", tags: ["Food & drink", "Culture", "History", "Mountains"], popularity: 6 },
  { id: "matera", name: "Matera", country: "Italy", emoji: "🪨", blurb: "Ancient cave dwellings carved into limestone cliffs.", tags: ["History", "Culture", "Photography"], popularity: 6 },
  { id: "bwindi", name: "Bwindi", country: "Uganda", emoji: "🦍", blurb: "Trek through misty forests to meet mountain gorillas.", tags: ["Wildlife", "Nature", "Hiking", "Photography"], popularity: 6 },
];

const DEST_PAGE_SIZE = 8;

function parseInterests(json) {
  try {
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

function scoreDestinations(userId) {
  const me = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  const interests = parseInterests(me?.interests);
  const interestSet = new Set(interests);
  return DESTINATIONS.map((d) => {
    const matched = d.tags.filter((t) => interestSet.has(t));
    return { ...d, score: matched.length, matched };
  }).sort((a, b) => b.score - a.score || b.popularity - a.popularity);
}

function pageDestinations(userId, offset = 0, limit = DEST_PAGE_SIZE) {
  const all = scoreDestinations(userId);
  const start = Math.max(0, offset);
  const end = start + limit;
  return {
    destinations: all.slice(start, end),
    total: all.length,
    hasMore: end < all.length,
    nextOffset: end,
  };
}

router.get("/destinations", requireAuth, (req, res) => {
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
  const limit = Math.min(12, Math.max(1, parseInt(req.query.limit, 10) || DEST_PAGE_SIZE));
  res.json(pageDestinations(req.user.id, offset, limit));
});

router.get("/", requireAuth, (req, res) => {
  const me = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  const interests = parseInterests(me?.interests);
  const interestSet = new Set(interests);

  const { destinations, total: destinationsTotal, hasMore: destinationsHasMore } =
    pageDestinations(req.user.id, 0, DEST_PAGE_SIZE);

  // 2) Travelers who share interests (excluding self + people already followed).
  const followed = new Set(
    db.prepare("SELECT followee_id FROM friendships WHERE follower_id = ?")
      .all(req.user.id)
      .map((r) => r.followee_id)
  );
  const people = db
    .prepare("SELECT id, username, avatar_url, bio, interests FROM users WHERE id != ?")
    .all(req.user.id)
    .filter((u) => !followed.has(u.id))
    .map((u) => {
      const shared = parseInterests(u.interests).filter((t) => interestSet.has(t));
      return { id: u.id, username: u.username, avatar_url: u.avatar_url, bio: u.bio, shared, score: shared.length };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  // 3) Public trips you might like — most-loved recent journeys from others.
  const trips = db
    .prepare("SELECT * FROM trips WHERE is_public = 1 AND user_id != ? ORDER BY created_at DESC LIMIT 30")
    .all(req.user.id)
    .map((t) => hydrateTrip(t, req.user.id))
    .sort((a, b) => b.kudos - a.kudos)
    .slice(0, 4);

  res.json({
    interests,
    destinations,
    destinationsTotal,
    destinationsHasMore,
    people,
    trips,
  });
});

export default router;
