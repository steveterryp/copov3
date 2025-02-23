import { PrismaClient } from '@prisma/client';
import { UserRole } from '@/lib/types/auth';
import { POVStatus, Priority } from '@/lib/types/pov';
import { TeamRole } from '@/lib/types/team';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
    console.log('Creating dummy data...');
    // Clean existing data
    await prisma.task.deleteMany();
    await prisma.phase.deleteMany();
    await prisma.pOV.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.team.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    console.log('Creating users...');
    // Create users
    const adminUser = await prisma.user.create({
        data: {
            email: 'admin@example.com',
            name: 'Admin User',
            password: await bcrypt.hash('admin123', 10),
            role: UserRole.ADMIN,
        },
    });
    const rikaUser = await prisma.user.create({
        data: {
            email: 'rika@example.com',
            name: 'Rika Terry',
            password: await bcrypt.hash('rikrik123', 10),
            role: UserRole.USER,
        },
    });
    const chrisUser = await prisma.user.create({
        data: {
            email: 'chris@example.com',
            name: 'Chris Terry',
            password: await bcrypt.hash('chris123', 10),
            role: UserRole.USER,
        },
    });
    console.log('Creating teams...');
    // Create teams
    const emeaTeam = await prisma.team.create({
        data: {
            name: 'EMEA',
            members: {
                create: [
                    {
                        userId: rikaUser.id,
                        role: TeamRole.OWNER,
                    },
                    {
                        userId: chrisUser.id,
                        role: TeamRole.MEMBER,
                    },
                ],
            },
        },
    });
    const apacTeam = await prisma.team.create({
        data: {
            name: 'APAC',
            members: {
                create: [
                    {
                        userId: chrisUser.id,
                        role: TeamRole.OWNER,
                    },
                    {
                        userId: rikaUser.id,
                        role: TeamRole.MEMBER,
                    },
                ],
            },
        },
    });
    console.log('Creating POVs...');
    // Create POVs for Rika
    const rikaPOVs = await Promise.all([
        prisma.pOV.create({
            data: {
                title: 'EMEA Market Analysis',
                description: 'Comprehensive market analysis for EMEA region',
                status: POVStatus.IN_PROGRESS,
                priority: Priority.HIGH,
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                ownerId: rikaUser.id,
                teamId: emeaTeam.id,
            },
        }),
        prisma.pOV.create({
            data: {
                title: 'EMEA Customer Feedback',
                description: 'Analysis of customer feedback from EMEA region',
                status: POVStatus.DRAFT,
                priority: Priority.MEDIUM,
                startDate: new Date(),
                endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
                ownerId: rikaUser.id,
                teamId: emeaTeam.id,
            },
        }),
        prisma.pOV.create({
            data: {
                title: 'EMEA Sales Strategy',
                description: 'Sales strategy development for EMEA region',
                status: POVStatus.COMPLETED,
                priority: Priority.HIGH,
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                endDate: new Date(),
                ownerId: rikaUser.id,
                teamId: emeaTeam.id,
            },
        }),
    ]);
    // Create POVs for Chris
    const chrisPOVs = await Promise.all([
        prisma.pOV.create({
            data: {
                title: 'APAC Growth Strategy',
                description: 'Strategic plan for APAC market expansion',
                status: POVStatus.IN_PROGRESS,
                priority: Priority.URGENT,
                startDate: new Date(),
                endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
                ownerId: chrisUser.id,
                teamId: apacTeam.id,
            },
        }),
        prisma.pOV.create({
            data: {
                title: 'APAC Partner Network',
                description: 'Development of partner network in APAC region',
                status: POVStatus.DRAFT,
                priority: Priority.HIGH,
                startDate: new Date(),
                endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
                ownerId: chrisUser.id,
                teamId: apacTeam.id,
            },
        }),
    ]);
    // Create a POV where Rika is a team member on Chris's project
    await prisma.pOV.create({
        data: {
            title: 'Cross-Region Collaboration',
            description: 'Joint EMEA-APAC market opportunity analysis',
            status: POVStatus.IN_PROGRESS,
            priority: Priority.HIGH,
            startDate: new Date(),
            endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
            ownerId: chrisUser.id,
            teamId: emeaTeam.id, // Rika's team
        },
    });
    // Create a POV where Chris is a team member on Rika's project
    await prisma.pOV.create({
        data: {
            title: 'Global Market Strategy',
            description: 'Combined EMEA-APAC market strategy',
            status: POVStatus.DRAFT,
            priority: Priority.URGENT,
            startDate: new Date(),
            endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days from now
            ownerId: rikaUser.id,
            teamId: apacTeam.id, // Chris's team
        },
    });
    console.log('Dummy data creation completed!');
}
main()
    .catch((e) => {
    console.error('Error creating dummy data:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
