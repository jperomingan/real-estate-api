import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { FastifyInstance } from "fastify";
import { buildTestApp } from "../../test/app-test-helper.js";
import {
    clearTestDatabase,
    createApprovedTestBroker,
    createClosedWonTestLead,
    createTestAdmin,
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

describe("Revenue API", () => {
    it("should reject revenue creation without token", async () => {
        const response = await app.inject({
            method: "POST",
            url: "/api/revenues",
            payload: {
                propertyId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
                grossSaleAmount: 3500000,
                commissionRate: 5,
                paymentReceived: 500000,
                paymentStatus: "PARTIAL",
                commissionStatus: "PENDING",
            },
        });

        expect(response.statusCode).toBe(401);

        const body = response.json();

        expect(body.message).toBe("Unauthorized");
    });

    it("should create revenue as admin", async () => {
        const token = await loginAsAdmin();
        const broker = await createApprovedTestBroker();
        const property = await createTestProperty(broker.id);
        const lead = await createClosedWonTestLead(broker.id, property.id);

        const response = await app.inject({
            method: "POST",
            url: "/api/revenues",
            headers: {
                authorization: `Bearer ${token}`,
            },
            payload: {
                propertyId: property.id,
                leadId: lead.id,
                grossSaleAmount: 3500000,
                commissionRate: 5,
                paymentReceived: 500000,
                paymentStatus: "PARTIAL",
                commissionStatus: "PENDING",
                notes: "Initial payment received.",
            },
        });

        expect(response.statusCode).toBe(201);

        const body = response.json();

        expect(body.message).toBe("Revenue record created successfully");
        expect(body.data.propertyId).toBe(property.id);
        expect(body.data.leadId).toBe(lead.id);
        expect(body.data.paymentStatus).toBe("PARTIAL");
        expect(body.data.commissionStatus).toBe("PENDING");
    });

    it("should reject revenue creation with invalid propertyId", async () => {
        const token = await loginAsAdmin();

        const response = await app.inject({
            method: "POST",
            url: "/api/revenues",
            headers: {
                authorization: `Bearer ${token}`,
            },
            payload: {
                propertyId: "invalid-property-id",
                grossSaleAmount: 3500000,
                commissionRate: 5,
            },
        });

        expect(response.statusCode).toBe(400);

        const body = response.json();

        expect(body.message).toBe("Validation error");
    });

    it("should list revenues as admin", async () => {
        const token = await loginAsAdmin();
        const broker = await createApprovedTestBroker();
        const property = await createTestProperty(broker.id);
        const lead = await createClosedWonTestLead(broker.id, property.id);

        await createTestRevenue(property.id, broker.id, lead.id);

        const response = await app.inject({
            method: "GET",
            url: "/api/revenues",
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

    it("should get revenue by ID as admin", async () => {
        const token = await loginAsAdmin();
        const broker = await createApprovedTestBroker();
        const property = await createTestProperty(broker.id);
        const lead = await createClosedWonTestLead(broker.id, property.id);
        const revenue = await createTestRevenue(property.id, broker.id, lead.id);

        const response = await app.inject({
            method: "GET",
            url: `/api/revenues/${revenue.id}`,
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.data.id).toBe(revenue.id);
        expect(body.data.propertyId).toBe(property.id);
    });

    it("should get revenue summary as admin", async () => {
        const token = await loginAsAdmin();
        const broker = await createApprovedTestBroker();
        const property = await createTestProperty(broker.id);
        const lead = await createClosedWonTestLead(broker.id, property.id);

        await createTestRevenue(property.id, broker.id, lead.id);

        const response = await app.inject({
            method: "GET",
            url: "/api/revenues/summary",
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.data).toBeDefined();
    });

    it("should update payment status as admin", async () => {
        const token = await loginAsAdmin();
        const broker = await createApprovedTestBroker();
        const property = await createTestProperty(broker.id);
        const lead = await createClosedWonTestLead(broker.id, property.id);
        const revenue = await createTestRevenue(property.id, broker.id, lead.id);

        const response = await app.inject({
            method: "PATCH",
            url: `/api/revenues/${revenue.id}/payment-status`,
            headers: {
                authorization: `Bearer ${token}`,
            },
            payload: {
                paymentStatus: "PAID",
                paymentReceived: 3500000,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.data.paymentStatus).toBe("PAID");
    });

    it("should update commission status as admin", async () => {
        const token = await loginAsAdmin();
        const broker = await createApprovedTestBroker();
        const property = await createTestProperty(broker.id);
        const lead = await createClosedWonTestLead(broker.id, property.id);
        const revenue = await createTestRevenue(property.id, broker.id, lead.id);

        const response = await app.inject({
            method: "PATCH",
            url: `/api/revenues/${revenue.id}/commission-status`,
            headers: {
                authorization: `Bearer ${token}`,
            },
            payload: {
                commissionStatus: "RELEASED",
            },
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.data.commissionStatus).toBe("RELEASED");
    });
});