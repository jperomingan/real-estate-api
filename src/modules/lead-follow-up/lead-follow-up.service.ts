import { prisma } from "../../lib/prisma.js";
import type {
  CreateLeadFollowUpInput,
  LeadFollowUpQuery,
  UpdateLeadFollowUpInput,
} from "./lead-follow-up.schema.js";

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

export async function createLeadFollowUpTask(
  leadId: string,
  input: CreateLeadFollowUpInput,
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

  return prisma.leadFollowUpTask.create({
    data: {
      title: input.title,
      description: input.description,
      priority: input.priority,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      leadId,
      assignedToUserId: input.assignedToUserId,
      createdByUserId: user.id,
    },
  });
}

export async function listLeadFollowUpTasks(
  query: LeadFollowUpQuery,
  user: CurrentUser,
) {
  const skip = (query.page - 1) * query.limit;

  const where = {
    ...buildVisibilityWhere(user),
    ...(query.leadId
      ? {
          leadId: query.leadId,
        }
      : {}),
    ...(query.status
      ? {
          status: query.status,
        }
      : {}),
    ...(query.priority
      ? {
          priority: query.priority,
        }
      : {}),
    ...(query.assignedToUserId
      ? {
          assignedToUserId: query.assignedToUserId,
        }
      : {}),
    ...(query.dueFrom || query.dueTo
      ? {
          dueDate: {
            ...(query.dueFrom ? { gte: new Date(query.dueFrom) } : {}),
            ...(query.dueTo ? { lte: new Date(query.dueTo) } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.leadFollowUpTask.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: [
        {
          dueDate: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
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
        assignedToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
    prisma.leadFollowUpTask.count({
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

export async function getLeadFollowUpTaskById(id: string, user: CurrentUser) {
  const task = await prisma.leadFollowUpTask.findFirst({
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
      assignedToUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
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

  if (!task) {
    throw new Error("Lead follow-up task not found");
  }

  return task;
}

export async function updateLeadFollowUpTask(
  id: string,
  input: UpdateLeadFollowUpInput,
  user: CurrentUser,
) {
  const existing = await prisma.leadFollowUpTask.findFirst({
    where: {
      id,
      ...buildVisibilityWhere(user),
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    throw new Error("Lead follow-up task not found");
  }

  const statusChangedToDone = input.status === "DONE";

  return prisma.leadFollowUpTask.update({
    where: {
      id,
    },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.status !== undefined
        ? {
            status: input.status,
            completedAt: statusChangedToDone ? new Date() : null,
          }
        : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.dueDate !== undefined
        ? {
            dueDate: input.dueDate ? new Date(input.dueDate) : null,
          }
        : {}),
      ...(input.assignedToUserId !== undefined
        ? {
            assignedToUserId: input.assignedToUserId,
          }
        : {}),
    },
  });
}

export async function deleteLeadFollowUpTask(id: string, user: CurrentUser) {
  const existing = await prisma.leadFollowUpTask.findFirst({
    where: {
      id,
      ...buildVisibilityWhere(user),
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    throw new Error("Lead follow-up task not found");
  }

  await prisma.leadFollowUpTask.delete({
    where: {
      id,
    },
  });

  return {
    success: true,
  };
}
