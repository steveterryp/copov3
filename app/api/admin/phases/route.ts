import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-handler';
import { getAuthUser } from '@/lib/auth/get-auth-user';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const phases = await prisma.phaseTemplate.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        phases: {
          select: {
            id: true,
            name: true,
            type: true,
            pov: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
      },
    });

    return Response.json(phases);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const data = await req.json();
    const { name, description, type, workflow, isDefault } = data;

    const phase = await prisma.phaseTemplate.create({
      data: {
        name,
        description,
        type,
        workflow,
        isDefault: isDefault ?? false,
      },
    });

    return Response.json(phase);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const data = await req.json();
    const { id, name, description, type, workflow, isDefault } = data;

    const phase = await prisma.phaseTemplate.update({
      where: { id },
      data: {
        name,
        description,
        type,
        workflow,
        isDefault,
      },
    });

    return Response.json(phase);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response('Missing phase template ID', { status: 400 });
    }

    await prisma.phaseTemplate.delete({
      where: { id },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
