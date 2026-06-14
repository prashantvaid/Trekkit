const imageCache = new Map();
const CACHE_VERSION = "v4";
const MAX_DESTINATION_IMAGES = 2; // one shown + one silent fallback

const UA = { "User-Agent": "Trekkit/0.1 (travel app)" };

/** Wikimedia file names known to be scenic for destinations that often return maps. */
const CURATED_FILES = {
  "Bali|Indonesia": [
    "Tegallalang Rice Terrace, Ubud, Bali, Indonesia.jpg",
    "Pura Ulun Danu Bratan, Bali.jpg",
    "Tanah Lot Sunset.jpg",
  ],
  "Kyoto|Japan": [
    "Kiyomizudera in Kyoto, Japan.jpg",
    "Torii path at Fushimi Inari Shrine, Kyoto, Japan.jpg",
    "Arashiyama bamboo grove, Kyoto, Japan.jpg",
  ],
  "Banff|Canada": [
    "Moraine Lake, Banff National Park, Alberta, Canada.jpg",
    "Lake Louise, Banff National Park, Alberta, Canada.jpg",
  ],
  "Lisbon|Portugal": [
    "Lisbon, Portugal (49149062123).jpg",
    "Tram 28 in Lisbon, Portugal.jpg",
  ],
  "Santorini|Greece": [
    "Santorini (Thira), Greece.jpg",
    "Oia, Santorini, Greece - panoramio.jpg",
  ],
  "Reykjavik|Iceland": [
    "Gullfoss, Iceland.jpg",
    "Seljalandsfoss, Iceland.jpg",
  ],
  "Barcelona|Spain": [
    "Sagrada Familia, Barcelona, Spain - Jan 2007.jpg",
    "Park Güell, Barcelona, Spain.jpg",
  ],
  "Machu Picchu|Peru": [
    "Machu Picchu, Peru.jpg",
    "View of Machu Picchu from Sun Gate.jpg",
  ],
  "Maldives|Indian Ocean": [
    "Maldives Island.jpg",
    "Maldives (3).jpg",
  ],
  "Serengeti|Tanzania": [
    "Serengeti National Park, Tanzania.jpg",
    "Wildebeest Migration in Serengeti.jpg",
  ],
  "Amalfi Coast|Italy": [
    "Positano, Amalfi Coast, Italy.jpg",
    "Amalfi Coast, Italy.jpg",
  ],
  "Patagonia|Chile & Argentina": [
    "Torres del Paine National Park, Chile.jpg",
    "Perito Moreno Glacier, Argentina.jpg",
  ],
  "Queenstown|New Zealand": [
    "Queenstown, New Zealand.jpg",
    "Lake Wakatipu, Queenstown, New Zealand.jpg",
  ],
  "Marrakech|Morocco": [
    "Jemaa el-Fnaa, Marrakech, Morocco.jpg",
    "Marrakech, Morocco (48994445902).jpg",
  ],
  "Rome|Italy": [
    "Colosseum in Rome, Italy - April 2007.jpg",
    "Trevi Fountain, Rome, Italy - May 2007.jpg",
  ],
  "Sydney|Australia": [
    "Sydney Opera House and Harbour Bridge.jpg",
    "Bondi Beach, Sydney, Australia.jpg",
  ],
  "Dubai|UAE": [
    "Burj Khalifa, Dubai, United Arab Emirates.jpg",
    "Dubai Marina, UAE.jpg",
  ],
  "Hanoi|Vietnam": [
    "Hoan Kiem Lake, Hanoi, Vietnam.jpg",
    "Old Quarter, Hanoi, Vietnam.jpg",
  ],
  "Phuket|Thailand": [
    "Phuket, Thailand beach.jpg",
    "Phi Phi Islands, Thailand.jpg",
  ],
  "Galápagos|Ecuador": [
    "Galapagos Islands, Ecuador.jpg",
    "Galápagos tortoise, Galápagos Islands.jpg",
  ],
  "Kruger|South Africa": [
    "Kruger National Park landscape.jpg",
    "Elephants in Kruger National Park.jpg",
  ],
  "Hokkaido|Japan": [
    "Lavender fields in Furano, Hokkaido, Japan.jpg",
    "Lake Mashu, Hokkaido, Japan.jpg",
  ],
  "Sapporo|Japan": [
    "Sapporo Snow Festival, Japan.jpg",
    "Odori Park, Sapporo, Japan.jpg",
  ],
  "Interlaken|Switzerland": [
    "Interlaken, Switzerland.jpg",
    "Jungfrau from Interlaken, Switzerland.jpg",
  ],
  "Lake Como|Italy": [
    "Lake Como, Italy.jpg",
    "Varenna, Lake Como, Italy.jpg",
  ],
  "Bora Bora|French Polynesia": [
    "Bora Bora, French Polynesia.jpg",
    "Mount Otemanu, Bora Bora.jpg",
  ],
  "Petra|Jordan": [
    "Al Khazneh, Petra, Jordan.jpg",
    "Petra, Jordan - panoramio.jpg",
  ],
  "Siem Reap|Cambodia": [
    "Angkor Wat, Siem Reap, Cambodia.jpg",
    "Angkor Wat at sunrise.jpg",
  ],
  "Cape Town|South Africa": [
    "Table Mountain, Cape Town, South Africa.jpg",
    "Cape Town, South Africa skyline.jpg",
  ],
  "Istanbul|Turkey": [
    "Hagia Sophia, Istanbul, Turkey.jpg",
    "Blue Mosque, Istanbul, Turkey.jpg",
  ],
  "Seoul|South Korea": [
    "Gyeongbokgung Palace, Seoul, South Korea.jpg",
    "Seoul skyline at night.jpg",
  ],
  "Mexico City|Mexico": [
    "Palacio de Bellas Artes, Mexico City.jpg",
    "Zócalo, Mexico City, Mexico.jpg",
  ],
  "New Orleans|USA": [
    "French Quarter, New Orleans, USA.jpg",
    "Bourbon Street, New Orleans.jpg",
  ],
  "Maui|USA": [
    "Road to Hana, Maui, Hawaii.jpg",
    "Haleakalā National Park, Maui, Hawaii.jpg",
  ],
  "Lofoten|Norway": [
    "Reine, Lofoten, Norway.jpg",
    "Lofoten Islands, Norway.jpg",
  ],
  "Azores|Portugal": [
    "Sete Cidades, Azores, Portugal.jpg",
    "Lagoa do Fogo, Azores, Portugal.jpg",
  ],
  "Zanzibar|Tanzania": [
    "Stone Town, Zanzibar, Tanzania.jpg",
    "Nungwi Beach, Zanzibar.jpg",
  ],
  "Chiang Mai|Thailand": [
    "Wat Phra That Doi Suthep, Chiang Mai, Thailand.jpg",
    "Chiang Mai old city, Thailand.jpg",
  ],
  "Edinburgh|Scotland": [
    "Edinburgh Castle, Scotland.jpg",
    "Edinburgh skyline from Calton Hill.jpg",
  ],
  "Prague|Czech Republic": [
    "Charles Bridge, Prague, Czech Republic.jpg",
    "Prague Old Town Square, Czech Republic.jpg",
  ],
  "Cartagena|Colombia": [
    "Cartagena, Colombia old city.jpg",
    "Cartagena de Indias, Colombia.jpg",
  ],
  "Buenos Aires|Argentina": [
    "Obelisco, Buenos Aires, Argentina.jpg",
    "Caminito, Buenos Aires, Argentina.jpg",
  ],
  "Porto|Portugal": [
    "Porto, Portugal (48994445902).jpg",
    "Dom Luís I Bridge, Porto, Portugal.jpg",
  ],
  "Copenhagen|Denmark": [
    "Nyhavn, Copenhagen, Denmark.jpg",
    "Copenhagen, Denmark skyline.jpg",
  ],
  "Vancouver|Canada": [
    "Stanley Park, Vancouver, Canada.jpg",
    "Vancouver skyline, Canada.jpg",
  ],
  "Dubrovnik|Croatia": [
    "Dubrovnik, Croatia old town.jpg",
    "Dubrovnik city walls, Croatia.jpg",
  ],
  "Athens|Greece": [
    "Acropolis of Athens, Greece.jpg",
    "Parthenon, Athens, Greece.jpg",
  ],
  "Matera|Italy": [
    "Matera, Italy Sassi di Matera.jpg",
    "Matera, Basilicata, Italy.jpg",
  ],
  "Tbilisi|Georgia": [
    "Tbilisi, Georgia old town.jpg",
    "Narikala Fortress, Tbilisi, Georgia.jpg",
  ],
  "Medellín|Colombia": [
    "Medellín, Colombia skyline.jpg",
    "Comuna 13, Medellín, Colombia.jpg",
  ],
  "Salzburg|Austria": [
    "Salzburg, Austria old town.jpg",
    "Hohensalzburg Fortress, Salzburg, Austria.jpg",
  ],
  "Nashville|USA": [
    "Broadway, Nashville, Tennessee.jpg",
    "Nashville skyline, Tennessee.jpg",
  ],
  "Mumbai|India": [
    "Gateway of India, Mumbai, India.jpg",
    "Marine Drive, Mumbai, India.jpg",
  ],
  "Havana|Cuba": [
    "Old Havana, Cuba.jpg",
    "Malecón, Havana, Cuba.jpg",
  ],
  "Bwindi|Uganda": [
    "Bwindi Impenetrable National Park, Uganda.jpg",
    "Mountain gorilla, Bwindi Impenetrable Forest.jpg",
  ],
};

