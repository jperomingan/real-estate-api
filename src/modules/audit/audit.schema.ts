import { z } from "zod";

export const auditIdParamsSchema = z.object({
    id: z.string().uuid("Invalid audit log ID"),
});

export const auditListQuerySchema = z.object({
    action: z
        .enum([
            "CREATE",
            "UPDATE",
            "DELETE",
            "APPROVE",
            "REJECT",
            "LOGIN",
            "LOGOUT",
            "STATUS_CHANGE",
        ])
        .optional(),

    resourceType: z.string().optional(),
    resourceId: z.string().optional(),
    actorUserId: z.string().uuid().optional(),

    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),

    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});