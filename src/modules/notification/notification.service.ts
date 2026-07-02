import type {
  NotificationType,
  Prisma,
} from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

import {
  buildPagination,
  getPaginationOffset,
} from "../../utils/pagination.js";

import type { JwtUser } from "../permission/permission.types.js";

import type { NotificationListQuery } from "./notification.schema.js";

type NotificationFindManyArgs = Prisma.Args<
  typeof prisma.notification,
  "findMany"
>;

type NotificationWhereInput = NonNullable<NotificationFindManyArgs["where"]>;

type NotificationSelect = NonNullable<NotificationFindManyArgs["select"]>;

type NotificationCreateData = Prisma.Args<
  typeof prisma.notification,
  "create"
>["data"];

const notificationSelect = {
  id: true,
  targetUserId: true,
  type: true,
  title: true,
  message: true,
  metadata: true,
  isRead: true,
  createdAt: true,
  updatedAt: true,
} satisfies NotificationSelect;

export type CreateNotificationInput = {
  targetUserId: string;
  type: NotificationCreateData["type"];
  title: string;
  message: string;
  metadata?: Prisma.InputJsonValue;
};

function assertNotificationOwner(
  notification: {
    targetUserId: string;
  },
  user: JwtUser,
) {
  if (notification.targetUserId !== user.id) {
    throw new Error("You can only access your own notifications.");
  }
}

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      targetUserId: input.targetUserId,
      type: input.type,
      title: input.title,
      message: input.message,
      metadata: input.metadata,
    },

    select: notificationSelect,
  });
}

export async function getNotifications(
  query: NotificationListQuery,
  user: JwtUser,
) {
  const notificationType = query.type as NotificationType | undefined;

  const where: NotificationWhereInput = {
    targetUserId: user.id,

    ...(notificationType
      ? {
          type: notificationType,
        }
      : {}),

    ...(query.isRead !== undefined
      ? {
          isRead: query.isRead,
        }
      : {}),

    ...(query.search
      ? {
          OR: [
            {
              title: {
                contains: query.search,

                mode: "insensitive" as const,
              },
            },

            {
              message: {
                contains: query.search,

                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const skip = getPaginationOffset(query.page, query.limit);

  const [items, total] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      select: notificationSelect,

      orderBy: {
        createdAt: "desc",
      },

      skip,
      take: query.limit,
    }),

    prisma.notification.count({
      where,
    }),
  ]);

  return {
    items,

    pagination: buildPagination({
      page: query.page,

      limit: query.limit,

      total,
    }),
  };
}

export async function getUnreadNotificationCount(user: JwtUser) {
  const count = await prisma.notification.count({
    where: {
      targetUserId: user.id,
      isRead: false,
    },
  });

  return {
    count,
  };
}

export async function markNotificationAsRead(id: string, user: JwtUser) {
  const existingNotification = await prisma.notification.findUnique({
    where: {
      id,
    },

    select: {
      id: true,
      targetUserId: true,
    },
  });

  if (!existingNotification) {
    return null;
  }

  assertNotificationOwner(existingNotification, user);

  return prisma.notification.update({
    where: {
      id,
    },

    data: {
      isRead: true,
    },

    select: notificationSelect,
  });
}

export async function markAllNotificationsAsRead(user: JwtUser) {
  const result = await prisma.notification.updateMany({
    where: {
      targetUserId: user.id,
      isRead: false,
    },

    data: {
      isRead: true,
    },
  });

  return {
    updatedCount: result.count,
  };
}

export async function deleteNotification(id: string, user: JwtUser) {
  const existingNotification = await prisma.notification.findUnique({
    where: {
      id,
    },

    select: {
      id: true,
      targetUserId: true,
    },
  });

  if (!existingNotification) {
    return null;
  }

  assertNotificationOwner(existingNotification, user);

  await prisma.notification.delete({
    where: {
      id,
    },
  });

  return {
    id,
  };
}
