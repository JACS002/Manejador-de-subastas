// src/client/src/socket.js
import { io } from "socket.io-client";

// Conecta al backend de postores (8081)
export const socket = io("http://localhost:8081", {
  transports: ["websocket"]
});
