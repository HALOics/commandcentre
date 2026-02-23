import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { dbApiMiddleware } from "./server/dbApi";
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), "");
    // Ensure server middleware can validate MS tokens using env from .env.
    process.env.AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID || env.AZURE_CLIENT_ID || env.VITE_AZURE_CLIENT_ID;
    process.env.VITE_AZURE_CLIENT_ID = process.env.VITE_AZURE_CLIENT_ID || env.VITE_AZURE_CLIENT_ID;
    process.env.AZURE_SQL_CONNECTION_STRING =
        process.env.AZURE_SQL_CONNECTION_STRING || env.AZURE_SQL_CONNECTION_STRING;
    return {
        plugins: [
            react(),
            {
                name: "halo-db-api",
                configureServer: function (server) {
                    server.middlewares.use(dbApiMiddleware());
                }
            }
        ]
    };
});
