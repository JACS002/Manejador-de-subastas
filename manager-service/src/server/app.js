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

// API endpoints
app.use("/api/subastas", auctionsRoutes);
app.use("/api/config", configRoutes);

// === Servir el frontend construido (si existe) ===
const clientDist = path.join(__dirname, "..", "client", "dist");
const indexHtml = path.join(clientDist, "index.html");

// Solo configurar los archivos estáticos si ya existe el build
if (fs.existsSync(indexHtml)) {
  app.use(express.static(clientDist));

  // Usa expresión regular en lugar de "/*" o "*"
  app.get(/.*/, (req, res) => {
    res.sendFile(indexHtml);
  });
}

export default app;
