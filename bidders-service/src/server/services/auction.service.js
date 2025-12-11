// src/server/services/auction.service.js
import fetch from "node-fetch";

const MANAGER_URL = process.env.MANAGER_URL || "http://localhost:8080";

// Estado interno en memoria
const state = {
  hasInit: false,
  order: [],            // [ "ml", "dc", ... ]
  catalogById: {},      // id -> { id, title, artist, year, basePrice, imageUrl }
  configById: {},       // id -> { startingPrice, minIncrement, durationSeconds }
  timingsById: {},      // id -> { startTs, endTs }
  currentPrices: {},    // id -> number
  registrations: {},    // id -> [ "Joel", "Ana", ... ]
  bidsById: {},         // id -> [ { bidder, amount, ts } ]
};

function nowMs() {
  return Date.now();
}

export const AuctionService = {
  // ---------- Inicializar leyendo del manager (Deber 3 / 4 / Final) ----------

  async initFromManager() {
    // 1) Catálogo desde manager
    const catRes = await fetch(`${MANAGER_URL}/api/subastas`);
    if (!catRes.ok) throw new Error("No se pudo leer /api/subastas del manejador");
    const catalogArr = await catRes.json();

    const catalogById = {};
    for (const a of catalogArr) {
      if (!a.id) continue;
      catalogById[a.id] = a;
    }

    // 2) Configuración desde manager
    const cfgRes = await fetch(`${MANAGER_URL}/api/config`);
    if (!cfgRes.ok) throw new Error("No se pudo leer /api/config del manejador");
    const cfg = await cfgRes.json();

    if (!cfg || !Array.isArray(cfg.order) || cfg.order.length === 0 || !cfg.items) {
      throw new Error("Configuración de subastas inválida en el manejador");
    }

    // 3) Construir estado interno
    state.order = cfg.order.slice();
    state.catalogById = catalogById;
    state.configById = {};
    state.timingsById = {};
    state.currentPrices = {};
    state.registrations = {};
    state.bidsById = {};

    const t0 = nowMs();
    let offsetMs = 0;

    for (const id of state.order) {
      const meta = catalogById[id];
      const itemCfg = cfg.items[id];

      if (!meta) throw new Error(`Catálogo no contiene id ${id}`);
      if (!itemCfg) throw new Error(`Config no contiene item para id ${id}`);

      const startingPrice = itemCfg.startingPrice ?? meta.basePrice;
      const minIncrement = itemCfg.minIncrement ?? Math.max(50, Math.round(meta.basePrice * 0.05));
      const durationSeconds = itemCfg.durationSeconds ?? 60;

      const startTs = t0 + offsetMs;
      const endTs = startTs + durationSeconds * 1000;

      state.configById[id] = { startingPrice, minIncrement, durationSeconds };
      state.timingsById[id] = { startTs, endTs };
      state.currentPrices[id] = Math.max(startingPrice, meta.basePrice);
      state.registrations[id] = [];
      state.bidsById[id] = [];

      offsetMs += durationSeconds * 1000;
    }

    state.hasInit = true;
    console.log("✅ Subastas inicializadas desde el manejador");
  },

  // alias por compatibilidad con rutas antiguas
  async loadFromManager() {
    return this.initFromManager();
  },

  // ---------- Helpers internos ----------

  _computeStatus(id, now) {
    const t = state.timingsById[id];
    if (!t) return "pending";
    if (now < t.startTs) return "pending";
    if (now >= t.endTs) return "finished";
    return "active";
  },

  _computePublicAuction(id, index, now) {
    const meta = state.catalogById[id];
    const cfg = state.configById[id];
    const t = state.timingsById[id];
    const regs = state.registrations[id] || [];
    const bids = state.bidsById[id] || [];
    const currentPrice = state.currentPrices[id];

    const secondsToStart = Math.max(0, Math.floor((t.startTs - now) / 1000));
    const secondsToEnd = Math.max(0, Math.floor((t.endTs - now) / 1000));

    const status = this._computeStatus(id, now);

    // ganador = puja más alta si ya terminó
    let winner = null;
    if (status === "finished" && bids.length > 0) {
      let best = bids[0];
      for (const b of bids) {
        if (b.amount > best.amount) best = b;
      }
      winner = { bidder: best.bidder, amount: best.amount };
    }

    const lastBids = bids.slice(-10); // últimas 10

    return {
      id,
      index,
      title: meta.title,
      artist: meta.artist,
      year: meta.year,
      imageUrl: meta.imageUrl,
      basePrice: meta.basePrice,
      startingPrice: cfg.startingPrice,
      minIncrement: cfg.minIncrement,
      durationSeconds: cfg.durationSeconds,
      status,                // "pending" | "active" | "finished"
      secondsToStart,        // para Deber 4 (antes de iniciar)
      secondsToEnd,          // para Proyecto Final (cuando está activa)
      currentPrice,
      registrations: regs,
      bids: lastBids,
      winner,
    };
  },

  // ---------- Estado público para el cliente (se emite por WS y/o REST) ----------

  getPublicState() {
    if (!state.hasInit) {
      return { ready: false };
    }
    const now = nowMs();

    const auctions = state.order.map((id, idx) =>
      this._computePublicAuction(id, idx, now)
    );

    return {
      ready: true,
      now,
      auctions,
    };
  },

  // alias si tenías algo como getState()
  getState() {
    return this.getPublicState();
  },

  // ---------- Registro de postores (Deber 4) ----------

  registerBidder(auctionId, rawBidder) {
    if (!state.hasInit) throw new Error("Subastas no inicializadas");
    if (!state.order.includes(auctionId)) throw new Error("Subasta inexistente");

    const bidder = (rawBidder || "").trim();
    if (bidder.length < 2) throw new Error("Nombre de postor demasiado corto");

    const regs = state.registrations[auctionId] || (state.registrations[auctionId] = []);
    if (!regs.includes(bidder)) {
      regs.push(bidder);
    }
  },

  // ---------- Hacer una puja (Proyecto Final) ----------

  placeBid({ auctionId, bidder: rawBidder, amount }) {
    if (!state.hasInit) throw new Error("Subastas no inicializadas");
    if (!state.order.includes(auctionId)) throw new Error("Subasta inexistente");

    const bidder = (rawBidder || "").trim();
    if (!bidder) throw new Error("Nombre de postor requerido");

    const regs = state.registrations[auctionId] || [];
    if (!regs.includes(bidder)) {
      throw new Error("El postor no está registrado en esta subasta");
    }

    const meta = state.catalogById[auctionId];
    const cfg = state.configById[auctionId];
    const t = state.timingsById[auctionId];
    const now = nowMs();

    if (now < t.startTs) throw new Error("La subasta aún no comienza");
    if (now >= t.endTs) throw new Error("La subasta ya terminó");

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount)) throw new Error("Monto inválido");

    const minValid = (state.currentPrices[auctionId] || cfg.startingPrice || meta.basePrice) + cfg.minIncrement;
    if (numericAmount < minValid) {
      throw new Error(`La puja mínima es ${minValid}`);
    }

    const bid = { bidder, amount: numericAmount, ts: now };
    const bids = state.bidsById[auctionId] || (state.bidsById[auctionId] = []);
    bids.push(bid);
    state.currentPrices[auctionId] = numericAmount;
  },

  // ---------- Tick (si necesitaras lógica extra por segundo) ----------

  tick() {
    // Por ahora no necesitamos cambiar nada en cada tick:
    // los estados pending/active/finished se derivan de los timestamps.
  }
};
