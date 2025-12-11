// src/server/server.js
import app from "./app.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { AuctionService } from "./services/auction.service.js";

const PORT = process.env.PORT || 8081;

// Servidor HTTP base (Express)
const httpServer = createServer(app);

// Servidor de WebSockets (Socket.io)
const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

// Conexión de clientes WebSocket (front de postores)
io.on("connection", (socket) => {
  console.log("🟢 Cliente conectado:", socket.id);

  // Enviar estado actual apenas se conecta
  socket.emit("state", AuctionService.getPublicState());

  // Registrar postor en una subasta
  socket.on("register", ({ auctionId, bidder }) => {
    try {
      AuctionService.registerBidder(auctionId, bidder);
      io.emit("state", AuctionService.getPublicState());
    } catch (err) {
      console.error("Error en register:", err);
      socket.emit("errorMsg", err.message || "Error al registrar");
    }
  });

  // Realizar una puja
  socket.on("bid", ({ auctionId, bidder, amount }) => {
    try {
      AuctionService.placeBid({ auctionId, bidder, amount });
      io.emit("state", AuctionService.getPublicState());
    } catch (err) {
      console.error("Error en bid:", err);
      socket.emit("errorMsg", err.message || "Error al pujar");
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Cliente desconectado:", socket.id);
  });
});

// Bucle de actualización (Deber 4 y Proyecto Final)
setInterval(() => {
  try {
    AuctionService.tick();
    const state = AuctionService.getPublicState();
    if (state.ready) {
      io.emit("state", state);
    }
  } catch (err) {
    console.error("Error en tick:", err);
  }
}, 1000);

// Levantar servidor
httpServer.listen(PORT, () => {
  console.log(`✅ Bidders-service con WebSockets escuchando en http://localhost:${PORT}`);
  console.log("   Recuerda llamar a AuctionService.initFromManager() (por /api/start) antes de subastar.");
});
