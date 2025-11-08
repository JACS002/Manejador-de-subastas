import { Router } from "express";
import { AuctionService } from "../services/auction.service.js";

const router = Router();

// Inicializa leyendo del manager
router.post("/start", async (_req, res) => {
  try {
    await AuctionService.loadFromManager();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Estado público (para polling del front)
router.get("/state", (_req, res) => {
  try {
    res.json(AuctionService.getPublicState());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Hacer una puja
router.post("/bid", (req, res) => {
  try {
    const { bidder, amount } = req.body || {};
    AuctionService.placeBid({ bidder, amount: Number(amount) });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
