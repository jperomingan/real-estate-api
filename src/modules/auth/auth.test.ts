import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { FastifyInstance } from "fastify";
import { buildTestApp } from "../../test/app-test-helper.js";
import {
    clearTestDatabase,
    createTestAdmin,
} from "../../test/db-test-helper.js";

let app: FastifyInstance;

beforeAll(async () => {
    app = await buildTestApp();
});

beforeEach(async () => {
    await clearTestDatabase();
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
        await createTestAdmin();

        const response = await app.inject({
            method: "POST",
            url: "/api/auth/login",
            payload: {
                email: "admin@test.com",
                password: "wrongpassword",
            },
        });

        expect(response.statusCode).toBe(401);

        const body = response.json();

        expect(body.success).toBe(false);
    });

    it("should login admin with correct credentials", async () => {
        await createTestAdmin();

        const response = await app.inject({
            method: "POST",
            url: "/api/auth/login",
            payload: {
                email: "admin@test.com",
                password: "AdminPassword123",
            },
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.success).toBe(true);
        expect(body.message).toBe("Login successful");
        expect(body.data.user.email).toBe("admin@test.com");
        expect(body.data.user.role).toBe("ADMIN");
        expect(body.data.token).toBeDefined();
    });
});