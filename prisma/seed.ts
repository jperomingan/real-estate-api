import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for seeding.");
}

const adapter = new PrismaPg({
    connectionString: databaseUrl,
});

const prisma = new PrismaClient({
    adapter,
});

async function seedAdminUser() {
    const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
    const password = process.env.SEED_ADMIN_PASSWORD ?? "AdminPassword123";
    const firstName = process.env.SEED_ADMIN_FIRST_NAME ?? "System";
    const lastName = process.env.SEED_ADMIN_LAST_NAME ?? "Admin";

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await prisma.user.upsert({
        where: {
            email,
        },
        update: {
            firstName,
            lastName,
            passwordHash,
            role: "ADMIN",
            status: "ACTIVE",
        },
        create: {
            firstName,
            lastName,
            email,
            passwordHash,
            role: "ADMIN",
            status: "ACTIVE",
        },
    });

    console.log(`Seeded admin user: ${admin.email}`);
}

async function main() {
    await seedAdminUser();
}

main()
    .then(async () => {
        await prisma.$disconnect();
        console.log("Database seed completed.");
    })
    .catch(async (error) => {
        console.error("Database seed failed:", error);
        await prisma.$disconnect();
        process.exit(1);
    });