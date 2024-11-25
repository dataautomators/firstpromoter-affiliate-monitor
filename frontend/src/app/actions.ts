"use server";

import type { Promoter } from "@/components/promoter-table";
import { type PromoterSchema, promoterSchema } from "@/lib/schema";
import { getChangedKeys } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const fetchPromoters = async () => {
  const { userId } = await auth();
  const res = await fetch(`${API_URL}/promoters`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${userId}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch promoters");
  return res.json();
};

export const fetchPromoter = async (
  id: string
): Promise<Promoter | { error: string }> => {
  const { userId } = await auth();
  const res = await fetch(`${API_URL}/promoters/${id}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${userId}`,
    },
  });
  if (!res.ok) {
    const message = await res.json();
    return { error: message.message || "Failed to fetch promoter" };
  }
  return res.json();
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
