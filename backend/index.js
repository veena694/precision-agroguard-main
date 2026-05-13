import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import testDB from "./routes/testDB.js";
import farmRoutes from "./routes/farmRoutes.js";
import cropRoutes from "./routes/cropRoutes.js";
import imageRoutes from "./routes/imageRoutes.js";
import sprayRoutes from "./routes/sprayRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.resolve(__dirname, "./uploads");

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check API
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Database test route
  app.use("/api/dbtest", testDB);
  app.use("/api/farms", farmRoutes);
  app.use("/api/crops", cropRoutes);
  app.use("/api/images", imageRoutes);
  app.use("/uploads", express.static(uploadsPath));
  app.use("/api/spray", sprayRoutes);
  

  return app;
}
