import { prisma } from "../../lib/prisma.js";

const favoriteSelect = {
    id: true,
    createdAt: true,
    property: {
        select: {
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
        },
    },
};

export async function addPropertyToFavorites(userId: string, propertyId: string) {
    const property = await prisma.property.findUnique({
        where: {
            id: propertyId,
        },
    });

    if (!property) {
        throw new Error("Property not found.");
    }

    if (property.status !== "PUBLISHED") {
        throw new Error("Only published properties can be saved.");
    }

    const existingFavorite = await prisma.propertyFavorite.findUnique({
        where: {
            userId_propertyId: {
                userId,
                propertyId,
            },
        },
    });

    if (existingFavorite) {
        throw new Error("Property is already saved.");
    }

    return prisma.propertyFavorite.create({
        data: {
            userId,
            propertyId,
        },
        select: favoriteSelect,
    });
}

export async function removePropertyFromFavorites(
    userId: string,
    propertyId: string
) {
    const existingFavorite = await prisma.propertyFavorite.findUnique({
        where: {
            userId_propertyId: {
                userId,
                propertyId,
            },
        },
    });

    if (!existingFavorite) {
        throw new Error("Property is not in your saved list.");
    }

    await prisma.propertyFavorite.delete({
        where: {
            userId_propertyId: {
                userId,
                propertyId,
            },
        },
    });
}

export async function getFavoriteStatus(userId: string, propertyId: string) {
    const favorite = await prisma.propertyFavorite.findUnique({
        where: {
            userId_propertyId: {
                userId,
                propertyId,
            },
        },
    });

    return {
        isFavorited: Boolean(favorite),
    };
}

export async function getUserFavorites(
    userId: string,
    query: {
        search?: string;
        city?: string;
        province?: string;
        page: number;
        limit: number;
    }
) {
    const where: any = {
        userId,
        property: {
            status: "PUBLISHED",
            ...(query.city
                ? {
                    city: {
                        contains: query.city,
                        mode: "insensitive",
                    },
                }
                : {}),
            ...(query.province
                ? {
                    province: {
                        contains: query.province,
                        mode: "insensitive",
                    },
                }
                : {}),
            ...(query.search
                ? {
                    OR: [
                        {
                            title: {
                                contains: query.search,
                                mode: "insensitive",
                            },
                        },
                        {
                            description: {
                                contains: query.search,
                                mode: "insensitive",
                            },
                        },
                        {
                            address: {
                                contains: query.search,
                                mode: "insensitive",
                            },
                        },
                        {
                            city: {
                                contains: query.search,
                                mode: "insensitive",
                            },
                        },
                        {
                            province: {
                                contains: query.search,
                                mode: "insensitive",
                            },
                        },
                    ],
                }
                : {}),
        },
    };

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await prisma.$transaction([
        prisma.propertyFavorite.findMany({
            where,
            select: favoriteSelect,
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take: query.limit,
        }),
        prisma.propertyFavorite.count({
            where,
        }),
    ]);

    return {
        items,
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
        },
    };
}