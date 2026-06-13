import { Router } from "express";
import { nanoid } from "nanoid";
import db from "../db.js";
import { requireAuth, optionalAuth } from "../auth.js";

const router = Router();

// Assemble a trip with author, stops and nested photos + kudos count.
export function hydrateTrip(trip, viewerId = null) {
  if (!trip) return null;
  const author = db
    .prepare("SELECT id, username, avatar_url FROM users WHERE id = ?")
    .get(trip.user_id);
  const stops = db
    .prepare("SELECT * FROM stops WHERE trip_id = ? ORDER BY sort_order ASC, created_at ASC")
    .all(trip.id);
  const photoStmt = db.prepare("SELECT * FROM photos WHERE stop_id = ? ORDER BY created_at ASC");
  for (const stop of stops) stop.photos = photoStmt.all(stop.id);

  const kudosCount = db
    .prepare("SELECT COUNT(*) AS c FROM kudos WHERE trip_id = ?")
    .get(trip.id).c;
  const likedByViewer = viewerId
    ? !!db.prepare("SELECT 1 FROM kudos WHERE trip_id = ? AND user_id = ?").get(trip.id, viewerId)
    : false;
  const commentCount = db
    .prepare("SELECT COUNT(*) AS c FROM comments WHERE trip_id = ?")
    .get(trip.id).c;
  const bookmarkedByViewer = viewerId
    ? !!db.prepare("SELECT 1 FROM bookmarks WHERE trip_id = ? AND user_id = ?").get(trip.id, viewerId)
    : false;

  return {
    ...trip,
    is_public: !!trip.is_public,
    author,
    stops,
    kudos: kudosCount,
    likedByViewer,
    commentCount,
    bookmarkedByViewer,
  };
}

// Create a trip
router.post("/", requireAuth, (req, res) => {
  const {
    title,
    description,
    start_date,
    end_date,
    cover_url,
    is_public,
    destination,
    destination_lat,
    destination_lng,
    country,
    country_lat,
    country_lng,
    map_presets,
  } = req.body || {};
  if (!title) return res.status(400).json({ error: "Trip title is required" });
  const trip = {
    id: nanoid(),
    user_id: req.user.id,
    title,
    description: description ?? null,
    start_date: start_date ?? null,
    end_date: end_date ?? null,
    cover_url: cover_url ?? null,
    destination: destination ?? null,
    destination_lat: destination_lat != null ? Number(destination_lat) : null,
    destination_lng: destination_lng != null ? Number(destination_lng) : null,
    country: country ?? null,
    country_lat: country_lat != null ? Number(country_lat) : null,
    country_lng: country_lng != null ? Number(country_lng) : null,
    map_presets: map_presets ?? null,
    is_public: is_public === false ? 0 : 1,
    created_at: new Date().toISOString(),
  };
  db.prepare(
    `INSERT INTO trips (id, user_id, title, description, start_date, end_date, cover_url, destination, destination_lat, destination_lng, country, country_lat, country_lng, map_presets, is_public, created_at)
     VALUES (@id, @user_id, @title, @description, @start_date, @end_date, @cover_url, @destination, @destination_lat, @destination_lng, @country, @country_lat, @country_lng, @map_presets, @is_public, @created_at)`
  ).run(trip);
  res.status(201).json({ trip: hydrateTrip(trip, req.user.id) });
});

// List trips for the authenticated user
router.get("/mine", requireAuth, (req, res) => {
  const trips = db
    .prepare("SELECT * FROM trips WHERE user_id = ? ORDER BY created_at DESC")
    .all(req.user.id);
  res.json({ trips: trips.map((t) => hydrateTrip(t, req.user.id)) });
});

// List public trips for a specific user
router.get("/user/:userId", optionalAuth, (req, res) => {
  const viewerId = req.user?.id ?? null;
  const isSelf = viewerId === req.params.userId;
  const trips = db
    .prepare(
      `SELECT * FROM trips WHERE user_id = ? ${isSelf ? "" : "AND is_public = 1"} ORDER BY created_at DESC`
    )
    .all(req.params.userId);
  res.json({ trips: trips.map((t) => hydrateTrip(t, viewerId)) });
});

// List the current user's bookmarked trips (defined before "/:id" so it isn't shadowed)
router.get("/bookmarks", requireAuth, (req, res) => {
  const trips = db
    .prepare(
      `SELECT t.* FROM bookmarks b
       JOIN trips t ON t.id = b.trip_id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`
    )
    .all(req.user.id)
    // hide trips that have since been made private by someone else
    .filter((t) => t.is_public || t.user_id === req.user.id);
  res.json({ trips: trips.map((t) => hydrateTrip(t, req.user.id)) });
});

// Get a single trip
router.get("/:id", optionalAuth, (req, res) => {
  const viewerId = req.user?.id ?? null;
  const trip = db.prepare("SELECT * FROM trips WHERE id = ?").get(req.params.id);
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  if (!trip.is_public && trip.user_id !== viewerId) {
    return res.status(403).json({ error: "This trip is private" });
  }
  res.json({ trip: hydrateTrip(trip, viewerId) });
});

