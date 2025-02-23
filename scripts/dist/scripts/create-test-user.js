import { PrismaClient } from '@prisma/client';
import { UserRole, UserStatus } from '@/lib/types/auth';
import { hash } from 'bcryptjs';
const prisma = new PrismaClient();
async function createTestUser(email, name, role) {
    try {
        // Hash password
        const hashedPassword = await hash('Trust123!!', 10);
        // Create or update test user
        const user = await prisma.user.upsert({
            where: { email: email },
            update: {
                password: hashedPassword,
                role: role,
                status: UserStatus.ACTIVE,
                name: name,
            },
            create: {
                email: email,
                name: name,
                password: hashedPassword,
                role: role,
            },
        });
        console.log(`Test ${role} user created/updated:`, user.email);
    }
    catch (error) {
        console.error(`Error creating test ${role} user:`, error);
    }
    finally {
        await prisma.$disconnect();
    }
}
async function main() {
    await createTestUser('admin@example.com', 'Admin User', UserRole.ADMIN);
    await createTestUser('rika@example.com', 'Rika Terry', UserRole.USER);
    await createTestUser('chris@example.com', 'Chris User', UserRole.USER);
}
main();
