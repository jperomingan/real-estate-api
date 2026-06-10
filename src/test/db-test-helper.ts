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

export async function createTestProperty(brokerId: string) {
    return prisma.property.create({
        data: {
            title: "Test House and Lot",
            description: "Test property description",
            type: "HOUSE_AND_LOT",
            status: "PUBLISHED",
            price: 3500000,
            lotAreaSqm: 120,
            floorAreaSqm: 80,
            bedrooms: 3,
            bathrooms: 2,
            address: "Test Address",
            barangay: "Test Barangay",
            city: "Cebu City",
            province: "Cebu",
            zipCode: "6000",
            brokerId,
        },
    });
}

export async function createTestLead(brokerId: string, propertyId?: string) {
    return prisma.lead.create({
        data: {
            firstName: "Maria",
            lastName: "Santos",
            email: "maria@test.com",
            phone: "09123456789",
            message: "I am interested in this property.",
            source: "WEBSITE",
            status: "NEW",
            budget: 3500000,
            brokerId,
            propertyId,
        },
    });
}

export async function createTestViewing(propertyId: string, brokerId: string) {
    return prisma.viewingAppointment.create({
        data: {
            propertyId,
            brokerId,
            firstName: "Maria",
            lastName: "Santos",
            email: "maria@test.com",
            phone: "09123456789",
            message: "I want to schedule a viewing.",
            preferredDate: new Date("2026-07-01T10:00:00.000Z"),
            status: "REQUESTED",
        },
    });
}

export async function createClosedWonTestLead(
    brokerId: string,
    propertyId: string
) {
    return prisma.lead.create({
        data: {
            firstName: "Maria",
            lastName: "Santos",
            email: "maria@test.com",
            phone: "09123456789",
            message: "Closed won lead for revenue test.",
            source: "WEBSITE",
            status: "CLOSED_WON",
            budget: 3500000,
            brokerId,
            propertyId,
        },
    });
}

export async function createTestRevenue(
    propertyId: string,
    brokerId: string,
    leadId?: string
) {
    return prisma.revenue.create({
        data: {
            propertyId,
            brokerId,
            leadId,
            grossSaleAmount: 3500000,
            commissionRate: 5,
            commissionAmount: 175000,
            paymentReceived: 500000,
            paymentStatus: "PARTIAL",
            commissionStatus: "PENDING",
            saleDate: new Date("2026-07-01T00:00:00.000Z"),
            notes: "Test revenue record.",
        },
    });
}