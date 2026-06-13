import { Router } from "express";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import db from "../db.js";
import { signToken, requireAuth } from "../auth.js";

const router = Router();

function publicUser(u) {
  if (!u) return null;
  const { password, ...rest } = u;
  let interests = [];
  if (rest.interests) {
    try {
      interests = JSON.parse(rest.interests);
    } catch {
      interests = [];
    }
  }
  return { ...rest, interests };
}

router.post("/register", (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ error: "username, email and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  const exists = db
    .prepare("SELECT id FROM users WHERE username = ? OR email = ?")
    .get(username, email);
  if (exists) return res.status(409).json({ error: "Username or email already taken" });

  const { bio, birthday, interests, avatar_url } = req.body || {};
  const user = {
    id: nanoid(),
    username,
    email,
    password: bcrypt.hashSync(password, 10),
    avatar_url: avatar_url ?? null,
    bio: bio ?? null,
    birthday: birthday ?? null,
    interests: Array.isArray(interests) ? JSON.stringify(interests) : null,
    created_at: new Date().toISOString(),
  };
  db.prepare(
    `INSERT INTO users (id, username, email, password, avatar_url, bio, birthday, interests, created_at)
     VALUES (@id, @username, @email, @password, @avatar_url, @bio, @birthday, @interests, @created_at)`
  ).run(user);

  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

router.post("/login", (req, res) => {
  const { emailOrUsername, password } = req.body || {};
  if (!emailOrUsername || !password) {
    return res.status(400).json({ error: "Credentials required" });
  }
  const user = db
    .prepare("SELECT * FROM users WHERE email = ? OR username = ?")
    .get(emailOrUsername, emailOrUsername);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

router.get("/me", requireAuth, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: publicUser(user) });
});

router.patch("/me", requireAuth, (req, res) => {
  const { bio, avatar_url, birthday, interests } = req.body || {};
  const interestsJson = Array.isArray(interests) ? JSON.stringify(interests) : undefined;
  db.prepare(
    `UPDATE users SET
       bio = COALESCE(?, bio),
       avatar_url = COALESCE(?, avatar_url),
       birthday = COALESCE(?, birthday),
       interests = COALESCE(?, interests)
     WHERE id = ?`
  ).run(
    bio ?? null,
    avatar_url ?? null,
    birthday ?? null,
    interestsJson ?? null,
    req.user.id
  );
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  res.json({ user: publicUser(user) });
});

export default router;
