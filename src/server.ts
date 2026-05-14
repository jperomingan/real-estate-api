import { buildApp } from "./app.js";
import { env } from "./config/env.js";

async function startServer() {
    const app = await buildApp();

    try {
        await app.listen({
            port: env.PORT,
            host: "0.0.0.0",
        });

        console.log(`Backend API is running at http://localhost:${env.PORT}`);
    } catch (error) {
        app.log.error(error);
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();