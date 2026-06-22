import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";

let app: FastifyInstance;

beforeAll(async () => {
    app = await buildApp();

    app.get("/test-error", async () => {
        throw new Error("Test internal error");
    });

    await app.ready();
});

afterAll(async () => {
    await app.close();
});

describe("Error Handler", () => {
    it("should return structured error response", async () => {
        const response = await app.inject({
            method: "GET",
            url: "/test-error",
        });

        expect(response.statusCode).toBe(500);

        const body = response.json();

        expect(body.success).toBe(false);
        expect(body.message).toBeDefined();
        expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
        expect(body.error.statusCode).toBe(500);
        expect(body.error.requestId).toBeDefined();
    });

    it("should include provided request id in error response", async () => {
        const requestId = "test-error-request-id-123";

        const response = await app.inject({
            method: "GET",
            url: "/test-error",
            headers: {
                "x-request-id": requestId,
            },
        });

        expect(response.statusCode).toBe(500);

        const body = response.json();

        expect(body.error.requestId).toBe(requestId);
    });
});
