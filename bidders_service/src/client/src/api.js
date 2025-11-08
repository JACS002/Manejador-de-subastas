export async function startFromManager() {
  const r = await fetch("/api/start", { method: "POST" });
  return r.json();
}
export async function readState() {
  const r = await fetch("/api/state");
  return r.json();
}
export async function placeBid(bidder, amount) {
  const r = await fetch("/api/bid", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bidder, amount })
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.error || "Error");
  }
  return r.json();
}
