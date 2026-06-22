import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { prisma } from "../../lib/prisma.js";
import {
    deletePropertyImageParamsSchema,
    propertyImageParamsSchema,
} from "./property-image.schema.js";
import {
    deletePropertyImageParamsSchemaForSwagger,
    propertyImageDeleteResponseSchema,
    propertyImageErrorResponseSchema,
    propertyImageSuccessResponseSchema,
    uploadPropertyImageBodySchema,
    uploadPropertyImageParamsSchema,
} from "./property-image.swagger.js";
import { JwtUser } from "../permission/permission.types.js";
import { requirePermission } from "../permission/permission.middleware.js";
import { sendSuccess, sendError } from "../../utils/api-response.js";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "properties");

function getFileExtension(filename: string) {
    const ext = path.extname(filename).toLowerCase();

    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

    if (!allowedExtensions.includes(ext)) {
        throw new Error("Only JPG, JPEG, PNG, and WEBP images are allowed.");
    }

    return ext;
}

async function ensureUploadDir() {
    await fs.mkdir(UPLOAD_DIR, {
        recursive: true,
    });
}

export async function propertyImageRoutes(app: FastifyInstance) {
    app.post(
        "/:id/images",
        {
            preHandler: requirePermission("MANAGE_PROPERTIES"),
            schema: {
                tags: ["Property Images"],
                summary: "Upload property image",
                description:
                    "Uploads an image file for a property. Only admins and approved brokers can upload. Brokers can upload only to their own properties.",
                security: [{ bearerAuth: [] }],
                consumes: ["multipart/form-data"],
                params: uploadPropertyImageParamsSchema,
                body: uploadPropertyImageBodySchema,
                response: {
                    201: propertyImageSuccessResponseSchema,
                    400: propertyImageErrorResponseSchema,
                    401: propertyImageErrorResponseSchema,
                    403: propertyImageErrorResponseSchema,
                    404: propertyImageErrorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const paramsResult = propertyImageParamsSchema.safeParse(request.params);

            if (!paramsResult.success) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message: "Validation error",
                    code: "VALIDATION_ERROR",
                    requestId: request.id,
                    details: paramsResult.error.flatten().fieldErrors,
                });
            }

            const propertyId = paramsResult.data.id;
            const user = request.user as JwtUser;

            const property = await prisma.property.findUnique({
                where: {
                    id: propertyId,
                },
                select: {
                    id: true,
                    brokerId: true,
                },
            });

            if (!property) {
                return sendError({
                    reply,
                    statusCode: 404,
                    message: "Property not found",
                    code: "PROPERTY_NOT_FOUND",
                    requestId: request.id,
                });
            }

            if (user.role === "BROKER" && property.brokerId !== user.id) {
                return sendError({
                    reply,
                    statusCode: 403,
                    message: "You can only upload images to your own properties.",
                    code: "PROPERTY_IMAGE_ACCESS_DENIED",
                    requestId: request.id,
                });
            }

            const file = await request.file();

            if (!file) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message: "Image file is required.",
                    code: "IMAGE_FILE_REQUIRED",
                    requestId: request.id,
                });
            }

            if (!file.mimetype.startsWith("image/")) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message: "Only image files are allowed.",
                    code: "INVALID_IMAGE_FILE",
                    requestId: request.id,
                });
            }

            try {
                await ensureUploadDir();

                const extension = getFileExtension(file.filename);
                const storedFilename = `${randomUUID()}${extension}`;
                const storedPath = path.join(UPLOAD_DIR, storedFilename);

                const fileHandle = await fs.open(storedPath, "w");

                try {
                    await pipeline(file.file, fileHandle.createWriteStream());
                } finally {
                    await fileHandle.close();
                }

                const currentImageCount = await prisma.propertyImage.count({
                    where: {
                        propertyId,
                    },
                });

                const imageUrl = `/uploads/properties/${storedFilename}`;

                const propertyImage = await prisma.propertyImage.create({
                    data: {
                        propertyId,
                        url: imageUrl,
                        altText: file.filename,
                        sortOrder: currentImageCount,
                    },
                    select: {
                        id: true,
                        url: true,
                        altText: true,
                        sortOrder: true,
                        propertyId: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                });

                return sendSuccess({
                    reply,
                    statusCode: 201,
                    message: "Property image uploaded successfully",
                    data: propertyImage,
                });
            } catch (error) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message:
                        error instanceof Error ? error.message : "Failed to upload image",
                    code: "PROPERTY_IMAGE_OPERATION_FAILED",
                    requestId: request.id,
                });
            }
        }
    );

    app.delete(
        "/:propertyId/images/:imageId",
        {
            preHandler: requirePermission("MANAGE_PROPERTIES"),
            schema: {
                tags: ["Property Images"],
                summary: "Delete property image",
                description:
                    "Deletes a property image record and removes its uploaded file if it exists locally.",
                security: [{ bearerAuth: [] }],
                params: deletePropertyImageParamsSchemaForSwagger,
                response: {
                    200: propertyImageDeleteResponseSchema,
                    400: propertyImageErrorResponseSchema,
                    401: propertyImageErrorResponseSchema,
                    403: propertyImageErrorResponseSchema,
                    404: propertyImageErrorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const paramsResult = deletePropertyImageParamsSchema.safeParse(
                request.params
            );

            if (!paramsResult.success) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message: "Validation error",
                    code: "VALIDATION_ERROR",
                    requestId: request.id,
                    details: paramsResult.error.flatten().fieldErrors,
                });
            }

            const { propertyId, imageId } = paramsResult.data;
            const user = request.user as JwtUser;

            const property = await prisma.property.findUnique({
                where: {
                    id: propertyId,
                },
                select: {
                    id: true,
                    brokerId: true,
                },
            });

            if (!property) {
                return sendError({
                    reply,
                    statusCode: 404,
                    message: "Property not found",
                    code: "PROPERTY_NOT_FOUND",
                    requestId: request.id,
                });
            }

            if (user.role === "BROKER" && property.brokerId !== user.id) {
                return sendError({
                    reply,
                    statusCode: 403,
                    message: "You can only delete images from your own properties.",
                    code: "PROPERTY_IMAGE_ACCESS_DENIED",
                    requestId: request.id,
                });
            }

            const image = await prisma.propertyImage.findUnique({
                where: {
                    id: imageId,
                },
            });

            if (!image || image.propertyId !== propertyId) {
                return sendError({
                    reply,
                    statusCode: 404,
                    message: "Property image not found",
                    code: "PROPERTY_IMAGE_NOT_FOUND",
                    requestId: request.id,
                });
            }

            await prisma.propertyImage.delete({
                where: {
                    id: imageId,
                },
            });

            const filename = image.url.replace("/uploads/properties/", "");
            const filePath = path.join(UPLOAD_DIR, filename);

            try {
                await fs.unlink(filePath);
            } catch {
                // Ignore missing local file because database record is already deleted.
            }

            return sendSuccess({
                reply,
                message: "Property image deleted successfully",
            });
        }
    );
}
