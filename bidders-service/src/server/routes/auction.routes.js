// src/server/routes/auction.routes.js
import { Router } from "express";
import { AuctionService } from "../services/auction.service.js";

const router = Router();

// Inicializar el estado leyendo del manager (Deber 3/4/proyecto)
router.post("/start", async (_req, res) => {
  try {
    await AuctionService.initFromManager();
    res.json({ ok: true });
  } catch (err) {
    console.error("Error en /api/start:", err);
    res.status(500).json({ error: err.message || "Error al inicializar desde el manejador" });
  }
});

// Endpoint opcional para inspeccionar estado por REST
router.get("/state", (_req, res) => {
  try {
    res.json(AuctionService.getPublicState());
  } catch (err) {
    res.status(500).json({ error: err.message || "Error al obtener estado" });
  }
});

export default router;
    