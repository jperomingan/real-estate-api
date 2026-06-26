import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";

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
    errors?: Record<
        string,
        string[]
    >;
    error?: {
        code?: string;
        statusCode?: number;
        requestId?: string;
    };
};

type LoginData = {
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
        status: string;
    };
    token: string;
};

type ViewingAppointment = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    message: string | null;
    preferredDate: string;
    confirmedDate: string | null;
    status: string;
    notes: string | null;
    propertyId: string;
    brokerId: string;
    clientId: string | null;
    createdAt: string;
    updatedAt: string;
};

type ViewingListData = {
    items:
    ViewingAppointment[];

    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

type CreateViewingPayload = {
    propertyId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    message?: string;
    preferredDate: string;
};

describe("Viewing API", () => {
    let app:
        | FastifyInstance
        | undefined;

    let testAdminId:
        | string
        | undefined;

    let testBrokerAId:
        | string
        | undefined;

    let testBrokerBId:
        | string
        | undefined;

    let testClientAId:
        | string
        | undefined;

    let testClientBId:
        | string
        | undefined;

    let testAdminPropertyId:
        | string
        | undefined;

    let testBrokerPropertyId:
        | string
        | undefined;

    let adminToken = "";
    let brokerAToken = "";
    let brokerBToken = "";
    let clientAToken = "";
    let clientBToken = "";

    const testAdminEmail =
        `viewing-admin-${randomUUID()}@example.com`;

    const testBrokerAEmail =
        `viewing-broker-a-${randomUUID()}@example.com`;

    const testBrokerBEmail =
        `viewing-broker-b-${randomUUID()}@example.com`;

    const testClientAEmail =
        `viewing-client-a-${randomUUID()}@example.com`;

    const testClientBEmail =
        `viewing-client-b-${randomUUID()}@example.com`;

    const testAdminPassword =
        "ViewingAdminPassword123";

    const testBrokerPassword =
        "ViewingBrokerPassword123";

    const testClientPassword =
        "ViewingClientPassword123";

    function getTestApp():
        FastifyInstance {
        if (!app) {
            throw new Error(
                "Test application has not been initialized.",
            );
        }

        return app;
    }

    function createFutureDate(
        daysFromNow = 7,
    ): string {
        const date = new Date();

        date.setUTCDate(
            date.getUTCDate() +
            daysFromNow,
        );

        date.setUTCHours(
            10,
            0,
            0,
            0,
        );

        return date.toISOString();
    }

    function createPastDate(
        daysAgo = 1,
    ): string {
        const date = new Date();

        date.setUTCDate(
            date.getUTCDate() - daysAgo,
        );

        date.setUTCHours(10, 0, 0, 0);

        return date.toISOString();
    }

    function buildViewingPayload(
        overrides:
            Partial<CreateViewingPayload> = {},
    ): CreateViewingPayload {
        if (!testAdminPropertyId) {
            throw new Error(
                "Admin test property has not been created.",
            );
        }

        return {
            propertyId:
                testAdminPropertyId,

            firstName:
                "Test",

            lastName:
                "Client",

            email:
                `viewing-client-${randomUUID()}@example.com`,

            phone:
                "09171234567",

            message:
                "I would like to schedule a property viewing.",

            preferredDate:
                createFutureDate(),

            ...overrides,
        };
    }

    async function loginUser(
        email: string,
        password: string,
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

        if (
            response.statusCode !== 200
        ) {
            throw new Error(
                [
                    `Unable to log in user ${email}.`,
                    `Status: ${response.statusCode}.`,
                    `Response: ${response.body}`,
                ].join(" "),
            );
        }

        const body =
            response.json() as ApiResponse<LoginData>;

        if (!body.data?.token) {
            throw new Error(
                `Login response for ${email} did not contain a token.`,
            );
        }

        return body.data.token;
    }

    async function createTestViewing(
        overrides:
            Partial<CreateViewingPayload> = {},

        token?: string,
    ): Promise<ViewingAppointment> {
        const response =
            await getTestApp().inject({
                method: "POST",
                url: "/api/viewings",

                ...(token
                    ? {
                        headers: {
                            authorization:
                                `Bearer ${token}`,
                        },
                    }
                    : {}),

                payload:
                    buildViewingPayload(
                        overrides,
                    ),
            });

        expect(
            response.statusCode,
        ).toBe(201);

        const body =
            response.json() as ApiResponse<ViewingAppointment>;

        expect(
            body.data,
        ).toBeDefined();

        expect(
            body.data.id,
        ).toBeTypeOf("string");

        return body.data;
    }

    async function createStoredViewing({
        propertyId,
        clientId,
        status = "REQUESTED",
        confirmedDate,
    }: {
        propertyId: string;
        clientId?: string;
        status?:
        | "REQUESTED"
        | "CONFIRMED"
        | "RESCHEDULED"
        | "COMPLETED"
        | "CANCELLED"
        | "DECLINED";
        confirmedDate?: Date;
    }) {
        const property =
            await prisma.property.findUnique({
                where: {
                    id: propertyId,
                },
                select: {
                    brokerId: true,
                },
            });

        if (!property) {
            throw new Error(
                "Test property was not found.",
            );
        }

        return prisma.viewingAppointment.create({
            data: {
                firstName: "Stored",
                lastName: "Client",
                email:
                    `stored-viewing-${randomUUID()}@example.com`,
                phone: "09170009999",
                message:
                    "Viewing created directly for an authorization test.",
                preferredDate: new Date(
                    createFutureDate(10),
                ),
                confirmedDate,
                status,
                propertyId,
                brokerId: property.brokerId,
                clientId,
            },
            select: {
                id: true,
                propertyId: true,
                brokerId: true,
                clientId: true,
                status: true,
                confirmedDate: true,
            },
        });
    }

    async function createNonExistingPropertyId():
        Promise<string> {
        let propertyId =
            randomUUID();

        let existingProperty =
            await prisma.property.findUnique({
                where: {
                    id: propertyId,
                },

                select: {
                    id: true,
                },
            });

        while (existingProperty) {
            propertyId =
                randomUUID();

            existingProperty =
                await prisma.property.findUnique({
                    where: {
                        id: propertyId,
                    },

                    select: {
                        id: true,
                    },
                });
        }

        return propertyId;
    }

    beforeAll(
        async () => {
            app =
                await buildTestApp();

            const adminPasswordHash =
                await bcrypt.hash(
                    testAdminPassword,
                    10,
                );

            const brokerPasswordHash =
                await bcrypt.hash(
                    testBrokerPassword,
                    10,
                );

            const clientPasswordHash =
                await bcrypt.hash(
                    testClientPassword,
                    10,
                );

            const admin =
                await prisma.user.create({
                    data: {
                        firstName:
                            "Viewing",

                        lastName:
                            "Administrator",

                        email:
                            testAdminEmail,

                        passwordHash:
                            adminPasswordHash,

                        phone:
                            "09170000000",

                        role:
                            "ADMIN",

                        status:
                            "ACTIVE",
                    },

                    select: {
                        id: true,
                    },
                });

            const brokerA =
                await prisma.user.create({
                    data: {
                        firstName:
                            "Viewing",

                        lastName:
                            "Broker A",

                        email:
                            testBrokerAEmail,

                        passwordHash:
                            brokerPasswordHash,

                        phone:
                            "09170000001",

                        role:
                            "BROKER",

                        status:
                            "ACTIVE",
                    },

                    select: {
                        id: true,
                    },
                });

            const brokerB =
                await prisma.user.create({
                    data: {
                        firstName:
                            "Viewing",

                        lastName:
                            "Broker B",

                        email:
                            testBrokerBEmail,

                        passwordHash:
                            brokerPasswordHash,

                        phone:
                            "09170000002",

                        role:
                            "BROKER",

                        status:
                            "ACTIVE",
                    },

                    select: {
                        id: true,
                    },
                });

            const clientA =
                await prisma.user.create({
                    data: {
                        firstName:
                            "Viewing",

                        lastName:
                            "Client A",

                        email:
                            testClientAEmail,

                        passwordHash:
                            clientPasswordHash,

                        phone:
                            "09170000003",

                        role:
                            "CLIENT",

                        status:
                            "ACTIVE",
                    },

                    select: {
                        id: true,
                    },
                });

            const clientB =
                await prisma.user.create({
                    data: {
                        firstName:
                            "Viewing",

                        lastName:
                            "Client B",

                        email:
                            testClientBEmail,

                        passwordHash:
                            clientPasswordHash,

                        phone:
                            "09170000004",

                        role:
                            "CLIENT",

                        status:
                            "ACTIVE",
                    },

                    select: {
                        id: true,
                    },
                });

            testAdminId =
                admin.id;

            testBrokerAId =
                brokerA.id;

            testBrokerBId =
                brokerB.id;

            testClientAId =
                clientA.id;

            testClientBId =
                clientB.id;

            const adminProperty =
                await prisma.property.create({
                    data: {
                        title:
                            `Admin Viewing Property ${randomUUID()}`,

                        description:
                            "Temporary published property owned by the test administrator.",

                        type:
                            "HOUSE_AND_LOT",

                        status:
                            "PUBLISHED",

                        price:
                            2_500_000,

                        lotAreaSqm:
                            120,

                        floorAreaSqm:
                            80,

                        bedrooms:
                            3,

                        bathrooms:
                            2,

                        address:
                            "123 Admin Viewing Street",

                        barangay:
                            "Lahug",

                        city:
                            "Cebu City",

                        province:
                            "Cebu",

                        zipCode:
                            "6000",

                        brokerId:
                            admin.id,
                    },

                    select: {
                        id: true,
                    },
                });

            const brokerProperty =
                await prisma.property.create({
                    data: {
                        title:
                            `Broker Viewing Property ${randomUUID()}`,

                        description:
                            "Temporary published property assigned to Broker A.",

                        type:
                            "HOUSE_AND_LOT",

                        status:
                            "PUBLISHED",

                        price:
                            3_500_000,

                        lotAreaSqm:
                            150,

                        floorAreaSqm:
                            100,

                        bedrooms:
                            4,

                        bathrooms:
                            3,

                        address:
                            "456 Broker Viewing Street",

                        barangay:
                            "Banilad",

                        city:
                            "Cebu City",

                        province:
                            "Cebu",

                        zipCode:
                            "6000",

                        brokerId:
                            brokerA.id,
                    },

                    select: {
                        id: true,
                    },
                });

            testAdminPropertyId =
                adminProperty.id;

            testBrokerPropertyId =
                brokerProperty.id;

            adminToken =
                await loginUser(
                    testAdminEmail,
                    testAdminPassword,
                );

            brokerAToken =
                await loginUser(
                    testBrokerAEmail,
                    testBrokerPassword,
                );

            brokerBToken =
                await loginUser(
                    testBrokerBEmail,
                    testBrokerPassword,
                );

            clientAToken =
                await loginUser(
                    testClientAEmail,
                    testClientPassword,
                );

            clientBToken =
                await loginUser(
                    testClientBEmail,
                    testClientPassword,
                );
        },
        30_000,
    );

    afterAll(async () => {
        try {
            const propertyIds = [
                testAdminPropertyId,
                testBrokerPropertyId,
            ].filter(
                (
                    id,
                ): id is string =>
                    Boolean(id),
            );

            const userIds = [
                testAdminId,
                testBrokerAId,
                testBrokerBId,
                testClientAId,
                testClientBId,
            ].filter(
                (
                    id,
                ): id is string =>
                    Boolean(id),
            );

            if (
                propertyIds.length > 0
            ) {
                await prisma.viewingAppointment.deleteMany({
                    where: {
                        propertyId: {
                            in:
                                propertyIds,
                        },
                    },
                });
            }

            if (
                userIds.length > 0
            ) {
                await prisma.notification.deleteMany({
                    where: {
                        targetUserId: {
                            in:
                                userIds,
                        },
                    },
                });
            }

            if (
                propertyIds.length > 0
            ) {
                await prisma.property.deleteMany({
                    where: {
                        id: {
                            in:
                                propertyIds,
                        },
                    },
                });
            }

            if (
                userIds.length > 0
            ) {
                await prisma.user.deleteMany({
                    where: {
                        id: {
                            in:
                                userIds,
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
        "should create viewing request with propertyId",
        async () => {
            if (
                !testAdminPropertyId
            ) {
                throw new Error(
                    "Admin test property is missing.",
                );
            }

            const payload =
                buildViewingPayload();

            const response =
                await getTestApp().inject({
                    method: "POST",
                    url: "/api/viewings",
                    payload,
                });

            expect(
                response.statusCode,
            ).toBe(201);

            const body =
                response.json() as ApiResponse<ViewingAppointment>;

            expect(
                body.data.id,
            ).toBeTypeOf("string");

            expect(
                body.data.propertyId,
            ).toBe(
                testAdminPropertyId,
            );

            expect(
                body.data.status,
            ).toBe("REQUESTED");

            expect(
                body.data.clientId,
            ).toBeNull();
        },
    );

    it(
        "should reject viewing request with invalid propertyId",
        async () => {
            const response =
                await getTestApp().inject({
                    method: "POST",
                    url: "/api/viewings",

                    payload:
                        buildViewingPayload({
                            propertyId:
                                "invalid-property-id",
                        }),
                });

            expect(
                response.statusCode,
            ).toBe(400);

            const body =
                response.json() as ErrorResponse;

            expect(
                body.message,
            ).toBe(
                "Validation error",
            );
        },
    );

    it(
        "should reject viewing request when property is not found",
        async () => {
            const nonExistingPropertyId =
                await createNonExistingPropertyId();

            const response =
                await getTestApp().inject({
                    method: "POST",
                    url: "/api/viewings",

                    payload:
                        buildViewingPayload({
                            propertyId:
                                nonExistingPropertyId,
                        }),
                });

            expect(
                response.statusCode,
            ).toBe(400);

            const body =
                response.json() as ErrorResponse;

            expect(
                body.message,
            ).toBe(
                "Property not found.",
            );
        },
    );

    it(
        "should reject listing viewings without token",
        async () => {
            const response =
                await getTestApp().inject({
                    method: "GET",
                    url: "/api/viewings",
                });

            expect(
                response.statusCode,
            ).toBe(401);
        },
    );

    it(
        "should list viewings as admin",
        async () => {
            const createdViewing =
                await createTestViewing();

            const response =
                await getTestApp().inject({
                    method: "GET",

                    url:
                        "/api/viewings?page=1&limit=20",

                    headers: {
                        authorization:
                            `Bearer ${adminToken}`,
                    },
                });

            expect(
                response.statusCode,
            ).toBe(200);

            const body =
                response.json() as ApiResponse<ViewingListData>;

            expect(
                body.data.items.some(
                    (item) =>
                        item.id ===
                        createdViewing.id,
                ),
            ).toBe(true);
        },
    );

    it(
        "should get viewing by ID as admin",
        async () => {
            const createdViewing =
                await createTestViewing();

            const response =
                await getTestApp().inject({
                    method: "GET",

                    url:
                        `/api/viewings/${createdViewing.id}`,

                    headers: {
                        authorization:
                            `Bearer ${adminToken}`,
                    },
                });

            expect(
                response.statusCode,
            ).toBe(200);

            const body =
                response.json() as ApiResponse<ViewingAppointment>;

            expect(
                body.data.id,
            ).toBe(
                createdViewing.id,
            );
        },
    );

    it(
        "should update viewing status as admin",
        async () => {
            const createdViewing =
                await createTestViewing();

            const response =
                await getTestApp().inject({
                    method: "PATCH",

                    url:
                        `/api/viewings/${createdViewing.id}/status`,

                    headers: {
                        authorization:
                            `Bearer ${adminToken}`,
                    },

                    payload: {
                        status:
                            "CONFIRMED",

                        notes:
                            "Viewing appointment confirmed by admin.",
                    },
                });

            expect(
                response.statusCode,
            ).toBe(200);

            const body =
                response.json() as ApiResponse<ViewingAppointment>;

            expect(
                body.data.status,
            ).toBe("CONFIRMED");

            expect(
                body.data.confirmedDate,
            ).not.toBeNull();
        },
    );

    it(
        "should reschedule viewing as admin",
        async () => {
            const createdViewing =
                await createTestViewing();

            const confirmedDate =
                createFutureDate(14);

            const response =
                await getTestApp().inject({
                    method: "PATCH",

                    url:
                        `/api/viewings/${createdViewing.id}/reschedule`,

                    headers: {
                        authorization:
                            `Bearer ${adminToken}`,
                    },

                    payload: {
                        confirmedDate,

                        notes:
                            "Viewing appointment rescheduled by admin.",
                    },
                });

            expect(
                response.statusCode,
            ).toBe(200);

            const body =
                response.json() as ApiResponse<ViewingAppointment>;

            expect(
                body.data.status,
            ).toBe("RESCHEDULED");

            expect(
                new Date(
                    body.data.confirmedDate as string,
                ).toISOString(),
            ).toBe(
                new Date(
                    confirmedDate,
                ).toISOString(),
            );
        },
    );

    it(
        "should delete viewing as admin",
        async () => {
            const createdViewing =
                await createTestViewing();

            const response =
                await getTestApp().inject({
                    method: "DELETE",

                    url:
                        `/api/viewings/${createdViewing.id}`,

                    headers: {
                        authorization:
                            `Bearer ${adminToken}`,
                    },
                });

            expect(
                response.statusCode,
            ).toBe(200);

            const deletedViewing =
                await prisma.viewingAppointment.findUnique({
                    where: {
                        id:
                            createdViewing.id,
                    },
                });

            expect(
                deletedViewing,
            ).toBeNull();
        },
    );

    it(
        "should allow broker to list only assigned viewings",
        async () => {
            if (
                !testBrokerPropertyId ||
                !testBrokerAId
            ) {
                throw new Error(
                    "Broker test setup is incomplete.",
                );
            }

            const brokerViewing =
                await createTestViewing({
                    propertyId:
                        testBrokerPropertyId,
                });

            const adminViewing =
                await createTestViewing();

            const response =
                await getTestApp().inject({
                    method: "GET",

                    url:
                        "/api/viewings?page=1&limit=100",

                    headers: {
                        authorization:
                            `Bearer ${brokerAToken}`,
                    },
                });

            expect(
                response.statusCode,
            ).toBe(200);

            const body =
                response.json() as ApiResponse<ViewingListData>;

            expect(
                body.data.items.some(
                    (item) =>
                        item.id ===
                        brokerViewing.id,
                ),
            ).toBe(true);

            expect(
                body.data.items.some(
                    (item) =>
                        item.id ===
                        adminViewing.id,
                ),
            ).toBe(false);

            expect(
                body.data.items.every(
                    (item) =>
                        item.brokerId ===
                        testBrokerAId,
                ),
            ).toBe(true);
        },
    );

    it(
        "should allow broker to get own viewing",
        async () => {
            if (
                !testBrokerPropertyId
            ) {
                throw new Error(
                    "Broker property is missing.",
                );
            }

            const viewing =
                await createTestViewing({
                    propertyId:
                        testBrokerPropertyId,
                });

            const response =
                await getTestApp().inject({
                    method: "GET",

                    url:
                        `/api/viewings/${viewing.id}`,

                    headers: {
                        authorization:
                            `Bearer ${brokerAToken}`,
                    },
                });

            expect(
                response.statusCode,
            ).toBe(200);

            const body =
                response.json() as ApiResponse<ViewingAppointment>;

            expect(
                body.data.id,
            ).toBe(viewing.id);

            expect(
                body.data.brokerId,
            ).toBe(
                testBrokerAId,
            );
        },
    );

    it(
        "should prevent another broker from getting viewing",
        async () => {
            if (
                !testBrokerPropertyId
            ) {
                throw new Error(
                    "Broker property is missing.",
                );
            }

            const viewing =
                await createTestViewing({
                    propertyId:
                        testBrokerPropertyId,
                });

            const response =
                await getTestApp().inject({
                    method: "GET",

                    url:
                        `/api/viewings/${viewing.id}`,

                    headers: {
                        authorization:
                            `Bearer ${brokerBToken}`,
                    },
                });

            expect(
                response.statusCode,
            ).toBe(403);

            const body =
                response.json() as ErrorResponse;

            expect(
                body.message,
            ).toBe(
                "You can only view your own appointments.",
            );
        },
    );

    it(
        "should prevent another broker from updating viewing status",
        async () => {
            if (
                !testBrokerPropertyId
            ) {
                throw new Error(
                    "Broker property is missing.",
                );
            }

            const viewing =
                await createTestViewing({
                    propertyId:
                        testBrokerPropertyId,
                });

            const response =
                await getTestApp().inject({
                    method: "PATCH",

                    url:
                        `/api/viewings/${viewing.id}/status`,

                    headers: {
                        authorization:
                            `Bearer ${brokerBToken}`,
                    },

                    payload: {
                        status:
                            "CONFIRMED",
                    },
                });

            expect(
                response.statusCode,
            ).toBe(403);

            const unchangedViewing =
                await prisma.viewingAppointment.findUnique({
                    where: {
                        id:
                            viewing.id,
                    },

                    select: {
                        status: true,
                    },
                });

            expect(
                unchangedViewing?.status,
            ).toBe("REQUESTED");
        },
    );

    it(
        "should prevent another broker from rescheduling viewing",
        async () => {
            if (
                !testBrokerPropertyId
            ) {
                throw new Error(
                    "Broker property is missing.",
                );
            }

            const viewing =
                await createTestViewing({
                    propertyId:
                        testBrokerPropertyId,
                });

            const response =
                await getTestApp().inject({
                    method: "PATCH",

                    url:
                        `/api/viewings/${viewing.id}/reschedule`,

                    headers: {
                        authorization:
                            `Bearer ${brokerBToken}`,
                    },

                    payload: {
                        confirmedDate:
                            createFutureDate(20),
                    },
                });

            expect(
                response.statusCode,
            ).toBe(403);

            const unchangedViewing =
                await prisma.viewingAppointment.findUnique({
                    where: {
                        id:
                            viewing.id,
                    },

                    select: {
                        status: true,
                        confirmedDate: true,
                    },
                });

            expect(
                unchangedViewing?.status,
            ).toBe("REQUESTED");

            expect(
                unchangedViewing?.confirmedDate,
            ).toBeNull();
        },
    );

    it(
        "should prevent another broker from deleting viewing",
        async () => {
            if (
                !testBrokerPropertyId
            ) {
                throw new Error(
                    "Broker property is missing.",
                );
            }

            const viewing =
                await createTestViewing({
                    propertyId:
                        testBrokerPropertyId,
                });

            const response =
                await getTestApp().inject({
                    method: "DELETE",

                    url:
                        `/api/viewings/${viewing.id}`,

                    headers: {
                        authorization:
                            `Bearer ${brokerBToken}`,
                    },
                });

            expect(
                response.statusCode,
            ).toBe(403);

            const existingViewing =
                await prisma.viewingAppointment.findUnique({
                    where: {
                        id:
                            viewing.id,
                    },
                });

            expect(
                existingViewing,
            ).not.toBeNull();
        },
    );

    it(
        "should allow assigned broker to update viewing status",
        async () => {
            if (
                !testBrokerPropertyId
            ) {
                throw new Error(
                    "Broker property is missing.",
                );
            }

            const viewing =
                await createTestViewing({
                    propertyId:
                        testBrokerPropertyId,
                });

            const response =
                await getTestApp().inject({
                    method: "PATCH",

                    url:
                        `/api/viewings/${viewing.id}/status`,

                    headers: {
                        authorization:
                            `Bearer ${brokerAToken}`,
                    },

                    payload: {
                        status:
                            "CONFIRMED",

                        notes:
                            "Confirmed by assigned broker.",
                    },
                });

            expect(
                response.statusCode,
            ).toBe(200);

            const body =
                response.json() as ApiResponse<ViewingAppointment>;

            expect(
                body.data.status,
            ).toBe("CONFIRMED");
        },
    );

    it(
        "should connect authenticated client to created viewing",
        async () => {
            if (
                !testBrokerPropertyId ||
                !testClientAId
            ) {
                throw new Error(
                    "Client test setup is incomplete.",
                );
            }

            const viewing =
                await createTestViewing(
                    {
                        propertyId:
                            testBrokerPropertyId,
                    },
                    clientAToken,
                );

            expect(
                viewing.clientId,
            ).toBe(
                testClientAId,
            );
        },
    );

    it(
        "should allow client to list only own viewings",
        async () => {
            if (
                !testBrokerPropertyId ||
                !testClientAId ||
                !testClientBId
            ) {
                throw new Error(
                    "Client test setup is incomplete.",
                );
            }

            const clientAViewing =
                await createStoredViewing({
                    propertyId:
                        testBrokerPropertyId,

                    clientId:
                        testClientAId,
                });

            const clientBViewing =
                await createStoredViewing({
                    propertyId:
                        testBrokerPropertyId,

                    clientId:
                        testClientBId,
                });

            const response =
                await getTestApp().inject({
                    method: "GET",

                    url:
                        "/api/viewings?page=1&limit=100",

                    headers: {
                        authorization:
                            `Bearer ${clientAToken}`,
                    },
                });

            expect(
                response.statusCode,
            ).toBe(200);

            const body =
                response.json() as ApiResponse<ViewingListData>;

            expect(
                body.data.items.some(
                    (item) =>
                        item.id ===
                        clientAViewing.id,
                ),
            ).toBe(true);

            expect(
                body.data.items.some(
                    (item) =>
                        item.id ===
                        clientBViewing.id,
                ),
            ).toBe(false);

            expect(
                body.data.items.every(
                    (item) =>
                        item.clientId ===
                        testClientAId,
                ),
            ).toBe(true);
        },
    );

    it(
        "should allow client to get own viewing",
        async () => {
            if (
                !testBrokerPropertyId ||
                !testClientAId
            ) {
                throw new Error(
                    "Client test setup is incomplete.",
                );
            }

            const viewing =
                await createStoredViewing({
                    propertyId:
                        testBrokerPropertyId,

                    clientId:
                        testClientAId,
                });

            const response =
                await getTestApp().inject({
                    method: "GET",

                    url:
                        `/api/viewings/${viewing.id}`,

                    headers: {
                        authorization:
                            `Bearer ${clientAToken}`,
                    },
                });

            expect(
                response.statusCode,
            ).toBe(200);

            const body =
                response.json() as ApiResponse<ViewingAppointment>;

            expect(
                body.data.id,
            ).toBe(viewing.id);

            expect(
                body.data.clientId,
            ).toBe(
                testClientAId,
            );
        },
    );

    it(
        "should prevent another client from getting viewing",
        async () => {
            if (
                !testBrokerPropertyId ||
                !testClientAId
            ) {
                throw new Error(
                    "Client test setup is incomplete.",
                );
            }

            const viewing =
                await createStoredViewing({
                    propertyId:
                        testBrokerPropertyId,

                    clientId:
                        testClientAId,
                });

            const response =
                await getTestApp().inject({
                    method: "GET",

                    url:
                        `/api/viewings/${viewing.id}`,

                    headers: {
                        authorization:
                            `Bearer ${clientBToken}`,
                    },
                });

            expect(
                response.statusCode,
            ).toBe(403);

            const body =
                response.json() as ErrorResponse;

            expect(
                body.message,
            ).toBe(
                "You can only view your own appointments.",
            );
        },
    );

    it(
        "should prevent client from updating viewing status",
        async () => {
            if (
                !testBrokerPropertyId ||
                !testClientAId
            ) {
                throw new Error(
                    "Client test setup is incomplete.",
                );
            }

            const viewing =
                await createStoredViewing({
                    propertyId:
                        testBrokerPropertyId,

                    clientId:
                        testClientAId,
                });

            const response =
                await getTestApp().inject({
                    method: "PATCH",

                    url:
                        `/api/viewings/${viewing.id}/status`,

                    headers: {
                        authorization:
                            `Bearer ${clientAToken}`,
                    },

                    payload: {
                        status:
                            "CONFIRMED",
                    },
                });

            expect(
                response.statusCode,
            ).toBe(403);

            const body =
                response.json() as ErrorResponse;

            expect(
                body.message,
            ).toBe(
                "Forbidden. You do not have permission to access this resource.",
            );

            const unchangedViewing =
                await prisma.viewingAppointment.findUnique({
                    where: {
                        id:
                            viewing.id,
                    },

                    select: {
                        status: true,
                    },
                });

            expect(
                unchangedViewing?.status,
            ).toBe("REQUESTED");
        },
    );

    it(
        "should prevent client from rescheduling viewing",
        async () => {
            if (
                !testBrokerPropertyId ||
                !testClientAId
            ) {
                throw new Error(
                    "Client test setup is incomplete.",
                );
            }

            const viewing =
                await createStoredViewing({
                    propertyId:
                        testBrokerPropertyId,

                    clientId:
                        testClientAId,
                });

            const response =
                await getTestApp().inject({
                    method: "PATCH",

                    url:
                        `/api/viewings/${viewing.id}/reschedule`,

                    headers: {
                        authorization:
                            `Bearer ${clientAToken}`,
                    },

                    payload: {
                        confirmedDate:
                            createFutureDate(25),
                    },
                });

            expect(
                response.statusCode,
            ).toBe(403);

            const unchangedViewing =
                await prisma.viewingAppointment.findUnique({
                    where: {
                        id:
                            viewing.id,
                    },

                    select: {
                        status: true,
                        confirmedDate: true,
                    },
                });

            expect(
                unchangedViewing?.status,
            ).toBe("REQUESTED");

            expect(
                unchangedViewing?.confirmedDate,
            ).toBeNull();
        },
    );

    it(
        "should prevent client from deleting viewing",
        async () => {
            if (
                !testBrokerPropertyId ||
                !testClientAId
            ) {
                throw new Error(
                    "Client test setup is incomplete.",
                );
            }

            const viewing =
                await createStoredViewing({
                    propertyId:
                        testBrokerPropertyId,

                    clientId:
                        testClientAId,
                });

            const response =
                await getTestApp().inject({
                    method: "DELETE",

                    url:
                        `/api/viewings/${viewing.id}`,

                    headers: {
                        authorization:
                            `Bearer ${clientAToken}`,
                    },
                });

            expect(
                response.statusCode,
            ).toBe(403);

            const existingViewing =
                await prisma.viewingAppointment.findUnique({
                    where: {
                        id:
                            viewing.id,
                    },
                });

            expect(
                existingViewing,
            ).not.toBeNull();
        },
    );

    it(
        "should reject viewing request with a past preferred date",
        async () => {
            const response =
                await getTestApp().inject({
                    method: "POST",
                    url: "/api/viewings",
                    payload: buildViewingPayload({
                        preferredDate: createPastDate(),
                    }),
                });

            expect(response.statusCode).toBe(400);

            const body =
                response.json() as ErrorResponse;

            expect(body.message).toBe(
                "Validation error",
            );
        },
    );

    it(
        "should reject rescheduling with a past confirmed date",
        async () => {
            const viewing =
                await createTestViewing();

            const response =
                await getTestApp().inject({
                    method: "PATCH",
                    url:
                        `/api/viewings/${viewing.id}/reschedule`,
                    headers: {
                        authorization:
                            `Bearer ${adminToken}`,
                    },
                    payload: {
                        confirmedDate: createPastDate(),
                    },
                });

            expect(response.statusCode).toBe(400);

            const body =
                response.json() as ErrorResponse;

            expect(body.message).toBe(
                "Validation error",
            );

            const unchangedViewing =
                await prisma.viewingAppointment.findUnique({
                    where: {
                        id: viewing.id,
                    },
                    select: {
                        status: true,
                        confirmedDate: true,
                    },
                });

            expect(unchangedViewing?.status).toBe(
                "REQUESTED",
            );

            expect(
                unchangedViewing?.confirmedDate,
            ).toBeNull();
        },
    );

    it(
        "should reject an invalid viewing status transition",
        async () => {
            if (!testBrokerPropertyId) {
                throw new Error(
                    "Broker property is missing.",
                );
            }

            const viewing =
                await createStoredViewing({
                    propertyId: testBrokerPropertyId,
                    status: "COMPLETED",
                });

            const response =
                await getTestApp().inject({
                    method: "PATCH",
                    url:
                        `/api/viewings/${viewing.id}/status`,
                    headers: {
                        authorization:
                            `Bearer ${adminToken}`,
                    },
                    payload: {
                        status: "CONFIRMED",
                    },
                });

            expect(response.statusCode).toBe(400);

            const body =
                response.json() as ErrorResponse;

            expect(body.message).toBe(
                "Invalid viewing status transition from COMPLETED to CONFIRMED.",
            );

            const unchangedViewing =
                await prisma.viewingAppointment.findUnique({
                    where: {
                        id: viewing.id,
                    },
                    select: {
                        status: true,
                    },
                });

            expect(unchangedViewing?.status).toBe(
                "COMPLETED",
            );
        },
    );

    it(
        "should prevent rescheduling terminal viewing statuses",
        async () => {
            if (!testBrokerPropertyId) {
                throw new Error(
                    "Broker property is missing.",
                );
            }

            const terminalStatuses = [
                "COMPLETED",
                "CANCELLED",
                "DECLINED",
            ] as const;

            for (const status of terminalStatuses) {
                const viewing =
                    await createStoredViewing({
                        propertyId: testBrokerPropertyId,
                        status,
                    });

                const response =
                    await getTestApp().inject({
                        method: "PATCH",
                        url:
                            `/api/viewings/${viewing.id}/reschedule`,
                        headers: {
                            authorization:
                                `Bearer ${adminToken}`,
                        },
                        payload: {
                            confirmedDate:
                                createFutureDate(30),
                        },
                    });

                expect(response.statusCode).toBe(400);

                const body =
                    response.json() as ErrorResponse;

                expect(body.message).toBe(
                    `${status} viewing appointments cannot be rescheduled.`,
                );

                const unchangedViewing =
                    await prisma.viewingAppointment.findUnique({
                        where: {
                            id: viewing.id,
                        },
                        select: {
                            status: true,
                            confirmedDate: true,
                        },
                    });

                expect(unchangedViewing?.status).toBe(
                    status,
                );

                expect(
                    unchangedViewing?.confirmedDate,
                ).toBeNull();
            }
        },
    );

    it(
        "should create broker notification for a new viewing request",
        async () => {
            if (
                !testBrokerPropertyId ||
                !testBrokerAId
            ) {
                throw new Error(
                    "Broker test setup is incomplete.",
                );
            }

            const viewing =
                await createTestViewing({
                    propertyId: testBrokerPropertyId,
                });

            const notification =
                await prisma.notification.findFirst({
                    where: {
                        targetUserId: testBrokerAId,
                        type: "VIEWING_REQUESTED",
                        metadata: {
                            path: ["viewingId"],
                            equals: viewing.id,
                        },
                    },
                });

            expect(notification).not.toBeNull();
            expect(notification?.title).toBe(
                "New Viewing Request",
            );
        },
    );

    it(
        "should create client notification when viewing is confirmed",
        async () => {
            if (
                !testBrokerPropertyId ||
                !testClientAId
            ) {
                throw new Error(
                    "Client test setup is incomplete.",
                );
            }

            const viewing =
                await createStoredViewing({
                    propertyId: testBrokerPropertyId,
                    clientId: testClientAId,
                });

            const response =
                await getTestApp().inject({
                    method: "PATCH",
                    url:
                        `/api/viewings/${viewing.id}/status`,
                    headers: {
                        authorization:
                            `Bearer ${adminToken}`,
                    },
                    payload: {
                        status: "CONFIRMED",
                    },
                });

            expect(response.statusCode).toBe(200);

            const notification =
                await prisma.notification.findFirst({
                    where: {
                        targetUserId: testClientAId,
                        type: "VIEWING_UPDATED",
                        title: "Viewing Status Updated",
                        metadata: {
                            path: ["viewingId"],
                            equals: viewing.id,
                        },
                    },
                });

            expect(notification).not.toBeNull();
        },
    );

    it(
        "should create client notification when viewing is rescheduled",
        async () => {
            if (
                !testBrokerPropertyId ||
                !testClientAId
            ) {
                throw new Error(
                    "Client test setup is incomplete.",
                );
            }

            const viewing =
                await createStoredViewing({
                    propertyId: testBrokerPropertyId,
                    clientId: testClientAId,
                    status: "CONFIRMED",
                    confirmedDate: new Date(
                        createFutureDate(7),
                    ),
                });

            const response =
                await getTestApp().inject({
                    method: "PATCH",
                    url:
                        `/api/viewings/${viewing.id}/reschedule`,
                    headers: {
                        authorization:
                            `Bearer ${adminToken}`,
                    },
                    payload: {
                        confirmedDate: createFutureDate(15),
                    },
                });

            expect(response.statusCode).toBe(200);

            const notification =
                await prisma.notification.findFirst({
                    where: {
                        targetUserId: testClientAId,
                        type: "VIEWING_UPDATED",
                        title:
                            "Viewing Appointment Rescheduled",
                        metadata: {
                            path: ["viewingId"],
                            equals: viewing.id,
                        },
                    },
                });

            expect(notification).not.toBeNull();
        },
    );

    it(
        "should return 404 for a nonexistent viewing appointment",
        async () => {
            const response =
                await getTestApp().inject({
                    method: "GET",
                    url:
                        `/api/viewings/${randomUUID()}`,
                    headers: {
                        authorization:
                            `Bearer ${adminToken}`,
                    },
                });

            expect(response.statusCode).toBe(404);

            const body =
                response.json() as ErrorResponse;

            expect(body.message).toBe(
                "Viewing appointment not found",
            );
        },
    );
});