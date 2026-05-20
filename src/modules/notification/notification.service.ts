import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";

type CreateNotificationInput = {
    targetUserId: string;
    type:
    | "LEAD_CREATED"
    | "VIEWING_REQUESTED"
    | "VIEWING_UPDATED"
    | "REVENUE_CREATED"
    | "PROPERTY_UPDATED"
    | "ACCOUNT_APPROVED"
    | "ACCOUNT_REJECTED"
    | "GENERAL";
    title: string;
    message: string;
    metadata?: Prisma.InputJsonValue;
};

const notificationSelect = {
    id: true,
    type: true,
    title: true,
    message: true,
    isRead: true,
    metadata: true,
    targetUserId: true,
    createdAt: true,
    updatedAt: true,
};

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
    userId: string,
    query: {
        isRead?: boolean;
        type?: string;
        page: number;
        limit: number;
    }
) {
    const where: any = {
        targetUserId: userId,
        ...(query.isRead !== undefined ? { isRead: query.isRead } : {}),
        ...(query.type ? { type: query.type } : {}),
    };

    const skip = (query.page - 1) * query.limit;

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
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
        },
    };
}

export async function getUnreadNotificationCount(userId: string) {
    const count = await prisma.notification.count({
        where: {
            targetUserId: userId,
            isRead: false,
        },
    });

    return {
        unreadCount: count,
    };
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findUnique({
        where: {
            id: notificationId,
        },
    });

    if (!notification) {
        throw new Error("Notification not found.");
    }

    if (notification.targetUserId !== userId) {
        throw new Error("You can only update your own notifications.");
    }

    return prisma.notification.update({
        where: {
            id: notificationId,
        },
        data: {
            isRead: true,
        },
        select: notificationSelect,
    });
}

export async function markAllNotificationsAsRead(userId: string) {
    await prisma.notification.updateMany({
        where: {
            targetUserId: userId,
            isRead: false,
        },
        data: {
            isRead: true,
        },
    });
}

export async function deleteNotification(userId: string, notificationId: string) {
    const notification = await prisma.notification.findUnique({
        where: {
            id: notificationId,
        },
    });

    if (!notification) {
        throw new Error("Notification not found.");
    }

    if (notification.targetUserId !== userId) {
        throw new Error("You can only delete your own notifications.");
    }

    await prisma.notification.delete({
        where: {
            id: notificationId,
        },
    });
}