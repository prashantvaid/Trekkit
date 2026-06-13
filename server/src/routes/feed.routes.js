import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../auth.js";
import { hydrateTrip } from "./trips.routes.js";

const router = Router();

// The main feed: your trips + the public trips of people you follow,
// most recent first. This is the "Strava activity feed" of travel.
router.get("/", requireAuth, (req, res) => {
  const trips = db
    .prepare(
      `SELECT * FROM trips
       WHERE (
         user_id = @me
         OR (is_public = 1 AND user_id IN (
           SELECT followee_id FROM friendships WHERE follower_id = @me
         ))
       )
       AND posted_at IS NOT NULL
       ORDER BY posted_at DESC
       LIMIT 100`
    )
    .all({ me: req.user.id });
  res.json({ trips: trips.map((t) => hydrateTrip(t, req.user.id)) });
});

export default router;
