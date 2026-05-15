import { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { comparePassword, hashPassword } from "../../lib/hash.js";
import { LoginInput, RegisterInput } from "./auth.schema.js";

type JwtUserPayload = {
    id: string;
    email: string;
    role: string;
    status: string;
};

const userSelect = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    role: true,
    status: true,
    phone: true,
    avatarUrl: true,
    createdAt: true,
    updatedAt: true,
};

export async function registerUser(app: FastifyInstance, input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
        where: {
            email: input.email,
        },
    });

    if (existingUser) {
        throw new Error("Email is already registered");
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
        data: {
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            passwordHash,
            phone: input.phone,
            role: input.role,
            status: input.role === "BROKER" ? "PENDING" : "ACTIVE",
        },
        select: userSelect,
    });

    const token = app.jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
        } satisfies JwtUserPayload,
        {
            expiresIn: "7d",
        }
    );

    return {
        user,
        token,
    };
}

export async function loginUser(app: FastifyInstance, input: LoginInput) {
    const user = await prisma.user.findUnique({
        where: {
            email: input.email,
        },
    });

    if (!user) {
        throw new Error("Invalid email or password");
    }

    const isPasswordValid = await comparePassword(input.password, user.passwordHash);

    if (!isPasswordValid) {
        throw new Error("Invalid email or password");
    }

    if (user.status === "REJECTED" || user.status === "INACTIVE") {
        throw new Error("Your account is not allowed to login");
    }

    const token = app.jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
        } satisfies JwtUserPayload,
        {
            expiresIn: "7d",
        }
    );

    const { passwordHash, ...safeUser } = user;

    return {
        user: safeUser,
        token,
    };
}

export async function getCurrentUser(userId: string) {
    return prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: userSelect,
    });
}