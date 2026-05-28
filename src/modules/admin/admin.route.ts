import { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";
import {
    updateUserStatusSchema,
    userIdParamsSchema,
    userListQuerySchema,
} from "./admin.schema.js";
import { requirePermission } from "../permission/permission.middleware.js";
import { buildPagination, getPaginationOffset } from "../../utils/pagination.js";

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

export async function adminRoutes(app: FastifyInstance) {
    app.get(
        "/users",
        {
            preHandler: requirePermission("MANAGE_USERS"),
            schema: {
                tags: ["Admin"],
                summary: "List users",
                security: [{ bearerAuth: [] }],
                querystring: {
                    type: "object",
                    properties: {
                        search: {
                            type: "string",
                            description: "Search by first name, last name, or email",
                        },
                        role: {
                            type: "string",
                            enum: ["ADMIN", "BROKER", "CLIENT"],
                        },
                        status: {
                            type: "string",
                            enum: ["PENDING", "APPROVED", "REJECTED", "ACTIVE", "INACTIVE"],
                        },
                        page: {
                            type: "number",
                            description: "Page number",
                        },
                        limit: {
                            type: "number",
                            description: "Items per page",
                        },
                    },
                },
            },
        },
        async (request, reply) => {
            const queryResult = userListQuerySchema.safeParse(request.query);

            if (!queryResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: queryResult.error.flatten().fieldErrors,
                });
            }

            const { search, role, status, page, limit } = queryResult.data;

            const where = {
                ...(role ? { role } : {}),
                ...(status ? { status } : {}),
                ...(search
                    ? {
                        OR: [
                            {
                                firstName: {
                                    contains: search,
                                    mode: "insensitive" as const,
                                },
                            },
                            {
                                lastName: {
                                    contains: search,
                                    mode: "insensitive" as const,
                                },
                            },
                            {
                                email: {
                                    contains: search,
                                    mode: "insensitive" as const,
                                },
                            },
                        ],
                    }
                    : {}),
            };

            const skip = getPaginationOffset(page, limit);

            const [users, total] = await prisma.$transaction([
                prisma.user.findMany({
                    where,
                    select: userSelect,
                    orderBy: {
                        createdAt: "desc",
                    },
                    skip,
                    take: limit,
                }),
                prisma.user.count({
                    where,
                }),
            ]);

            return reply.send({
                message: "Users fetched successfully",
                data: {
                    items: users,
                    pagination: buildPagination({
                        page,
                        limit,
                        total,
                    }),
                },
            });
        }
    );

    app.get(
        "/users/:id",
        {
            preHandler: requirePermission("MANAGE_USERS"),
            schema: {
                tags: ["Admin"],
                summary: "Get user by ID",
                security: [{ bearerAuth: [] }],
                params: {
                    type: "object",
                    required: ["id"],
                    properties: {
                        id: {
                            type: "string",
                            description: "User ID",
                        },
                    },
                },
            },
        },
        async (request, reply) => {
            const paramsResult = userIdParamsSchema.safeParse(request.params);

            if (!paramsResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: paramsResult.error.flatten().fieldErrors,
                });
            }

            const user = await prisma.user.findUnique({
                where: {
                    id: paramsResult.data.id,
                },
                select: userSelect,
            });

            if (!user) {
                return reply.status(404).send({
                    message: "User not found",
                });
            }

            return reply.send({
                message: "User fetched successfully",
                data: user,
            });
        }
    );

    app.patch(
        "/users/:id/approve",
        {
            preHandler: requirePermission("MANAGE_USERS"),
            schema: {
                tags: ["Admin"],
                summary: "Approve broker account",
                security: [{ bearerAuth: [] }],
                params: {
                    type: "object",
                    required: ["id"],
                    properties: {
                        id: {
                            type: "string",
                            description: "User ID",
                        },
                    },
                },
            },
        },
        async (request, reply) => {
            const paramsResult = userIdParamsSchema.safeParse(request.params);

            if (!paramsResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: paramsResult.error.flatten().fieldErrors,
                });
            }

            const existingUser = await prisma.user.findUnique({
                where: {
                    id: paramsResult.data.id,
                },
            });

            if (!existingUser) {
                return reply.status(404).send({
                    message: "User not found",
                });
            }

            const updatedUser = await prisma.user.update({
                where: {
                    id: paramsResult.data.id,
                },
                data: {
                    status: "APPROVED",
                },
                select: userSelect,
            });

            return reply.send({
                message: "User approved successfully",
                data: updatedUser,
            });
        }
    );

    app.patch(
        "/users/:id/reject",
        {
            preHandler: requirePermission("MANAGE_USERS"),
            schema: {
                tags: ["Admin"],
                summary: "Reject broker account",
                security: [{ bearerAuth: [] }],
                params: {
                    type: "object",
                    required: ["id"],
                    properties: {
                        id: {
                            type: "string",
                            description: "User ID",
                        },
                    },
                },
            },
        },
        async (request, reply) => {
            const paramsResult = userIdParamsSchema.safeParse(request.params);

            if (!paramsResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: paramsResult.error.flatten().fieldErrors,
                });
            }

            const existingUser = await prisma.user.findUnique({
                where: {
                    id: paramsResult.data.id,
                },
            });

            if (!existingUser) {
                return reply.status(404).send({
                    message: "User not found",
                });
            }

            const updatedUser = await prisma.user.update({
                where: {
                    id: paramsResult.data.id,
                },
                data: {
                    status: "REJECTED",
                },
                select: userSelect,
            });

            return reply.send({
                message: "User rejected successfully",
                data: updatedUser,
            });
        }
    );

    app.patch(
        "/users/:id/status",
        {
            preHandler: requirePermission("MANAGE_USERS"),
            schema: {
                tags: ["Admin"],
                summary: "Update user status",
                security: [{ bearerAuth: [] }],
                params: {
                    type: "object",
                    required: ["id"],
                    properties: {
                        id: {
                            type: "string",
                            description: "User ID",
                        },
                    },
                },
                body: {
                    type: "object",
                    required: ["status"],
                    properties: {
                        status: {
                            type: "string",
                            enum: ["PENDING", "APPROVED", "REJECTED", "ACTIVE", "INACTIVE"],
                        },
                    },
                },
            },
        },
        async (request, reply) => {
            const paramsResult = userIdParamsSchema.safeParse(request.params);
            const bodyResult = updateUserStatusSchema.safeParse(request.body);

            if (!paramsResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: paramsResult.error.flatten().fieldErrors,
                });
            }

            if (!bodyResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: bodyResult.error.flatten().fieldErrors,
                });
            }

            const existingUser = await prisma.user.findUnique({
                where: {
                    id: paramsResult.data.id,
                },
            });

            if (!existingUser) {
                return reply.status(404).send({
                    message: "User not found",
                });
            }

            const updatedUser = await prisma.user.update({
                where: {
                    id: paramsResult.data.id,
                },
                data: {
                    status: bodyResult.data.status,
                },
                select: userSelect,
            });

            return reply.send({
                message: "User status updated successfully",
                data: updatedUser,
            });
        }
    );

    app.delete(
        "/users/:id",
        {
            preHandler: requirePermission("MANAGE_USERS"),
            schema: {
                tags: ["Admin"],
                summary: "Delete user",
                security: [{ bearerAuth: [] }],
                params: {
                    type: "object",
                    required: ["id"],
                    properties: {
                        id: {
                            type: "string",
                            description: "User ID",
                        },
                    },
                },
            },
        },
        async (request, reply) => {
            const paramsResult = userIdParamsSchema.safeParse(request.params);

            if (!paramsResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: paramsResult.error.flatten().fieldErrors,
                });
            }

            const jwtUser = request.user as {
                id: string;
                role: string;
            };

            if (paramsResult.data.id === jwtUser.id) {
                return reply.status(400).send({
                    message: "You cannot delete your own account.",
                });
            }

            const existingUser = await prisma.user.findUnique({
                where: {
                    id: paramsResult.data.id,
                },
            });

            if (!existingUser) {
                return reply.status(404).send({
                    message: "User not found",
                });
            }

            await prisma.user.delete({
                where: {
                    id: paramsResult.data.id,
                },
            });

            return reply.send({
                message: "User deleted successfully",
            });
        }
    );
}