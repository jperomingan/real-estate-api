import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../lib/hash.js";

type TestUserRole = "ADMIN" | "BROKER" | "CLIENT";

type TestUserStatus =
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "ACTIVE"
    | "INACTIVE";

type CreateTestUserInput = {
    firstName?: string;
    lastName?: string;
    email: string;
    password?: string;
    role?: TestUserRole;
    status?: TestUserStatus;
    phone?: string;
};

export async function clearTestDatabase() {
    await prisma.$transaction([
        prisma.auditLog.deleteMany(),
        prisma.notification.deleteMany(),
        prisma.propertyFavorite.deleteMany(),
        prisma.viewingAppointment.deleteMany(),
        prisma.revenue.deleteMany(),
        prisma.lead.deleteMany(),
        prisma.propertyImage.deleteMany(),
        prisma.property.deleteMany(),
        prisma.user.deleteMany(),
    ]);
}

export async function createTestUser({
    firstName = "Test",
    lastName = "User",
    email,
    password = "Password123",
    role = "CLIENT",
    status = "ACTIVE",
    phone,
}: CreateTestUserInput) {
    const passwordHash = await hashPassword(password);

    return prisma.user.create({
        data: {
            firstName,
            lastName,
            email,
            passwordHash,
            role,
            status,
            phone,
        },
    });
}

export async function createTestAdmin() {
    return createTestUser({
        firstName: "Test",
        lastName: "Admin",
        email: "admin@test.com",
        password: "AdminPassword123",
        role: "ADMIN",
        status: "ACTIVE",
    });
}

export async function createApprovedTestBroker() {
    return createTestUser({
        firstName: "Test",
        lastName: "Broker",
        email: "broker@test.com",
        password: "BrokerPassword123",
        role: "BROKER",
        status: "APPROVED",
    });
}

export async function createTestClient() {
    return createTestUser({
        firstName: "Test",
        lastName: "Client",
        email: "client@test.com",
        password: "ClientPassword123",
        role: "CLIENT",
        status: "ACTIVE",
    });
}