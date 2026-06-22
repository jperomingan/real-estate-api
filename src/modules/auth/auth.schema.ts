import { z } from "zod";
import {
    emptyStringToUndefined,
    normalizeEmail,
    trimString,
} from "../../utils/sanitize.js";

export const registerSchema = z.object({
    firstName: z.preprocess(
        trimString,
        z.string().min(2, "First name is required")
    ),

    lastName: z.preprocess(
        trimString,
        z.string().min(2, "Last name is required")
    ),

    email: z.preprocess(
        normalizeEmail,
        z.string().email("Invalid email address")
    ),

    password: z.string().min(8, "Password must be at least 8 characters"),

    phone: z.preprocess(emptyStringToUndefined, z.string().optional()),

    role: z.enum(["BROKER", "CLIENT"]).default("BROKER"),
});

export const loginSchema = z.object({
    email: z.preprocess(
        normalizeEmail,
        z.string().email("Invalid email address")
    ),

    password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;