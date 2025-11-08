import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,                 // distinto al manager
    proxy: { "/api": "http://localhost:8081" }
  },
  build: {
    outDir: "../../dist/client",
    emptyOutDir: true
  }
});
