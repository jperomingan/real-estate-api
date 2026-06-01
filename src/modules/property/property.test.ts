import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { FastifyInstance } from "fastify";
import { buildTestApp } from "../../test/app-test-helper.js";
import {
    clearTestDatabase,
    createApprovedTestBroker,
    createTestAdmin,
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

describe("Property API", () => {
    it("should reject property creation without token", async () => {
        const response = await app.inject({
            method: "POST",
            url: "/api/properties",
            payload: {
                title: "Unauthorized Property",
                type: "HOUSE_AND_LOT",
                status: "PUBLISHED",
                price: 3500000,
                address: "Test Address",
                city: "Cebu City",
                province: "Cebu",
            },
        });

        expect(response.statusCode).toBe(401);

        const body = response.json();

        expect(body.message).toBe("Unauthorized");
    });

    it("should create property as admin", async () => {
        const token = await loginAsAdmin();
        const broker = await createApprovedTestBroker();

        const response = await app.inject({
            method: "POST",
            url: "/api/properties",
            headers: {
                authorization: `Bearer ${token}`,
            },
            payload: {
                title: "Affordable House and Lot in Cebu",
                description: "Good for starting family.",
                type: "HOUSE_AND_LOT",
                status: "PUBLISHED",
                price: 3500000,
                lotAreaSqm: 120,
                floorAreaSqm: 80,
                bedrooms: 3,
                bathrooms: 2,
                address: "Test Address",
                barangay: "Test Barangay",
                city: "Cebu City",
                province: "Cebu",
                zipCode: "6000",
                brokerId: broker.id,
            },
        });

        expect(response.statusCode).toBe(201);

        const body = response.json();

        expect(body.message).toBe("Property created successfully");
        expect(body.data.title).toBe("Affordable House and Lot in Cebu");
        expect(body.data.city).toBe("Cebu City");
        expect(body.data.province).toBe("Cebu");
    });

    it("should list properties", async () => {
        const broker = await createApprovedTestBroker();

        await createTestProperty(broker.id);

        const response = await app.inject({
            method: "GET",
            url: "/api/properties",
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.data.items.length).toBeGreaterThanOrEqual(1);
        expect(body.data.pagination).toBeDefined();
        expect(body.data.pagination.page).toBe(1);
        expect(body.data.pagination.hasNextPage).toBeDefined();
        expect(body.data.pagination.hasPreviousPage).toBeDefined();
    });

    it("should get property by ID", async () => {
        const broker = await createApprovedTestBroker();
        const property = await createTestProperty(broker.id);

        const response = await app.inject({
            method: "GET",
            url: `/api/properties/${property.id}`,
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.data.id).toBe(property.id);
        expect(body.data.title).toBe("Test House and Lot");
    });

    it("should return 400 for invalid property ID", async () => {
        const response = await app.inject({
            method: "GET",
            url: "/api/properties/11111111-1111-1111-1111-111111111111",
        });

        expect(response.statusCode).toBe(400);

        const body = response.json();

        expect(body.message).toBe("Validation error");
    });

    it("should return 404 for valid but non-existing property ID", async () => {
        const response = await app.inject({
            method: "GET",
            url: "/api/properties/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        });

        expect(response.statusCode).toBe(404);

        const body = response.json();

        expect(body.message).toBe("Property not found");
    });
});