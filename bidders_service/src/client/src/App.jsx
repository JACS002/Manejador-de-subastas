import { useEffect, useState } from "react";
import { startFromManager, readState, placeBid } from "./api";
import "./App.css";

const usd = n => n?.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function App() {
  const [st, setSt] = useState(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState({ t:"", ok:true });

  // cargar/actualizar estado cada 1s
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const s = await readState();
      if (!alive) return;
      setSt(s);
    };
    load();
    const id = setInterval(load, 1000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const handleStart = async () => {
    await startFromManager();
    const s = await readState();
    setSt(s);
  };

  const bid = async () => {
    try {
      const amt = Number(amount);
      if (!name.trim()) throw new Error("Escribe tu nombre");
      await placeBid(name.trim(), amt);
      setAmount("");
      setMsg({ t:"✅ Puja aceptada", ok:true });
    } catch (e) {
      setMsg({ t:"❌ " + e.message, ok:false });
    }
  };

  if (!st || !st.ready) {
    return (
      <div className="app">
        <div className="container">
          <div className="header">
            <h1>Subastas — Sala de Postores</h1>
            <p>Este servicio consume la configuración del manejador (8080) y gestiona las pujas en vivo.</p>
          </div>
          <div className="panel">
            <p>La subasta no está inicializada.</p>
            <button className="btn btn-primary" onClick={handleStart}>Cargar configuración del manejador</button>
          </div>
        </div>
      </div>
    );
  }

  const c = st.current;
  const minNext = c.currentPrice + c.minIncrement;

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1>Subastas — Sala de Postores</h1>
          <p>{st.index + 1} / {st.total} &nbsp;|&nbsp; <span className="badge">{c.remaining}s restantes</span></p>
        </div>

        <div className="panel">
          <div className="grid">
            <div className="art">
              <img src={c.imageUrl} alt={c.title} />
              <div className="meta">
                <div className="title">{c.title}</div>
                <div className="sub">{c.artist} ({c.year})</div>
              </div>
            </div>

            <div className="meta">
              <div className="row">
                <span className="badge">Base: {usd(c.basePrice)}</span>
                <span className="badge">Min. inc: {usd(c.minIncrement)}</span>
                <span className="badge">Inicio: {usd(c.startingPrice)}</span>
              </div>

              <div className="price">Actual: {usd(c.currentPrice)}</div>

              <div className="controls">
                <input
                  className="input"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
                <div className="row">
                  <input
                    className="input"
                    type="number"
                    placeholder={`≥ ${minNext}`}
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    min={minNext}
                  />
                  <button className="btn btn-primary" onClick={bid}>Pujar</button>
                </div>
                {msg.t && <div className={`msg ${msg.ok ? "ok":"err"}`}>{msg.t}</div>}
              </div>

              <div className="bids">
                <div style={{fontWeight:700, color:"#cbd5e1"}}>Últimas pujas</div>
                {st.bids.length === 0 && <div className="item">Aún no hay pujas.</div>}
                {st.bids.slice().reverse().map((b, i) => (
                  <div key={i} className="item">
                    <span>{b.bidder}</span>
                    <span>{usd(b.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {c.remaining === 0 && (
            <div style={{marginTop:14}} className="msg ok">Lote finalizado. Espera el siguiente…</div>
          )}
        </div>
      </div>
    </div>
  );
}
