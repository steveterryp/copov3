import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function checkUser(email) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
                lastLogin: true,
                createdAt: true,
                customRole: {
                    select: {
                        name: true,
                        permissions: true
                    }
                },
                teamMembers: {
                    select: {
                        role: true,
                        team: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            },
        });
        if (!user) {
            console.log(`No user found with email: ${email}`);
            return;
        }
        console.log('User details:');
        console.log(JSON.stringify(user, null, 2));
    }
    catch (error) {
        console.error('Error checking user:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
// Check Rika's user account
checkUser('rika@example.com');
