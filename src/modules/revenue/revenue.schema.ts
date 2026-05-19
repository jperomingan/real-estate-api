import { z } from "zod";

export const paymentStatusSchema = z.enum([
    "UNPAID",
    "PARTIAL",
    "PAID",
    "CANCELLED",
    "REFUNDED",
]);

export const commissionStatusSchema = z.enum([
    "PENDING",
    "PARTIAL",
    "RELEASED",
    "CANCELLED",
]);

export const createRevenueSchema = z.object({
    propertyId: z.string().uuid("Invalid property ID"),
    leadId: z.string().uuid("Invalid lead ID").optional(),
    brokerId: z.string().uuid("Invalid broker ID").optional(),

    grossSaleAmount: z.coerce.number().positive("Gross sale amount is required"),
    commissionRate: z.coerce.number().min(0).max(100),
    paymentReceived: z.coerce.number().min(0).default(0),

    paymentStatus: paymentStatusSchema.default("UNPAID"),
    commissionStatus: commissionStatusSchema.default("PENDING"),

    saleDate: z.coerce.date().optional(),
    notes: z.string().optional(),
});

export const revenueIdParamsSchema = z.object({
    id: z.string().uuid("Invalid revenue ID"),
});

export const updatePaymentStatusSchema = z.object({
    paymentStatus: paymentStatusSchema,
    paymentReceived: z.coerce.number().min(0).optional(),
});

export const updateCommissionStatusSchema = z.object({
    commissionStatus: commissionStatusSchema,
});

export const revenueListQuerySchema = z.object({
    search: z.string().optional(),
    propertyId: z.string().uuid().optional(),
    brokerId: z.string().uuid().optional(),
    paymentStatus: paymentStatusSchema.optional(),
    commissionStatus: commissionStatusSchema.optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateRevenueInput = z.infer<typeof createRevenueSchema>;