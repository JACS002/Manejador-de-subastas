import { ConfigService } from "../services/config.service.js";

export const ConfigController = {
  get: (req, res) => {
    res.json(ConfigService.getConfig() ?? null);
  },

  save: (req, res) => {
    try {
      ConfigService.setConfig(req.body);
      res.json({ ok: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};
