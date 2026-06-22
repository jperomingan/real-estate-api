import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { FastifyInstance } from "fastify";
import { buildTestApp } from "../../test/app-test-helper.js";
import {
    clearTestDatabase,
    createApprovedTestBroker,
    createTestClient,
    createTestProperty,
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

async function loginAsClient() {
    await createTestClient();

    const response = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: {
            email: "client@test.com",
            password: "ClientPassword123",
        },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();

    return body.data.token as string;
}

describe("Favorite API", () => {
    it("should reject listing favorites without token", async () => {
        const response = await app.inject({
            method: "GET",
            url: "/api/favorites",
        });

        expect(response.statusCode).toBe(401);

        const body = response.json();

        expect(body.message).toBe("Unauthorized");
    });

    it("should save property to favorites as client", async () => {
        const token = await loginAsClient();
        const broker = await createApprovedTestBroker();
        const property = await createTestProperty(broker.id);

        const response = await app.inject({
            method: "POST",
            url: `/api/favorites/${property.id}`,
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(201);

        const body = response.json();

        expect(body.data).toBeDefined();
        expect(body.data.property.id).toBe(property.id);
    });

    it("should list current user's favorites", async () => {
        const token = await loginAsClient();
        const broker = await createApprovedTestBroker();
        const property = await createTestProperty(broker.id);

        await app.inject({
            method: "POST",
            url: `/api/favorites/${property.id}`,
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        const response = await app.inject({
            method: "GET",
            url: "/api/favorites",
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.data.items.length).toBeGreaterThanOrEqual(1);
        expect(body.data.pagination).toBeDefined();
        expect(body.data.pagination.page).toBe(1);
    });

    it("should check favorite status", async () => {
        const token = await loginAsClient();
        const broker = await createApprovedTestBroker();
        const property = await createTestProperty(broker.id);

        await app.inject({
            method: "POST",
            url: `/api/favorites/${property.id}`,
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        const response = await app.inject({
            method: "GET",
            url: `/api/favorites/${property.id}/status`,
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.data.isFavorited).toBe(true);
    });

    it("should remove property from favorites", async () => {
        const token = await loginAsClient();
        const broker = await createApprovedTestBroker();
        const property = await createTestProperty(broker.id);

        await app.inject({
            method: "POST",
            url: `/api/favorites/${property.id}`,
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        const response = await app.inject({
            method: "DELETE",
            url: `/api/favorites/${property.id}`,
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.message).toBeDefined();
    });

    it("should return false favorite status after removing favorite", async () => {
        const token = await loginAsClient();
        const broker = await createApprovedTestBroker();
        const property = await createTestProperty(broker.id);

        await app.inject({
            method: "POST",
            url: `/api/favorites/${property.id}`,
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        await app.inject({
            method: "DELETE",
            url: `/api/favorites/${property.id}`,
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        const response = await app.inject({
            method: "GET",
            url: `/api/favorites/${property.id}/status`,
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.data.isFavorited).toBe(false);
    });

    it("should reject favorite with invalid property ID", async () => {
        const token = await loginAsClient();

        const response = await app.inject({
            method: "POST",
            url: "/api/favorites/invalid-property-id",
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(400);

        const body = response.json();

        expect(body.message).toBe("Validation error");
    });
});