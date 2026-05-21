import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    DATABASE_URL: z
        .string({
            error: "DATABASE_URL is required",
        })
        .min(1, "DATABASE_URL is required"),

    JWT_SECRET: z
        .string({
            error: "JWT_SECRET is required",
        })
        .min(32, "JWT_SECRET must be at least 32 characters"),

    PORT: z.coerce
        .number({
            error: "PORT must be a number",
        })
        .int("PORT must be an integer")
        .positive("PORT must be positive")
        .default(4000),

    NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),

    APP_URL: z
        .string()
        .url("APP_URL must be a valid URL")
        .default("http://localhost:4000"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error("\nEnvironment validation failed:");

    const fieldErrors = parsedEnv.error.flatten().fieldErrors;

    for (const [key, messages] of Object.entries(fieldErrors)) {
        if (messages && messages.length > 0) {
            console.error(`- ${key}: ${messages.join(", ")}`);
        }
    }

    console.error("\nPlease check your .env file.\n");

    process.exit(1);
}

export const env = parsedEnv.data;

export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";