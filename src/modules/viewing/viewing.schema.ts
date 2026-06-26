import { z } from "zod";

export const viewingStatusSchema = z.enum([
    "REQUESTED",
    "CONFIRMED",
    "RESCHEDULED",
    "COMPLETED",
    "CANCELLED",
    "DECLINED",
]);

function futureDateSchema(
    fieldName: string,
) {
    return z.coerce.date().refine(
        (date) =>
            date.getTime() >
            Date.now(),
        {
            message:
                `${fieldName} must be in the future.`,
        },
    );
}

export const createViewingSchema =
    z.object({
        propertyId: z
            .string()
            .trim()
            .uuid(
                "Property ID must be a valid UUID.",
            ),

        firstName: z
            .string()
            .trim()
            .min(
                1,
                "First name is required.",
            )
            .max(
                100,
                "First name must not exceed 100 characters.",
            ),

        lastName: z
            .string()
            .trim()
            .min(
                1,
                "Last name is required.",
            )
            .max(
                100,
                "Last name must not exceed 100 characters.",
            ),

        email: z
            .string()
            .trim()
            .email(
                "A valid email address is required.",
            )
            .max(
                255,
                "Email must not exceed 255 characters.",
            ),

        phone: z
            .string()
            .trim()
            .min(
                7,
                "Phone number must contain at least 7 characters.",
            )
            .max(
                30,
                "Phone number must not exceed 30 characters.",
            ),

        message: z
            .string()
            .trim()
            .max(
                2000,
                "Message must not exceed 2000 characters.",
            )
            .optional(),

        preferredDate:
            futureDateSchema(
                "Preferred date",
            ),
    });

export const getViewingAppointmentsQuerySchema =
    z
        .object({
            search: z
                .string()
                .trim()
                .min(
                    1,
                    "Search must not be empty.",
                )
                .optional(),

            status:
                viewingStatusSchema.optional(),

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
                message:
                    "dateFrom must be earlier than or equal to dateTo.",
                path: ["dateTo"],
            },
        );

export const updateViewingStatusSchema =
    z.object({
        status:
            viewingStatusSchema,

        notes: z
            .string()
            .trim()
            .max(
                2000,
                "Notes must not exceed 2000 characters.",
            )
            .optional(),
    });

export const rescheduleViewingSchema =
    z.object({
        confirmedDate:
            futureDateSchema(
                "Confirmed date",
            ),

        notes: z
            .string()
            .trim()
            .max(
                2000,
                "Notes must not exceed 2000 characters.",
            )
            .optional(),
    });

export const viewingAppointmentParamsSchema =
    z.object({
        id: z
            .string()
            .trim()
            .uuid(
                "Viewing appointment ID must be a valid UUID.",
            ),
    });

export type ViewingAppointmentStatus =
    z.infer<
        typeof viewingStatusSchema
    >;

export type CreateViewingInput =
    z.infer<
        typeof createViewingSchema
    >;

export type GetViewingAppointmentsQuery =
    z.infer<
        typeof getViewingAppointmentsQuerySchema
    >;

export type UpdateViewingStatusInput =
    z.infer<
        typeof updateViewingStatusSchema
    >;

export type RescheduleViewingInput =
    z.infer<
        typeof rescheduleViewingSchema
    >;

export type ViewingAppointmentParams =
    z.infer<
        typeof viewingAppointmentParamsSchema
    >;

export const createViewingAppointmentSchema =
    createViewingSchema;

export const viewingAppointmentsQuerySchema =
    getViewingAppointmentsQuerySchema;

export const viewingListQuerySchema =
    getViewingAppointmentsQuerySchema;

export const viewingIdParamsSchema =
    viewingAppointmentParamsSchema;

export const rescheduleViewingAppointmentSchema =
    rescheduleViewingSchema;
