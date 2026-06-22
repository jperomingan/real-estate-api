import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { FastifyInstance } from "fastify";
import { buildTestApp } from "../../test/app-test-helper.js";
import {
    clearTestDatabase,
    createApprovedTestBroker,
    createTestAdmin,
    createTestProperty,
    createTestViewing,
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

describe("Viewing API", () => {
    it("should create viewing request with propertyId", async () => {
        const broker = await createApprovedTestBroker();
        const property = await createTestProperty(broker.id);

        const response = await app.inject({
            method: "POST",
            url: "/api/viewings",
            payload: {
                propertyId: property.id,
                firstName: "Maria",
                lastName: "Santos",
                email: "maria@test.com",
                phone: "09123456789",
                message: "I want to view this property.",
                preferredDate: "2026-07-01T10:00:00.000Z",
            },
        });

        expect(response.statusCode).toBe(201);

        const body = response.json();

        expect(body.data.firstName).toBe("Maria");
        expect(body.data.propertyId).toBe(property.id);
        expect(body.data.brokerId).toBe(broker.id);
        expect(body.data.status).toBe("REQUESTED");
    });

    it("should reject viewing request with invalid propertyId", async () => {
        const response = await app.inject({
            method: "POST",
            url: "/api/viewings",
            payload: {
                propertyId: "invalid-property-id",
                firstName: "Maria",
                phone: "09123456789",
                preferredDate: "2026-07-01T10:00:00.000Z",
            },
        });

        expect(response.statusCode).toBe(400);

        const body = response.json();

        expect(body.message).toBe("Validation error");
    });

    it("should reject viewing request when property is not found", async () => {
        const response = await app.inject({
            method: "POST",
            url: "/api/viewings",
            payload: {
                propertyId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
                firstName: "Maria",
                phone: "09123456789",
                preferredDate: "2026-07-01T10:00:00.000Z",
            },
        });

        expect(response.statusCode).toBe(400);

        const body = response.json();

        expect(body.message).toBe("Property not found.");
    });

    it("should reject listing viewings without token", async () => {
        const response = await app.inject({
            method: "GET",
            url: "/api/viewings",
        });

        expect(response.statusCode).toBe(401);

        const body = response.json();

        expect(body.message).toBe("Unauthorized");
    });

    it("should list viewings as admin", async () => {
        const token = await loginAsAdmin();
        const broker = await createApprovedTestBroker();
        const property = await createTestProperty(broker.id);

        await createTestViewing(property.id, broker.id);

        const response = await app.inject({
            method: "GET",
            url: "/api/viewings",
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

    it("should get viewing by ID as admin", async () => {
        const token = await loginAsAdmin();
        const broker = await createApprovedTestBroker();
        const property = await createTestProperty(broker.id);
        const viewing = await createTestViewing(property.id, broker.id);

        const response = await app.inject({
            method: "GET",
            url: `/api/viewings/${viewing.id}`,
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.data.id).toBe(viewing.id);
        expect(body.data.firstName).toBe("Maria");
    });

    it("should update viewing status as admin", async () => {
        const token = await loginAsAdmin();
        const broker = await createApprovedTestBroker();
        const property = await createTestProperty(broker.id);
        const viewing = await createTestViewing(property.id, broker.id);

        const response = await app.inject({
            method: "PATCH",
            url: `/api/viewings/${viewing.id}/status`,
            headers: {
                authorization: `Bearer ${token}`,
            },
            payload: {
                status: "CONFIRMED",
                notes: "Viewing confirmed.",
            },
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.data.status).toBe("CONFIRMED");
    });

    it("should reschedule viewing as admin", async () => {
        const token = await loginAsAdmin();
        const broker = await createApprovedTestBroker();
        const property = await createTestProperty(broker.id);
        const viewing = await createTestViewing(property.id, broker.id);

        const response = await app.inject({
            method: "PATCH",
            url: `/api/viewings/${viewing.id}/reschedule`,
            headers: {
                authorization: `Bearer ${token}`,
            },
            payload: {
                confirmedDate: "2026-07-02T14:00:00.000Z",
                notes: "Client requested afternoon schedule.",
            },
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.data.status).toBe("RESCHEDULED");
        expect(body.data.confirmedDate).toBeDefined();
    });
});