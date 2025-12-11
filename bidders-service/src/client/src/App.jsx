// src/client/src/App.jsx
import { useEffect, useState, useMemo } from "react";
import { Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import { socket } from "./socket";

const fmtUSD = (n) =>
  typeof n === "number"
    ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : n;

const statusLabel = (s) =>
  s === "active" ? "Activa" : s === "finished" ? "Finalizada" : "Pendiente";

export default function App() {
  const [st, setSt] = useState(null);
  const [msg, setMsg] = useState({ t: "", ok: true });

  useEffect(() => {
    socket.on("state", (data) => {
      setSt(data);
    });
    socket.on("errorMsg", (txt) => {
      setMsg({ t: `❌ ${txt}`, ok: false });
    });
    return () => {
      socket.off("state");
      socket.off("errorMsg");
    };
  }, []);

  if (!st || !st.ready) {
    return (
      <div className="app">
        <div className="container">
          <header className="header">
            <h1>Sala de Postores</h1>
            <p>
              Esperando configuración desde el servicio del manejador. Asegúrate de que el
              administrador haya guardado la configuración y ejecutado <code>/api/start</code>.
            </p>
          </header>
          <div className="panel">
            <p>Por ahora el backend reporta <b>ready = false</b>.</p>
            {msg.t && <div className={`msg ${msg.ok ? "ok" : "err"}`}>{msg.t}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>Sala de Postores</h1>
          <p>Consulta las subastas disponibles y participa en tiempo real.</p>
        </header>
        <Routes>
          <Route path="/" element={<HomeView state={st} />} />
          <Route path="/subasta/:id" element={<AuctionView state={st} globalMsg={msg} setGlobalMsg={setMsg} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}

/* ================= Home: lista de subastas ================= */

function HomeView({ state }) {
  const auctions = state.auctions || [];

  return (
    <div className="panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div>
          <span className="badge">
            Tiempo de servidor: {new Date(state.now).toLocaleTimeString()}
          </span>
        </div>
        <Link to="/" className="btn">Inicio</Link>
      </div>

      <div className="auctions-grid">
        {auctions.map(a => {
          const isPending = a.status === "pending";
          const isActive = a.status === "active";
          const isFinished = a.status === "finished";

          let timeLabel = "";
          if (isPending) timeLabel = `Comienza en ${a.secondsToStart}s`;
          else if (isActive) timeLabel = `Termina en ${a.secondsToEnd}s`;
          else timeLabel = "Finalizada";

          return (
            <article key={a.id} className="auction-card">
              <img src={a.imageUrl} alt={a.title} className="auction-thumb" />
              <div>
                <div className="auction-title">{a.title}</div>
                <div className="auction-sub">{a.artist} ({a.year})</div>
              </div>
              <div className="auction-footer">
                <div style={{ display: "grid", gap: 2 }}>
                  <span style={{ fontSize: ".9rem" }}>Base: {fmtUSD(a.basePrice)}</span>
                  <span style={{ fontSize: ".9rem" }}>Actual: {fmtUSD(a.currentPrice)}</span>
                  <span style={{ fontSize: ".8rem", color: "var(--muted)" }}>{timeLabel}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className={`status-pill ${
                    isPending ? "status-pending" : isActive ? "status-active" : "status-finished"
                  }`}>
                    <span className="badge-dot" style={{
                      background: isActive ? "#22c55e" : isFinished ? "#f97373" : "#a1a1aa"
                    }} />
                    <span>{statusLabel(a.status)}</span>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <Link to={`/subasta/${a.id}`} className="btn btn-primary" style={{ fontSize: ".85rem" }}>
                      Ver subasta
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {auctions.length === 0 && <p>No hay subastas configuradas.</p>}
    </div>
  );
}

/* ================= Detalle de una subasta ================= */

function AuctionView({ state, globalMsg, setGlobalMsg }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const auction = useMemo(
    () => (state.auctions || []).find(a => a.id === id),
    [state, id]
  );

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    // limpiar mensaje local/global al entrar
    setGlobalMsg({ t: "", ok: true });
  }, [id, setGlobalMsg]);

  if (!auction) {
    return (
      <div className="panel">
        <p>Subasta no encontrada.</p>
        <button className="btn" onClick={() => navigate("/")}>Volver al listado</button>
      </div>
    );
  }

  const isPending = auction.status === "pending";
  const isActive = auction.status === "active";
  const isFinished = auction.status === "finished";

  const minNext = (auction.currentPrice || auction.startingPrice || auction.basePrice) + auction.minIncrement;

  const handleRegister = () => {
    if (!name.trim()) {
      setGlobalMsg({ t: "❌ Escribe tu nombre para registrarte.", ok: false });
      return;
    }
    socket.emit("register", { auctionId: auction.id, bidder: name.trim() });
    setGlobalMsg({ t: "✅ Solicitud de registro enviada.", ok: true });
  };

  const handleBid = () => {
    if (!name.trim()) {
      setGlobalMsg({ t: "❌ Debes estar registrado y haber escrito tu nombre.", ok: false });
      return;
    }
    if (!isActive) {
      setGlobalMsg({ t: "❌ Esta subasta no está activa.", ok: false });
      return;
    }
    const val = Number(amount);
    if (!Number.isFinite(val) || val < minNext) {
      setGlobalMsg({ t: `❌ La puja mínima es ${fmtUSD(minNext)}`, ok: false });
      return;
    }
    socket.emit("bid", { auctionId: auction.id, bidder: name.trim(), amount: val });
    setAmount("");
    setGlobalMsg({ t: "✅ Puja enviada.", ok: true });
  };

  return (
    <div className="panel">
      <div style={{
        display:"flex",
        justifyContent:"space-between",
        alignItems:"center",
        gap:8,
        marginBottom:12
      }}>
        <button className="btn" onClick={() => navigate("/")}>← Volver</button>
        <span className="badge">
          Lote {auction.index + 1} de {state.auctions.length}
        </span>
      </div>

      <div className="detail-grid">
        <div>
          <img src={auction.imageUrl} alt={auction.title} className="detail-image" />
          <h2 className="detail-title">{auction.title}</h2>
          <p className="detail-sub">{auction.artist} ({auction.year})</p>

          <div className="detail-prices">
            <span className="chip">Base: {fmtUSD(auction.basePrice)}</span>
            <span className="chip">Inicio: {fmtUSD(auction.startingPrice)}</span>
            <span className="chip">Min. incremento: {fmtUSD(auction.minIncrement)}</span>
          </div>

          <div style={{ marginTop: 6 }}>
            {isPending && (
              <span className="chip">
                ⏳ Comienza en {auction.secondsToStart}s
              </span>
            )}
            {isActive && (
              <span className="chip">
                🔥 Termina en {auction.secondsToEnd}s
              </span>
            )}
            {isFinished && (
              <span className="chip">
                ✅ Subasta finalizada
              </span>
            )}
          </div>

          <div style={{ marginTop: 14 }}>
            <div className="detail-price-main">
              Precio actual: {fmtUSD(auction.currentPrice)}
            </div>
            <div style={{ fontSize:".9rem", color:"var(--muted)", marginTop:4 }}>
              Siguiente puja mínima: {fmtUSD(minNext)}
            </div>
          </div>

          {auction.winner && isFinished && (
            <div style={{ marginTop: 14 }} className="msg ok">
              🏆 Ganador/a: <b>{auction.winner.bidder}</b> con {fmtUSD(auction.winner.amount)}
            </div>
          )}
        </div>

        <div className="side-panel">
          <section>
            <div className="section-title">Registro de postores</div>
            <div style={{ display:"flex", gap:8, marginTop:8 }}>
              <input
                className="input"
                placeholder="Tu nombre completo"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <button className="btn btn-primary" onClick={handleRegister}>
                Registrarme
              </button>
            </div>
            <ul className="reg-list">
              {auction.registrations.length === 0 && (
                <li>No hay postores registrados aún.</li>
              )}
              {auction.registrations.map((r, i) => (
                <li key={i}>• {r}</li>
              ))}
            </ul>
          </section>

          <section>
            <div className="section-title">Pujas</div>
            <div style={{ display:"flex", gap:8, marginTop:8 }}>
              <input
                type="number"
                className="input"
                placeholder={`≥ ${minNext}`}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min={minNext}
                step={auction.minIncrement}
              />
              <button className="btn btn-primary" onClick={handleBid} disabled={!isActive}>
                Ofertar
              </button>
            </div>
            <div className="bids-list">
              {auction.bids.length === 0 && (
                <div className="bid-row"><span>No hay pujas aún.</span></div>
              )}
              {auction.bids.slice().reverse().map((b, i) => (
                <div key={i} className="bid-row">
                  <span>{b.bidder}</span>
                  <span>{fmtUSD(b.amount)}</span>
                </div>
              ))}
            </div>
          </section>

          {globalMsg.t && (
            <div className={`msg ${globalMsg.ok ? "ok" : "err"}`}>
              {globalMsg.t}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= 404 simple ================= */

function NotFound() {
  return (
    <div className="panel">
      <p>Página no encontrada.</p>
      <Link to="/" className="btn">Volver al inicio</Link>
    </div>
  );
}