// Publish a trip to the feed (animated globe card)
router.post("/:id/post", requireAuth, (req, res) => {
  const trip = db.prepare("SELECT * FROM trips WHERE id = ?").get(req.params.id);
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  if (trip.user_id !== req.user.id) return res.status(403).json({ error: "Not your trip" });

  const stopCount = db
    .prepare("SELECT COUNT(*) AS c FROM stops WHERE trip_id = ?")
    .get(trip.id).c;
  if (stopCount < 1) {
    return res.status(400).json({ error: "Add at least one stop on the map before posting" });
  }

  const { description, is_public } = req.body || {};
  const now = new Date().toISOString();
  const updates = { posted_at: now };
  if (description !== undefined) updates.description = description || null;
  if (is_public !== undefined) updates.is_public = is_public ? 1 : 0;

  for (const [k, v] of Object.entries(updates)) {
    db.prepare(`UPDATE trips SET ${k} = ? WHERE id = ?`).run(v, trip.id);
  }
  const updated = db.prepare("SELECT * FROM trips WHERE id = ?").get(trip.id);
  res.json({ trip: hydrateTrip(updated, req.user.id) });
});

// Update a trip
router.patch("/:id", requireAuth, (req, res) => {
  const trip = db.prepare("SELECT * FROM trips WHERE id = ?").get(req.params.id);
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  if (trip.user_id !== req.user.id) return res.status(403).json({ error: "Not your trip" });

  const fields = [
    "title",
    "description",
    "start_date",
    "end_date",
    "cover_url",
    "destination",
    "destination_lat",
    "destination_lng",
    "country",
    "country_lat",
    "country_lng",
    "map_presets",
  ];
  const updates = {};
  for (const f of fields) if (req.body[f] !== undefined) updates[f] = req.body[f];
  if (req.body.is_public !== undefined) updates.is_public = req.body.is_public ? 1 : 0;
  if (updates.destination_lat != null) updates.destination_lat = Number(updates.destination_lat);
  if (updates.destination_lng != null) updates.destination_lng = Number(updates.destination_lng);
  if (updates.country_lat != null) updates.country_lat = Number(updates.country_lat);
  if (updates.country_lng != null) updates.country_lng = Number(updates.country_lng);

  for (const [k, v] of Object.entries(updates)) {
    db.prepare(`UPDATE trips SET ${k} = ? WHERE id = ?`).run(v, trip.id);
  }
  const updated = db.prepare("SELECT * FROM trips WHERE id = ?").get(trip.id);
  res.json({ trip: hydrateTrip(updated, req.user.id) });
});

// Delete a trip
router.delete("/:id", requireAuth, (req, res) => {
  const trip = db.prepare("SELECT * FROM trips WHERE id = ?").get(req.params.id);
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  if (trip.user_id !== req.user.id) return res.status(403).json({ error: "Not your trip" });
  db.prepare("DELETE FROM trips WHERE id = ?").run(trip.id);
  res.json({ ok: true });
});

// --- Stops ---

// Add a stop to a trip
router.post("/:id/stops", requireAuth, (req, res) => {
  const trip = db.prepare("SELECT * FROM trips WHERE id = ?").get(req.params.id);
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  if (trip.user_id !== req.user.id) return res.status(403).json({ error: "Not your trip" });

  const { name, lat, lng, day, visited_on, notes, place_type } = req.body || {};
  if (!name || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: "name, lat and lng are required" });
  }
  const maxOrder =
    db.prepare("SELECT MAX(sort_order) AS m FROM stops WHERE trip_id = ?").get(trip.id).m ?? -1;

  const stop = {
    id: nanoid(),
    trip_id: trip.id,
    name,
    lat: Number(lat),
    lng: Number(lng),
    day: day ?? null,
    visited_on: visited_on ?? null,
    notes: notes ?? null,
    place_type: place_type ?? null,
    sort_order: maxOrder + 1,
    created_at: new Date().toISOString(),
  };
  db.prepare(
    `INSERT INTO stops (id, trip_id, name, lat, lng, day, visited_on, notes, place_type, sort_order, created_at)
     VALUES (@id, @trip_id, @name, @lat, @lng, @day, @visited_on, @notes, @place_type, @sort_order, @created_at)`
  ).run(stop);
  stop.photos = [];
  res.status(201).json({ stop });
});

// Delete a stop
router.delete("/:id/stops/:stopId", requireAuth, (req, res) => {
  const trip = db.prepare("SELECT * FROM trips WHERE id = ?").get(req.params.id);
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  if (trip.user_id !== req.user.id) return res.status(403).json({ error: "Not your trip" });
  db.prepare("DELETE FROM stops WHERE id = ? AND trip_id = ?").run(req.params.stopId, trip.id);
  res.json({ ok: true });
});

// --- Photos ---

