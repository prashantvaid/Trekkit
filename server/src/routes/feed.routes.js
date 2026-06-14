import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../auth.js";
import { hydrateTrip } from "./trips.routes.js";
import { hydratePost } from "./posts.routes.js";

const router = Router();

const FEED_VISIBILITY = `
  user_id = @me
  OR (is_public = 1 AND user_id IN (
    SELECT followee_id FROM friendships WHERE follower_id = @me
  ))
`;

router.get("/", requireAuth, (req, res) => {
  const me = req.user.id;

  const trips = db
    .prepare(
      `SELECT id, posted_at FROM trips
       WHERE (${FEED_VISIBILITY}) AND posted_at IS NOT NULL`
    )
    .all({ me })
    .map((row) => ({ type: "trip", id: row.id, posted_at: row.posted_at }));

  const posts = db
    .prepare(
      `SELECT id, posted_at FROM posts WHERE ${FEED_VISIBILITY}`
    )
    .all({ me })
    .map((row) => ({ type: "post", id: row.id, posted_at: row.posted_at }));

  const merged = [...trips, ...posts]
    .sort((a, b) => b.posted_at.localeCompare(a.posted_at))
    .slice(0, 100);

  const items = merged.map((row) => {
    if (row.type === "trip") {
      const trip = db.prepare("SELECT * FROM trips WHERE id = ?").get(row.id);
      return { type: "trip", posted_at: row.posted_at, trip: hydrateTrip(trip, me) };
    }
    const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(row.id);
    return { type: "post", posted_at: row.posted_at, post: hydratePost(post, me) };
  });

  res.json({ items, trips: items.filter((i) => i.type === "trip").map((i) => i.trip) });
});

export default router;
