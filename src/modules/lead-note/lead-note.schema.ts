import { z } from "zod";

export const leadNoteTypeSchema = z.enum([
  "GENERAL",
  "CALL",
  "EMAIL",
  "SMS",
  "MEETING",
  "VIEWING",
  "FOLLOW_UP",
  "STATUS_UPDATE",
]);

export const createLeadNoteSchema = z.object({
  type: leadNoteTypeSchema.default("GENERAL"),
  content: z.string().min(1, "Content is required"),
});

export const updateLeadNoteSchema = z.object({
  type: leadNoteTypeSchema.optional(),
  content: z.string().min(1, "Content is required").optional(),
});

export const leadNoteQuerySchema = z.object({
  leadId: z.string().uuid().optional(),
  type: leadNoteTypeSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const leadNoteParamsSchema = z.object({
  id: z.string().uuid(),
});

export const leadNoteLeadParamsSchema = z.object({
  leadId: z.string().uuid(),
});

export type CreateLeadNoteInput = z.infer<typeof createLeadNoteSchema>;
export type UpdateLeadNoteInput = z.infer<typeof updateLeadNoteSchema>;
export type LeadNoteQuery = z.infer<typeof leadNoteQuerySchema>;
