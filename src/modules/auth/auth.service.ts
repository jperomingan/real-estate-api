import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";

function sanitizeUser(user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    status: string;
    phone: string | null;
    createdAt: Date;
    updatedAt: Date;
}) {
    return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}

function generateToken(user: {
    id: string;
    email: string;
    role: string;
    status: string;
}) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
        },
        env.JWT_SECRET,
        {
            expiresIn: "7d",
        },
    );
}

export const authService = {
    async register(input: RegisterInput) {
        const existingUser = await prisma.user.findUnique({
            where: {
                email: input.email,
            },
        });

        if (existingUser) {
            const error = new Error("Email is already registered");
            Object.assign(error, {
                statusCode: 409,
                code: "EMAIL_ALREADY_EXISTS",
            });
            throw error;
        }

        const passwordHash = await bcrypt.hash(input.password, 10);

        const user = await prisma.user.create({
            data: {
                firstName: input.firstName,
                lastName: input.lastName,
                email: input.email,
                passwordHash,
                phone: input.phone ?? null,
                role: "CLIENT",
                status: "ACTIVE",
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                status: true,
                phone: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
        });

        return {
            user: sanitizeUser(user),
            token,
        };
    },

    async login(input: LoginInput) {
        const user = await prisma.user.findUnique({
            where: {
                email: input.email,
            },
        });

        if (!user) {
            return null;
        }

        const isPasswordValid = await bcrypt.compare(
            input.password,
            user.passwordHash,
        );

        if (!isPasswordValid) {
            return null;
        }

        if (user.status !== "ACTIVE") {
            const error = new Error("User account is not active");
            Object.assign(error, {
                statusCode: 403,
                code: "ACCOUNT_NOT_ACTIVE",
            });
            throw error;
        }

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
        });

        return {
            user: sanitizeUser({
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                status: user.status,
                phone: user.phone,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            }),
            token,
        };
    },

    async getCurrentUser(userId: string) {
        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                status: true,
                phone: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            return null;
        }

        return sanitizeUser(user);
    },
};
