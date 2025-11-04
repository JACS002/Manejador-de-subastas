import { ConfigService } from "../services/config.service.js";

export const AuctionsController = {
  list: (req, res) => {
    res.json(ConfigService.listAuctions());
  }
};
