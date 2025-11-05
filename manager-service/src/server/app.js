import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import auctionsRoutes from "./routes/auctions.routes.js";
import configRoutes from "./routes/config.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// API
app.use("/api/subastas", auctionsRoutes);
app.use("/api/config", configRoutes);

// === Servir el frontend construido ===
// Vite genera en manager-service/dist/client (por el outDir de vite.config.js)
const clientDist = path.join(__dirname, "..", "..", "dist", "client");
const indexHtml = path.join(clientDist, "index.html");

if (fs.existsSync(indexHtml)) {
  app.use(express.static(clientDist));
  // usa regex como catch-all para evitar errores con path-to-regexp
  app.get(/.*/, (_req, res) => res.sendFile(indexHtml));
}

export default app;
