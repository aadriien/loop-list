import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/loop-list/",
  plugins: [react()],
  // `make backend` runs a local PocketBase here
  server: { proxy: { "/api": "http://127.0.0.1:8090" } },
});