function wikimediaFilePath(filename, width = 900) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=${width}`;
}

function curatedCandidates(name, country) {
  const files = (CURATED_FILES[`${name}|${country}`] || []).slice(0, 1);
  return files.map((filename) => ({
    url: wikimediaFilePath(filename),
    title: filename,
    score: 40,
  }));
}

const MAP_PATTERN =
  /\b(map|maps|locator|location_map|relief_map|topographic|topo_map|outline_map|district_map|administrative|flag_of|coat_of_arms|emblem_of|seal_of|logo_of|icon_of|diagram|chart|border|svg|openstreetmap|osm_|geography_icon|locator_map|pushpin|dot_map)\b/i;

const PEOPLE_PATTERN =
  /\b(portrait|headshot|selfie|self-portrait|person|people|woman|women|man|men|girl|boy|child|children|baby|babies|model|fashion|wedding|bride|groom|bikini|swimsuit|shirtless|nude|naked|crowd|dancer|dancing|performer|tourists?|visitors?|family|couple|faces?|smiling|holding_hands)\b/i;

const SCENIC_PATTERN =
  /\b(landscape|beach|coast|sunset|sunrise|skyline|panorama|aerial|view|scenery|scenic|temple|waterfall|mountain|lake|harbor|harbour|terrace|forest|valley|island|bay|cliff|coastline|national_park|monument|cathedral|mosque|palace|ruins|garden|park|architecture|cityscape|overlook|vista|fjord|glacier|volcano|desert|canyon|archipelago|lagoon|harbour|harbor)\b/i;

const WIKI_EXCLUDE =
  "-map -locator -location_map -flag -coat_of_arms -emblem -svg -diagram -portrait -person -people -selfie -model -nude -wedding -headshot -crowd";

function isLikelyMap(url, title = "") {
  const hay = `${title} ${decodeURIComponent(url || "")}`.toLowerCase();
  return MAP_PATTERN.test(hay);
}

function isLikelyPeople(url, title = "") {
  const hay = `${title} ${decodeURIComponent(url || "")}`.toLowerCase();
  return PEOPLE_PATTERN.test(hay);
}

function isRejectedImage(url, title = "") {
  return isLikelyMap(url, title) || isLikelyPeople(url, title);
}

function scenicScore(url, title = "") {
  if (isRejectedImage(url, title)) return -100;
  const hay = `${title} ${url}`.toLowerCase();
  if (SCENIC_PATTERN.test(hay)) return 12;
  if (/\b(jpg|jpeg|webp)\b/i.test(hay)) return 4;
  return 1;
}

function uniqueScenic(items, max = MAX_DESTINATION_IMAGES) {
  const seen = new Set();
  const out = [];
  for (const item of items.sort((a, b) => b.score - a.score)) {
    if (!item.url || seen.has(item.url) || item.score < 0) continue;
    seen.add(item.url);
    out.push(item.url);
    if (out.length >= max) break;
  }
  return out;
}

function uniqueUrls(list) {
  return [...new Set(list.filter(Boolean))];
}

async function wikipediaSummaryImages(title) {
  const urls = [];
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { headers: UA }
    );
    if (res.ok) {
      const json = await res.json();
      const titleHint = json.title || title;
      if (json.originalimage?.source && !isRejectedImage(json.originalimage.source, titleHint)) {
        urls.push({ url: json.originalimage.source, title: titleHint, score: scenicScore(json.originalimage.source, titleHint) });
      }
      if (json.thumbnail?.source && !isRejectedImage(json.thumbnail.source, titleHint)) {
        urls.push({ url: json.thumbnail.source, title: titleHint, score: scenicScore(json.thumbnail.source, titleHint) });
      }
    }
  } catch {
    /* ignore */
  }
  return urls;
}

async function wikimediaImages(search, size = 640, limit = 10) {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", search);
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("gsrlimit", String(limit));
  url.searchParams.set("prop", "pageimages");
  url.searchParams.set("piprop", "thumbnail");
  url.searchParams.set("pithumbsize", String(size));
  url.searchParams.set("format", "json");

  try {
    const res = await fetch(url, { headers: UA });
    if (!res.ok) return [];
    const json = await res.json();
    return Object.values(json.query?.pages || {})
      .map((p) => ({
        url: p.thumbnail?.source,
        title: p.title || "",
        score: scenicScore(p.thumbnail?.source, p.title),
      }))
      .filter((p) => p.url);
  } catch {
    return [];
  }
}

async function wikipediaPageImage(title) {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("titles", title);
  url.searchParams.set("prop", "pageimages");
  url.searchParams.set("piprop", "original|thumbnail");
  url.searchParams.set("pithumbsize", "800");
  url.searchParams.set("format", "json");

  try {
    const res = await fetch(url, { headers: UA });
    if (!res.ok) return [];
    const json = await res.json();
    const page = Object.values(json.query?.pages || {})[0];
    if (!page || page.missing !== undefined) return [];
    const out = [];
    const hint = page.title || title;
    if (page.original?.source && !isRejectedImage(page.original.source, hint)) {
      out.push({ url: page.original.source, title: hint, score: scenicScore(page.original.source, hint) });
    }
    if (page.thumbnail?.source && !isRejectedImage(page.thumbnail.source, hint)) {
      out.push({ url: page.thumbnail.source, title: hint, score: scenicScore(page.thumbnail.source, hint) });
    }
    return out;
  } catch {
    return [];
  }
}

function scenicSearches(name, country) {
  return [
    `${name} ${country} landscape scenery ${WIKI_EXCLUDE}`,
    `${name} ${country} skyline aerial view ${WIKI_EXCLUDE}`,
    `${name} ${country} national park coast ${WIKI_EXCLUDE}`,
  ];
}

export async function getDestinationImages(name, country) {
  const cacheKey = `${CACHE_VERSION}|${name}|${country}`;
  if (imageCache.has(cacheKey)) return imageCache.get(cacheKey);

  const wikiTitles = [name, `${name}, ${country}`];
  const searches = scenicSearches(name, country);

  const batches = await Promise.all([
    ...searches.map((q) => wikimediaImages(q, 800, 6)),
    ...wikiTitles.map((t) => wikipediaSummaryImages(t)),
    ...wikiTitles.map((t) => wikipediaPageImage(t)),
  ]);

  let candidates = [...curatedCandidates(name, country), ...batches.flat()];
  let urls = uniqueScenic(candidates);

  if (urls.length < 1) {
    const fallback = await wikimediaImages(
      `${name} ${country} landscape architecture ${WIKI_EXCLUDE}`,
      640,
      8
    );
    urls = uniqueScenic([...candidates, ...fallback]);
  }

  if (urls.length < 1) {
    const countryScenic = await wikimediaImages(`${country} landscape scenery ${WIKI_EXCLUDE}`, 640, 5);
    urls = uniqueScenic(countryScenic);
  }

  if (urls.length) imageCache.set(cacheKey, urls);
  return urls;
}

export async function getDestinationImage(name, country) {
  const images = await getDestinationImages(name, country);
  return images[0] || null;
}

export async function getPlaceImages(name, locality, categoryIcon = null) {
  const cacheKey = `${CACHE_VERSION}|place:${name}|${locality || ""}`;
  if (imageCache.has(cacheKey)) return imageCache.get(cacheKey);

  const englishName = name.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const city = locality?.split("·").pop()?.trim() || locality?.split(",").pop()?.trim();
  const searches = [
    [englishName, city].filter(Boolean).join(" "),
    [englishName, locality?.split(",").pop()?.trim()].filter(Boolean).join(" "),
    englishName,
  ];

  const batches = await Promise.all([
    wikimediaImages(`${searches[0]} landscape ${WIKI_EXCLUDE}`, 400, 4),
    wikimediaImages(`${searches[1]} ${WIKI_EXCLUDE}`, 400, 3),
    wikipediaSummaryImages(englishName),
  ]);

  let urls = uniqueScenic(batches.flat(), 3);
  if (categoryIcon && !isRejectedImage(categoryIcon)) urls.push(categoryIcon);

  if (urls.length) imageCache.set(cacheKey, urls);
  return urls;
}

export async function getPlaceImage(name, locality, categoryIcon = null) {
  const images = await getPlaceImages(name, locality, categoryIcon);
  return images[0] || (categoryIcon && !isRejectedImage(categoryIcon) ? categoryIcon : null);
}

/** For tests / cache busting after logic changes */
export function clearDestinationImageCache() {
  imageCache.clear();
}
