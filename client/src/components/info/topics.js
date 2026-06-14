import { CreateTripVisual, PinStopVisual, ShareTripVisual } from "./HowVisuals.jsx";
import { GlobeVisual, PhotosVisual, PlannerVisual, SocialVisual } from "./FeatureVisuals.jsx";

export const HOW_ORDER = ["create-trip", "pin-stops", "share"];

export const HOW_TOPICS = {
  "create-trip": {
    slug: "create-trip",
    badge: "Step 01 · How it works",
    title: "Create your trip",
    lead: "Name the journey, set your dates, and pick who can see it. Trekkit opens a day-by-day board — no spreadsheet, no ten-screen wizard.",
    paragraphs: [
      "Most travel apps make you fill out forms before you can do anything useful. Trekkit flips that: one short screen gives you a trip shell with a map and empty day columns ready for pins.",
      "Choose public, friends-only, or private visibility up front so you never have to rethink sharing later. When you're on the road, the same trip becomes your live diary.",
    ],
    bullets: [
      "Trip title and date range on a single screen",
      "Origin country plotted on the map automatically",
      "Unlimited trips on a free account",
    ],
    tag: "~30 seconds to set up",
    visual: CreateTripVisual,
    ctaTitle: "Name your next trip",
    ctaLabel: "Sign up free",
  },
  "pin-stops": {
    slug: "pin-stops",
    badge: "Step 02 · How it works",
    title: "Pin every stop",
    lead: "Search any city, landmark, or address worldwide. Pick the day and slot — the satellite map flies there and drops a pin while your route fills in.",
    paragraphs: [
      "You never type coordinates. Search \"Kyoto\" or \"Shibuya Crossing\" and Trekkit resolves the place, assigns it to a day, and animates the map to that location.",
      "Add morning, afternoon, or evening slots, transport mode, notes, and photos per stop. Your itinerary and map stay in sync — change one, the other updates.",
    ],
    bullets: [
      "Global place search — no lat/long needed",
      "Morning, afternoon, and evening slots per day",
      "Notes, prices, and photos attached to each pin",
    ],
    tag: "Unlimited pins",
    visual: PinStopVisual,
    ctaTitle: "Start pinning places",
    ctaLabel: "Create free account",
  },
  share: {
    slug: "share",
    badge: "Step 03 · How it works",
    title: "Share the journey",
    lead: "Post your finished route to the feed with a caption. Friends scroll a mapped story, zoom the route, leave kudos, and save ideas for their own trips.",
    paragraphs: [
      "Sharing isn't a PDF export or a link dump — it's a trip card with a live route preview embedded. Followers see exactly where you went, in order, on a real map.",
      "Kudos and comments land on the post itself. Someone inspired by your ramen crawl can open your stops and start building their own plan from yours.",
    ],
    bullets: [
      "Shareable cards with embedded route preview",
      "Kudos and comments on every post",
      "Follow travelers and explore their maps",
    ],
    tag: "One tap to publish",
    visual: ShareTripVisual,
    ctaTitle: "Share your first map",
    ctaLabel: "Get started free",
  },
};

export const FEATURE_ORDER = ["3d-map", "photos", "planner", "feed"];

