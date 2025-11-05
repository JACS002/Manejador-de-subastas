import { useEffect, useState, useEffect as UseEffect } from "react";
import { fetchAuctions, fetchConfig, saveConfig } from "./api";
import "./App.css";

export default function App() {
  const [auctions, setAuctions] = useState([]);
  const [order, setOrder] = useState([]);
  const [items, setItems] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: true });

  // Modal state
  const [preview, setPreview] = useState(null); // { src, title, artist, year }

  const usd = (n) =>
    typeof n === "number"
      ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
      : n;

  useEffect(() => {
    (async () => {
      const a = await fetchAuctions();
      setAuctions(a);
      const cfg = await fetchConfig();
      if (cfg) {
        setOrder(cfg.order);
        setItems(cfg.items);
      } else {
        const def = {};
        a.forEach(x => {
          def[x.id] = {
            id: x.id,
            startingPrice: x.basePrice,
            minIncrement: Math.max(50, Math.round(x.basePrice * 0.05)),
            durationSeconds: 60
          };
        });
        setOrder(a.map(x => x.id));
        setItems(def);
      }
    })();
  }, []);

  // Cerrar modal con ESC
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setPreview(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openPreview = (a) => setPreview({ src: a.imageUrl, title: a.title, artist: a.artist, year: a.year });
  const closePreview = () => setPreview(null);

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
    try {
      await saveConfig({ order, items });
      setMsg({ text: "Configuración guardada", ok: true });
    } catch (e) {
      setMsg({ text: e.message || "Error al guardar", ok: false });
    } finally {
      setSaving(false);
    }
  };

  const getMeta = id => auctions.find(x => x.id === id);

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1 className="title">Configurar Subastas</h1>
          <p className="subtitle">
            Ordena las obras y define precio inicial, mínimo incremento y duración.
          </p>
        </header>

        <section className="panel">
          {/* Desktop / tablet: tabla con imagen click-to-zoom */}
          <div className="table-wrap">
            <table className="table" aria-label="Tabla de configuración de subastas">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Obra</th>
                  <th>Base</th>
                  <th>Precio inicial</th>
                  <th>Min. incremento</th>
                  <th>Duración (s)</th>
                  <th>Orden</th>
                </tr>
              </thead>
              <tbody>
                {order.map((id, idx) => {
                  const a = getMeta(id);
                  const row = items[id];
                  if (!a || !row) return null;
                  return (
                    <tr key={id}>
                      <td>{idx + 1}</td>
                      <td>
                        <div className="obra-cell">
                          <img
                            className="thumb"
                            src={a.imageUrl}
                            alt={a.title}
                            onClick={() => openPreview(a)}
                          />
                          <div className="obra-meta">
                            <span className="obra-title">{a.title}</span>
                            <span className="obra-sub">{a.artist} ({a.year})</span>
                          </div>
                        </div>
                      </td>
                      <td>{usd(a.basePrice)}</td>
                      <td>
                        <input
                          className="input"
                          type="number"
                          min={a.basePrice}
                          value={row.startingPrice}
                          onChange={e => update(id, "startingPrice", +e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          type="number"
                          min="1"
                          value={row.minIncrement}
                          onChange={e => update(id, "minIncrement", +e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          type="number"
                          min="10"
                          value={row.durationSeconds}
                          onChange={e => update(id, "durationSeconds", +e.target.value)}
                        />
                      </td>
                      <td>
                        <div className="controls">
                          <button className="btn" onClick={() => move(id, -1)} aria-label="Subir">↑</button>
                          <button className="btn" onClick={() => move(id, +1)} aria-label="Bajar">↓</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Móvil: tarjetas (tap para ampliar también) */}
          <div className="cards">
            {order.map((id, idx) => {
              const a = getMeta(id);
              const row = items[id];
              if (!a || !row) return null;
              return (
                <div className="card" key={`card-${id}`} aria-label={`Subasta ${idx + 1}`}>
                  <img className="card-image" src={a.imageUrl} alt={a.title} onClick={() => openPreview(a)} />
                  <div className="row"><span className="label">#</span><span className="value">{idx + 1}</span></div>
                  <div className="row"><span className="label">Obra</span><span className="value">{a.title}</span></div>
                  <div className="row"><span className="label">Artista</span><span className="value">{a.artist} ({a.year})</span></div>
                  <div className="row"><span className="label">Base</span><span className="value">{usd(a.basePrice)}</span></div>
                  <div className="row">
                    <span className="label">Precio inicial</span>
                    <input className="input" type="number" min={a.basePrice}
                           value={row.startingPrice}
                           onChange={e => update(id, "startingPrice", +e.target.value)} />
                  </div>
                  <div className="row">
                    <span className="label">Min. incremento</span>
                    <input className="input" type="number" min="1"
                           value={row.minIncrement}
                           onChange={e => update(id, "minIncrement", +e.target.value)} />
                  </div>
                  <div className="row">
                    <span className="label">Duración (s)</span>
                    <input className="input" type="number" min="10"
                           value={row.durationSeconds}
                           onChange={e => update(id, "durationSeconds", +e.target.value)} />
                  </div>
                  <div className="row actions">
                    <button className="btn" onClick={() => move(id, -1)}>↑</button>
                    <button className="btn" onClick={() => move(id, +1)}>↓</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="actions-row" style={{ marginTop: 14 }}>
          <button className="btn-primary" onClick={onSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar Configuración"}
          </button>
          {msg.text && (
            <span className={`msg ${msg.ok ? "ok" : "err"}`}> {msg.ok ? "✅" : "❌"} {msg.text}</span>
          )}
        </div>
      </div>

      {/* ===== Modal de imagen ===== */}
      {preview && (
        <div className="modal-backdrop" onClick={closePreview} role="dialog" aria-modal="true">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header>
              <div>
                <div className="modal-title">{preview.title}</div>
                <div className="modal-sub">{preview.artist} ({preview.year})</div>
              </div>
              <button className="modal-close" onClick={closePreview} aria-label="Cerrar">✕</button>
            </header>
            <img src={preview.src} alt={preview.title} />
          </div>
        </div>
      )}
    </div>
  );
}
