import fetch from "node-fetch";
import { state } from "../models/state.js";

const MANAGER_URL = process.env.MANAGER_URL || "http://localhost:8080";

function now() { return Date.now(); }
function newEndTs(seconds) { return now() + seconds * 1000; }

export const AuctionService = {
  async loadFromManager() {
    // 1) Traer catálogo
    const catRes = await fetch(`${MANAGER_URL}/api/subastas`);
    if (!catRes.ok) throw new Error("No pude leer /api/subastas del manager");
    const catalogArr = await catRes.json();
    state.catalog = {};
    catalogArr.forEach(a => { state.catalog[a.id] = a; });

    // 2) Traer config
    const cfgRes = await fetch(`${MANAGER_URL}/api/config`);
    if (!cfgRes.ok) throw new Error("No pude leer /api/config del manager");
    const cfg = await cfgRes.json();
    if (!cfg || !Array.isArray(cfg.order) || !cfg.items) {
      throw new Error("Config vacía o inválida en manager");
    }
    state.order = cfg.order;
    state.items = cfg.items;
    // 3) Reiniciar subasta al primer ítem
    state.idx = 0;
    const currentId = state.order[state.idx];
    const it = state.items[currentId];
    state.currentPrice = Math.max(it.startingPrice, state.catalog[currentId].basePrice);
    state.endTs = newEndTs(it.durationSeconds);
    state.bids = [];
  },

  getPublicState() {
    if (!state.order.length) return { ready: false };
    const currentId = state.order[state.idx];
    const catalog = state.catalog[currentId] || {};
    const cfg = state.items[currentId] || {};
    const remaining = Math.max(0, Math.floor((state.endTs - now()) / 1000));
    return {
      ready: true,
      current: {
        id: currentId,
        title: catalog.title,
        artist: catalog.artist,
        year: catalog.year,
        imageUrl: catalog.imageUrl,
        basePrice: catalog.basePrice,
        minIncrement: cfg.minIncrement,
        durationSeconds: cfg.durationSeconds,
        startingPrice: cfg.startingPrice,
        currentPrice: state.currentPrice,
        remaining
      },
      index: state.idx,
      total: state.order.length,
      bids: state.bids.slice(-10) // últimas 10
    };
  },

  tickAndMaybeAdvance() {
    if (!state.order.length) return;
    if (now() >= state.endTs) {
      // avanzar a la siguiente obra
      if (state.idx + 1 < state.order.length) {
        state.idx += 1;
        const id = state.order[state.idx];
        const it = state.items[id];
        state.currentPrice = Math.max(it.startingPrice, state.catalog[id].basePrice);
        state.endTs = newEndTs(it.durationSeconds);
        state.bids = [];
      } else {
        // fin de todas las subastas: congelamos el tiempo
        state.endTs = now();
      }
    }
  },

  placeBid({ bidder, amount }) {
    if (!state.order.length) throw new Error("La subasta no está inicializada");
    const currentId = state.order[state.idx];
    const cfg = state.items[currentId];
    if (now() >= state.endTs) throw new Error("La subasta actual ya terminó");

    const minValid = state.currentPrice + cfg.minIncrement;
    if (typeof amount !== "number" || amount < minValid) {
      throw new Error(`La puja mínima es ${minValid}`);
    }
    if (!bidder || typeof bidder !== "string" || bidder.trim().length < 2) {
      throw new Error("Nombre de postor inválido");
    }

    state.currentPrice = amount;
    state.bids.push({ id: currentId, bidder: bidder.trim(), amount, ts: now() });
    // bonus: extender 5s si faltan <3s (anti-sniping)
    const remaining = state.endTs - now();
    if (remaining < 3000) state.endTs += 5000;
  }
};

// reloj de 1s
setInterval(() => {
  try { AuctionService.tickAndMaybeAdvance(); } catch {}
}, 1000);
