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

  const mappings = await prisma.cRMFieldMapping.findMany({
    orderBy: { crmField: 'asc' }
  });

  return Response.json(mappings);
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
  if (!data.crmField || !data.localField) {
    throw new ApiError("BAD_REQUEST", "Missing required fields");
  }

  // Check for duplicate CRM field
  const existing = await prisma.cRMFieldMapping.findUnique({
    where: { crmField: data.crmField }
  });

  if (existing) {
    throw new ApiError("BAD_REQUEST", "A mapping for this CRM field already exists");
  }

  const mapping = await prisma.cRMFieldMapping.create({
    data: {
      crmField: data.crmField,
      localField: data.localField,
      transformer: data.transformer || null,
      isRequired: data.isRequired || false,
    }
  });

  return Response.json(mapping);
}

export async function PUT(request: NextRequest) {
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
  if (!data.id || !data.crmField || !data.localField) {
    throw new ApiError("BAD_REQUEST", "Missing required fields");
  }

  // Check for duplicate CRM field (excluding current record)
  const existing = await prisma.cRMFieldMapping.findFirst({
    where: {
      crmField: data.crmField,
      id: { not: data.id }
    }
  });

  if (existing) {
    throw new ApiError("BAD_REQUEST", "A mapping for this CRM field already exists");
  }

  const mapping = await prisma.cRMFieldMapping.update({
    where: { id: data.id },
    data: {
      crmField: data.crmField,
      localField: data.localField,
      transformer: data.transformer || null,
      isRequired: data.isRequired || false,
    }
  });

  return Response.json(mapping);
}
