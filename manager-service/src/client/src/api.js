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
