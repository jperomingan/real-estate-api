import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { buildPagination, getPaginationOffset } from "../../utils/pagination.js";

type AuditAction =
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "APPROVE"
    | "REJECT"
    | "LOGIN"
    | "LOGOUT"
    | "STATUS_CHANGE";

type CreateAuditLogInput = {
    action: AuditAction;
    resourceType: string;
    resourceId?: string;
    description?: string;
    actorUserId?: string;
    oldValues?: Prisma.InputJsonValue;
    newValues?: Prisma.InputJsonValue;
    metadata?: Prisma.InputJsonValue;
    ipAddress?: string;
    userAgent?: string;
};

const auditLogSelect = {
    id: true,
    action: true,
    resourceType: true,
    resourceId: true,
    description: true,
    oldValues: true,
    newValues: true,
    metadata: true,
    actorUserId: true,
    actorUser: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
        },
    },
    ipAddress: true,
    userAgent: true,
    createdAt: true,
};

export async function createAuditLog(input: CreateAuditLogInput) {
    return prisma.auditLog.create({
        data: {
            action: input.action,
            resourceType: input.resourceType,
            resourceId: input.resourceId,
            description: input.description,
            actorUserId: input.actorUserId,
            oldValues: input.oldValues,
            newValues: input.newValues,
            metadata: input.metadata,
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
        },
        select: auditLogSelect,
    });
}

export async function getAuditLogs(query: {
    action?: string;
    resourceType?: string;
    resourceId?: string;
    actorUserId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page: number;
    limit: number;
}) {
    const where: any = {
        ...(query.action ? { action: query.action } : {}),
        ...(query.resourceType ? { resourceType: query.resourceType } : {}),
        ...(query.resourceId ? { resourceId: query.resourceId } : {}),
        ...(query.actorUserId ? { actorUserId: query.actorUserId } : {}),

        ...(query.dateFrom || query.dateTo
            ? {
                createdAt: {
                    ...(query.dateFrom ? { gte: query.dateFrom } : {}),
                    ...(query.dateTo ? { lte: query.dateTo } : {}),
                },
            }
            : {}),
    };

    const skip = getPaginationOffset(query.page, query.limit);

    const [items, total] = await prisma.$transaction([
        prisma.auditLog.findMany({
            where,
            select: auditLogSelect,
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take: query.limit,
        }),
        prisma.auditLog.count({
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

export async function getAuditLogById(id: string) {
    return prisma.auditLog.findUnique({
        where: {
            id,
        },
        select: auditLogSelect,
    });
}