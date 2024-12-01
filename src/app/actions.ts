"use server";

import prisma from "@/lib/prisma";
import { type PromoterSchema, promoterSchema } from "@/lib/schema";
import { getChangedKeys } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { Promoter as PrismaPromoter } from "@prisma/client";
import { revalidatePath } from "next/cache";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const fetchPromoters = async (
  page: number = 1,
  sort: string = "",
  desc: string = "false",
  pageSize: number = 10
) => {
  const { userId } = await auth();

  if (!userId) return { error: "Unauthorized" };

  const pageNumber = page || 1;

  const orderBy = sort ? { [sort]: desc === "true" ? "desc" : "asc" } : {};

  const [promoters, totalCount] = await Promise.all([
    prisma.promoter.findMany({
      where: {
        userId,
      },
      include: {
        data: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
      orderBy,
    }),
    prisma.promoter.count({
      where: {
        userId,
      },
    }),
  ]);

  return {
    promoters,
    meta: {
      totalCount,
      page: pageNumber,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    },
  };
};

export const fetchPromoter = async (
  id: string
): Promise<PrismaPromoter | { error: string }> => {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const promoter = await prisma.promoter.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!promoter) return { error: "Promoter not found" };

  return promoter;
};

export const fetchPromoterData = async (id: string) => {
  const promoterData = await prisma.promoterData.findMany({
    where: {
      promoterId: id,
    },
  });

  return JSON.parse(JSON.stringify(promoterData));
};

export const fetchFilteredPromoterData = async (
  id: string,
  page: number = 1,
  sort: string = "",
  desc: string = "false",
  pageSize: number = 10
) => {
  const pageNumber = page || 1;

  const orderBy = sort ? { [sort]: desc === "true" ? "desc" : "asc" } : {};

  const [promoterData, totalCount] = await Promise.all([
    prisma.promoterData.findMany({
      where: {
        promoterId: id,
      },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
      orderBy,
    }),
    prisma.promoterData.count({
      where: {
        promoterId: id,
      },
    }),
  ]);

  const data = JSON.parse(JSON.stringify(promoterData));

  return {
    promoterData: data,
    meta: {
      totalCount,
      page: pageNumber,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    },
  };
};

export const addPromoter = async (values: PromoterSchema) => {
  const validatedFields = promoterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid input" };
  }

  const { userId } = await auth();

  const res = await fetch(`${API_URL}/promoters`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userId}`,
    },
    body: JSON.stringify(validatedFields.data),
  });

  if (!res.ok) {
    const message = await res.json();
    return { error: message.message || "Failed to add promoter" };
  }

  const promoter = await res.json();

  revalidatePath("/");
  revalidatePath(`/promoter/${promoter.id!}`);
  return { success: true };
};

export const updatePromoter = async (
  id: string,
  values: PromoterSchema,
  previousPromoter: PromoterSchema
) => {
  const validatedFields = promoterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid input" };
  }

  // get the changed fields
  const changedFields = getChangedKeys(previousPromoter, validatedFields.data);

  if (changedFields.length === 0) {
    return { error: "No changes made" };
  }

  const changedData = changedFields.reduce((acc, field) => {
    acc[field] =
      validatedFields.data[field as keyof typeof validatedFields.data];
    return acc;
  }, {} as Record<string, unknown>);

  const { userId } = await auth();

  const response = await fetch(`${API_URL}/promoters/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userId}`,
    },
    body: JSON.stringify(changedData),
  });

  if (!response.ok) {
    const message = await response.json();
    return { error: message.message || "Failed to update promoter" };
  }

  revalidatePath("/");
  revalidatePath(`/promoter/${id}`);
  return { success: true };
};

export const deletePromoter = async (id: string) => {
  const { userId } = await auth();
  const res = await fetch(`${API_URL}/promoters/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${userId}`,
    },
  });

  if (!res.ok) throw new Error("Failed to delete promoter");

  revalidatePath("/");
};

export const manualRun = async (id: string) => {
  const { userId } = await auth();
  const res = await fetch(`${API_URL}/manual-run/${id}`, {
    headers: {
      Authorization: `Bearer ${userId}`,
    },
  });
  if (!res.ok) {
    return { error: "Failed to run manual job" };
  }
};
