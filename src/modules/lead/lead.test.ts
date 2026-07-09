import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { FastifyInstance } from "fastify";
import { buildTestApp } from "../../test/app-test-helper.js";
import {
  clearTestDatabase,
  createApprovedTestBroker,
  createTestAdmin,
  createTestLead,
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

describe("Lead API", () => {
  it("should create lead with brokerId", async () => {
    const broker = await createApprovedTestBroker();

    const response = await app.inject({
      method: "POST",
      url: "/api/leads",
      payload: {
        firstName: "Maria",
        lastName: "Santos",
        email: "maria@test.com",
        phone: "09123456789",
        message: "I am interested in your property.",
        source: "WEBSITE",
        budget: 3500000,
        brokerId: broker.id,
      },
    });

    expect(response.statusCode).toBe(201);

    const body = response.json();

    expect(body.message).toBe("Lead created successfully");
    expect(body.data.firstName).toBe("Maria");
    expect(body.data.email).toBe("maria@test.com");
    expect(body.data.brokerId).toBe(broker.id);
  });

  it("should create lead with propertyId", async () => {
    const broker = await createApprovedTestBroker();
    const property = await createTestProperty(broker.id);

    const response = await app.inject({
      method: "POST",
      url: "/api/leads",
      payload: {
        firstName: "Maria",
        lastName: "Santos",
        email: "maria@test.com",
        phone: "09123456789",
        message: "I am interested in this property.",
        source: "WEBSITE",
        budget: 3500000,
        propertyId: property.id,
      },
    });

    expect(response.statusCode).toBe(201);

    const body = response.json();

    expect(body.message).toBe("Lead created successfully");
    expect(body.data.propertyId).toBe(property.id);
    expect(body.data.brokerId).toBe(broker.id);
  });

  it("should reject lead creation with invalid propertyId", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/leads",
      payload: {
        firstName: "Maria",
        phone: "09123456789",
        propertyId: "invalid-property-id",
      },
    });

    expect(response.statusCode).toBe(400);

    const body = response.json();

    expect(body.message).toBe("Validation error");
  });

  it("should reject lead creation when property is not found", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/leads",
      payload: {
        firstName: "Maria",
        phone: "09123456789",
        propertyId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      },
    });

    expect(response.statusCode).toBe(400);

    const body = response.json();

    expect(body.message).toBe("Property not found.");
  });

  it("should reject listing leads without token", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/leads",
    });

    expect(response.statusCode).toBe(401);

    const body = response.json();

    expect(body.message).toBe("Unauthorized");
  });

  it("should list leads as admin", async () => {
    const token = await loginAsAdmin();
    const broker = await createApprovedTestBroker();

    await createTestLead(broker.id);

    const response = await app.inject({
      method: "GET",
      url: "/api/leads",
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

  it("should get lead by ID as admin", async () => {
    const token = await loginAsAdmin();
    const broker = await createApprovedTestBroker();

    const lead = await createTestLead(broker.id);

    const response = await app.inject({
      method: "GET",
      url: `/api/leads/${lead.id}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();

    expect(body.data.id).toBe(lead.id);
    expect(body.data.firstName).toBe("Maria");
  });

  it("should update lead status as admin", async () => {
    const token = await loginAsAdmin();
    const broker = await createApprovedTestBroker();

    const lead = await createTestLead(broker.id);

    const response = await app.inject({
      method: "PATCH",
      url: `/api/leads/${lead.id}/status`,
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        status: "CONTACTED",
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();

    expect(body.message).toBe("Lead status updated successfully");
    expect(body.data.status).toBe("CONTACTED");
  });
});
