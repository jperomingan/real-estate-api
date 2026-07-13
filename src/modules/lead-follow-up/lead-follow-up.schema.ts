import { z } from "zod";

export const leadFollowUpStatusSchema = z.enum([
  "PENDING",
  "DONE",
  "CANCELLED",
]);

export const leadFollowUpPrioritySchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
]);

export const createLeadFollowUpSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: leadFollowUpPrioritySchema.default("MEDIUM"),
  dueDate: z.string().datetime().optional(),
  assignedToUserId: z.string().uuid().optional(),
});

export const updateLeadFollowUpSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: leadFollowUpStatusSchema.optional(),
  priority: leadFollowUpPrioritySchema.optional(),
  dueDate: z.string().datetime().nullable().optional(),
  assignedToUserId: z.string().uuid().nullable().optional(),
});

export const leadFollowUpQuerySchema = z.object({
  leadId: z.string().uuid().optional(),
  status: leadFollowUpStatusSchema.optional(),
  priority: leadFollowUpPrioritySchema.optional(),
  assignedToUserId: z.string().uuid().optional(),
  dueFrom: z.string().datetime().optional(),
  dueTo: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const leadFollowUpParamsSchema = z.object({
  id: z.string().uuid(),
});

export const leadFollowUpLeadParamsSchema = z.object({
  leadId: z.string().uuid(),
});

export type CreateLeadFollowUpInput = z.infer<typeof createLeadFollowUpSchema>;
export type UpdateLeadFollowUpInput = z.infer<typeof updateLeadFollowUpSchema>;
export type LeadFollowUpQuery = z.infer<typeof leadFollowUpQuerySchema>;
