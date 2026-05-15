import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
    adapter,
});

async function main() {
    const email = "admin@example.com";
    const password = "AdminPassword123";

    const existingAdmin = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    if (existingAdmin) {
        console.log("Admin account already exists.");
        return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
        data: {
            firstName: "System",
            lastName: "Admin",
            email,
            passwordHash,
            role: "ADMIN",
            status: "ACTIVE",
        },
    });

    console.log("Admin account created successfully.");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });