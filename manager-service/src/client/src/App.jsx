import { useEffect, useState } from "react";
import { fetchAuctions, fetchConfig, saveConfig } from "./api";

export default function App() {
  const [auctions, setAuctions] = useState([]);
  const [order, setOrder] = useState([]);
  const [items, setItems] = useState({});
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // Cargar catálogo y config inicial
  useEffect(() => {
    (async () => {
      const a = await fetchAuctions();
      setAuctions(a);

      const cfg = await fetchConfig();
      if (cfg) {
        setOrder(cfg.order);
        setItems(cfg.items);
      } else {
        // valores por defecto
        const def = {};
        a.forEach(x => {
          def[x.id] = {
            id: x.id,
            minIncrement: Math.max(50, Math.round(x.basePrice * 0.05)),
            durationSeconds: 60
          };
        });
        setOrder(a.map(x => x.id));
        setItems(def);
      }
    })();
  }, []);

  const move = (id, dir) => {
    setOrder(prev => {
      const i = prev.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  };

  const update = (id, field, value) => {
    setItems(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const onSave = async () => {
    setSaving(true);
    setMsg("");
    try {
      await saveConfig({ order, items });
      setMsg("✅ Configuración guardada");
    } catch (e) {
      setMsg("❌ " + e.message);
    }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 980, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>Configurar Subastas</h1>
      <p>Ordena las obras y define el mínimo incremento y la duración.</p>

      <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #ddd" }}>
            <th>#</th>
            <th>Obra</th>
            <th>Artista</th>
            <th>Base</th>
            <th>Min. incremento</th>
            <th>Duración (s)</th>
            <th>Orden</th>
          </tr>
        </thead>
        <tbody>
          {order.map((id, idx) => {
            const a = auctions.find(x => x.id === id);
            const row = items[id];
            if (!a || !row) return null;
            return (
              <tr key={id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td>{idx + 1}</td>
                <td>{a.title}</td>
                <td>{a.artist} ({a.year})</td>
                <td>${a.basePrice}</td>
                <td>
                  <input
                    type="number"
                    min="1"
                    value={row.minIncrement}
                    onChange={e => update(id, "minIncrement", +e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="10"
                    value={row.durationSeconds}
                    onChange={e => update(id, "durationSeconds", +e.target.value)}
                  />
                </td>
                <td>
                  <button onClick={() => move(id, -1)}>↑</button>
                  <button onClick={() => move(id, +1)} style={{ marginLeft: 6 }}>↓</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ marginTop: 16 }}>
        <button onClick={onSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar Configuración"}
        </button>
        <span style={{ marginLeft: 12 }}>{msg}</span>
      </div>
    </div>
  );
}
