import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { FastifyInstance } from "fastify";
import { buildTestApp } from "../../test/app-test-helper.js";
import {
    clearTestDatabase,
    createTestClient,
    createTestNotification,
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

    return {
        token: body.data.token as string,
        userId: body.data.user.id as string,
    };
}

describe("Notification API", () => {
    it("should reject listing notifications without token", async () => {
        const response = await app.inject({
            method: "GET",
            url: "/api/notifications",
        });

        expect(response.statusCode).toBe(401);

        const body = response.json();

        expect(body.message).toBe("Unauthorized");
    });

    it("should list current user's notifications", async () => {
        const { token, userId } = await loginAsClient();

        await createTestNotification(userId);

        const response = await app.inject({
            method: "GET",
            url: "/api/notifications",
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.data.items.length).toBeGreaterThanOrEqual(1);
        expect(body.data.pagination).toBeDefined();
        expect(body.data.pagination.page).toBe(1);
        expect(body.data.items[0].title).toBe("Test Notification");
    });

    it("should get unread notification count", async () => {
        const { token, userId } = await loginAsClient();

        await createTestNotification(userId);

        const response = await app.inject({
            method: "GET",
            url: "/api/notifications/unread-count",
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.data.unreadCount).toBeGreaterThanOrEqual(1);
    });

    it("should mark notification as read", async () => {
        const { token, userId } = await loginAsClient();

        const notification = await createTestNotification(userId);

        const response = await app.inject({
            method: "PATCH",
            url: `/api/notifications/${notification.id}/read`,
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.data.id).toBe(notification.id);
        expect(body.data.isRead).toBe(true);
    });

    it("should mark all notifications as read", async () => {
        const { token, userId } = await loginAsClient();

        await createTestNotification(userId);
        await createTestNotification(userId);

        const response = await app.inject({
            method: "PATCH",
            url: "/api/notifications/read-all",
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const countResponse = await app.inject({
            method: "GET",
            url: "/api/notifications/unread-count",
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(countResponse.statusCode).toBe(200);

        const countBody = countResponse.json();

        expect(countBody.data.unreadCount).toBe(0);
    });

    it("should delete notification", async () => {
        const { token, userId } = await loginAsClient();

        const notification = await createTestNotification(userId);

        const response = await app.inject({
            method: "DELETE",
            url: `/api/notifications/${notification.id}`,
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const listResponse = await app.inject({
            method: "GET",
            url: "/api/notifications",
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(listResponse.statusCode).toBe(200);

        const listBody = listResponse.json();

        expect(listBody.data.items.length).toBe(0);
    });

    it("should reject invalid notification ID", async () => {
        const { token } = await loginAsClient();

        const response = await app.inject({
            method: "PATCH",
            url: "/api/notifications/invalid-notification-id/read",
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(400);

        const body = response.json();

        expect(body.message).toBe("Validation error");
    });
});