import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        include: ["src/**/*.test.ts"],
        exclude: ["node_modules/**", "dist/**"],
        testTimeout: 30000,
        env: {
            NODE_ENV: "test",
            DATABASE_URL:
                process.env.DATABASE_URL ??
                "postgresql://jenn@localhost:5432/real_estate_test_db?schema=public",
            JWT_SECRET:
                process.env.JWT_SECRET ??
                "test_secret_must_be_at_least_32_characters_long",
            PORT: "4001",
            APP_URL: "http://localhost:4001",
            ALLOWED_ORIGINS: "http://localhost:4001",
        },
    },
});