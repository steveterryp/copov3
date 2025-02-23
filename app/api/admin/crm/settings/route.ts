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

  const settings = await prisma.cRMSettings.findFirst();

  return Response.json(settings || {
    apiUrl: "",
    apiKey: "",
    clientId: "",
    clientSecret: "",
    autoSync: true,
    syncInterval: 30,
    retryAttempts: 3,
  });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    throw new ApiError("UNAUTHORIZED", "Unauthorized");
  }

  // Check if user has admin permissions
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new ApiError("FORBIDDEN", "Insufficient permissions");
  }

  const data = await request.json();

  // Validate required fields
  if (!data.apiUrl || !data.apiKey || !data.clientId || !data.clientSecret) {
    throw new ApiError("BAD_REQUEST", "Missing required fields");
  }

  // Validate numeric fields
  if (data.syncInterval && (isNaN(data.syncInterval) || data.syncInterval < 5 || data.syncInterval > 1440)) {
    throw new ApiError("BAD_REQUEST", "Invalid sync interval");
  }

  if (data.retryAttempts && (isNaN(data.retryAttempts) || data.retryAttempts < 1 || data.retryAttempts > 10)) {
    throw new ApiError("BAD_REQUEST", "Invalid retry attempts");
  }

  // Convert string numbers to integers
  const settings = await prisma.cRMSettings.upsert({
    where: { id: "default" },
    update: {
      apiUrl: data.apiUrl,
      apiKey: data.apiKey,
      clientId: data.clientId,
      clientSecret: data.clientSecret,
      autoSync: Boolean(data.autoSync),
      syncInterval: parseInt(data.syncInterval),
      retryAttempts: parseInt(data.retryAttempts),
    },
    create: {
      id: "default",
      apiUrl: data.apiUrl,
      apiKey: data.apiKey,
      clientId: data.clientId,
      clientSecret: data.clientSecret,
      autoSync: Boolean(data.autoSync),
      syncInterval: parseInt(data.syncInterval),
      retryAttempts: parseInt(data.retryAttempts),
    },
  });

  return Response.json(settings);
}
