import type {
  Prisma,
} from "../../generated/prisma/client.js";

import {
  prisma,
} from "../../lib/prisma.js";

import {
  buildPagination,
  getPaginationOffset,
} from "../../utils/pagination.js";

import {
  createNotification,
} from "../notification/notification.service.js";

import type {
  JwtUser,
} from "../permission/permission.types.js";

import type {
  CreateViewingInput,
  GetViewingAppointmentsQuery,
  RescheduleViewingInput,
  UpdateViewingStatusInput,
  ViewingAppointmentStatus,
} from "./viewing.schema.js";

type ViewingAppointmentFindManyArgs =
  Prisma.Args<
    typeof prisma.viewingAppointment,
    "findMany"
  >;

type ViewingAppointmentWhereInput =
  NonNullable<
    ViewingAppointmentFindManyArgs["where"]
  >;

type ViewingAppointmentSelect =
  NonNullable<
    ViewingAppointmentFindManyArgs["select"]
  >;

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
      status: true,
      price: true,
      address: true,
      barangay: true,
      city: true,
      province: true,
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
  client: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies ViewingAppointmentSelect;

type ViewingOwnershipRecord = {
  brokerId: string;
  clientId: string | null;
};

const allowedStatusTransitions: Record<
  ViewingAppointmentStatus,
  readonly ViewingAppointmentStatus[]
> = {
  REQUESTED: [
    "CONFIRMED",
    "CANCELLED",
    "DECLINED",
  ],
  CONFIRMED: [
    "COMPLETED",
    "CANCELLED",
  ],
  RESCHEDULED: [
    "CONFIRMED",
    "COMPLETED",
    "CANCELLED",
  ],
  COMPLETED: [],
  CANCELLED: [],
  DECLINED: [],
};

const terminalStatuses =
  new Set<ViewingAppointmentStatus>([
    "COMPLETED",
    "CANCELLED",
    "DECLINED",
  ]);

function assertFutureDate(
  date: Date,
  fieldName: string,
) {
  if (date.getTime() <= Date.now()) {
    throw new Error(
      `${fieldName} must be in the future.`,
    );
  }
}

function assertValidStatusTransition(
  currentStatus: ViewingAppointmentStatus,
  nextStatus: ViewingAppointmentStatus,
) {
  const allowedNextStatuses =
    allowedStatusTransitions[currentStatus];

  if (!allowedNextStatuses.includes(nextStatus)) {
    throw new Error(
      `Invalid viewing status transition from ${currentStatus} to ${nextStatus}.`,
    );
  }
}

function assertCanViewViewing(
  viewing: ViewingOwnershipRecord,
  user: JwtUser,
) {
  if (
    user.role === "BROKER" &&
    viewing.brokerId !== user.id
  ) {
    throw new Error(
      "You can only view your own appointments.",
    );
  }

  if (
    user.role === "CLIENT" &&
    viewing.clientId !== user.id
  ) {
    throw new Error(
      "You can only view your own appointments.",
    );
  }
}

function assertCanManageViewing(
  viewing: ViewingOwnershipRecord,
  user: JwtUser,
  operation:
    | "update"
    | "reschedule"
    | "delete",
) {
  if (user.role === "CLIENT") {
    if (operation === "update") {
      throw new Error(
        "Clients are not allowed to update viewing appointment statuses.",
      );
    }

    if (operation === "reschedule") {
      throw new Error(
        "Clients are not allowed to reschedule viewing appointments directly.",
      );
    }

    throw new Error(
      "Clients are not allowed to delete viewing appointments.",
    );
  }

  if (
    user.role === "BROKER" &&
    viewing.brokerId !== user.id
  ) {
    if (operation === "update") {
      throw new Error(
        "You can only update your own appointments.",
      );
    }

    if (operation === "reschedule") {
      throw new Error(
        "You can only reschedule your own appointments.",
      );
    }

    throw new Error(
      "You can only delete your own appointments.",
    );
  }
}

export async function createViewingAppointment(
  input: CreateViewingInput,
  user?: JwtUser,
) {
  assertFutureDate(
    input.preferredDate,
    "Preferred date",
  );

  const property =
    await prisma.property.findUnique({
      where: {
        id: input.propertyId,
      },
      select: {
        id: true,
        title: true,
        status: true,
        brokerId: true,
      },
    });

  if (!property) {
    throw new Error("Property not found.");
  }

  if (property.status !== "PUBLISHED") {
    throw new Error(
      "Viewing appointments can only be requested for published properties.",
    );
  }

  const viewing =
    await prisma.viewingAppointment.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        message: input.message,
        preferredDate: input.preferredDate,
        status: "REQUESTED",
        propertyId: property.id,
        brokerId: property.brokerId,
        clientId:
          user?.role === "CLIENT"
            ? user.id
            : undefined,
      },
      select: viewingSelect,
    });

  await createNotification({
    targetUserId: property.brokerId,
    type: "VIEWING_REQUESTED",
    title: "New Viewing Request",
    message:
      `${input.firstName} ${input.lastName} requested a viewing for ${property.title}.`,
    metadata: {
      viewingId: viewing.id,
      propertyId: property.id,
    },
  });

  return viewing;
}

