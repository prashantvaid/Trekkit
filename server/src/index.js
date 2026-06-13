import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.routes.js";
import tripRoutes from "./routes/trips.routes.js";
import userRoutes from "./routes/users.routes.js";
import feedRoutes from "./routes/feed.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import geoRoutes from "./routes/geo.routes.js";
import recommendationsRoutes from "./routes/recommendations.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (_req, res) => res.json({ ok: true, app: "trekkit" }));

app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/users", userRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/geo", geoRoutes);
app.use("/api/recommendations", recommendationsRoutes);

// Centralized error handler (e.g. multer file-size / type errors)
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

app.listen(PORT, () => {
  console.log(`🌍 Trekkit API running on http://localhost:${PORT}`);
});
