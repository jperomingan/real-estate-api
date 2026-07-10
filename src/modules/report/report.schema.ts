import { z } from "zod";

export const reportQuerySchema = z
  .object({
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    brokerId: z.string().uuid().optional(),
  })
  .refine(
    (value) => {
      if (!value.dateFrom || !value.dateTo) {
        return true;
      }

      return new Date(value.dateFrom) <= new Date(value.dateTo);
    },
    {
      message: "dateFrom must be before or equal to dateTo",
      path: ["dateFrom"],
    },
  );

export type ReportQuery = z.infer<typeof reportQuerySchema>;
