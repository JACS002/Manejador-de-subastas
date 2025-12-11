// manager-service/src/server/controllers/config.controller.js
import { ConfigService } from "../services/config.service.js";
import fetch from "node-fetch";

export const ConfigController = {
  get: (req, res) => {
    res.json(ConfigService.getConfig() ?? null);
  },

  save: async (req, res) => {
    try {
      // 1) Guardar configuración localmente (como ya hacías)
      ConfigService.setConfig(req.body);

      // 2) Intentar notificar al servicio de postores (bidders-service)
      let biddersInit = {
        called: false,
        ok: false,
        status: null,
        error: null
      };

      try {
        const biddersUrl =
          process.env.BIDDERS_URL || "http://localhost:8081/api/start";

        console.log("👉 Llamando a bidders-service en:", biddersUrl);

        const r = await fetch(biddersUrl, { method: "POST" });
        const j = await r.json().catch(() => ({}));

        biddersInit = {
          called: true,
          ok: r.ok && j.ok !== false,
          status: r.status,
          error: j.error || null
        };

        if (!biddersInit.ok) {
          console.error("⚠️ No se pudieron inicializar las subastas:", biddersInit);
        } else {
          console.log("✅ Subastas inicializadas automáticamente en bidders-service");
        }

      } catch (err) {
        biddersInit = {
          called: true,
          ok: false,
          status: null,
          error: err.message || String(err)
        };
        console.error("⚠️ No se pudo contactar al bidders-service:", err);
      }

      // 3) Responder al frontend
      res.json({ ok: true, biddersInit });

    } catch (err) {
      console.error("Error guardando configuración:", err);
      res.status(400).json({ error: err.message });
    }
  }
};
