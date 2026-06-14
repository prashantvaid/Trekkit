import { Router } from "express";
import { nanoid } from "nanoid";
import db from "../db.js";
import { requireAuth, optionalAuth } from "../auth.js";

const router = Router();

export function hydratePost(post, viewerId = null) {
  if (!post) return null;
  const author = db
    .prepare("SELECT id, username, avatar_url FROM users WHERE id = ?")
    .get(post.user_id);
  const kudos = db
    .prepare("SELECT COUNT(*) AS c FROM post_kudos WHERE post_id = ?")
    .get(post.id).c;
  const likedByViewer = viewerId
    ? !!db.prepare("SELECT 1 FROM post_kudos WHERE post_id = ? AND user_id = ?").get(post.id, viewerId)
    : false;
  const commentCount = db
    .prepare("SELECT COUNT(*) AS c FROM post_comments WHERE post_id = ?")
    .get(post.id).c;

  return {
    ...post,
    is_public: !!post.is_public,
    author,
    kudos,
    likedByViewer,
    commentCount,
  };
}

function canViewPost(post, viewerId) {
  if (!post) return false;
  if (post.user_id === viewerId) return true;
  return !!post.is_public;
}

function commentWithAuthor(row) {
  return {
    id: row.id,
    body: row.body,
    created_at: row.created_at,
    author: { id: row.user_id, username: row.username, avatar_url: row.avatar_url },
  };
}

router.post("/", requireAuth, (req, res) => {
  const { title, body, cover_url, topic, is_public } = req.body || {};
  const text = (body || "").trim();
  if (!text) return res.status(400).json({ error: "Post body is required" });
  const now = new Date().toISOString();
  const post = {
    id: nanoid(),
    user_id: req.user.id,
    title: title?.trim() || null,
    body: text,
    cover_url: cover_url ?? null,
    topic: topic?.trim() || null,
    is_public: is_public === false ? 0 : 1,
    posted_at: now,
    created_at: now,
  };
  db.prepare(
    `INSERT INTO posts (id, user_id, title, body, cover_url, topic, is_public, posted_at, created_at)
     VALUES (@id, @user_id, @title, @body, @cover_url, @topic, @is_public, @posted_at, @created_at)`
  ).run(post);
  res.status(201).json({ post: hydratePost(post, req.user.id) });
});

router.get("/user/:userId", optionalAuth, (req, res) => {
  const viewerId = req.user?.id ?? null;
  const isSelf = viewerId === req.params.userId;
  const posts = db
    .prepare(
      `SELECT * FROM posts WHERE user_id = ? ${isSelf ? "" : "AND is_public = 1"} ORDER BY posted_at DESC`
    )
    .all(req.params.userId);
  res.json({ posts: posts.map((p) => hydratePost(p, viewerId)) });
});

router.get("/:id", optionalAuth, (req, res) => {
  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (!canViewPost(post, req.user?.id)) {
    return res.status(403).json({ error: "This post is private" });
  }
  res.json({ post: hydratePost(post, req.user?.id) });
});

router.patch("/:id", requireAuth, (req, res) => {
  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (post.user_id !== req.user.id) return res.status(403).json({ error: "Not your post" });
  const { title, body, cover_url, topic, is_public } = req.body || {};
  const text = body !== undefined ? String(body).trim() : post.body;
  if (!text) return res.status(400).json({ error: "Post body is required" });
  db.prepare(
    `UPDATE posts SET
       title = ?,
       body = ?,
       cover_url = ?,
       topic = ?,
       is_public = ?
     WHERE id = ?`
  ).run(
    title !== undefined ? (title?.trim() || null) : post.title,
    text,
    cover_url !== undefined ? cover_url : post.cover_url,
    topic !== undefined ? (topic?.trim() || null) : post.topic,
    is_public === false ? 0 : is_public === true ? 1 : post.is_public,
    post.id
  );
  const updated = db.prepare("SELECT * FROM posts WHERE id = ?").get(post.id);
  res.json({ post: hydratePost(updated, req.user.id) });
});

router.delete("/:id", requireAuth, (req, res) => {
  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (post.user_id !== req.user.id) return res.status(403).json({ error: "Not your post" });
  db.prepare("DELETE FROM posts WHERE id = ?").run(post.id);
  res.json({ ok: true });
});

router.post("/:id/kudos", requireAuth, (req, res) => {
  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  const existing = db
    .prepare("SELECT 1 FROM post_kudos WHERE post_id = ? AND user_id = ?")
    .get(post.id, req.user.id);
  if (existing) {
    db.prepare("DELETE FROM post_kudos WHERE post_id = ? AND user_id = ?").run(post.id, req.user.id);
  } else {
    db.prepare("INSERT INTO post_kudos (user_id, post_id, created_at) VALUES (?, ?, ?)").run(
      req.user.id,
      post.id,
      new Date().toISOString()
    );
  }
  const count = db.prepare("SELECT COUNT(*) AS c FROM post_kudos WHERE post_id = ?").get(post.id).c;
  res.json({ kudos: count, liked: !existing });
});

router.get("/:id/comments", optionalAuth, (req, res) => {
  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (!canViewPost(post, req.user?.id)) {
    return res.status(403).json({ error: "This post is private" });
  }
  const rows = db
    .prepare(
      `SELECT c.id, c.body, c.created_at, c.user_id, u.username, u.avatar_url
       FROM post_comments c JOIN users u ON u.id = c.user_id
       WHERE c.post_id = ? ORDER BY c.created_at ASC`
    )
    .all(post.id);
  res.json({ comments: rows.map(commentWithAuthor) });
});

router.post("/:id/comments", requireAuth, (req, res) => {
  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (!canViewPost(post, req.user.id)) {
    return res.status(403).json({ error: "This post is private" });
  }
  const body = (req.body?.body || "").trim();
  if (!body) return res.status(400).json({ error: "Comment is required" });
  const row = {
    id: nanoid(),
    post_id: post.id,
    user_id: req.user.id,
    body,
    created_at: new Date().toISOString(),
  };
  db.prepare(
    "INSERT INTO post_comments (id, post_id, user_id, body, created_at) VALUES (@id, @post_id, @user_id, @body, @created_at)"
  ).run(row);
  const author = db
    .prepare("SELECT id, username, avatar_url FROM users WHERE id = ?")
    .get(req.user.id);
  res.status(201).json({ comment: { ...row, author } });
});

router.delete("/:id/comments/:commentId", requireAuth, (req, res) => {
  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  const comment = db
    .prepare("SELECT * FROM post_comments WHERE id = ? AND post_id = ?")
    .get(req.params.commentId, post.id);
  if (!comment) return res.status(404).json({ error: "Comment not found" });
  if (comment.user_id !== req.user.id && post.user_id !== req.user.id) {
    return res.status(403).json({ error: "Not allowed" });
  }
  db.prepare("DELETE FROM post_comments WHERE id = ?").run(comment.id);
  res.json({ ok: true });
});

export default router;
