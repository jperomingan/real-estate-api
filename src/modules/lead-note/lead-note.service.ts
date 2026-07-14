import { prisma } from "../../lib/prisma.js";
import type {
  CreateLeadNoteInput,
  LeadNoteQuery,
  UpdateLeadNoteInput,
} from "./lead-note.schema.js";

type CurrentUser = {
  id: string;
  role: string;
};

function buildVisibilityWhere(user: CurrentUser) {
  if (user.role === "ADMIN") {
    return {};
  }

  return {
    lead: {
      OR: [
        {
          brokerId: user.id,
        },
        {
          clientId: user.id,
        },
      ],
    },
  };
}

export async function createLeadNote(
  leadId: string,
  input: CreateLeadNoteInput,
  user: CurrentUser,
) {
  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      ...(user.role === "ADMIN"
        ? {}
        : {
            OR: [
              {
                brokerId: user.id,
              },
              {
                clientId: user.id,
              },
            ],
          }),
    },
    select: {
      id: true,
    },
  });

  if (!lead) {
    throw new Error("Lead not found");
  }

  return prisma.leadNote.create({
    data: {
      leadId,
      type: input.type,
      content: input.content,
      createdByUserId: user.id,
    },
  });
}

export async function listLeadNotes(query: LeadNoteQuery, user: CurrentUser) {
  const skip = (query.page - 1) * query.limit;

  const where = {
    ...buildVisibilityWhere(user),
    ...(query.leadId
      ? {
          leadId: query.leadId,
        }
      : {}),
    ...(query.type
      ? {
          type: query.type,
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.leadNote.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),
    prisma.leadNote.count({
      where,
    }),
  ]);

  return {
    items,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getLeadNoteById(id: string, user: CurrentUser) {
  const note = await prisma.leadNote.findFirst({
    where: {
      id,
      ...buildVisibilityWhere(user),
    },
    include: {
      lead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          status: true,
        },
      },
      createdByUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!note) {
    throw new Error("Lead note not found");
  }

  return note;
}

export async function updateLeadNote(
  id: string,
  input: UpdateLeadNoteInput,
  user: CurrentUser,
) {
  const existing = await prisma.leadNote.findFirst({
    where: {
      id,
      ...buildVisibilityWhere(user),
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    throw new Error("Lead note not found");
  }

  return prisma.leadNote.update({
    where: {
      id,
    },
    data: {
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
    },
  });
}

export async function deleteLeadNote(id: string, user: CurrentUser) {
  const existing = await prisma.leadNote.findFirst({
    where: {
      id,
      ...buildVisibilityWhere(user),
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    throw new Error("Lead note not found");
  }

  await prisma.leadNote.delete({
    where: {
      id,
    },
  });

  return {
    success: true,
  };
}
