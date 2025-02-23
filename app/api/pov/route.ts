import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const GET = async (req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const statusParam = url.searchParams.get('status');
    const statuses = statusParam?.split(',') || [];

    // Get POVs with optional status filter
    const povs = await prisma.pOV.findMany({
      where: {
        // If statuses provided, filter by them
        ...(statuses.length > 0 ? {
          status: {
            in: statuses as any[]
          }
        } : {}),
        // Filter by user if not admin
        ...(req.headers.get('x-user-role') !== 'ADMIN' && req.headers.get('x-user-id') ? {
          OR: [
            { ownerId: req.headers.get('x-user-id') as string },
            { 
              team: { 
                members: { 
                  some: { 
                    userId: { equals: req.headers.get('x-user-id') as string }
                  } 
                } 
              } 
            }
          ]
        } : {})
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        startDate: true,
        endDate: true,
        dealId: true,
        opportunityName: true,
        customerName: true,
        lastCrmSync: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            members: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Map POVs to include source information
    const mappedPovs = povs.map(pov => ({
      ...pov,
      source: pov.dealId ? 'CRM Import' : 'Manual Creation',
      // Format dates for display
      lastCrmSync: pov.lastCrmSync?.toISOString(),
      createdAt: pov.createdAt.toISOString()
    }));

    return NextResponse.json({ 
      data: mappedPovs,
      meta: {
        total: mappedPovs.length,
        crmImported: mappedPovs.filter(p => p.dealId).length,
        manual: mappedPovs.filter(p => !p.dealId).length
      }
    });
  } catch (error) {
    console.error('[POV List Error]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch POVs' },
      { status: 500 }
    );
  }
};
