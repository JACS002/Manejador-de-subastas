import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import auctionRoutes from "./routes/auction.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// API
app.use("/api", auctionRoutes);

// servir frontend (build Vite)
const clientDist = path.join(__dirname, "..", "..", "dist", "client");
const indexHtml = path.join(clientDist, "index.html");
if (fs.existsSync(indexHtml)) {
  app.use(express.static(clientDist));
  app.get(/.*/, (_req, res) => res.sendFile(indexHtml));
}

export default app;
