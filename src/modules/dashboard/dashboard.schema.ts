import { z } from "zod";

export const dashboardSummaryQuerySchema = z
  .object({
    dateFrom: z.coerce.date().optional(),

    dateTo: z.coerce.date().optional(),

    recentLimit: z.coerce
      .number()
      .int("Recent limit must be an integer.")
      .positive("Recent limit must be greater than zero.")
      .max(20, "Recent limit must not exceed 20.")
      .default(5),
  })
  .refine(
    (data) => !data.dateFrom || !data.dateTo || data.dateFrom <= data.dateTo,
    {
      path: ["dateTo"],
      message: "dateFrom must be earlier than or equal to dateTo.",
    },
  );

export type DashboardSummaryQuery = z.infer<typeof dashboardSummaryQuerySchema>;
