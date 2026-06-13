import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "trekkit.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    username    TEXT UNIQUE NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    avatar_url  TEXT,
    bio         TEXT,
    birthday    TEXT,
    interests   TEXT,
    created_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS trips (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    title       TEXT NOT NULL,
    description TEXT,
    start_date  TEXT,
    end_date    TEXT,
    cover_url   TEXT,
    destination TEXT,
    destination_lat REAL,
    destination_lng REAL,
    is_public   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS stops (
    id          TEXT PRIMARY KEY,
    trip_id     TEXT NOT NULL,
    name        TEXT NOT NULL,
    lat         REAL NOT NULL,
    lng         REAL NOT NULL,
    day         INTEGER,
    visited_on  TEXT,
    notes       TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS photos (
    id          TEXT PRIMARY KEY,
    stop_id     TEXT NOT NULL,
    url         TEXT NOT NULL,
    caption     TEXT,
    created_at  TEXT NOT NULL,
    FOREIGN KEY (stop_id) REFERENCES stops(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS friendships (
    follower_id TEXT NOT NULL,
    followee_id TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    PRIMARY KEY (follower_id, followee_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (followee_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS kudos (
    user_id    TEXT NOT NULL,
    trip_id    TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (user_id, trip_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS comments (
    id         TEXT PRIMARY KEY,
    trip_id    TEXT NOT NULL,
    user_id    TEXT NOT NULL,
    body       TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS bookmarks (
    user_id    TEXT NOT NULL,
    trip_id    TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (user_id, trip_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
  );
`);

// --- lightweight migrations for databases created before new columns existed ---
const userCols = db.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
if (!userCols.includes("birthday")) db.exec("ALTER TABLE users ADD COLUMN birthday TEXT");
if (!userCols.includes("interests")) db.exec("ALTER TABLE users ADD COLUMN interests TEXT");

const tripCols = db.prepare("PRAGMA table_info(trips)").all().map((c) => c.name);
if (!tripCols.includes("destination")) db.exec("ALTER TABLE trips ADD COLUMN destination TEXT");
if (!tripCols.includes("destination_lat")) db.exec("ALTER TABLE trips ADD COLUMN destination_lat REAL");
if (!tripCols.includes("destination_lng")) db.exec("ALTER TABLE trips ADD COLUMN destination_lng REAL");
if (!tripCols.includes("country")) db.exec("ALTER TABLE trips ADD COLUMN country TEXT");
if (!tripCols.includes("country_lat")) db.exec("ALTER TABLE trips ADD COLUMN country_lat REAL");
if (!tripCols.includes("country_lng")) db.exec("ALTER TABLE trips ADD COLUMN country_lng REAL");
if (!tripCols.includes("map_presets")) db.exec("ALTER TABLE trips ADD COLUMN map_presets TEXT");
if (!tripCols.includes("posted_at")) db.exec("ALTER TABLE trips ADD COLUMN posted_at TEXT");

const stopCols = db.prepare("PRAGMA table_info(stops)").all().map((c) => c.name);
if (!stopCols.includes("place_type")) db.exec("ALTER TABLE stops ADD COLUMN place_type TEXT");

const photoCols = db.prepare("PRAGMA table_info(photos)").all().map((c) => c.name);
if (!photoCols.includes("lat")) db.exec("ALTER TABLE photos ADD COLUMN lat REAL");
if (!photoCols.includes("lng")) db.exec("ALTER TABLE photos ADD COLUMN lng REAL");

// Backfill country from legacy destination fields
db.prepare(
  `UPDATE trips
   SET country = destination, country_lat = destination_lat, country_lng = destination_lng
   WHERE country IS NULL AND destination IS NOT NULL
     AND destination_lat IS NOT NULL AND destination_lng IS NOT NULL`
).run();

export default db;
