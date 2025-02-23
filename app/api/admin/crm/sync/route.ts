import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { ApiError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    throw new ApiError("UNAUTHORIZED", "Unauthorized");
  }

  // Check if user has admin permissions
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new ApiError("FORBIDDEN", "Insufficient permissions");
  }

  const history = await prisma.cRMSyncHistory.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100, // Limit to last 100 records
    include: {
      pov: {
        select: {
          title: true
        }
      }
    }
  });

  return Response.json(history);
}
