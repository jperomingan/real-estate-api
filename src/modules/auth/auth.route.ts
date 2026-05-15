import { FastifyInstance } from "fastify";
import {
    loginController,
    meController,
    registerController,
} from "./auth.controller.js";

export async function authRoutes(app: FastifyInstance) {
    app.post("/register", registerController);

    app.post("/login", loginController);

    app.get("/me", meController);
}