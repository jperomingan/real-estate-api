import { z } from "zod";

export const favoritePropertyParamsSchema = z.object({
    propertyId: z.string().uuid("Invalid property ID"),
});

export const favoriteListQuerySchema = z.object({
    search: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});