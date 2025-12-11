// client/src/api.js
export async function fetchAuctions() {
  const res = await fetch("/api/subastas");
  return res.json();
}

export async function fetchConfig() {
  const res = await fetch("/api/config");
  return res.json();
}

export async function saveConfig(cfg) {
  const res = await fetch("/api/config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cfg)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Error al guardar");
  }
}
const BIDDERS_URL =
  import.meta.env.VITE_BIDDERS_URL || "http://localhost:8081";

export async function notifyBiddersStart() {
  const res = await fetch(`${BIDDERS_URL}/api/start`, {
    method: "POST"
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "No se pudo inicializar el servicio de postores");
  }
  return res.json();
}