import { z } from "zod";

export const notificationIdParamsSchema = z.object({
  id: z.string().trim().uuid("Notification ID must be a valid UUID."),
});

export const notificationListQuerySchema = z.object({
  search: z.string().trim().min(1, "Search must not be empty.").optional(),

  type: z
    .string()
    .trim()
    .min(1, "Notification type must not be empty.")
    .optional(),

  isRead: z
    .union([z.boolean(), z.literal("true"), z.literal("false")])
    .transform((value) => {
      if (typeof value === "boolean") {
        return value;
      }

      return value === "true";
    })
    .optional(),

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

export type NotificationIdParams = z.infer<typeof notificationIdParamsSchema>;

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
