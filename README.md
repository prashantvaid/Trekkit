# 🌍 Trekkit — *Track your treks*

**Your travel journal, mapped.** Log your trips day by day, drop pins where you wandered,
attach photos to each stop, and share your journeys with friends on a living **3D globe**.

This is a working MVP focused on the core loop: **sign in → track a trip → see it
on a 3D map → post it to a feed → follow friends.** Design polish is intentionally
left light so you can iterate on it.

---

## ✨ Features

- **Accounts & auth** — register / log in (JWT + bcrypt).
- **Trip tracking (the main event)** — create a trip, then pin stops day by day.
  Each stop has a location, day number, notes, and photos.
- **3D globe** — every trip renders on an interactive globe with numbered markers
  and animated arcs tracing your route in order. Click a marker to jump to that stop.
- **Place search** — type "Kyoto, Japan" and it geocodes to coordinates
  (via OpenStreetMap Nominatim) so you don't need to know lat/lng.
- **Photos** — upload images (stored on the server) or add by URL, attached per stop.
- **Feed** — your trips + the public trips of people you follow, newest first.
- **Explore** — discover public trips from travelers everywhere.
- **Friends** — search users, follow / unfollow, view profiles & their trips.
- **Kudos** — ❤️ trips.

> Itinerary building, vacation research, and booking are roadmap items — the data
> model (trips → stops → photos) is already shaped to grow into them.

---

## 🧱 Tech stack

| Layer    | Choice |
|----------|--------|
| Frontend | React 18 + Vite, React Router, [`react-globe.gl`](https://github.com/vasturiano/react-globe.gl) (Three.js) |
| Backend  | Node + Express |
| Database | SQLite via `better-sqlite3` (zero-config, file-based) |
| Auth     | JWT + bcrypt |
| Geocode  | OpenStreetMap Nominatim (proxied server-side) |

No API keys required to run it.

---

## 🚀 Getting started

From the project root:

```bash
# 1. Install everything (server + client)
npm run install:all

# 2. Run both the API and the web app together
npm install        # installs "concurrently" at the root (one time)
npm run dev
```

- Web app → http://localhost:5173
- API → http://localhost:4000

Vite proxies `/api` and `/uploads` to the backend, so you only need the one browser tab.

### Run them separately (optional)

```bash
npm run dev:server   # API on :4000
npm run dev:client   # web app on :5173
```

---

## 📁 Project structure

```
trekkit/
├── server/                 # Express API
│   ├── src/
│   │   ├── index.js        # app entry + route wiring
│   │   ├── db.js           # SQLite schema (users, trips, stops, photos, friendships, kudos)
│   │   ├── auth.js         # JWT helpers + middleware
│   │   └── routes/         # auth, trips, users, feed, upload, geo
│   ├── data/               # SQLite db file (auto-created, git-ignored)
│   └── uploads/            # uploaded photos (auto-created, git-ignored)
└── client/                 # React + Vite app
    └── src/
        ├── pages/          # Login, Feed, NewTrip, TripDetail, Friends, Profile
        ├── components/     # TripGlobe, TripCard, Nav, AddStop, StopPhotos
        ├── api.js          # typed-ish API client
        └── auth.jsx        # auth context
```

---

## 🗺️ How to use it

1. **Sign up** at http://localhost:5173.
2. Click **+ Track a Trip**, give it a title and dates.
3. On the trip page, use **Pin a stop** → search a place → set the day & notes → add it.
   Watch it appear on the globe with an arc from the previous stop.
4. **Upload photos** to any stop.
5. Go to **Friends**, search a username, and **Follow** to see their trips in your **Feed**.

> Tip: create two accounts (in two browsers / a private window) to test the social feed.

---

## 🔌 API quick reference

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/auth/register` · `/api/auth/login` | returns `{ token, user }` |
| GET  | `/api/feed` · `/api/feed/explore` | activity feeds |
| POST | `/api/trips` | create a trip |
| GET  | `/api/trips/:id` | trip + stops + photos |
| POST | `/api/trips/:id/stops` | pin a stop |
| POST | `/api/trips/:id/stops/:stopId/photos` | attach a photo URL |
| POST | `/api/trips/:id/kudos` | toggle ❤️ |
| GET  | `/api/geo/search?q=` | geocode a place name |
| POST | `/api/upload` | multipart image upload |
| POST/DELETE | `/api/users/:id/follow` | follow / unfollow |

Send `Authorization: Bearer <token>` on protected routes.

---

## 🛣️ Roadmap ideas

- Drag-to-reorder stops; multi-day stops.
- Itinerary planner with suggested places & times.
- Vacation research (points of interest near a stop) and booking integrations.
- Trip stats: countries visited, distance traveled, a personal "world heatmap."
- Comments on trips; activity notifications.

---

## ⚠️ Notes for production

- Set `JWT_SECRET` as an env var (defaults to a dev secret).
- Swap SQLite for Postgres and move uploads to object storage (S3/Cloudflare R2).
- Respect Nominatim's usage policy or move to a paid geocoder with caching.
