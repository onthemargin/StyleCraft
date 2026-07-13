import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Served at "/stylecraft/" in production (sub-app of app.gyatso.me); "/" for standalone dev.
// Deploy build sets VITE_BASE=/stylecraft/.
const base = process.env.VITE_BASE ?? "/";

// Client calls the API at `${base}api/...`; in dev, proxy that to the Express server on 3005.
export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@shared": "/src/shared" },
  },
  server: {
    port: 5173,
    proxy: {
      "/stylecraft/api": { target: "http://localhost:3005", changeOrigin: true },
      "/api": { target: "http://localhost:3005", changeOrigin: true },
    },
  },
});
