import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { prisma } from "../../lib/prisma.js";
import { JwtUser, requirePropertyManager } from "./property.middleware.js";
import {
    deletePropertyImageParamsSchema,
    propertyImageParamsSchema,
} from "./property-image.schema.js";

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
            preHandler: requirePropertyManager,
            schema: {
                tags: ["Property Images"],
                summary: "Upload property image",
                security: [{ bearerAuth: [] }],
                params: {
                    type: "object",
                    required: ["id"],
                    properties: {
                        id: { type: "string" },
                    },
                },
            },
        },
        async (request, reply) => {
            const paramsResult = propertyImageParamsSchema.safeParse(request.params);

            if (!paramsResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: paramsResult.error.flatten().fieldErrors,
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
                return reply.status(404).send({
                    message: "Property not found",
                });
            }

            if (user.role === "BROKER" && property.brokerId !== user.id) {
                return reply.status(403).send({
                    message: "You can only upload images to your own properties.",
                });
            }

            const file = await request.file();

            if (!file) {
                return reply.status(400).send({
                    message: "Image file is required.",
                });
            }

            if (!file.mimetype.startsWith("image/")) {
                return reply.status(400).send({
                    message: "Only image files are allowed.",
                });
            }

            try {
                await ensureUploadDir();

                const extension = getFileExtension(file.filename);
                const storedFilename = `${randomUUID()}${extension}`;
                const storedPath = path.join(UPLOAD_DIR, storedFilename);

                await pipeline(file.file, await fs.open(storedPath, "w").then((handle) => handle.createWriteStream()));

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

                return reply.status(201).send({
                    message: "Property image uploaded successfully",
                    data: propertyImage,
                });
            } catch (error) {
                return reply.status(400).send({
                    message:
                        error instanceof Error ? error.message : "Failed to upload image",
                });
            }
        }
    );

    app.delete(
        "/:propertyId/images/:imageId",
        {
            preHandler: requirePropertyManager,
            schema: {
                tags: ["Property Images"],
                summary: "Delete property image",
                security: [{ bearerAuth: [] }],
                params: {
                    type: "object",
                    required: ["propertyId", "imageId"],
                    properties: {
                        propertyId: { type: "string" },
                        imageId: { type: "string" },
                    },
                },
            },
        },
        async (request, reply) => {
            const paramsResult = deletePropertyImageParamsSchema.safeParse(
                request.params
            );

            if (!paramsResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: paramsResult.error.flatten().fieldErrors,
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
                return reply.status(404).send({
                    message: "Property not found",
                });
            }

            if (user.role === "BROKER" && property.brokerId !== user.id) {
                return reply.status(403).send({
                    message: "You can only delete images from your own properties.",
                });
            }

            const image = await prisma.propertyImage.findUnique({
                where: {
                    id: imageId,
                },
            });

            if (!image || image.propertyId !== propertyId) {
                return reply.status(404).send({
                    message: "Property image not found",
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

            return reply.send({
                message: "Property image deleted successfully",
            });
        }
    );
}