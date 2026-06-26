import type { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

import {
  buildPagination,
  getPaginationOffset,
} from "../../utils/pagination.js";

type PropertyFavoriteFindManyArgs = Prisma.Args<
  typeof prisma.propertyFavorite,
  "findMany"
>;

type PropertyFavoriteWhereInput = NonNullable<
  PropertyFavoriteFindManyArgs["where"]
>;

type PropertyFavoriteSelect = NonNullable<
  PropertyFavoriteFindManyArgs["select"]
>;

type FavoriteListQuery = {
  search?: string;
  city?: string;
  province?: string;
  page: number;
  limit: number;
};

const favoriteSelect = {
  id: true,
  userId: true,
  propertyId: true,

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
    },
  },

  createdAt: true,
} satisfies PropertyFavoriteSelect;

/**
 * Saves a published property to a user's favorites.
 */
export async function addPropertyToFavorites(
  userId: string,
  propertyId: string,
) {
  const property = await prisma.property.findUnique({
    where: {
      id: propertyId,
    },

    select: {
      id: true,
      status: true,
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

    select: {
      id: true,
    },
  });

  if (existingFavorite) {
    throw new Error("Property is already in your saved list.");
  }

  return prisma.propertyFavorite.create({
    data: {
      userId,
      propertyId,
    },

    select: favoriteSelect,
  });
}

/**
 * Removes a property from a user's favorites.
 */
export async function removePropertyFromFavorites(
  userId: string,
  propertyId: string,
) {
  const existingFavorite = await prisma.propertyFavorite.findUnique({
    where: {
      userId_propertyId: {
        userId,
        propertyId,
      },
    },

    select: {
      id: true,
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

/**
 * Checks whether the user has saved the property.
 */
export async function getFavoriteStatus(userId: string, propertyId: string) {
  const favorite = await prisma.propertyFavorite.findUnique({
    where: {
      userId_propertyId: {
        userId,
        propertyId,
      },
    },

    select: {
      id: true,
    },
  });

  return {
    isFavorited: Boolean(favorite),
  };
}

/**
 * Returns the authenticated user's published favorite properties.
 */
export async function getUserFavorites(
  userId: string,
  query: FavoriteListQuery,
) {
  const where: PropertyFavoriteWhereInput = {
    userId,

    property: {
      status: "PUBLISHED",

      ...(query.city
        ? {
            city: {
              contains: query.city,

              mode: "insensitive" as const,
            },
          }
        : {}),

      ...(query.province
        ? {
            province: {
              contains: query.province,

              mode: "insensitive" as const,
            },
          }
        : {}),

      ...(query.search
        ? {
            OR: [
              {
                title: {
                  contains: query.search,

                  mode: "insensitive" as const,
                },
              },

              {
                description: {
                  contains: query.search,

                  mode: "insensitive" as const,
                },
              },

              {
                address: {
                  contains: query.search,

                  mode: "insensitive" as const,
                },
              },

              {
                barangay: {
                  contains: query.search,

                  mode: "insensitive" as const,
                },
              },

              {
                city: {
                  contains: query.search,

                  mode: "insensitive" as const,
                },
              },

              {
                province: {
                  contains: query.search,

                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    },
  };

  const skip = getPaginationOffset(query.page, query.limit);

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

    pagination: buildPagination({
      page: query.page,

      limit: query.limit,

      total,
    }),
  };
}

/*
 * Compatibility aliases.
 *
 * These aliases prevent route import errors if an older route version
 * uses savePropertyToFavorites() or removeFavorite().
 */
export const savePropertyToFavorites = addPropertyToFavorites;

export const addFavorite = addPropertyToFavorites;

export const removeFavorite = removePropertyFromFavorites;
