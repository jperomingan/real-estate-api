import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

import type { FastifyInstance } from "fastify";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../../lib/prisma.js";

import { buildTestApp } from "../../test/app-test-helper.js";

type ApiResponse<T> = {
  success?: boolean;
  message: string;
  data: T;
};

type LoginData = {
  user: {
    id: string;
    email: string;
    role: string;
    status: string;
  };
  token: string;
};

type StatusCount = {
  status: string;
  count: number;
};

type DashboardSummary = {
  role: string;
  scope: string;

  filters: {
    dateFrom: string | null;
    dateTo: string | null;
    recentLimit: number;
  };

  properties: {
    total: number;
    byStatus: StatusCount[];
  };

  leads: {
    total: number;
    byStatus: StatusCount[];
  };

  viewings: {
    total: number;
    byStatus: StatusCount[];
  };

  revenue: {
    totalRecords: number;
    totalGrossSales: number;
    totalCommission: number;
    totalPaymentReceived: number;
    totalReceivable: number;
    byPaymentStatus: StatusCount[];
    byCommissionStatus: StatusCount[];
  };

  recent: {
    properties: Array<{
      id: string;
      broker: {
        id: string;
      };
    }>;

    leads: Array<{
      id: string;
      broker: {
        id: string;
      };
    }>;

    viewings: Array<{
      id: string;
      broker: {
        id: string;
      };
    }>;

    revenues: Array<{
      id: string;
      broker: {
        id: string;
      };
    }>;
  };
};

const phoneSeed = String(Date.now() % 1_000_000).padStart(6, "0");
let phoneCounter = 0;

function uniquePhone() {
  phoneCounter += 1;

  return `09${phoneSeed}${String(phoneCounter).padStart(3, "0")}`;
}

type DashboardTestUserRole = "ADMIN" | "BROKER" | "CLIENT";

async function createDashboardTestUser({
  firstName,
  lastName,
  email,
  passwordHash,
  role,
}: {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: DashboardTestUserRole;
}) {
  try {
    return await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        role,
        status: "ACTIVE",
        phone: uniquePhone(),
      },
      select: {
        id: true,
      },
    });
  } catch (error) {
    console.error("Failed creating dashboard test user:", {
      firstName,
      lastName,
      email,
      role,
      code: (error as { code?: string }).code,
      meta: (error as { meta?: unknown }).meta,
    });

    throw error;
  }
}

