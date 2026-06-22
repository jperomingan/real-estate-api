import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { FastifyInstance } from "fastify";
import { buildTestApp } from "../../test/app-test-helper.js";
import {
    clearTestDatabase,
    createApprovedTestBroker,
    createClosedWonTestLead,
    createTestAdmin,
    createTestLead,
    createTestProperty,
    createTestRevenue,
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

    return body.data.token as string;
}

async function seedDashboardData() {
    const broker = await createApprovedTestBroker();
    const property = await createTestProperty(broker.id);

    await createTestLead(broker.id, property.id);

    const closedWonLead = await createClosedWonTestLead(broker.id, property.id);

    await createTestRevenue(property.id, broker.id, closedWonLead.id);

    return {
        broker,
        property,
        closedWonLead,
    };
}

describe("Dashboard API", () => {
    it("should reject dashboard summary without token", async () => {
        const response = await app.inject({
            method: "GET",
            url: "/api/dashboard/summary",
        });

        expect(response.statusCode).toBe(401);

        const body = response.json();

        expect(body.message).toBe("Unauthorized");
    });

    it("should get dashboard summary as admin", async () => {
        const token = await loginAsAdmin();

        await seedDashboardData();

        const response = await app.inject({
            method: "GET",
            url: "/api/dashboard/summary",
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.data).toBeDefined();
        expect(body.data.totalProperties).toBeGreaterThanOrEqual(1);
        expect(body.data.totalLeads).toBeGreaterThanOrEqual(1);
        expect(body.data.totalRevenueRecords).toBeGreaterThanOrEqual(1);
    });

    it("should get monthly revenue as admin", async () => {
        const token = await loginAsAdmin();

        await seedDashboardData();

        const response = await app.inject({
            method: "GET",
            url: "/api/dashboard/monthly-revenue",
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(Array.isArray(body.data)).toBe(true);
    });

    it("should get lead conversion statistics as admin", async () => {
        const token = await loginAsAdmin();

        await seedDashboardData();

        const response = await app.inject({
            method: "GET",
            url: "/api/dashboard/lead-conversion",
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(Array.isArray(body.data)).toBe(true);
        expect(body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should get property statistics as admin", async () => {
        const token = await loginAsAdmin();

        await seedDashboardData();

        const response = await app.inject({
            method: "GET",
            url: "/api/dashboard/property-stats",
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.data).toBeDefined();
        expect(body.data.total).toBeGreaterThanOrEqual(1);
        expect(Array.isArray(body.data.byStatus)).toBe(true);
        expect(Array.isArray(body.data.byType)).toBe(true);
    });

    it("should get broker performance as admin", async () => {
        const token = await loginAsAdmin();

        await seedDashboardData();

        const response = await app.inject({
            method: "GET",
            url: "/api/dashboard/broker-performance",
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(Array.isArray(body.data)).toBe(true);
    });
});