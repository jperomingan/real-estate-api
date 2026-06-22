import { z } from "zod";

export const notificationIdParamsSchema = z.object({
    id: z.string().uuid("Invalid notification ID"),
});

export const notificationListQuerySchema = z.object({
    isRead: z.coerce.boolean().optional(),
    type: z
        .enum([
            "LEAD_CREATED",
            "VIEWING_REQUESTED",
            "VIEWING_UPDATED",
            "REVENUE_CREATED",
            "PROPERTY_UPDATED",
            "ACCOUNT_APPROVED",
            "ACCOUNT_REJECTED",
            "GENERAL",
        ])
        .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});