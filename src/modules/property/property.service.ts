import { prisma } from "../../lib/prisma.js";
import {
    CreatePropertyInput,
    UpdatePropertyInput,
} from "./property.schema.js";
import { JwtUser } from "./property.middleware.js";

const propertySelect = {
    id: true,
    title: true,
    description: true,
    type: true,
    status: true,
    price: true,
    lotAreaSqm: true,
    floorAreaSqm: true,
    bedrooms: true,
    bathrooms: true,
    address: true,
    barangay: true,
    city: true,
    province: true,
    zipCode: true,
    latitude: true,
    longitude: true,
    brokerId: true,
    broker: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
        },
    },
    images: {
        select: {
            id: true,
            url: true,
            altText: true,
            sortOrder: true,
        },
        orderBy: {
            sortOrder: "asc" as const,
        },
    },
    createdAt: true,
    updatedAt: true,
};

export async function createProperty(input: CreatePropertyInput, user: JwtUser) {
    const brokerId = input.brokerId ?? user.id;

    if (user.role === "BROKER" && input.brokerId && input.brokerId !== user.id) {
        throw new Error("Brokers can only create properties under their own account.");
    }

    const broker = await prisma.user.findUnique({
        where: {
            id: brokerId,
        },
    });

    if (!broker) {
        throw new Error("Broker not found.");
    }

    if (broker.role !== "BROKER" && broker.role !== "ADMIN") {
        throw new Error("Selected property owner must be a broker or admin.");
    }

    return prisma.property.create({
        data: {
            title: input.title,
            description: input.description,
            type: input.type,
            status: input.status,
            price: input.price,
            lotAreaSqm: input.lotAreaSqm,
            floorAreaSqm: input.floorAreaSqm,
            bedrooms: input.bedrooms,
            bathrooms: input.bathrooms,
            address: input.address,
            barangay: input.barangay,
            city: input.city,
            province: input.province,
            zipCode: input.zipCode,
            latitude: input.latitude,
            longitude: input.longitude,
            brokerId,
            images: input.imageUrls
                ? {
                    create: input.imageUrls.map((url, index) => ({
                        url,
                        sortOrder: index,
                    })),
                }
                : undefined,
        },
        select: propertySelect,
    });
}

export async function getProperties(query: {
    search?: string;
    type?: string;
    status?: string;
    city?: string;
    province?: string;
    minPrice?: number;
    maxPrice?: number;
    page: number;
    limit: number;
}) {
    const where: any = {
        ...(query.type ? { type: query.type } : {}),
        ...(query.status ? { status: query.status } : { status: "PUBLISHED" }),
        ...(query.city ? { city: { contains: query.city, mode: "insensitive" } } : {}),
        ...(query.province
            ? { province: { contains: query.province, mode: "insensitive" } }
            : {}),
        ...(query.search
            ? {
                OR: [
                    { title: { contains: query.search, mode: "insensitive" } },
                    { description: { contains: query.search, mode: "insensitive" } },
                    { address: { contains: query.search, mode: "insensitive" } },
                    { city: { contains: query.search, mode: "insensitive" } },
                    { province: { contains: query.search, mode: "insensitive" } },
                ],
            }
            : {}),
    };

    if (query.minPrice || query.maxPrice) {
        where.price = {
            ...(query.minPrice ? { gte: query.minPrice } : {}),
            ...(query.maxPrice ? { lte: query.maxPrice } : {}),
        };
    }

    const skip = (query.page - 1) * query.limit;

    const [properties, total] = await prisma.$transaction([
        prisma.property.findMany({
            where,
            select: propertySelect,
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take: query.limit,
        }),
        prisma.property.count({
            where,
        }),
    ]);

    return {
        items: properties,
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
        },
    };
}

export async function getPropertyById(id: string) {
    return prisma.property.findUnique({
        where: {
            id,
        },
        select: propertySelect,
    });
}

export async function updateProperty(
    id: string,
    input: UpdatePropertyInput,
    user: JwtUser
) {
    const existingProperty = await prisma.property.findUnique({
        where: {
            id,
        },
    });

    if (!existingProperty) {
        throw new Error("Property not found.");
    }

    if (user.role === "BROKER" && existingProperty.brokerId !== user.id) {
        throw new Error("You can only update your own properties.");
    }

    return prisma.$transaction(async (tx) => {
        if (input.imageUrls) {
            await tx.propertyImage.deleteMany({
                where: {
                    propertyId: id,
                },
            });
        }

        return tx.property.update({
            where: {
                id,
            },
            data: {
                title: input.title,
                description: input.description,
                type: input.type,
                status: input.status,
                price: input.price,
                lotAreaSqm: input.lotAreaSqm,
                floorAreaSqm: input.floorAreaSqm,
                bedrooms: input.bedrooms,
                bathrooms: input.bathrooms,
                address: input.address,
                barangay: input.barangay,
                city: input.city,
                province: input.province,
                zipCode: input.zipCode,
                latitude: input.latitude,
                longitude: input.longitude,
                images: input.imageUrls
                    ? {
                        create: input.imageUrls.map((url, index) => ({
                            url,
                            sortOrder: index,
                        })),
                    }
                    : undefined,
            },
            select: propertySelect,
        });
    });
}

export async function deleteProperty(id: string, user: JwtUser) {
    const existingProperty = await prisma.property.findUnique({
        where: {
            id,
        },
    });

    if (!existingProperty) {
        throw new Error("Property not found.");
    }

    if (user.role === "BROKER" && existingProperty.brokerId !== user.id) {
        throw new Error("You can only delete your own properties.");
    }

    await prisma.property.delete({
        where: {
            id,
        },
    });
}