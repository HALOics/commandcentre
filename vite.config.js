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
    process.env.AUTH_TOTP_ENCRYPTION_KEY = process.env.AUTH_TOTP_ENCRYPTION_KEY || env.AUTH_TOTP_ENCRYPTION_KEY;
    process.env.SMTP_HOST = process.env.SMTP_HOST || env.SMTP_HOST;
    process.env.SMTP_PORT = process.env.SMTP_PORT || env.SMTP_PORT;
    process.env.SMTP_SECURE = process.env.SMTP_SECURE || env.SMTP_SECURE;
    process.env.SMTP_USER = process.env.SMTP_USER || env.SMTP_USER;
    process.env.SMTP_PASS = process.env.SMTP_PASS || env.SMTP_PASS;
    process.env.SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || env.SMTP_FROM_EMAIL;
    process.env.APP_BASE_URL = process.env.APP_BASE_URL || env.APP_BASE_URL || env.VITE_AZURE_REDIRECT_URI;
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
