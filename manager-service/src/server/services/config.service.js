import { state } from "../models/state.js";
import { AuctionsService } from "./auctions.service.js";

export const ConfigService = {
  getConfig() {
    return state.config;
  },

  setConfig(cfg) {
    if (!cfg || !Array.isArray(cfg.order) || cfg.order.length === 0)
      throw new Error("Configuración inválida: order[] requerido");

    const ids = new Set(AuctionsService.list().map(a => a.id));
    const orderOk = cfg.order.every(id => ids.has(id));
    if (!orderOk) throw new Error("IDs inválidos en la configuración");

    const items = cfg.items || {};
    for (const id of cfg.order) {
      const it = items[id];
      if (!it || it.minIncrement <= 0 || it.durationSeconds < 10) {
        throw new Error("Items inválidos: minIncrement>0 y durationSeconds>=10");
      }
    }

    state.config = cfg;
  },

  listAuctions() {
    return state.auctions;
  }
};
