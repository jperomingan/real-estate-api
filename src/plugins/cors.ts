import cors from "@fastify/cors";
import { FastifyInstance } from "fastify";
import {
  allowedOrigins,
  isDevelopment,
} from "../config/env.js";

export async function corsPlugin(
  app: FastifyInstance,
) {
  await app.register(cors, {
    credentials: true,

    methods: [
      "GET",
      "HEAD",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Request-Id",
    ],

    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (
        isDevelopment &&
        origin.startsWith(
          "http://localhost",
        )
      ) {
        callback(null, true);
        return;
      }

      if (
        allowedOrigins.includes(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(
        new Error(
          `Origin not allowed by CORS: ${origin}`,
        ),
        false,
      );
    },
  });
}