export async function getViewingAppointments(
  query: GetViewingAppointmentsQuery,
  user: JwtUser,
) {
  const where: ViewingAppointmentWhereInput = {
    ...(query.status
      ? { status: query.status }
      : {}),
    ...(query.propertyId
      ? { propertyId: query.propertyId }
      : {}),
    ...(query.brokerId
      ? { brokerId: query.brokerId }
      : {}),
    ...(query.dateFrom || query.dateTo
      ? {
        preferredDate: {
          ...(query.dateFrom
            ? { gte: query.dateFrom }
            : {}),
          ...(query.dateTo
            ? { lte: query.dateTo }
            : {}),
        },
      }
      : {}),
    ...(query.search
      ? {
        OR: [
          {
            firstName: {
              contains: query.search,
              mode: "insensitive" as const,
            },
          },
          {
            lastName: {
              contains: query.search,
              mode: "insensitive" as const,
            },
          },
          {
            email: {
              contains: query.search,
              mode: "insensitive" as const,
            },
          },
          {
            phone: {
              contains: query.search,
              mode: "insensitive" as const,
            },
          },
          {
            property: {
              title: {
                contains: query.search,
                mode: "insensitive" as const,
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

  if (user.role === "CLIENT") {
    where.clientId = user.id;
  }

  const skip = getPaginationOffset(
    query.page,
    query.limit,
  );

  const [items, total] =
    await prisma.$transaction([
      prisma.viewingAppointment.findMany({
        where,
        select: viewingSelect,
        orderBy: {
          createdAt: "desc",
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
    pagination: buildPagination({
      page: query.page,
      limit: query.limit,
      total,
    }),
  };
}

export async function getViewingAppointmentById(
  id: string,
  user: JwtUser,
) {
  const viewing =
    await prisma.viewingAppointment.findUnique({
      where: { id },
      select: viewingSelect,
    });

  if (!viewing) {
    return null;
  }

  assertCanViewViewing(viewing, user);
  return viewing;
}

export async function updateViewingStatus(
  id: string,
  input: UpdateViewingStatusInput,
  user: JwtUser,
) {
  const existingViewing =
    await prisma.viewingAppointment.findUnique({
      where: { id },
      select: {
        id: true,
        brokerId: true,
        clientId: true,
        status: true,
        preferredDate: true,
        confirmedDate: true,
      },
    });

  if (!existingViewing) {
    throw new Error(
      "Viewing appointment not found.",
    );
  }

  assertCanManageViewing(
    existingViewing,
    user,
    "update",
  );

  assertValidStatusTransition(
    existingViewing.status,
    input.status,
  );

  const viewing =
    await prisma.viewingAppointment.update({
      where: { id },
      data: {
        status: input.status,
        ...(input.notes !== undefined
          ? { notes: input.notes }
          : {}),
        ...(input.status === "CONFIRMED"
          ? {
            confirmedDate:
              existingViewing.confirmedDate ??
              existingViewing.preferredDate,
          }
          : {}),
      },
      select: viewingSelect,
    });

  if (viewing.clientId) {
    await createNotification({
      targetUserId: viewing.clientId,
      type: "VIEWING_UPDATED",
      title: "Viewing Status Updated",
      message:
        `Your viewing appointment status is now ${viewing.status}.`,
      metadata: {
        viewingId: viewing.id,
        propertyId: viewing.propertyId,
        status: viewing.status,
      },
    });
  }

  return viewing;
}

export async function rescheduleViewingAppointment(
  id: string,
  input: RescheduleViewingInput,
  user: JwtUser,
) {
  assertFutureDate(
    input.confirmedDate,
    "Confirmed date",
  );

  const existingViewing =
    await prisma.viewingAppointment.findUnique({
      where: { id },
      select: {
        id: true,
        brokerId: true,
        clientId: true,
        status: true,
      },
    });

  if (!existingViewing) {
    throw new Error(
      "Viewing appointment not found.",
    );
  }

  assertCanManageViewing(
    existingViewing,
    user,
    "reschedule",
  );

  if (terminalStatuses.has(existingViewing.status)) {
    throw new Error(
      `${existingViewing.status} viewing appointments cannot be rescheduled.`,
    );
  }

  const viewing =
    await prisma.viewingAppointment.update({
      where: { id },
      data: {
        confirmedDate: input.confirmedDate,
        status: "RESCHEDULED",
        ...(input.notes !== undefined
          ? { notes: input.notes }
          : {}),
      },
      select: viewingSelect,
    });

  if (viewing.clientId) {
    await createNotification({
      targetUserId: viewing.clientId,
      type: "VIEWING_UPDATED",
      title:
        "Viewing Appointment Rescheduled",
      message:
        "Your viewing appointment has been rescheduled.",
      metadata: {
        viewingId: viewing.id,
        propertyId: viewing.propertyId,
        confirmedDate:
          viewing.confirmedDate
            ? viewing.confirmedDate.toISOString()
            : null,
      },
    });
  }

  return viewing;
}

export async function deleteViewingAppointment(
  id: string,
  user: JwtUser,
) {
  const existingViewing =
    await prisma.viewingAppointment.findUnique({
      where: { id },
      select: {
        id: true,
        brokerId: true,
        clientId: true,
      },
    });

  if (!existingViewing) {
    throw new Error(
      "Viewing appointment not found.",
    );
  }

  assertCanManageViewing(
    existingViewing,
    user,
    "delete",
  );

  await prisma.viewingAppointment.delete({
    where: { id },
  });
}
