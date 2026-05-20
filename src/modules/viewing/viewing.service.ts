import { prisma } from "../../lib/prisma.js";
import { CreateViewingInput } from "./viewing.schema.js";
import { JwtUser } from "./viewing.middleware.js";

const viewingSelect = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    message: true,
    preferredDate: true,
    confirmedDate: true,
    status: true,
    notes: true,
    propertyId: true,
    property: {
        select: {
            id: true,
            title: true,
            price: true,
            address: true,
            barangay: true,
            city: true,
            province: true,
            status: true,
        },
    },
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
    clientId: true,
    createdAt: true,
    updatedAt: true,
};

export async function createViewingAppointment(
    input: CreateViewingInput,
    user?: JwtUser
) {
    const property = await prisma.property.findUnique({
        where: {
            id: input.propertyId,
        },
        select: {
            id: true,
            status: true,
            brokerId: true,
        },
    });

    if (!property) {
        throw new Error("Property not found.");
    }

    if (property.status !== "PUBLISHED") {
        throw new Error("Viewing can only be requested for published properties.");
    }

    return prisma.viewingAppointment.create({
        data: {
            propertyId: input.propertyId,
            brokerId: property.brokerId,
            clientId: user?.role === "CLIENT" ? user.id : undefined,

            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            phone: input.phone,
            message: input.message,
            preferredDate: input.preferredDate,
        },
        select: viewingSelect,
    });
}

export async function getViewingAppointments(
    query: {
        search?: string;
        status?: string;
        propertyId?: string;
        brokerId?: string;
        dateFrom?: Date;
        dateTo?: Date;
        page: number;
        limit: number;
    },
    user: JwtUser
) {
    const where: any = {
        ...(query.status ? { status: query.status } : {}),
        ...(query.propertyId ? { propertyId: query.propertyId } : {}),
        ...(query.brokerId ? { brokerId: query.brokerId } : {}),

        ...(query.dateFrom || query.dateTo
            ? {
                preferredDate: {
                    ...(query.dateFrom ? { gte: query.dateFrom } : {}),
                    ...(query.dateTo ? { lte: query.dateTo } : {}),
                },
            }
            : {}),

        ...(query.search
            ? {
                OR: [
                    { firstName: { contains: query.search, mode: "insensitive" } },
                    { lastName: { contains: query.search, mode: "insensitive" } },
                    { email: { contains: query.search, mode: "insensitive" } },
                    { phone: { contains: query.search, mode: "insensitive" } },
                    {
                        property: {
                            title: {
                                contains: query.search,
                                mode: "insensitive",
                            },
                        },
                    },
                ],
            }
            : {}),
    };

    if (user.role === "BROKER") {
        where.brokerId = user.id;
    }

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await prisma.$transaction([
        prisma.viewingAppointment.findMany({
            where,
            select: viewingSelect,
            orderBy: {
                preferredDate: "desc",
            },
            skip,
            take: query.limit,
        }),
        prisma.viewingAppointment.count({
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

export async function getViewingAppointmentById(id: string, user: JwtUser) {
    const viewing = await prisma.viewingAppointment.findUnique({
        where: {
            id,
        },
        select: viewingSelect,
    });

    if (!viewing) {
        return null;
    }

    if (user.role === "BROKER" && viewing.brokerId !== user.id) {
        throw new Error("You can only view your own appointments.");
    }

    return viewing;
}

export async function updateViewingStatus(
    id: string,
    input: {
        status:
        | "REQUESTED"
        | "CONFIRMED"
        | "RESCHEDULED"
        | "COMPLETED"
        | "CANCELLED"
        | "DECLINED";
        notes?: string;
    },
    user: JwtUser
) {
    const existingViewing = await prisma.viewingAppointment.findUnique({
        where: {
            id,
        },
    });

    if (!existingViewing) {
        throw new Error("Viewing appointment not found.");
    }

    if (user.role === "BROKER" && existingViewing.brokerId !== user.id) {
        throw new Error("You can only update your own appointments.");
    }

    return prisma.viewingAppointment.update({
        where: {
            id,
        },
        data: {
            status: input.status,
            notes: input.notes,
            confirmedDate:
                input.status === "CONFIRMED"
                    ? existingViewing.confirmedDate ?? existingViewing.preferredDate
                    : existingViewing.confirmedDate,
        },
        select: viewingSelect,
    });
}

export async function rescheduleViewingAppointment(
    id: string,
    input: {
        confirmedDate: Date;
        notes?: string;
    },
    user: JwtUser
) {
    const existingViewing = await prisma.viewingAppointment.findUnique({
        where: {
            id,
        },
    });

    if (!existingViewing) {
        throw new Error("Viewing appointment not found.");
    }

    if (user.role === "BROKER" && existingViewing.brokerId !== user.id) {
        throw new Error("You can only reschedule your own appointments.");
    }

    return prisma.viewingAppointment.update({
        where: {
            id,
        },
        data: {
            status: "RESCHEDULED",
            confirmedDate: input.confirmedDate,
            notes: input.notes,
        },
        select: viewingSelect,
    });
}

export async function deleteViewingAppointment(id: string, user: JwtUser) {
    const existingViewing = await prisma.viewingAppointment.findUnique({
        where: {
            id,
        },
    });

    if (!existingViewing) {
        throw new Error("Viewing appointment not found.");
    }

    if (user.role === "BROKER" && existingViewing.brokerId !== user.id) {
        throw new Error("You can only delete your own appointments.");
    }

    await prisma.viewingAppointment.delete({
        where: {
            id,
        },
    });
}