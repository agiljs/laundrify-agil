import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Port 5174 supaya tidak bentrok dengan web admin (frontend) di 5173.
// host: true -> bisa dibuka dari HP lewat IP laptop (mis. http://192.168.1.10:5174).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5174, host: true },
  preview: { port: 5174, host: true },
});