export const FEATURE_TOPICS = {
  "3d-map": {
    slug: "3d-map",
    badge: "Feature · Map",
    title: "3D globe & terrain map",
    lead: "Every stop becomes a pin connected by animated arcs in travel order. Spin the globe, fly through satellite terrain, and tap any pin to focus.",
    summary: "Your route is the interface — not a sidebar list with a map tacked on.",
    paragraphs: [
      "Trekkit renders each journey on a WebGL globe with glowing arcs between stops in the exact order you traveled. Spin it to see the whole trip at once, or zoom into satellite terrain with hillshade on the trip detail view.",
      "Route playback walks the journey stop by stop — the map flies between pins while arcs light up in sequence. It's the same engine behind the landing demo, live trip pages, and feed previews.",
      "Tap any pin to focus the camera. Drag to orbit on the globe, scroll to zoom into street-level satellite imagery. Stops you haven't reached yet stay dimmed until you log them.",
    ],
    bullets: [
      "Animated arcs between stops in travel order",
      "3D globe spin with pin clusters per trip",
      "Satellite terrain + hillshade on trip detail",
      "Route playback to relive the journey",
      "Tap-to-focus on any stop",
    ],
    highlights: [
      { title: "Trip detail map", text: "Full-screen terrain view with every pin, photo thumbnail, and day label visible at once." },
      { title: "Globe view", text: "All your trips on one planet — arcs show how far you actually went." },
      { title: "Feed previews", text: "Shared posts include a live route thumbnail friends can zoom before opening the full trip." },
    ],
    details: [
      { title: "How arcs work", text: "Stops are numbered in the order you added them. Arcs draw along great-circle paths between consecutive pins, so a Tokyo → Kyoto → Osaka route reads clearly at a glance." },
      { title: "Works while traveling", text: "Add a pin from your phone and the map updates immediately — no refresh, no export step. The globe and flat map stay in sync." },
    ],
    useCases: ["Road trips across multiple cities", "Multi-country backpacking routes", "Reliving past trips years later"],
    tag: "WebGL map engine",
    visual: GlobeVisual,
    ctaTitle: "See your route on the globe",
    ctaLabel: "Start mapping",
  },
  photos: {
    slug: "photos",
    badge: "Feature · Memories",
    title: "Photos pinned to places",
    lead: "Upload shots to the exact stop where you took them. Open any pin for its gallery — memories stay on the map, not lost in your camera roll.",
    summary: "Photos live where they happened, not in a separate album you'll never scroll again.",
    paragraphs: [
      "A temple photo belongs at the temple pin. Trekkit ties images to coordinates and stop names, so when you or a friend opens that location the gallery is already there.",
      "Upload from desktop or mobile while you're still on the trip. Multiple images per stop are supported — great for food crawls, hikes, or any day with more than one highlight.",
      "Photos appear on trip cards in your profile and on feed posts when you share. Viewers see visuals in context instead of a caption with no sense of where things were taken.",
    ],
    bullets: [
      "Multiple images per stop",
      "Galleries open from any pin on the map",
      "Shown on trip cards and feed posts",
      "Mobile-friendly uploads from the road",
      "No geotag parsing required — you pick the stop",
    ],
    highlights: [
      { title: "Pin gallery", text: "Tap a stop → swipe through every photo you attached to that place." },
      { title: "Trip cards", text: "Cover photos pull from your stops so shared trips look polished automatically." },
      { title: "Chronological story", text: "Photos follow your day order, so the trip reads like a visual diary." },
    ],
    details: [
      { title: "Why pin, not album?", text: "Albums sort by date; trips sort by place. When you remember \"that ramen shop in Kyoto,\" you want the map — not scroll through 4,000 camera roll thumbnails." },
      { title: "Friends see context", text: "When someone views your shared trip they open the same pin galleries you built — the photo and the location stay linked." },
    ],
    useCases: ["Food and restaurant logs per city", "Hiking trails with summit shots", "Architecture and street photography tours"],
    tag: "Per-stop galleries",
    visual: PhotosVisual,
    ctaTitle: "Pin your first photo",
    ctaLabel: "Sign up free",
  },
  planner: {
    slug: "planner",
    badge: "Feature · Plan",
    title: "Itinerary builder & hotel search",
    lead: "Research hotels, restaurants, and activities anywhere on earth before you fly. Add picks to a day-by-day board and carry the plan into a tracked trip.",
    summary: "Research worldwide, build day-by-day, then track the same trip when you land.",
    paragraphs: [
      "Search isn't locked to your trip destination. Look up Kyoto hotels while your trip is still labeled \"Japan,\" compare options, and drop the winner onto Day 3 without re-entering anything later.",
      "Hotel results show nightly rates (not misleading totals), star ratings, and links to Google Hotels or Booking.com so you can book externally. Places and activities search works the same way.",
      "The day-by-day board mirrors how you'll actually travel — morning, afternoon, and evening slots. AI Sherpa can draft a first pass from your destination and dates, then you edit freely.",
      "When the trip starts, convert the plan into a tracked journey in one tap. Stops, notes, and structure carry over — you're not rebuilding from scratch at the airport.",
    ],
    bullets: [
      "Worldwide hotel and place search",
      "Nightly rates with booking links",
      "Day-by-day board with time slots",
      "AI Sherpa drafts itineraries",
      "One tap: plan → tracked trip",
    ],
    highlights: [
      { title: "Hotel search", text: "Real nightly rates, star ratings, addresses, and view/book links — with fallback when APIs rate-limit." },
      { title: "Places search", text: "Restaurants, landmarks, and activities geocoded and ready to add to any day." },
      { title: "Cost tracking", text: "Per-stop prices and nightly hotel rates roll into a trip total so you can budget as you plan." },
    ],
    details: [
      { title: "Search anywhere", text: "The location picker is independent of your trip setup. Research Barcelona before you've created a \"Spain\" trip, or compare neighborhoods across cities." },
      { title: "Edit before you go", text: "Reorder days, delete stops, change notes — the board is a living document until you convert it to a tracked trip." },
    ],
    useCases: ["Two-week international trips with hotels", "Weekend city breaks with restaurant lists", "Group trips where everyone adds ideas to one board"],
    tag: "Built-in planner",
    visual: PlannerVisual,
    ctaTitle: "Plan your next trip",
    ctaLabel: "Try the planner",
  },
  feed: {
    slug: "feed",
    badge: "Feature · Social",
    title: "Friends, feed & kudos",
    lead: "Follow travelers and scroll a feed of real mapped trips. Every post includes a route thumbnail, stop count, and quick kudos — discovery built around places.",
    summary: "A travel feed where every post is a map you can actually explore.",
    paragraphs: [
      "Most travel social apps show a photo and a caption. Trekkit posts are trips — with a route preview, stop count, dates, and a map thumbnail you can zoom before opening the full journey.",
      "Follow friends and see their trips surface in your feed. Open a post to walk the route, read stop notes, view photo galleries, and leave kudos or comments on the trip itself.",
      "Profiles show trip history as mapped cards, not a grid of unrelated images. You can see where someone has been over time and dig into any journey that catches your eye.",
      "Notifications tell you when people you follow post or when someone kudos your trip — lightweight encouragement without turning travel into a popularity contest.",
    ],
    bullets: [
      "Follow graph and profile trip history",
      "Route previews in the scroll feed",
      "Kudos and comments on every post",
      "Notifications for follows and posts",
      "Public, friends-only, or private trips",
    ],
    highlights: [
      { title: "Mapped feed cards", text: "Each post shows a route thumbnail, trip title, stop count, and author — scroll discovery that respects geography." },
      { title: "Kudos", text: "One-tap appreciation on trips you love. Authors see counts on the post and get notified." },
      { title: "Comments", text: "Ask questions about stops, routes, or hotels — threaded on the trip post." },
    ],
    details: [
      { title: "Discovery by route", text: "Inspired by someone's Japan trip? Open their map, zoom stops you care about, and start your own plan from the same places." },
      { title: "Privacy controls", text: "Trips can be public, friends-only, or private. You choose per trip before sharing — not buried in account settings." },
    ],
    useCases: ["Following friends' gap years and sabbaticals", "Finding restaurant ideas from people who've been", "Sharing finished trips without exporting PDFs"],
    tag: "Social discovery",
    visual: SocialVisual,
    ctaTitle: "Join the feed",
    ctaLabel: "Create free account",
  },
};
