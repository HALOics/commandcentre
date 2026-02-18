import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { dbApiMiddleware } from "./server/dbApi";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "halo-db-api",
      configureServer(server) {
        server.middlewares.use(dbApiMiddleware());
      }
    }
  ]
});
