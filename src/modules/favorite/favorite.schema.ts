import { z } from "zod";

export const favoritePropertyParamsSchema = z.object({
  propertyId: z.string().trim().uuid("Property ID must be a valid UUID."),
});

export const favoriteListQuerySchema = z.object({
  search: z.string().trim().min(1, "Search must not be empty.").optional(),

  city: z.string().trim().min(1, "City must not be empty.").optional(),

  province: z.string().trim().min(1, "Province must not be empty.").optional(),

  page: z.coerce
    .number()
    .int("Page must be an integer.")
    .positive("Page must be greater than zero.")
    .default(1),

  limit: z.coerce
    .number()
    .int("Limit must be an integer.")
    .positive("Limit must be greater than zero.")
    .max(100, "Limit must not exceed 100.")
    .default(20),
});

export type FavoritePropertyParams = z.infer<
  typeof favoritePropertyParamsSchema
>;

export type FavoriteListQuery = z.infer<typeof favoriteListQuerySchema>;
