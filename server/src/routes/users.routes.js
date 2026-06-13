import { Router } from "express";
import db from "../db.js";
import { requireAuth, optionalAuth } from "../auth.js";

const router = Router();

function getUserStats(userId, includePrivate) {
  const tripFilter = includePrivate ? "t.user_id = ?" : "t.user_id = ? AND t.is_public = 1";

  const tripCount = db
    .prepare(`SELECT COUNT(*) AS c FROM trips t WHERE ${tripFilter}`)
    .get(userId).c;

  const stopCount = db
    .prepare(
      `SELECT COUNT(*) AS c FROM stops s
       JOIN trips t ON t.id = s.trip_id
       WHERE ${tripFilter}`
    )
    .get(userId).c;

  const photoCount = db
    .prepare(
      `SELECT COUNT(*) AS c FROM photos p
       JOIN stops s ON s.id = p.stop_id
       JOIN trips t ON t.id = s.trip_id
       WHERE ${tripFilter}`
    )
    .get(userId).c;

  const countryCount = db
    .prepare(
      `SELECT COUNT(DISTINCT country) AS c FROM trips t
       WHERE ${tripFilter} AND country IS NOT NULL AND TRIM(country) != ''`
    )
    .get(userId).c;

  const kudosReceived = db
    .prepare(
      `SELECT COUNT(*) AS c FROM kudos k
       JOIN trips t ON t.id = k.trip_id
       WHERE ${tripFilter}`
    )
    .get(userId).c;

  const commentsReceived = db
    .prepare(
      `SELECT COUNT(*) AS c FROM comments c
       JOIN trips t ON t.id = c.trip_id
       WHERE ${tripFilter}`
    )
    .get(userId).c;

  const daysTraveled = db
    .prepare(
      `SELECT start_date, end_date FROM trips t
       WHERE ${tripFilter} AND start_date IS NOT NULL AND end_date IS NOT NULL`
    )
    .all(userId)
    .reduce((sum, row) => {
      const start = new Date(row.start_date);
      const end = new Date(row.end_date);
      if (Number.isNaN(start) || Number.isNaN(end) || end < start) return sum;
      const days = Math.round((end - start) / 86400000) + 1;
      return sum + Math.max(days, 1);
    }, 0);

  return {
    tripCount,
    stopCount,
    photoCount,
    countryCount,
    kudosReceived,
    commentsReceived,
    daysTraveled,
  };
}

// Search users by username
router.get("/search", requireAuth, (req, res) => {
  const q = (req.query.q || "").toString().trim();
  if (!q) return res.json({ users: [] });
  const users = db
    .prepare(
      `SELECT id, username, avatar_url, bio FROM users
       WHERE username LIKE ? AND id != ? LIMIT 20`
    )
    .all(`%${q}%`, req.user.id);
  const followingIds = new Set(
    db.prepare("SELECT followee_id FROM friendships WHERE follower_id = ?")
      .all(req.user.id)
      .map((r) => r.followee_id)
  );
  res.json({
    users: users.map((u) => ({ ...u, following: followingIds.has(u.id) })),
  });
});

// Follow a user
router.post("/:userId/follow", requireAuth, (req, res) => {
  if (req.params.userId === req.user.id) {
    return res.status(400).json({ error: "You cannot follow yourself" });
  }
  const target = db.prepare("SELECT id FROM users WHERE id = ?").get(req.params.userId);
  if (!target) return res.status(404).json({ error: "User not found" });
  db.prepare(
    "INSERT OR IGNORE INTO friendships (follower_id, followee_id, created_at) VALUES (?, ?, ?)"
  ).run(req.user.id, req.params.userId, new Date().toISOString());
  res.json({ ok: true, following: true });
});

// Unfollow a user
router.delete("/:userId/follow", requireAuth, (req, res) => {
  db.prepare("DELETE FROM friendships WHERE follower_id = ? AND followee_id = ?").run(
    req.user.id,
    req.params.userId
  );
  res.json({ ok: true, following: false });
});

// People the user follows
router.get("/following", requireAuth, (req, res) => {
  const users = db
    .prepare(
      `SELECT u.id, u.username, u.avatar_url, u.bio
       FROM friendships f JOIN users u ON u.id = f.followee_id
       WHERE f.follower_id = ? ORDER BY f.created_at DESC`
    )
    .all(req.user.id);
  res.json({ users });
});

// A user's public profile
router.get("/:userId", optionalAuth, (req, res) => {
  const user = db
    .prepare("SELECT id, username, avatar_url, bio, birthday, interests, created_at FROM users WHERE id = ?")
    .get(req.params.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  try {
    user.interests = user.interests ? JSON.parse(user.interests) : [];
  } catch {
    user.interests = [];
  }

  const isSelf = req.user?.id === user.id;
  const stats = getUserStats(user.id, isSelf);
  const followerCount = db
    .prepare("SELECT COUNT(*) AS c FROM friendships WHERE followee_id = ?")
    .get(user.id).c;
  const followingCount = db
    .prepare("SELECT COUNT(*) AS c FROM friendships WHERE follower_id = ?")
    .get(user.id).c;

  let isFollowing = false;
  if (req.user) {
    isFollowing = !!db
      .prepare("SELECT 1 FROM friendships WHERE follower_id = ? AND followee_id = ?")
      .get(req.user.id, user.id);
  }

  res.json({
    user: {
      ...user,
      tripCount: stats.tripCount,
      followerCount,
      followingCount,
      isFollowing,
      stats,
    },
  });
});

export default router;
