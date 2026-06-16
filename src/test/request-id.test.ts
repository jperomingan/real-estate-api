import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "./app-test-helper.js";

let app: FastifyInstance;

beforeAll(async () => {
    app = await buildTestApp();
});

afterAll(async () => {
    await app.close();
});

describe("Request ID", () => {
    it("should return x-request-id header", async () => {
        const response = await app.inject({
            method: "GET",
            url: "/health",
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers["x-request-id"]).toBeDefined();
    });

    it("should reuse provided x-request-id header", async () => {
        const requestId = "test-request-id-123";

        const response = await app.inject({
            method: "GET",
            url: "/health",
            headers: {
                "x-request-id": requestId,
            },
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers["x-request-id"]).toBe(requestId);
    });
});