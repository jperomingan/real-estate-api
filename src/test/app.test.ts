import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FastifyInstance } from "fastify";
import { buildTestApp } from "./app-test-helper.js";

let app: FastifyInstance;

beforeAll(async () => {
    app = await buildTestApp();
});

afterAll(async () => {
    await app.close();
});

describe("Health API", () => {
    it("should return health status", async () => {
        const response = await app.inject({
            method: "GET",
            url: "/health",
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.success).toBe(true);
        expect(body.message).toBe("Backend API is running");
        expect(body.data.status).toBe("ok");
        expect(body.data.service).toBe("real-estate-api");
    });
});