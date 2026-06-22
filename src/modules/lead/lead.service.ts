import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { CreateLeadInput } from "./lead.schema.js";
import { JwtUser } from "../permission/permission.types.js";
import { createNotification } from "../notification/notification.service.js";
import { getPaginationOffset } from "../../utils/pagination.js";

const leadSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  message: true,
  source: true,
  status: true,
  budget: true,
  preferredDate: true,
  propertyId: true,
  property: {
    select: {
      id: true,
      title: true,
      price: true,
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

export async function createLead(input: CreateLeadInput, user?: JwtUser) {
  let brokerId = input.brokerId;

  if (input.propertyId) {
    const property = await prisma.property.findUnique({
      where: {
        id: input.propertyId,
      },
      select: {
        id: true,
        brokerId: true,
      },
    });

    if (!property) {
      throw new Error("Property not found.");
    }

    brokerId = property.brokerId;
  }

  if (!brokerId) {
    throw new Error("Broker is required when no property is selected.");
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
    throw new Error("Lead must be assigned to a broker or admin.");
  }

  const lead = await prisma.lead.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      message: input.message,
      source: input.source,
      budget: input.budget,
      preferredDate: input.preferredDate,
      propertyId: input.propertyId,
      brokerId,
      clientId: user?.role === "CLIENT" ? user.id : undefined,
    },
    select: leadSelect,
  });

  await createNotification({
    targetUserId: brokerId,
    type: "LEAD_CREATED",
    title: "New Lead Received",
    message: `${input.firstName} submitted a new property inquiry.`,
    metadata: {
      leadId: lead.id,
      propertyId: input.propertyId,
    },
  });

  return lead;
}

export async function getLeads(
  query: {
    search?: string;
    status?: string;
    source?: string;
    propertyId?: string;
    brokerId?: string;
    page: number;
    limit: number;
  },
  user: JwtUser,
) {
  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.source ? { source: query.source } : {}),
    ...(query.propertyId ? { propertyId: query.propertyId } : {}),
    ...(query.brokerId ? { brokerId: query.brokerId } : {}),
    ...(query.search
      ? {
          OR: [
            { firstName: { contains: query.search, mode: "insensitive" } },
            { lastName: { contains: query.search, mode: "insensitive" } },
            { email: { contains: query.search, mode: "insensitive" } },
            { phone: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  } as Prisma.LeadWhereInput;

  if (user.role === "BROKER") {
    where.brokerId = user.id;
  }

  const skip = getPaginationOffset(query.page, query.limit);

  const [items, total] = await prisma.$transaction([
    prisma.lead.findMany({
      where,
      select: leadSelect,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: query.limit,
    }),
    prisma.lead.count({
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

export async function getLeadById(id: string, user: JwtUser) {
  const lead = await prisma.lead.findUnique({
    where: {
      id,
    },
    select: leadSelect,
  });

  if (!lead) {
    return null;
  }

  if (user.role === "BROKER" && lead.brokerId !== user.id) {
    throw new Error("You can only view your own leads.");
  }

  return lead;
}

export async function updateLeadStatus(
  id: string,
  status:
    | "NEW"
    | "CONTACTED"
    | "QUALIFIED"
    | "VIEWING_SCHEDULED"
    | "NEGOTIATION"
    | "CLOSED_WON"
    | "CLOSED_LOST"
    | "ARCHIVED",
  user: JwtUser,
) {
  const existingLead = await prisma.lead.findUnique({
    where: {
      id,
    },
  });

  if (!existingLead) {
    throw new Error("Lead not found.");
  }

  if (user.role === "BROKER" && existingLead.brokerId !== user.id) {
    throw new Error("You can only update your own leads.");
  }

  return prisma.lead.update({
    where: {
      id,
    },
    data: {
      status,
    },
    select: leadSelect,
  });
}

export async function deleteLead(id: string, user: JwtUser) {
  const existingLead = await prisma.lead.findUnique({
    where: {
      id,
    },
  });

  if (!existingLead) {
    throw new Error("Lead not found.");
  }

  if (user.role === "BROKER" && existingLead.brokerId !== user.id) {
    throw new Error("You can only delete your own leads.");
  }

  await prisma.lead.delete({
    where: {
      id,
    },
  });
}