describe("Dashboard API", () => {
  let app: FastifyInstance | undefined;

  let adminId: string | undefined;

  let brokerAId: string | undefined;

  let brokerBId: string | undefined;

  let clientId: string | undefined;

  let propertyAId: string | undefined;

  let propertyBId: string | undefined;

  let adminToken = "";
  let brokerAToken = "";
  let brokerBToken = "";
  let clientToken = "";

  const password = "DashboardPassword123";

  const adminEmail = `dashboard-admin-${randomUUID()}@example.com`;

  const brokerAEmail = `dashboard-broker-a-${randomUUID()}@example.com`;

  const brokerBEmail = `dashboard-broker-b-${randomUUID()}@example.com`;

  const clientEmail = `dashboard-client-${randomUUID()}@example.com`;

  function getTestApp(): FastifyInstance {
    if (!app) {
      throw new Error("Test application has not been initialized.");
    }

    return app;
  }

  function dateDaysAgo(daysAgo = 1): Date {
    const date = new Date();

    date.setUTCDate(date.getUTCDate() - daysAgo);

    return date;
  }

  function dateDaysFromNow(daysFromNow = 7): Date {
    const date = new Date();

    date.setUTCDate(date.getUTCDate() + daysFromNow);

    return date;
  }

  async function login(email: string): Promise<string> {
    const response = await getTestApp().inject({
      method: "POST",
      url: "/api/auth/login",

      payload: {
        email,
        password,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as ApiResponse<LoginData>;

    return body.data.token;
  }

  async function createProperty({
    brokerId,
    title,
    status = "PUBLISHED",
    price = 3_000_000,
  }: {
    brokerId: string;
    title: string;
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    price?: number;
  }) {
    return prisma.property.create({
      data: {
        title,
        description: "Dashboard integration test property.",
        type: "HOUSE_AND_LOT",
        status,
        price,
        lotAreaSqm: 120,
        floorAreaSqm: 90,
        bedrooms: 3,
        bathrooms: 2,
        address: "Dashboard Street",
        barangay: "Lahug",
        city: "Cebu City",
        province: "Cebu",
        zipCode: "6000",
        brokerId,
      },

      select: {
        id: true,
      },
    });
  }

  async function createLead({
    brokerId,
    propertyId,
    status = "NEW",
    source = "WEBSITE",
  }: {
    brokerId: string;
    propertyId: string;
    status: "NEW" | "CONTACTED" | "QUALIFIED" | "CLOSED_WON";
    source: "WEBSITE" | "REFERRAL" | "SOCIAL_MEDIA" | "WALK_IN" | "OTHER";
  }) {
    return prisma.lead.create({
      data: {
        firstName: "Dashboard",
        lastName: "Lead",
        email: `dashboard-lead-${randomUUID()}@example.com`,
        phone: "09171230000",
        source,
        status,
        budget: 3_500_000,
        message: "Dashboard test lead.",
        propertyId,
        brokerId,
      },

      select: {
        id: true,
      },
    });
  }

  async function createViewing({
    brokerId,
    propertyId,
    status = "REQUESTED",
  }: {
    brokerId: string;
    propertyId: string;
    status:
    | "REQUESTED"
    | "CONFIRMED"
    | "RESCHEDULED"
    | "COMPLETED"
    | "CANCELLED"
    | "DECLINED";
  }) {
    return prisma.viewingAppointment.create({
      data: {
        firstName: "Dashboard",
        lastName: "Viewer",
        email: `dashboard-viewing-${randomUUID()}@example.com`,
        phone: "09179990000",
        message: "Dashboard test viewing.",
        preferredDate: dateDaysFromNow(10),
        confirmedDate: status === "CONFIRMED" ? dateDaysFromNow(11) : undefined,
        status,
        propertyId,
        brokerId,
      },

      select: {
        id: true,
      },
    });
  }

  async function createRevenue({
    brokerId,
    propertyId,
    grossSaleAmount,
    commissionRate,
    paymentReceived,
  }: {
    brokerId: string;
    propertyId: string;
    grossSaleAmount: number;
    commissionRate: number;
    paymentReceived: number;
  }) {
    const commissionAmount = grossSaleAmount * (commissionRate / 100);

    const paymentStatus =
      paymentReceived <= 0
        ? "UNPAID"
        : paymentReceived >= grossSaleAmount
          ? "PAID"
          : "PARTIAL";

    return prisma.revenue.create({
      data: {
        propertyId,
        brokerId,
        grossSaleAmount,
        commissionRate,
        commissionAmount,
        paymentReceived,
        paymentStatus,
        commissionStatus: "PENDING",
        saleDate: dateDaysAgo(1),
        notes: "Dashboard test revenue.",
      },

      select: {
        id: true,
      },
    });
  }

  beforeAll(async () => {
    app = await buildTestApp();

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await createDashboardTestUser({
      firstName: "Dashboard",
      lastName: "Admin",
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
    });

    const brokerA = await createDashboardTestUser({
      firstName: "Dashboard",
      lastName: "Broker A",
      email: brokerAEmail,
      passwordHash,
      role: "BROKER",
    });

    const brokerB = await createDashboardTestUser({
      firstName: "Dashboard",
      lastName: "Broker B",
      email: brokerBEmail,
      passwordHash,
      role: "BROKER",
    });

    const client = await createDashboardTestUser({
      firstName: "Dashboard",
      lastName: "Client",
      email: clientEmail,
      passwordHash,
      role: "CLIENT",
    });

    adminId = admin.id;
    brokerAId = brokerA.id;
    brokerBId = brokerB.id;
    clientId = client.id;

    const propertyA = await createProperty({
      brokerId: brokerA.id,
      title: `Dashboard Property A ${randomUUID()}`,
      status: "PUBLISHED",
      price: 5_000_000,
    });

    const propertyB = await createProperty({
      brokerId: brokerB.id,
      title: `Dashboard Property B ${randomUUID()}`,
      status: "PUBLISHED",
      price: 4_000_000,
    });

    propertyAId = propertyA.id;
    propertyBId = propertyB.id;

    await createProperty({
      brokerId: brokerA.id,
      title: `Dashboard Draft Property ${randomUUID()}`,
      status: "DRAFT",
      price: 2_000_000,
    });

    await createLead({
      brokerId: brokerA.id,
      propertyId: propertyA.id,
      status: "NEW",
      source: "WEBSITE",
    });

    await createLead({
      brokerId: brokerA.id,
      propertyId: propertyA.id,
      status: "CLOSED_WON",
      source: "REFERRAL",
    });

    await createLead({
      brokerId: brokerB.id,
      propertyId: propertyB.id,
      status: "QUALIFIED",
      source: "SOCIAL_MEDIA",
    });

    await createViewing({
      brokerId: brokerA.id,
      propertyId: propertyA.id,
      status: "REQUESTED",
    });

    await createViewing({
      brokerId: brokerA.id,
      propertyId: propertyA.id,
      status: "CONFIRMED",
    });

    await createViewing({
      brokerId: brokerB.id,
      propertyId: propertyB.id,
      status: "REQUESTED",
    });

    await createRevenue({
      brokerId: brokerA.id,
      propertyId: propertyA.id,
      grossSaleAmount: 5_000_000,
      commissionRate: 5,
      paymentReceived: 1_000_000,
    });

    await createRevenue({
      brokerId: brokerB.id,
      propertyId: propertyB.id,
      grossSaleAmount: 4_000_000,
      commissionRate: 5,
      paymentReceived: 4_000_000,
    });

    adminToken = await login(adminEmail);

    brokerAToken = await login(brokerAEmail);

    brokerBToken = await login(brokerBEmail);

    clientToken = await login(clientEmail);
  }, 30_000);

  afterAll(async () => {
    try {
      const userIds = [adminId, brokerAId, brokerBId, clientId].filter(
        (id): id is string => Boolean(id),
      );

      const propertyIds = [propertyAId, propertyBId].filter(
        (id): id is string => Boolean(id),
      );

      if (propertyIds.length > 0) {
        await prisma.revenue.deleteMany({
          where: {
            propertyId: {
              in: propertyIds,
            },
          },
        });

        await prisma.viewingAppointment.deleteMany({
          where: {
            propertyId: {
              in: propertyIds,
            },
          },
        });

        await prisma.lead.deleteMany({
          where: {
            propertyId: {
              in: propertyIds,
            },
          },
        });
      }

      if (userIds.length > 0) {
        await prisma.property.deleteMany({
          where: {
            brokerId: {
              in: userIds,
            },
          },
        });

        await prisma.user.deleteMany({
          where: {
            id: {
              in: userIds,
            },
          },
        });
      }
    } finally {
      if (app) {
        await app.close();
      }
    }
  });

  it("should reject dashboard summary without token", async () => {
    const response = await getTestApp().inject({
      method: "GET",
      url: "/api/dashboard/summary",
    });

    expect(response.statusCode).toBe(401);
  });

  it("should reject dashboard summary for client", async () => {
    const response = await getTestApp().inject({
      method: "GET",
      url: "/api/dashboard/summary",

      headers: {
        authorization: `Bearer ${clientToken}`,
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it("should return global dashboard summary for admin", async () => {
    const response = await getTestApp().inject({
      method: "GET",
      url: "/api/dashboard/summary",

      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as ApiResponse<DashboardSummary>;

    expect(body.data.scope).toBe("GLOBAL");

    expect(body.data.properties.total).toBeGreaterThanOrEqual(3);

    expect(body.data.leads.total).toBeGreaterThanOrEqual(3);

    expect(body.data.viewings.total).toBeGreaterThanOrEqual(3);

    expect(body.data.revenue.totalRecords).toBeGreaterThanOrEqual(2);

    expect(body.data.revenue.totalGrossSales).toBeGreaterThanOrEqual(9_000_000);
  });

  it("should return broker-scoped dashboard summary", async () => {
    const response = await getTestApp().inject({
      method: "GET",
      url: "/api/dashboard/summary",

      headers: {
        authorization: `Bearer ${brokerAToken}`,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as ApiResponse<DashboardSummary>;

    expect(body.data.scope).toBe("BROKER");

    expect(body.data.properties.total).toBeGreaterThanOrEqual(2);

    expect(body.data.revenue.totalGrossSales).toBeLessThan(9_000_000);

    expect(
      body.data.recent.properties.every(
        (property) => property.broker.id === brokerAId,
      ),
    ).toBe(true);

    expect(
      body.data.recent.leads.every((lead) => lead.broker.id === brokerAId),
    ).toBe(true);

    expect(
      body.data.recent.viewings.every(
        (viewing) => viewing.broker.id === brokerAId,
      ),
    ).toBe(true);

    expect(
      body.data.recent.revenues.every(
        (revenue) => revenue.broker.id === brokerAId,
      ),
    ).toBe(true);
  });

  it("should return broker B own dashboard data", async () => {
    const response = await getTestApp().inject({
      method: "GET",
      url: "/api/dashboard/summary",

      headers: {
        authorization: `Bearer ${brokerBToken}`,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as ApiResponse<DashboardSummary>;

    expect(body.data.scope).toBe("BROKER");

    expect(
      body.data.recent.properties.every(
        (property) => property.broker.id === brokerBId,
      ),
    ).toBe(true);
  });

  it("should include grouped status counts", async () => {
    const response = await getTestApp().inject({
      method: "GET",
      url: "/api/dashboard/summary",

      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as ApiResponse<DashboardSummary>;

    expect(body.data.properties.byStatus.length).toBeGreaterThan(0);

    expect(body.data.leads.byStatus.length).toBeGreaterThan(0);

    expect(body.data.viewings.byStatus.length).toBeGreaterThan(0);

    expect(body.data.revenue.byPaymentStatus.length).toBeGreaterThan(0);

    expect(body.data.revenue.byCommissionStatus.length).toBeGreaterThan(0);
  });

  it("should respect recentLimit query", async () => {
    const response = await getTestApp().inject({
      method: "GET",
      url: "/api/dashboard/summary?recentLimit=1",

      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as ApiResponse<DashboardSummary>;

    expect(body.data.filters.recentLimit).toBe(1);

    expect(body.data.recent.properties.length).toBeLessThanOrEqual(1);

    expect(body.data.recent.leads.length).toBeLessThanOrEqual(1);

    expect(body.data.recent.viewings.length).toBeLessThanOrEqual(1);

    expect(body.data.recent.revenues.length).toBeLessThanOrEqual(1);
  });

  it("should reject invalid recentLimit query", async () => {
    const response = await getTestApp().inject({
      method: "GET",
      url: "/api/dashboard/summary?recentLimit=0",

      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("should reject invalid date range", async () => {
    const dateFrom = new Date().toISOString();

    const dateTo = dateDaysAgo(10).toISOString();

    const response = await getTestApp().inject({
      method: "GET",

      url: `/api/dashboard/summary?dateFrom=${encodeURIComponent(
        dateFrom,
      )}&dateTo=${encodeURIComponent(dateTo)}`,

      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });

    expect(response.statusCode).toBe(400);
  });
});
