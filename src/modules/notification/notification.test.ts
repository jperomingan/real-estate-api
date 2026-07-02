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

type NotificationItem = {
  id: string;
  targetUserId: string;
  type: string;
  title: string;
  message: string;
  metadata: unknown;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};

type NotificationListData = {
  items: NotificationItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type UnreadCountData = {
  count: number;
};

type ReadAllData = {
  updatedCount: number;
};

type DeleteNotificationData = {
  id: string;
};

describe("Notification API", () => {
  let app: FastifyInstance | undefined;

  let adminId: string | undefined;

  let brokerId: string | undefined;

  let clientAId: string | undefined;

  let clientBId: string | undefined;

  let adminToken = "";
  let brokerToken = "";
  let clientAToken = "";

  const password = "NotificationPassword123";

  const adminEmail = `notification-admin-${randomUUID()}@example.com`;

  const brokerEmail = `notification-broker-${randomUUID()}@example.com`;

  const clientAEmail = `notification-client-a-${randomUUID()}@example.com`;

  const clientBEmail = `notification-client-b-${randomUUID()}@example.com`;

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

  async function createStoredNotification({
    targetUserId,
    type = "VIEWING_UPDATED",
    title = "Test Notification",
    message = "This is a notification test message.",
    isRead = false,
  }: {
    targetUserId: string;
    type?:
      | "VIEWING_REQUESTED"
      | "VIEWING_UPDATED"
      | "LEAD_CREATED"
      | "REVENUE_UPDATED";
    title?: string;
    message?: string;
    isRead?: boolean;
  }) {
    return prisma.notification.create({
      data: {
        targetUserId,
        type,
        title,
        message,
        isRead,
        metadata: {
          testRun: true,
          referenceId: randomUUID(),
        },
      },

      select: {
        id: true,
        targetUserId: true,
        type: true,
        title: true,
        message: true,
        isRead: true,
      },
    });
  }

  beforeAll(async () => {
    app = await buildTestApp();

    const passwordHash = await bcrypt.hash(password, 10);

    const [admin, broker, clientA, clientB] = await Promise.all([
      prisma.user.create({
        data: {
          firstName: "Notification",
          lastName: "Admin",
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
          firstName: "Notification",
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
          firstName: "Notification",
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
          firstName: "Notification",
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
  }, 30_000);

  afterAll(async () => {
    try {
      const userIds = [adminId, brokerId, clientAId, clientBId].filter(
        (id): id is string => Boolean(id),
      );

      if (userIds.length > 0) {
        await prisma.notification.deleteMany({
          where: {
            targetUserId: {
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

  it("should reject listing notifications without token", async () => {
    const response = await getTestApp().inject({
      method: "GET",
      url: "/api/notifications",
    });

    expect(response.statusCode).toBe(401);
  });

  it("should allow admin to list own notifications", async () => {
    if (!adminId) {
      throw new Error("Admin setup is incomplete.");
    }

    const notification = await createStoredNotification({
      targetUserId: adminId,
      title: "Admin Notification",
    });

    const response = await getTestApp().inject({
      method: "GET",
      url: "/api/notifications",

      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as ApiResponse<NotificationListData>;

    expect(body.data.items.some((item) => item.id === notification.id)).toBe(
      true,
    );

    expect(body.data.items.every((item) => item.targetUserId === adminId)).toBe(
      true,
    );
  });

  it("should allow broker to list own notifications", async () => {
    if (!brokerId) {
      throw new Error("Broker setup is incomplete.");
    }

    const notification = await createStoredNotification({
      targetUserId: brokerId,
      title: "Broker Notification",
    });

    const response = await getTestApp().inject({
      method: "GET",
      url: "/api/notifications",

      headers: {
        authorization: `Bearer ${brokerToken}`,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as ApiResponse<NotificationListData>;

    expect(body.data.items.some((item) => item.id === notification.id)).toBe(
      true,
    );
  });

  it("should allow client to list only own notifications", async () => {
    if (!clientAId || !clientBId) {
      throw new Error("Client setup is incomplete.");
    }

    const ownNotification = await createStoredNotification({
      targetUserId: clientAId,
      title: "Client A Own Notification",
    });

    const otherNotification = await createStoredNotification({
      targetUserId: clientBId,
      title: "Client B Other Notification",
    });

    const response = await getTestApp().inject({
      method: "GET",
      url: "/api/notifications?page=1&limit=100",

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as ApiResponse<NotificationListData>;

    expect(body.data.items.some((item) => item.id === ownNotification.id)).toBe(
      true,
    );

    expect(
      body.data.items.some((item) => item.id === otherNotification.id),
    ).toBe(false);

    expect(
      body.data.items.every((item) => item.targetUserId === clientAId),
    ).toBe(true);
  });

  it("should filter notifications by unread status", async () => {
    if (!clientAId) {
      throw new Error("Client setup is incomplete.");
    }

    await createStoredNotification({
      targetUserId: clientAId,
      title: "Unread Filter Notification",
      isRead: false,
    });

    await createStoredNotification({
      targetUserId: clientAId,
      title: "Read Filter Notification",
      isRead: true,
    });

    const response = await getTestApp().inject({
      method: "GET",
      url: "/api/notifications?isRead=false&page=1&limit=100",

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as ApiResponse<NotificationListData>;

    expect(body.data.items.length).toBeGreaterThan(0);

    expect(body.data.items.every((item) => item.isRead === false)).toBe(true);
  });

  it("should filter notifications by type", async () => {
    if (!clientAId) {
      throw new Error("Client setup is incomplete.");
    }

    const notification = await createStoredNotification({
      targetUserId: clientAId,
      type: "VIEWING_REQUESTED",
      title: "Viewing Requested Type Filter",
    });

    await createStoredNotification({
      targetUserId: clientAId,
      type: "VIEWING_UPDATED",
      title: "Viewing Updated Type Filter",
    });

    const response = await getTestApp().inject({
      method: "GET",
      url: "/api/notifications?type=VIEWING_REQUESTED&page=1&limit=100",

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as ApiResponse<NotificationListData>;

    expect(body.data.items.some((item) => item.id === notification.id)).toBe(
      true,
    );

    expect(
      body.data.items.every((item) => item.type === "VIEWING_REQUESTED"),
    ).toBe(true);
  });

  it("should search notifications by title or message", async () => {
    if (!clientAId) {
      throw new Error("Client setup is incomplete.");
    }

    const notification = await createStoredNotification({
      targetUserId: clientAId,
      title: "Unique Search Alpha",
      message: "This message contains beta keyword.",
    });

    const response = await getTestApp().inject({
      method: "GET",
      url: "/api/notifications?search=beta&page=1&limit=100",

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as ApiResponse<NotificationListData>;

    expect(body.data.items.some((item) => item.id === notification.id)).toBe(
      true,
    );
  });

  it("should paginate notifications", async () => {
    if (!clientAId) {
      throw new Error("Client setup is incomplete.");
    }

    await createStoredNotification({
      targetUserId: clientAId,
      title: "Pagination Notification One",
    });

    await createStoredNotification({
      targetUserId: clientAId,
      title: "Pagination Notification Two",
    });

    const response = await getTestApp().inject({
      method: "GET",
      url: "/api/notifications?page=1&limit=1",

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as ApiResponse<NotificationListData>;

    expect(body.data.items).toHaveLength(1);

    expect(body.data.pagination.page).toBe(1);

    expect(body.data.pagination.limit).toBe(1);
  });

  it("should reject invalid notification list query", async () => {
    const response = await getTestApp().inject({
      method: "GET",
      url: "/api/notifications?page=0",

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(400);

    const body = response.json() as ErrorResponse;

    expect(body.message).toContain("page");
  });

  it("should return unread count for own notifications", async () => {
    if (!clientAId) {
      throw new Error("Client setup is incomplete.");
    }

    await createStoredNotification({
      targetUserId: clientAId,
      title: "Unread Count Notification",
      isRead: false,
    });

    const response = await getTestApp().inject({
      method: "GET",
      url: "/api/notifications/unread-count",

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as ApiResponse<UnreadCountData>;

    expect(body.data.count).toBeGreaterThan(0);
  });

  it("should mark one notification as read", async () => {
    if (!clientAId) {
      throw new Error("Client setup is incomplete.");
    }

    const notification = await createStoredNotification({
      targetUserId: clientAId,
      isRead: false,
    });

    const response = await getTestApp().inject({
      method: "PATCH",
      url: `/api/notifications/${notification.id}/read`,

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as ApiResponse<NotificationItem>;

    expect(body.data.isRead).toBe(true);
  });

  it("should prevent marking another user notification as read", async () => {
    if (!clientBId) {
      throw new Error("Client setup is incomplete.");
    }

    const notification = await createStoredNotification({
      targetUserId: clientBId,
      isRead: false,
    });

    const response = await getTestApp().inject({
      method: "PATCH",
      url: `/api/notifications/${notification.id}/read`,

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(403);

    const body = response.json() as ErrorResponse;

    expect(body.message).toBe("You can only access your own notifications.");
  });

  it("should return 404 when marking missing notification as read", async () => {
    const response = await getTestApp().inject({
      method: "PATCH",
      url: `/api/notifications/${randomUUID()}/read`,

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(404);
  });

  it("should return 400 for invalid notification ID", async () => {
    const response = await getTestApp().inject({
      method: "PATCH",
      url: "/api/notifications/invalid-notification-id/read",

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("should mark all own notifications as read", async () => {
    if (!clientAId) {
      throw new Error("Client setup is incomplete.");
    }

    await createStoredNotification({
      targetUserId: clientAId,
      title: "Read All One",
      isRead: false,
    });

    await createStoredNotification({
      targetUserId: clientAId,
      title: "Read All Two",
      isRead: false,
    });

    const response = await getTestApp().inject({
      method: "PATCH",
      url: "/api/notifications/read-all",

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as ApiResponse<ReadAllData>;

    expect(body.data.updatedCount).toBeGreaterThanOrEqual(2);

    const unreadCount = await prisma.notification.count({
      where: {
        targetUserId: clientAId,
        isRead: false,
      },
    });

    expect(unreadCount).toBe(0);
  });

  it("should delete own notification", async () => {
    if (!clientAId) {
      throw new Error("Client setup is incomplete.");
    }

    const notification = await createStoredNotification({
      targetUserId: clientAId,
    });

    const response = await getTestApp().inject({
      method: "DELETE",
      url: `/api/notifications/${notification.id}`,

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as ApiResponse<DeleteNotificationData>;

    expect(body.data.id).toBe(notification.id);

    const deletedNotification = await prisma.notification.findUnique({
      where: {
        id: notification.id,
      },
    });

    expect(deletedNotification).toBeNull();
  });

  it("should prevent deleting another user notification", async () => {
    if (!clientBId) {
      throw new Error("Client setup is incomplete.");
    }

    const notification = await createStoredNotification({
      targetUserId: clientBId,
    });

    const response = await getTestApp().inject({
      method: "DELETE",
      url: `/api/notifications/${notification.id}`,

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(403);

    const existingNotification = await prisma.notification.findUnique({
      where: {
        id: notification.id,
      },
    });

    expect(existingNotification).not.toBeNull();
  });

  it("should return 404 when deleting missing notification", async () => {
    const response = await getTestApp().inject({
      method: "DELETE",
      url: `/api/notifications/${randomUUID()}`,

      headers: {
        authorization: `Bearer ${clientAToken}`,
      },
    });

    expect(response.statusCode).toBe(404);
  });
});
