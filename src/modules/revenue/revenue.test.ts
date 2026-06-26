import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import type {
    FastifyInstance,
} from "fastify";
import {
    afterAll,
    beforeAll,
    describe,
    expect,
    it,
} from "vitest";

import {
    prisma,
} from "../../lib/prisma.js";
import {
    buildTestApp,
} from "../../test/app-test-helper.js";

type ApiResponse<T> = {
    success?: boolean;
    message: string;
    data: T;
};

type ErrorResponse = {
    success?: boolean;
    message: string;
    errors?: Record<string, string[]>;
    error?: {
        code?: string;
        statusCode?: number;
        requestId?: string;
    };
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

type RevenueItem = {
    id: string;
    propertyId: string;
    leadId: string | null;
    brokerId: string;
    grossSaleAmount: string | number;
    commissionRate: string | number;
    commissionAmount: string | number;
    paymentReceived: string | number;
    paymentStatus: string;
    commissionStatus: string;
    saleDate: string;
    notes: string | null;
};

type RevenueListData = {
    items: RevenueItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

type RevenueSummary = {
    totalRecords: number;
    totalGrossSales: number;
    totalCommission: number;
    totalPaymentReceived: number;
    totalReceivable: number;
    unpaidCount: number;
    partiallyPaidCount: number;
    paidCount: number;
    pendingCommissionCount: number;
    releasedCommissionCount: number;
};

type CreateRevenuePayload = {
    propertyId: string;
    leadId?: string;
    grossSaleAmount: number;
    commissionRate: number;
    paymentReceived?: number;
    commissionStatus?:
    | "PENDING"
    | "RELEASED";
    saleDate: string;
    notes?: string;
};

describe("Revenue API", () => {
    let app: FastifyInstance | undefined;

    let adminId: string | undefined;
    let brokerAId: string | undefined;
    let brokerBId: string | undefined;
    let clientId: string | undefined;
    let brokerAPropertyId: string | undefined;
    let brokerBPropertyId: string | undefined;

    let adminToken = "";
    let brokerAToken = "";
    let brokerBToken = "";
    let clientToken = "";

    const password =
        "RevenuePassword123";

    const adminEmail =
        `revenue-admin-${randomUUID()}@example.com`;

    const brokerAEmail =
        `revenue-broker-a-${randomUUID()}@example.com`;

    const brokerBEmail =
        `revenue-broker-b-${randomUUID()}@example.com`;

    const clientEmail =
        `revenue-client-${randomUUID()}@example.com`;

    function getTestApp(): FastifyInstance {
        if (!app) {
            throw new Error(
                "Test application has not been initialized.",
            );
        }

        return app;
    }

    function pastDate(
        daysAgo = 1,
    ): string {
        const date = new Date();

        date.setUTCDate(
            date.getUTCDate() - daysAgo,
        );

        return date.toISOString();
    }

    function futureDate(
        daysFromNow = 1,
    ): string {
        const date = new Date();

        date.setUTCDate(
            date.getUTCDate() + daysFromNow,
        );

        return date.toISOString();
    }

    function buildPayload(
        overrides: Partial<CreateRevenuePayload> = {},
    ): CreateRevenuePayload {
        if (!brokerAPropertyId) {
            throw new Error(
                "Broker A property is missing.",
            );
        }

        return {
            propertyId: brokerAPropertyId,
            grossSaleAmount: 5_000_000,
            commissionRate: 5,
            paymentReceived: 0,
            commissionStatus: "PENDING",
            saleDate: pastDate(),
            notes: "Revenue integration test.",
            ...overrides,
        };
    }

    async function login(
        email: string,
    ): Promise<string> {
        const response =
            await getTestApp().inject({
                method: "POST",
                url: "/api/auth/login",
                payload: {
                    email,
                    password,
                },
            });

        expect(response.statusCode).toBe(200);

        const body =
            response.json() as ApiResponse<LoginData>;

        return body.data.token;
    }

    async function createRevenueRequest(
        token: string,
        overrides: Partial<CreateRevenuePayload> = {},
    ): Promise<RevenueItem> {
        const response =
            await getTestApp().inject({
                method: "POST",
                url: "/api/revenues",
                headers: {
                    authorization: `Bearer ${token}`,
                },
                payload: buildPayload(overrides),
            });

        expect(response.statusCode).toBe(201);

        const body =
            response.json() as ApiResponse<RevenueItem>;

        return body.data;
    }

    async function createStoredRevenue({
        propertyId,
        brokerId,
        grossSaleAmount = 1_000_000,
        commissionRate = 5,
        paymentReceived = 0,
    }: {
        propertyId: string;
        brokerId: string;
        grossSaleAmount?: number;
        commissionRate?: number;
        paymentReceived?: number;
    }) {
        const commissionAmount =
            grossSaleAmount *
            (commissionRate / 100);

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
                saleDate: new Date(pastDate(2)),
            },
            select: {
                id: true,
                brokerId: true,
                paymentStatus: true,
                paymentReceived: true,
                commissionStatus: true,
            },
        });
    }

    beforeAll(
        async () => {
            app = await buildTestApp();

            const passwordHash =
                await bcrypt.hash(
                    password,
                    10,
                );

            const [
                admin,
                brokerA,
                brokerB,
                client,
            ] = await Promise.all([
                prisma.user.create({
                    data: {
                        firstName: "Revenue",
                        lastName: "Admin",
                        email: adminEmail,
                        passwordHash,
                        role: "ADMIN",
                        status: "ACTIVE",
                        phone: "09170001000",
                    },
                    select: { id: true },
                }),
                prisma.user.create({
                    data: {
                        firstName: "Revenue",
                        lastName: "Broker A",
                        email: brokerAEmail,
                        passwordHash,
                        role: "BROKER",
                        status: "ACTIVE",
                        phone: "09170001001",
                    },
                    select: { id: true },
                }),
                prisma.user.create({
                    data: {
                        firstName: "Revenue",
                        lastName: "Broker B",
                        email: brokerBEmail,
                        passwordHash,
                        role: "BROKER",
                        status: "ACTIVE",
                        phone: "09170001002",
                    },
                    select: { id: true },
                }),
                prisma.user.create({
                    data: {
                        firstName: "Revenue",
                        lastName: "Client",
                        email: clientEmail,
                        passwordHash,
                        role: "CLIENT",
                        status: "ACTIVE",
                        phone: "09170001003",
                    },
                    select: { id: true },
                }),
            ]);

            adminId = admin.id;
            brokerAId = brokerA.id;
            brokerBId = brokerB.id;
            clientId = client.id;

            const [propertyA, propertyB] =
                await Promise.all([
                    prisma.property.create({
                        data: {
                            title:
                                `Revenue Property A ${randomUUID()}`,
                            description:
                                "Revenue test property A.",
                            type: "HOUSE_AND_LOT",
                            status: "PUBLISHED",
                            price: 5_000_000,
                            address: "Revenue Street A",
                            city: "Cebu City",
                            province: "Cebu",
                            brokerId: brokerA.id,
                        },
                        select: { id: true },
                    }),
                    prisma.property.create({
                        data: {
                            title:
                                `Revenue Property B ${randomUUID()}`,
                            description:
                                "Revenue test property B.",
                            type: "CONDOMINIUM",
                            status: "PUBLISHED",
                            price: 4_000_000,
                            address: "Revenue Street B",
                            city: "Cebu City",
                            province: "Cebu",
                            brokerId: brokerB.id,
                        },
                        select: { id: true },
                    }),
                ]);

            brokerAPropertyId = propertyA.id;
            brokerBPropertyId = propertyB.id;

            adminToken = await login(adminEmail);
            brokerAToken = await login(brokerAEmail);
            brokerBToken = await login(brokerBEmail);
            clientToken = await login(clientEmail);
        },
        30_000,
    );

    afterAll(async () => {
        try {
            const userIds = [
                adminId,
                brokerAId,
                brokerBId,
                clientId,
            ].filter(
                (id): id is string => Boolean(id),
            );

            const propertyIds = [
                brokerAPropertyId,
                brokerBPropertyId,
            ].filter(
                (id): id is string => Boolean(id),
            );

            if (userIds.length > 0) {
                await prisma.auditLog.deleteMany({
                    where: {
                        actorUserId: {
                            in: userIds,
                        },
                    },
                });
            }

            if (propertyIds.length > 0) {
                await prisma.revenue.deleteMany({
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

                await prisma.property.deleteMany({
                    where: {
                        id: {
                            in: propertyIds,
                        },
                    },
                });
            }

            if (userIds.length > 0) {
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

    it(
        "should reject revenue creation without token",
        async () => {
            const response =
                await getTestApp().inject({
                    method: "POST",
                    url: "/api/revenues",
                    payload: buildPayload(),
                });

            expect(response.statusCode).toBe(401);
        },
    );

    it(
        "should reject revenue access as client",
        async () => {
            const response =
                await getTestApp().inject({
                    method: "GET",
                    url: "/api/revenues",
                    headers: {
                        authorization:
                            `Bearer ${clientToken}`,
                    },
                });

            expect(response.statusCode).toBe(403);
        },
    );

    it(
        "should create revenue and calculate commission as admin",
        async () => {
            const revenue =
                await createRevenueRequest(
                    adminToken,
                    {
                        grossSaleAmount: 5_000_000,
                        commissionRate: 5,
                        paymentReceived: 1_000_000,
                    },
                );

            expect(
                Number(revenue.commissionAmount),
            ).toBe(250_000);

            expect(revenue.paymentStatus).toBe(
                "PARTIAL",
            );

            const audit =
                await prisma.auditLog.findFirst({
                    where: {
                        resourceType: "REVENUE",
                        resourceId: revenue.id,
                        action: "CREATE",
                    },
                });

            expect(audit).not.toBeNull();
        },
    );

    it(
        "should reject invalid property ID",
        async () => {
            const response =
                await getTestApp().inject({
                    method: "POST",
                    url: "/api/revenues",
                    headers: {
                        authorization:
                            `Bearer ${adminToken}`,
                    },
                    payload: buildPayload({
                        propertyId:
                            "invalid-property-id",
                    }),
                });

            expect(response.statusCode).toBe(400);
        },
    );

    it(
        "should reject a valid but missing property",
        async () => {
            const response =
                await getTestApp().inject({
                    method: "POST",
                    url: "/api/revenues",
                    headers: {
                        authorization:
                            `Bearer ${adminToken}`,
                    },
                    payload: buildPayload({
                        propertyId: randomUUID(),
                    }),
                });

            expect(response.statusCode).toBe(400);

            const body =
                response.json() as ErrorResponse;

            expect(body.message).toBe(
                "Property not found.",
            );
        },
    );

    it(
        "should reject overpayment during creation",
        async () => {
            const response =
                await getTestApp().inject({
                    method: "POST",
                    url: "/api/revenues",
                    headers: {
                        authorization:
                            `Bearer ${adminToken}`,
                    },
                    payload: buildPayload({
                        grossSaleAmount: 1_000_000,
                        paymentReceived: 1_000_001,
                    }),
                });

            expect(response.statusCode).toBe(400);
        },
    );

    it(
        "should reject a future sale date",
        async () => {
            const response =
                await getTestApp().inject({
                    method: "POST",
                    url: "/api/revenues",
                    headers: {
                        authorization:
                            `Bearer ${adminToken}`,
                    },
                    payload: buildPayload({
                        saleDate: futureDate(),
                    }),
                });

            expect(response.statusCode).toBe(400);
        },
    );

    it(
        "should allow broker to create revenue for own property",
        async () => {
            const revenue =
                await createRevenueRequest(
                    brokerAToken,
                );

            expect(revenue.brokerId).toBe(
                brokerAId,
            );
        },
    );

    it(
        "should reject broker creating revenue for another broker property",
        async () => {
            if (!brokerBPropertyId) {
                throw new Error(
                    "Broker B property is missing.",
                );
            }

            const response =
                await getTestApp().inject({
                    method: "POST",
                    url: "/api/revenues",
                    headers: {
                        authorization:
                            `Bearer ${brokerAToken}`,
                    },
                    payload: buildPayload({
                        propertyId:
                            brokerBPropertyId,
                    }),
                });

            expect(response.statusCode).toBe(403);
        },
    );

    it(
        "should list only broker-owned revenues",
        async () => {
            if (
                !brokerAPropertyId ||
                !brokerBPropertyId ||
                !brokerAId ||
                !brokerBId
            ) {
                throw new Error(
                    "Broker setup is incomplete.",
                );
            }

            const ownRevenue =
                await createStoredRevenue({
                    propertyId: brokerAPropertyId,
                    brokerId: brokerAId,
                });

            const otherRevenue =
                await createStoredRevenue({
                    propertyId: brokerBPropertyId,
                    brokerId: brokerBId,
                });

            const response =
                await getTestApp().inject({
                    method: "GET",
                    url:
                        "/api/revenues?page=1&limit=100",
                    headers: {
                        authorization:
                            `Bearer ${brokerAToken}`,
                    },
                });

            expect(response.statusCode).toBe(200);

            const body =
                response.json() as ApiResponse<RevenueListData>;

            expect(
                body.data.items.some(
                    (item) =>
                        item.id === ownRevenue.id,
                ),
            ).toBe(true);

            expect(
                body.data.items.some(
                    (item) =>
                        item.id === otherRevenue.id,
                ),
            ).toBe(false);

            expect(
                body.data.items.every(
                    (item) =>
                        item.brokerId === brokerAId,
                ),
            ).toBe(true);
        },
    );

    it(
        "should allow broker to get own revenue",
        async () => {
            if (!brokerAPropertyId || !brokerAId) {
                throw new Error(
                    "Broker setup is incomplete.",
                );
            }

            const revenue =
                await createStoredRevenue({
                    propertyId: brokerAPropertyId,
                    brokerId: brokerAId,
                });

            const response =
                await getTestApp().inject({
                    method: "GET",
                    url:
                        `/api/revenues/${revenue.id}`,
                    headers: {
                        authorization:
                            `Bearer ${brokerAToken}`,
                    },
                });

            expect(response.statusCode).toBe(200);
        },
    );

    it(
        "should prevent broker from getting another broker revenue",
        async () => {
            if (!brokerBPropertyId || !brokerBId) {
                throw new Error(
                    "Broker setup is incomplete.",
                );
            }

            const revenue =
                await createStoredRevenue({
                    propertyId: brokerBPropertyId,
                    brokerId: brokerBId,
                });

            const response =
                await getTestApp().inject({
                    method: "GET",
                    url:
                        `/api/revenues/${revenue.id}`,
                    headers: {
                        authorization:
                            `Bearer ${brokerAToken}`,
                    },
                });

            expect(response.statusCode).toBe(403);
        },
    );

    it(
        "should automatically set payment status to PARTIAL",
        async () => {
            const revenue =
                await createRevenueRequest(
                    adminToken,
                    {
                        grossSaleAmount: 1_000_000,
                    },
                );

            const response =
                await getTestApp().inject({
                    method: "PATCH",
                    url:
                        `/api/revenues/${revenue.id}/payment-status`,
                    headers: {
                        authorization:
                            `Bearer ${adminToken}`,
                    },
                    payload: {
                        paymentReceived: 500_000,
                    },
                });

            expect(response.statusCode).toBe(200);

            const body =
                response.json() as ApiResponse<RevenueItem>;

            expect(body.data.paymentStatus).toBe(
                "PARTIAL",
            );
        },
    );

    it(
        "should automatically set payment status to PAID",
        async () => {
            const revenue =
                await createRevenueRequest(
                    adminToken,
                    {
                        grossSaleAmount: 1_000_000,
                    },
                );

            const response =
                await getTestApp().inject({
                    method: "PATCH",
                    url:
                        `/api/revenues/${revenue.id}/payment-status`,
                    headers: {
                        authorization:
                            `Bearer ${adminToken}`,
                    },
                    payload: {
                        paymentReceived: 1_000_000,
                    },
                });

            expect(response.statusCode).toBe(200);

            const body =
                response.json() as ApiResponse<RevenueItem>;

            expect(body.data.paymentStatus).toBe(
                "PAID",
            );
        },
    );

    it(
        "should reject payment greater than gross sale",
        async () => {
            const revenue =
                await createRevenueRequest(
                    adminToken,
                    {
                        grossSaleAmount: 1_000_000,
                    },
                );

            const response =
                await getTestApp().inject({
                    method: "PATCH",
                    url:
                        `/api/revenues/${revenue.id}/payment-status`,
                    headers: {
                        authorization:
                            `Bearer ${adminToken}`,
                    },
                    payload: {
                        paymentReceived: 1_000_001,
                    },
                });

            expect(response.statusCode).toBe(400);
        },
    );

    it(
        "should reject a mismatched supplied payment status",
        async () => {
            const revenue =
                await createRevenueRequest(
                    adminToken,
                    {
                        grossSaleAmount: 1_000_000,
                    },
                );

            const response =
                await getTestApp().inject({
                    method: "PATCH",
                    url:
                        `/api/revenues/${revenue.id}/payment-status`,
                    headers: {
                        authorization:
                            `Bearer ${adminToken}`,
                    },
                    payload: {
                        paymentReceived: 500_000,
                        paymentStatus: "PAID",
                    },
                });

            expect(response.statusCode).toBe(400);

            const body =
                response.json() as ErrorResponse;

            expect(body.message).toBe(
                "Payment status must be PARTIAL for the supplied payment amount.",
            );
        },
    );

    it(
        "should update commission status as assigned broker",
        async () => {
            const revenue =
                await createRevenueRequest(
                    brokerAToken,
                );

            const response =
                await getTestApp().inject({
                    method: "PATCH",
                    url:
                        `/api/revenues/${revenue.id}/commission-status`,
                    headers: {
                        authorization:
                            `Bearer ${brokerAToken}`,
                    },
                    payload: {
                        commissionStatus: "RELEASED",
                    },
                });

            expect(response.statusCode).toBe(200);

            const body =
                response.json() as ApiResponse<RevenueItem>;

            expect(
                body.data.commissionStatus,
            ).toBe("RELEASED");
        },
    );

    it(
        "should prevent another broker from updating revenue",
        async () => {
            const revenue =
                await createRevenueRequest(
                    brokerAToken,
                );

            const response =
                await getTestApp().inject({
                    method: "PATCH",
                    url:
                        `/api/revenues/${revenue.id}/commission-status`,
                    headers: {
                        authorization:
                            `Bearer ${brokerBToken}`,
                    },
                    payload: {
                        commissionStatus: "RELEASED",
                    },
                });

            expect(response.statusCode).toBe(403);
        },
    );

    it(
        "should return broker-specific revenue summary",
        async () => {
            const response =
                await getTestApp().inject({
                    method: "GET",
                    url: "/api/revenues/summary",
                    headers: {
                        authorization:
                            `Bearer ${brokerAToken}`,
                    },
                });

            expect(response.statusCode).toBe(200);

            const body =
                response.json() as ApiResponse<RevenueSummary>;

            expect(
                body.data.totalRecords,
            ).toBeGreaterThan(0);
        },
    );

    it(
        "should return 400 for invalid revenue ID",
        async () => {
            const response =
                await getTestApp().inject({
                    method: "GET",
                    url:
                        "/api/revenues/invalid-revenue-id",
                    headers: {
                        authorization:
                            `Bearer ${adminToken}`,
                    },
                });

            expect(response.statusCode).toBe(400);
        },
    );

    it(
        "should return 404 for valid missing revenue ID",
        async () => {
            const response =
                await getTestApp().inject({
                    method: "GET",
                    url:
                        `/api/revenues/${randomUUID()}`,
                    headers: {
                        authorization:
                            `Bearer ${adminToken}`,
                    },
                });

            expect(response.statusCode).toBe(404);
        },
    );

    it(
        "should allow broker to delete own revenue",
        async () => {
            const revenue =
                await createRevenueRequest(
                    brokerAToken,
                );

            const response =
                await getTestApp().inject({
                    method: "DELETE",
                    url:
                        `/api/revenues/${revenue.id}`,
                    headers: {
                        authorization:
                            `Bearer ${brokerAToken}`,
                    },
                });

            expect(response.statusCode).toBe(200);

            const deleted =
                await prisma.revenue.findUnique({
                    where: {
                        id: revenue.id,
                    },
                });

            expect(deleted).toBeNull();
        },
    );

    it(
        "should prevent another broker from deleting revenue",
        async () => {
            const revenue =
                await createRevenueRequest(
                    brokerAToken,
                );

            const response =
                await getTestApp().inject({
                    method: "DELETE",
                    url:
                        `/api/revenues/${revenue.id}`,
                    headers: {
                        authorization:
                            `Bearer ${brokerBToken}`,
                    },
                });

            expect(response.statusCode).toBe(403);

            const existing =
                await prisma.revenue.findUnique({
                    where: {
                        id: revenue.id,
                    },
                });

            expect(existing).not.toBeNull();
        },
    );
});
