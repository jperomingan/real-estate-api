import { z } from "zod";

export const userIdParamsSchema = z.object({
    id: z.string().uuid("Invalid user ID"),
});

export const updateUserStatusSchema = z.object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "ACTIVE", "INACTIVE"]),
});

export const userListQuerySchema = z.object({
    search: z.string().optional(),
    role: z.enum(["ADMIN", "BROKER", "CLIENT"]).optional(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "ACTIVE", "INACTIVE"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});