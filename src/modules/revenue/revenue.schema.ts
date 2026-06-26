import { z } from "zod";

export const revenuePaymentStatusSchema = z.enum([
    "UNPAID",
    "PARTIAL",
    "PAID",
]);

export const revenueCommissionStatusSchema = z.enum([
    "PENDING",
    "RELEASED",
]);

const moneySchema = z.coerce
    .number()
    .finite("Amount must be a valid number.");

const optionalNotesSchema = z
    .string()
    .trim()
    .max(
        2000,
        "Notes must not exceed 2000 characters.",
    )
    .optional();

export const createRevenueSchema = z
    .object({
        propertyId: z
            .string()
            .trim()
            .uuid(
                "Property ID must be a valid UUID.",
            ),

        leadId: z
            .string()
            .trim()
            .uuid(
                "Lead ID must be a valid UUID.",
            )
            .optional(),

        grossSaleAmount: moneySchema.positive(
            "Gross sale amount must be greater than zero.",
        ),

        commissionRate: moneySchema
            .min(
                0,
                "Commission rate must not be negative.",
            )
            .max(
                100,
                "Commission rate must not exceed 100.",
            ),

        paymentReceived: moneySchema
            .min(
                0,
                "Payment received must not be negative.",
            )
            .default(0),

        commissionStatus:
            revenueCommissionStatusSchema.default(
                "PENDING",
            ),

        saleDate: z.coerce.date(),

        notes: optionalNotesSchema,
    })
    .superRefine(
        (data, context) => {
            if (
                data.paymentReceived >
                data.grossSaleAmount
            ) {
                context.addIssue({
                    code: "custom",
                    path: ["paymentReceived"],
                    message:
                        "Payment received must not exceed the gross sale amount.",
                });
            }

            if (
                data.saleDate.getTime() >
                Date.now()
            ) {
                context.addIssue({
                    code: "custom",
                    path: ["saleDate"],
                    message:
                        "Sale date must not be in the future.",
                });
            }
        },
    );

export const revenueListQuerySchema = z
    .object({
        search: z
            .string()
            .trim()
            .min(
                1,
                "Search must not be empty.",
            )
            .optional(),

        propertyId: z
            .string()
            .trim()
            .uuid(
                "Property ID must be a valid UUID.",
            )
            .optional(),

        brokerId: z
            .string()
            .trim()
            .uuid(
                "Broker ID must be a valid UUID.",
            )
            .optional(),

        paymentStatus:
            revenuePaymentStatusSchema.optional(),

        commissionStatus:
            revenueCommissionStatusSchema.optional(),

        dateFrom:
            z.coerce.date().optional(),

        dateTo:
            z.coerce.date().optional(),

        page: z.coerce
            .number()
            .int(
                "Page must be an integer.",
            )
            .positive(
                "Page must be greater than zero.",
            )
            .default(1),

        limit: z.coerce
            .number()
            .int(
                "Limit must be an integer.",
            )
            .positive(
                "Limit must be greater than zero.",
            )
            .max(
                100,
                "Limit must not exceed 100.",
            )
            .default(20),
    })
    .refine(
        (data) =>
            !data.dateFrom ||
            !data.dateTo ||
            data.dateFrom <= data.dateTo,
        {
            path: ["dateTo"],
            message:
                "dateFrom must be earlier than or equal to dateTo.",
        },
    );

export const updatePaymentStatusSchema = z.object({
    paymentReceived: moneySchema.min(
        0,
        "Payment received must not be negative.",
    ),

    paymentStatus:
        revenuePaymentStatusSchema.optional(),
});

export const updateCommissionStatusSchema =
    z.object({
        commissionStatus:
            revenueCommissionStatusSchema,
    });

export const revenueIdParamsSchema = z.object({
    id: z
        .string()
        .trim()
        .uuid(
            "Revenue ID must be a valid UUID.",
        ),
});

export type RevenuePaymentStatus =
    z.infer<
        typeof revenuePaymentStatusSchema
    >;

export type RevenueCommissionStatus =
    z.infer<
        typeof revenueCommissionStatusSchema
    >;

export type CreateRevenueInput =
    z.infer<
        typeof createRevenueSchema
    >;

export type RevenueListQuery =
    z.infer<
        typeof revenueListQuerySchema
    >;

export type UpdatePaymentStatusInput =
    z.infer<
        typeof updatePaymentStatusSchema
    >;

export type UpdateCommissionStatusInput =
    z.infer<
        typeof updateCommissionStatusSchema
    >;

export type RevenueIdParams =
    z.infer<
        typeof revenueIdParamsSchema
    >;
