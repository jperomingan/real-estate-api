import { z } from "zod";

export const propertyImageParamsSchema = z.object({
    id: z.string().uuid("Invalid property ID"),
});

export const deletePropertyImageParamsSchema = z.object({
    propertyId: z.string().uuid("Invalid property ID"),
    imageId: z.string().uuid("Invalid image ID"),
});