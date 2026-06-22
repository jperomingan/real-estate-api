import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { FastifyInstance } from "fastify";
import { buildTestApp } from "../../test/app-test-helper.js";
import {
    clearTestDatabase,
    createInactiveTestClient,
    createPendingTestBroker,
    createTestAdmin,
    createTestClient,
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

async function loginAsAdmin() {
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

    return {
        token: body.data.token as string,
        userId: body.data.user.id as string,
    };
}

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

    return {
        token: body.data.token as string,
        userId: body.data.user.id as string,
    };
}

describe("Admin API", () => {
    it("should reject listing users without token", async () => {
        const response = await app.inject({
            method: "GET",
            url: "/api/admin/users",
        });

        expect(response.statusCode).toBe(401);

        const body = response.json();

        expect(body.message).toBe("Unauthorized");
    });

    it("should reject listing users as client", async () => {
        const { token } = await loginAsClient();

        const response = await app.inject({
            method: "GET",
            url: "/api/admin/users",
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(403);

        const body = response.json();

        expect(body.message).toBeDefined();
    });

    it("should list users as admin", async () => {
        const { token } = await loginAsAdmin();

        await createPendingTestBroker();
        await createInactiveTestClient();

        const response = await app.inject({
            method: "GET",
            url: "/api/admin/users",
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.data.items.length).toBeGreaterThanOrEqual(2);
        expect(body.data.pagination).toBeDefined();
        expect(body.data.pagination.page).toBe(1);
    });

    it("should get user by ID as admin", async () => {
        const { token } = await loginAsAdmin();

        const user = await createPendingTestBroker();

        const response = await app.inject({
            method: "GET",
            url: `/api/admin/users/${user.id}`,
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.data.id).toBe(user.id);
        expect(body.data.email).toBe("pending.broker@test.com");
    });

    it("should approve user as admin", async () => {
        const { token } = await loginAsAdmin();

        const user = await createPendingTestBroker();

        const response = await app.inject({
            method: "PATCH",
            url: `/api/admin/users/${user.id}/approve`,
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.data.id).toBe(user.id);
        expect(body.data.status).toBe("APPROVED");
    });

    it("should reject user as admin", async () => {
        const { token } = await loginAsAdmin();

        const user = await createPendingTestBroker();

        const response = await app.inject({
            method: "PATCH",
            url: `/api/admin/users/${user.id}/reject`,
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.data.id).toBe(user.id);
        expect(body.data.status).toBe("REJECTED");
    });

    it("should update user status as admin", async () => {
        const { token } = await loginAsAdmin();

        const user = await createInactiveTestClient();

        const response = await app.inject({
            method: "PATCH",
            url: `/api/admin/users/${user.id}/status`,
            headers: {
                authorization: `Bearer ${token}`,
            },
            payload: {
                status: "ACTIVE",
            },
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.data.id).toBe(user.id);
        expect(body.data.status).toBe("ACTIVE");
    });

    it("should reject invalid user ID", async () => {
        const { token } = await loginAsAdmin();

        const response = await app.inject({
            method: "GET",
            url: "/api/admin/users/invalid-user-id",
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(400);

        const body = response.json();

        expect(body.message).toBe("Validation error");
    });

    it("should return 404 for valid but non-existing user ID", async () => {
        const { token } = await loginAsAdmin();

        const response = await app.inject({
            method: "GET",
            url: "/api/admin/users/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(404);

        const body = response.json();

        expect(body.message).toBeDefined();
    });

    it("should delete user as admin", async () => {
        const { token } = await loginAsAdmin();

        const user = await createInactiveTestClient();

        const response = await app.inject({
            method: "DELETE",
            url: `/api/admin/users/${user.id}`,
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.message).toBeDefined();
    });
});