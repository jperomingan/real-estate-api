import { z } from "zod";
import {
    emptyStringToUndefined,
    trimString,
} from "../../utils/sanitize.js";

export const propertyTypeSchema = z.enum([
    "HOUSE_AND_LOT",
    "CONDOMINIUM",
    "LOT_ONLY",
    "APARTMENT",
    "TOWNHOUSE",
    "COMMERCIAL",
    "AGRICULTURAL",
    "INDUSTRIAL",
]);

export const propertyStatusSchema = z.enum([
    "DRAFT",
    "PUBLISHED",
    "RESERVED",
    "SOLD",
    "ARCHIVED",
]);

export const createPropertySchema = z.object({
    title: z.preprocess(
        trimString,
        z.string().min(3, "Title is required")
    ),

    description: z.preprocess(
        emptyStringToUndefined,
        z.string().optional()
    ),

    type: propertyTypeSchema,
    status: propertyStatusSchema.default("DRAFT"),

    price: z.coerce.number().positive("Price must be greater than zero"),
    lotAreaSqm: z.coerce.number().positive().optional(),
    floorAreaSqm: z.coerce.number().positive().optional(),

    bedrooms: z.coerce.number().int().min(0).optional(),
    bathrooms: z.coerce.number().int().min(0).optional(),

    address: z.preprocess(
        trimString,
        z.string().min(3, "Address is required")
    ),

    barangay: z.preprocess(
        emptyStringToUndefined,
        z.string().optional()
    ),

    city: z.preprocess(
        trimString,
        z.string().min(2, "City is required")
    ),

    province: z.preprocess(
        trimString,
        z.string().min(2, "Province is required")
    ),

    zipCode: z.preprocess(
        emptyStringToUndefined,
        z.string().optional()
    ),

    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),

    brokerId: z.string().uuid().optional(),

    imageUrls: z.array(z.string().url()).optional(),
});

export const updatePropertySchema = createPropertySchema.partial();

export const propertyIdParamsSchema = z.object({
    id: z.string().uuid("Invalid property ID"),
});

export const propertyListQuerySchema = z.object({
    search: z.preprocess(
        emptyStringToUndefined,
        z.string().optional(),
    ),

    type: z.preprocess(
        emptyStringToUndefined,
        propertyTypeSchema.optional(),
    ),

    status: z.preprocess(
        emptyStringToUndefined,
        propertyStatusSchema.optional(),
    ),

    city: z.preprocess(
        emptyStringToUndefined,
        z.string().optional(),
    ),

    province: z.preprocess(
        emptyStringToUndefined,
        z.string().optional(),
    ),

    barangay: z.preprocess(
        emptyStringToUndefined,
        z.string().optional(),
    ),

    minPrice: z.preprocess(
        emptyStringToUndefined,
        z.coerce.number().optional(),
    ),

    maxPrice: z.preprocess(
        emptyStringToUndefined,
        z.coerce.number().optional(),
    ),

    minLotAreaSqm: z.preprocess(
        emptyStringToUndefined,
        z.coerce.number().optional(),
    ),

    maxLotAreaSqm: z.preprocess(
        emptyStringToUndefined,
        z.coerce.number().optional(),
    ),

    minFloorAreaSqm: z.preprocess(
        emptyStringToUndefined,
        z.coerce.number().optional(),
    ),

    maxFloorAreaSqm: z.preprocess(
        emptyStringToUndefined,
        z.coerce.number().optional(),
    ),

    bedrooms: z.preprocess(
        emptyStringToUndefined,
        z.coerce.number().int().min(0).optional(),
    ),

    bathrooms: z.preprocess(
        emptyStringToUndefined,
        z.coerce.number().int().min(0).optional(),
    ),

    sortBy: z.preprocess(
        emptyStringToUndefined,
        z.enum(["createdAt", "price", "title", "city"]).default("createdAt"),
    ),

    sortOrder: z.preprocess(
        emptyStringToUndefined,
        z.enum(["asc", "desc"]).default("desc"),
    ),

    page: z.preprocess(
        emptyStringToUndefined,
        z.coerce.number().int().min(1).default(1),
    ),

    limit: z.preprocess(
        emptyStringToUndefined,
        z.coerce.number().int().min(1).max(100).default(20),
    ),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;