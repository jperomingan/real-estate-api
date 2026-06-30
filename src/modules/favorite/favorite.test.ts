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

type ErrorResponse = {
  success?: boolean;
  message: string;

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

type FavoriteItem = {
  id: string;
  userId: string;
  propertyId: string;

  property: {
    id: string;
    title: string;
    status: string;
    city: string;
    province: string;
  };

  createdAt: string;
};

type FavoriteListData = {
  items: FavoriteItem[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type FavoriteStatusData = {
  propertyId: string;
  isFavorited: boolean;
};

describe("Favorite API", () => {
  let app: FastifyInstance | undefined;

  let adminId: string | undefined;

  let brokerId: string | undefined;

  let clientAId: string | undefined;

  let clientBId: string | undefined;

  let adminToken = "";
  let brokerToken = "";
  let clientAToken = "";
  let clientBToken = "";

  const createdPropertyIds: string[] = [];

  const password = "FavoritePassword123";

  const adminEmail = `favorite-admin-${randomUUID()}@example.com`;

  const brokerEmail = `favorite-broker-${randomUUID()}@example.com`;

  const clientAEmail = `favorite-client-a-${randomUUID()}@example.com`;

  const clientBEmail = `favorite-client-b-${randomUUID()}@example.com`;

  function getTestApp(): FastifyInstance {
    if (!app) {
      throw new Error("Test application has not been initialized.");
    }

    return app;
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
    title = `Favorite Property ${randomUUID()}`,

    status = "PUBLISHED",

    city = "Cebu City",

    province = "Cebu",
  }: {
    title?: string;

    status?: "DRAFT" | "PUBLISHED" | "RESERVED" | "SOLD" | "ARCHIVED";

    city?: string;
    province?: string;
  } = {}) {
    if (!brokerId) {
      throw new Error("Favorite test broker is missing.");
    }

    const property = await prisma.property.create({
      data: {
        title,

        description: `Description for ${title}.`,

        type: "HOUSE_AND_LOT",

        status,

        price: 3_000_000,

        lotAreaSqm: 120,

        floorAreaSqm: 90,

        bedrooms: 3,

        bathrooms: 2,

        address: `${randomUUID()} Favorite Street`,

        barangay: "Lahug",

        city,

        province,

        zipCode: "6000",

        brokerId,
      },

      select: {
        id: true,
        title: true,
        status: true,
        city: true,
        province: true,
      },
    });

    createdPropertyIds.push(property.id);

    return property;
  }

  async function createStoredFavorite(userId: string, propertyId: string) {
    return prisma.propertyFavorite.create({
      data: {
        userId,
        propertyId,
      },

      select: {
        id: true,
        userId: true,
        propertyId: true,
      },
    });
  }

  beforeAll(async () => {
    app = await buildTestApp();

    const passwordHash = await bcrypt.hash(password, 10);

    const [admin, broker, clientA, clientB] = await Promise.all([
      prisma.user.create({
        data: {
          firstName: "Favorite",

          lastName: "Administrator",

          email: adminEmail,

          passwordHash,

          phone: "09170002000",

          role: "ADMIN",

          status: "ACTIVE",
        },

        select: {
          id: true,
        },
      }),

      prisma.user.create({
        data: {
          firstName: "Favorite",

          lastName: "Broker",

          email: brokerEmail,

          passwordHash,

          phone: "09170002001",

          role: "BROKER",

          status: "ACTIVE",
        },

        select: {
          id: true,
        },
      }),

      prisma.user.create({
        data: {
          firstName: "Favorite",

          lastName: "Client A",

          email: clientAEmail,

          passwordHash,

          phone: "09170002002",

          role: "CLIENT",

          status: "ACTIVE",
        },

        select: {
          id: true,
        },
      }),

      prisma.user.create({
        data: {
          firstName: "Favorite",

          lastName: "Client B",

          email: clientBEmail,

          passwordHash,

          phone: "09170002003",

          role: "CLIENT",

          status: "ACTIVE",
        },

        select: {
          id: true,
        },
      }),
    ]);

    adminId = admin.id;

    brokerId = broker.id;

    clientAId = clientA.id;

    clientBId = clientB.id;

    adminToken = await login(adminEmail);

    brokerToken = await login(brokerEmail);

    clientAToken = await login(clientAEmail);

    clientBToken = await login(clientBEmail);
  }, 30_000);

  afterAll(async () => {
    try {
      const userIds = [adminId, brokerId, clientAId, clientBId].filter(
        (id): id is string => Boolean(id),
      );

      if (userIds.length > 0 || createdPropertyIds.length > 0) {
        await prisma.propertyFavorite.deleteMany({
          where: {
            OR: [
              ...(userIds.length > 0
                ? [
                    {
                      userId: {
                        in: userIds,
                      },
                    },
                  ]
                : []),

              ...(createdPropertyIds.length > 0
                ? [
                    {
                      propertyId: {
                        in: createdPropertyIds,
                      },
                    },
                  ]
                : []),
            ],
          },
        });
      }

      if (createdPropertyIds.length > 0) {
        await prisma.property.deleteMany({
          where: {
            id: {
              in: createdPropertyIds,
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

  it("should reject listing favorites without a token", async () => {
    const response = await getTestApp().inject({
      method: "GET",
      url: "/api/favorites",
    });

    expect(response.statusCode).toBe(401);
  });

  it("should reject favorite access as broker", async () => {
    const response = await getTestApp().inject({
      method: "GET",
      url: "/api/favorites",

      headers: {
        authorization: `Bearer ${brokerToken}`,
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it("should reject favorite access as admin", async () => {
    const response = await getTestApp().inject({
      method: "GET",
      url: "/api/favorites",

      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });

    expect(response.statusCode).toBe(403);

    const body = response.json() as ErrorResponse;

    expect(body.message).toBe("Only clients can manage saved properties.");
  });

  it("should save a published property as client", async () => {
    if (!clientAId) {
      throw new Error("Client A is missing.");
    }

    const property = await createProperty();

    const response = await getTestApp().inject({
      method: "POST",

      url: `/api/favorites/${property.id}`,

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(201);

    const body = response.json() as ApiResponse<FavoriteItem>;

    expect(body.data.userId).toBe(clientAId);

    expect(body.data.propertyId).toBe(property.id);

    expect(body.data.property.status).toBe("PUBLISHED");
  });

  it("should reject a duplicate favorite", async () => {
    const property = await createProperty();

    const firstResponse = await getTestApp().inject({
      method: "POST",

      url: `/api/favorites/${property.id}`,

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(firstResponse.statusCode).toBe(201);

    const duplicateResponse = await getTestApp().inject({
      method: "POST",

      url: `/api/favorites/${property.id}`,

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(duplicateResponse.statusCode).toBe(400);

    const body = duplicateResponse.json() as ErrorResponse;

    expect(body.message).toBe("Property is already in your saved list.");
  });

  it("should reject an invalid property ID", async () => {
    const response = await getTestApp().inject({
      method: "POST",

      url: "/api/favorites/invalid-property-id",

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("should return 404 for a missing property", async () => {
    const response = await getTestApp().inject({
      method: "POST",

      url: `/api/favorites/${randomUUID()}`,

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(404);

    const body = response.json() as ErrorResponse;

    expect(body.message).toBe("Property not found.");
  });

  it("should reject saving an unpublished property", async () => {
    const property = await createProperty({
      status: "DRAFT",
    });

    const response = await getTestApp().inject({
      method: "POST",

      url: `/api/favorites/${property.id}`,

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(400);

    const body = response.json() as ErrorResponse;

    expect(body.message).toBe("Only published properties can be saved.");
  });

  it("should list only the current client's favorites", async () => {
    if (!clientAId || !clientBId) {
      throw new Error("Client test setup is incomplete.");
    }

    const clientAProperty = await createProperty();

    const clientBProperty = await createProperty();

    await createStoredFavorite(clientAId, clientAProperty.id);

    await createStoredFavorite(clientBId, clientBProperty.id);

    const response = await getTestApp().inject({
      method: "GET",

      url: "/api/favorites?page=1&limit=100",

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as ApiResponse<FavoriteListData>;

    expect(
      body.data.items.some((item) => item.propertyId === clientAProperty.id),
    ).toBe(true);

    expect(
      body.data.items.some((item) => item.propertyId === clientBProperty.id),
    ).toBe(false);

    expect(body.data.items.every((item) => item.userId === clientAId)).toBe(
      true,
    );
  });

  it("should filter favorites by search", async () => {
    if (!clientAId) {
      throw new Error("Client A is missing.");
    }

    const matchingProperty = await createProperty({
      title: `Unique Seaview ${randomUUID()}`,
    });

    const otherProperty = await createProperty({
      title: `Mountain Home ${randomUUID()}`,
    });

    await createStoredFavorite(clientAId, matchingProperty.id);

    await createStoredFavorite(clientAId, otherProperty.id);

    const response = await getTestApp().inject({
      method: "GET",

      url: "/api/favorites?search=Seaview&page=1&limit=100",

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as ApiResponse<FavoriteListData>;

    expect(
      body.data.items.some((item) => item.propertyId === matchingProperty.id),
    ).toBe(true);

    expect(
      body.data.items.some((item) => item.propertyId === otherProperty.id),
    ).toBe(false);
  });

  it("should filter favorites by city", async () => {
    if (!clientAId) {
      throw new Error("Client A is missing.");
    }

    const cebuProperty = await createProperty({
      city: "Cebu City",
    });

    const mandaueProperty = await createProperty({
      city: "Mandaue City",
    });

    await createStoredFavorite(clientAId, cebuProperty.id);

    await createStoredFavorite(clientAId, mandaueProperty.id);

    const response = await getTestApp().inject({
      method: "GET",

      url: "/api/favorites?city=Mandaue&page=1&limit=100",

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as ApiResponse<FavoriteListData>;

    expect(
      body.data.items.some((item) => item.propertyId === mandaueProperty.id),
    ).toBe(true);

    expect(
      body.data.items.some((item) => item.propertyId === cebuProperty.id),
    ).toBe(false);
  });

  it("should filter favorites by province", async () => {
    if (!clientAId) {
      throw new Error("Client A is missing.");
    }

    const cebuProperty = await createProperty({
      province: "Cebu",
    });

    const boholProperty = await createProperty({
      city: "Tagbilaran City",

      province: "Bohol",
    });

    await createStoredFavorite(clientAId, cebuProperty.id);

    await createStoredFavorite(clientAId, boholProperty.id);

    const response = await getTestApp().inject({
      method: "GET",

      url: "/api/favorites?province=Bohol&page=1&limit=100",

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as ApiResponse<FavoriteListData>;

    expect(
      body.data.items.some((item) => item.propertyId === boholProperty.id),
    ).toBe(true);

    expect(
      body.data.items.some((item) => item.propertyId === cebuProperty.id),
    ).toBe(false);
  });

  it("should paginate favorites", async () => {
    if (!clientBId) {
      throw new Error("Client B is missing.");
    }

    const propertyOne = await createProperty();

    const propertyTwo = await createProperty();

    const propertyThree = await createProperty();

    await createStoredFavorite(clientBId, propertyOne.id);

    await createStoredFavorite(clientBId, propertyTwo.id);

    await createStoredFavorite(clientBId, propertyThree.id);

    const response = await getTestApp().inject({
      method: "GET",

      url: "/api/favorites?page=1&limit=2",

      headers: {
        authorization: `Bearer ${clientBToken}`,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as ApiResponse<FavoriteListData>;

    expect(body.data.items).toHaveLength(2);

    expect(body.data.pagination.page).toBe(1);

    expect(body.data.pagination.limit).toBe(2);

    expect(body.data.pagination.total).toBeGreaterThanOrEqual(3);

    expect(body.data.pagination.totalPages).toBeGreaterThanOrEqual(2);
  });

  it("should return true when property is favorited", async () => {
    if (!clientAId) {
      throw new Error("Client A is missing.");
    }

    const property = await createProperty();

    await createStoredFavorite(clientAId, property.id);

    const response = await getTestApp().inject({
      method: "GET",

      url: `/api/favorites/${property.id}/status`,

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as ApiResponse<FavoriteStatusData>;

    expect(body.data.propertyId).toBe(property.id);

    expect(body.data.isFavorited).toBe(true);
  });

  it("should return false when property is not favorited", async () => {
    const property = await createProperty();

    const response = await getTestApp().inject({
      method: "GET",

      url: `/api/favorites/${property.id}/status`,

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as ApiResponse<FavoriteStatusData>;

    expect(body.data.isFavorited).toBe(false);
  });

  it("should remove the current client's favorite", async () => {
    if (!clientAId) {
      throw new Error("Client A is missing.");
    }

    const property = await createProperty();

    await createStoredFavorite(clientAId, property.id);

    const response = await getTestApp().inject({
      method: "DELETE",

      url: `/api/favorites/${property.id}`,

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(200);

    const favorite = await prisma.propertyFavorite.findUnique({
      where: {
        userId_propertyId: {
          userId: clientAId,

          propertyId: property.id,
        },
      },
    });

    expect(favorite).toBeNull();
  });

  it("should not let one client remove another client's favorite", async () => {
    if (!clientAId || !clientBId) {
      throw new Error("Client setup is incomplete.");
    }

    const property = await createProperty();

    await createStoredFavorite(clientAId, property.id);

    const response = await getTestApp().inject({
      method: "DELETE",

      url: `/api/favorites/${property.id}`,

      headers: {
        authorization: `Bearer ${clientBToken}`,
      },
    });

    expect(response.statusCode).toBe(404);

    const favorite = await prisma.propertyFavorite.findUnique({
      where: {
        userId_propertyId: {
          userId: clientAId,

          propertyId: property.id,
        },
      },
    });

    expect(favorite).not.toBeNull();
  });

  it("should return 404 when removing a property that is not saved", async () => {
    const property = await createProperty();

    const response = await getTestApp().inject({
      method: "DELETE",

      url: `/api/favorites/${property.id}`,

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(404);

    const body = response.json() as ErrorResponse;

    expect(body.message).toBe("Property is not in your saved list.");
  });

  it("should return 404 when checking a missing property", async () => {
    const response = await getTestApp().inject({
      method: "GET",

      url: `/api/favorites/${randomUUID()}/status`,

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(404);
  });

  it("should reject invalid favorite pagination", async () => {
    const response = await getTestApp().inject({
      method: "GET",

      url: "/api/favorites?page=0&limit=101",

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(400);
  });
});
