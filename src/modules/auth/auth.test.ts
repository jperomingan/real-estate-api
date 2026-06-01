import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FastifyInstance } from "fastify";
import { buildTestApp } from "../../test/app-test-helper.js";

let app: FastifyInstance;

beforeAll(async () => {
    app = await buildTestApp();
});

afterAll(async () => {
    await app.close();
});

describe("Auth API", () => {
    it("should reject login with invalid email format", async () => {
        const response = await app.inject({
            method: "POST",
            url: "/api/auth/login",
            payload: {
                email: "invalid-email",
                password: "wrongpassword",
            },
        });

        expect(response.statusCode).toBe(400);

        const body = response.json();

        expect(body.success).toBe(false);
        expect(body.message).toBe("Validation error");
        expect(body.errors.email).toBeDefined();
    });

    it("should reject login with wrong credentials", async () => {
        const response = await app.inject({
            method: "POST",
            url: "/api/auth/login",
            payload: {
                email: "wrong@example.com",
                password: "wrongpassword",
            },
        });

        expect(response.statusCode).toBe(401);

        const body = response.json();

        expect(body.success).toBe(false);
    });
});