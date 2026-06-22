import { z } from "zod";
import {
    emptyStringToUndefined,
    normalizeOptionalEmail,
    trimString,
} from "../../utils/sanitize.js";

export const viewingStatusSchema = z.enum([
    "REQUESTED",
    "CONFIRMED",
    "RESCHEDULED",
    "COMPLETED",
    "CANCELLED",
    "DECLINED",
]);

export const createViewingSchema = z.object({
    propertyId: z.string().uuid("Invalid property ID"),

    firstName: z.preprocess(
        trimString,
        z.string().min(2, "First name is required")
    ),

    lastName: z.preprocess(
        emptyStringToUndefined,
        z.string().optional()
    ),

    email: z.preprocess(
        normalizeOptionalEmail,
        z.string().email().optional()
    ),

    phone: z.preprocess(
        trimString,
        z.string().min(5, "Phone number is required")
    ),

    message: z.preprocess(
        emptyStringToUndefined,
        z.string().optional()
    ),

    preferredDate: z.coerce.date(),
});

export const viewingIdParamsSchema = z.object({
    id: z.string().uuid("Invalid viewing ID"),
});

export const updateViewingStatusSchema = z.object({
    status: viewingStatusSchema,
    notes: z.string().optional(),
});

export const rescheduleViewingSchema = z.object({
    confirmedDate: z.coerce.date(),
    notes: z.string().optional(),
});

export const viewingListQuerySchema = z.object({
    search: z.string().optional(),
    status: viewingStatusSchema.optional(),
    propertyId: z.string().uuid().optional(),
    brokerId: z.string().uuid().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateViewingInput = z.infer<typeof createViewingSchema>;