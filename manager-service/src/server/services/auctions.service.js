import { state } from "../models/state.js";

export const AuctionsService = {
  list() {
    return state.auctions;
  },
  exists(id) {
    return state.auctions.some(a => a.id === id);
  }
};