// Attach a photo (by URL) to a stop
router.post("/:id/stops/:stopId/photos", requireAuth, (req, res) => {
  const trip = db.prepare("SELECT * FROM trips WHERE id = ?").get(req.params.id);
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  if (trip.user_id !== req.user.id) return res.status(403).json({ error: "Not your trip" });
  const stop = db
    .prepare("SELECT * FROM stops WHERE id = ? AND trip_id = ?")
    .get(req.params.stopId, trip.id);
  if (!stop) return res.status(404).json({ error: "Stop not found" });

  const { url, caption, lat, lng } = req.body || {};
  if (!url) return res.status(400).json({ error: "Photo url is required" });
  const photo = {
    id: nanoid(),
    stop_id: stop.id,
    url,
    caption: caption ?? null,
    lat: lat != null ? Number(lat) : null,
    lng: lng != null ? Number(lng) : null,
    created_at: new Date().toISOString(),
  };
  db.prepare(
    "INSERT INTO photos (id, stop_id, url, caption, lat, lng, created_at) VALUES (@id, @stop_id, @url, @caption, @lat, @lng, @created_at)"
  ).run(photo);
  res.status(201).json({ photo });
});

// --- Kudos (likes) ---

router.post("/:id/kudos", requireAuth, (req, res) => {
  const trip = db.prepare("SELECT * FROM trips WHERE id = ?").get(req.params.id);
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  const existing = db
    .prepare("SELECT 1 FROM kudos WHERE trip_id = ? AND user_id = ?")
    .get(trip.id, req.user.id);
  if (existing) {
    db.prepare("DELETE FROM kudos WHERE trip_id = ? AND user_id = ?").run(trip.id, req.user.id);
  } else {
    db.prepare("INSERT INTO kudos (user_id, trip_id, created_at) VALUES (?, ?, ?)").run(
      req.user.id,
      trip.id,
      new Date().toISOString()
    );
  }
  const count = db.prepare("SELECT COUNT(*) AS c FROM kudos WHERE trip_id = ?").get(trip.id).c;
  res.json({ kudos: count, liked: !existing });
});

// --- Bookmarks (save for later) ---

router.post("/:id/bookmark", requireAuth, (req, res) => {
  const trip = db.prepare("SELECT * FROM trips WHERE id = ?").get(req.params.id);
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  const existing = db
    .prepare("SELECT 1 FROM bookmarks WHERE trip_id = ? AND user_id = ?")
    .get(trip.id, req.user.id);
  if (existing) {
    db.prepare("DELETE FROM bookmarks WHERE trip_id = ? AND user_id = ?").run(trip.id, req.user.id);
  } else {
    db.prepare("INSERT INTO bookmarks (user_id, trip_id, created_at) VALUES (?, ?, ?)").run(
      req.user.id,
      trip.id,
      new Date().toISOString()
    );
  }
  res.json({ bookmarked: !existing });
});

// --- Comments ---

function commentWithAuthor(row) {
  return {
    id: row.id,
    body: row.body,
    created_at: row.created_at,
    author: { id: row.user_id, username: row.username, avatar_url: row.avatar_url },
  };
}

// List comments on a trip
router.get("/:id/comments", optionalAuth, (req, res) => {
  const trip = db.prepare("SELECT * FROM trips WHERE id = ?").get(req.params.id);
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  if (!trip.is_public && trip.user_id !== req.user?.id) {
    return res.status(403).json({ error: "This trip is private" });
  }
  const rows = db
    .prepare(
      `SELECT c.*, u.username, u.avatar_url
       FROM comments c JOIN users u ON u.id = c.user_id
       WHERE c.trip_id = ? ORDER BY c.created_at ASC`
    )
    .all(trip.id);
  res.json({ comments: rows.map(commentWithAuthor) });
});

// Add a comment
router.post("/:id/comments", requireAuth, (req, res) => {
  const trip = db.prepare("SELECT * FROM trips WHERE id = ?").get(req.params.id);
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  const body = (req.body?.body || "").trim();
  if (!body) return res.status(400).json({ error: "Comment can't be empty" });

  const comment = {
    id: nanoid(),
    trip_id: trip.id,
    user_id: req.user.id,
    body,
    created_at: new Date().toISOString(),
  };
  db.prepare(
    "INSERT INTO comments (id, trip_id, user_id, body, created_at) VALUES (@id, @trip_id, @user_id, @body, @created_at)"
  ).run(comment);
  const author = db.prepare("SELECT id, username, avatar_url FROM users WHERE id = ?").get(req.user.id);
  res.status(201).json({ comment: { ...comment, author } });
});

// Delete a comment (comment author or trip owner)
router.delete("/:id/comments/:commentId", requireAuth, (req, res) => {
  const comment = db
    .prepare("SELECT * FROM comments WHERE id = ? AND trip_id = ?")
    .get(req.params.commentId, req.params.id);
  if (!comment) return res.status(404).json({ error: "Comment not found" });
  const trip = db.prepare("SELECT user_id FROM trips WHERE id = ?").get(req.params.id);
  if (comment.user_id !== req.user.id && trip?.user_id !== req.user.id) {
    return res.status(403).json({ error: "Not allowed" });
  }
  db.prepare("DELETE FROM comments WHERE id = ?").run(comment.id);
  res.json({ ok: true });
});

export default router;
