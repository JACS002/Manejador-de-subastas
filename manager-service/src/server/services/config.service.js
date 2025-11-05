import { state } from "../models/state.js";
import { AuctionsService } from "./auctions.service.js";

export const ConfigService = {
  getConfig() {
    return state.config;
  },

  setConfig(cfg) {
    if (!cfg || !Array.isArray(cfg.order) || cfg.order.length === 0) {
      throw new Error("Configuración inválida: order[] requerido");
    }

    const catalog = AuctionsService.list();               // [{ id, basePrice, ... }]
    const idSet = new Set(catalog.map(a => a.id));

    // order debe contener IDs válidos
    const orderOk = cfg.order.every(id => idSet.has(id));
    if (!orderOk) throw new Error("IDs inválidos en la configuración");

    const items = cfg.items || {};
    const metaById = new Map(catalog.map(a => [a.id, a]));

    // Validaciones por ítem
    for (const id of cfg.order) {
      const it = items[id];
      const meta = metaById.get(id);
      if (!it) throw new Error(`Falta item para id ${id}`);

      // startingPrice requerido y >= basePrice del catálogo
      if (typeof it.startingPrice !== "number" || it.startingPrice <= 0) {
        throw new Error(`Precio inicial inválido para ${id}`);
      }
      if (it.startingPrice < meta.basePrice) {
        throw new Error(`Precio inicial de ${id} no puede ser menor al precio base ($${meta.basePrice})`);
      }

      // minIncrement y duración
      if (typeof it.minIncrement !== "number" || it.minIncrement <= 0) {
        throw new Error(`minIncrement inválido para ${id}`);
      }
      if (typeof it.durationSeconds !== "number" || it.durationSeconds < 10) {
        throw new Error(`durationSeconds inválido para ${id} (>=10)`);
      }
    }

    state.config = cfg;
  },

  listAuctions() {
    return state.auctions;
  }
};
