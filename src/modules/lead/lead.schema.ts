import { z } from "zod";
import {
    emptyStringToUndefined,
    normalizeOptionalEmail,
    trimString,
} from "../../utils/sanitize.js";

export const leadStatusSchema = z.enum([
    "NEW",
    "CONTACTED",
    "QUALIFIED",
    "VIEWING_SCHEDULED",
    "NEGOTIATION",
    "CLOSED_WON",
    "CLOSED_LOST",
    "ARCHIVED",
]);

export const leadSourceSchema = z.enum([
    "WEBSITE",
    "FACEBOOK",
    "REFERRAL",
    "WALK_IN",
    "PHONE_CALL",
    "EMAIL",
    "OTHER",
]);

export const createLeadSchema = z.object({
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

    source: leadSourceSchema.default("WEBSITE"),
    budget: z.coerce.number().positive().optional(),
    preferredDate: z.coerce.date().optional(),

    propertyId: z.string().uuid().optional(),
    brokerId: z.string().uuid().optional(),
});

export const leadIdParamsSchema = z.object({
    id: z.string().uuid("Invalid lead ID"),
});

export const updateLeadStatusSchema = z.object({
    status: leadStatusSchema,
});

export const leadListQuerySchema = z.object({
    search: z.string().optional(),
    status: leadStatusSchema.optional(),
    source: leadSourceSchema.optional(),
    propertyId: z.string().uuid().optional(),
    brokerId: z.string().uuid().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;