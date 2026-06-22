import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { FastifyInstance } from "fastify";
import { buildTestApp } from "../../test/app-test-helper.js";
import {
    clearTestDatabase,
    createTestAdmin,
    createTestAuditLog,
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

describe("Audit Log API", () => {
    it("should reject listing audit logs without token", async () => {
        const response = await app.inject({
            method: "GET",
            url: "/api/audit-logs",
        });

        expect(response.statusCode).toBe(401);

        const body = response.json();

        expect(body.message).toBe("Unauthorized");
    });

    it("should reject listing audit logs as client", async () => {
        const { token } = await loginAsClient();

        const response = await app.inject({
            method: "GET",
            url: "/api/audit-logs",
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(403);

        const body = response.json();

        expect(body.message).toBeDefined();
    });

    it("should list audit logs as admin", async () => {
        const { token, userId } = await loginAsAdmin();

        await createTestAuditLog(userId);

        const response = await app.inject({
            method: "GET",
            url: "/api/audit-logs",
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.data.items.length).toBeGreaterThanOrEqual(1);
        expect(body.data.pagination).toBeDefined();
        expect(body.data.pagination.page).toBe(1);
        expect(body.data.items[0].action).toBe("CREATE");
    });

    it("should get audit log by ID as admin", async () => {
        const { token, userId } = await loginAsAdmin();

        const auditLog = await createTestAuditLog(userId);

        const response = await app.inject({
            method: "GET",
            url: `/api/audit-logs/${auditLog.id}`,
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.data.id).toBe(auditLog.id);
        expect(body.data.action).toBe("CREATE");
        expect(body.data.resourceType).toBe("Property");
    });

    it("should reject invalid audit log ID", async () => {
        const { token } = await loginAsAdmin();

        const response = await app.inject({
            method: "GET",
            url: "/api/audit-logs/invalid-audit-log-id",
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(400);

        const body = response.json();

        expect(body.message).toBe("Validation error");
    });

    it("should return 404 for valid but non-existing audit log ID", async () => {
        const { token } = await loginAsAdmin();

        const response = await app.inject({
            method: "GET",
            url: "/api/audit-logs/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(404);

        const body = response.json();

        expect(body.message).toBeDefined();
    });
});