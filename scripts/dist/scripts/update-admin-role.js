import { PrismaClient } from '@prisma/client';
import { UserRole } from '@/lib/types/auth';
const prisma = new PrismaClient();
async function main() {
    try {
        // Update admin user's role
        const adminUser = await prisma.user.update({
            where: {
                email: 'admin@example.com'
            },
            data: {
                role: UserRole.ADMIN
            }
        });
        console.log('Updated admin user:', adminUser);
    }
    catch (error) {
        console.error('Error updating admin user:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
