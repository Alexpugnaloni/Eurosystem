"use server";

import { db } from "@/db";
import { customers } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export type CreateCustomerState = {
  error?: string;
  values?: {
    name: string;
    isActive: boolean;
  };
};

export async function createCustomerAction(
  _prev: CreateCustomerState,
  formData: FormData
): Promise<CreateCustomerState> {
  const me = await requireUser();
  if (me.role !== "ADMIN") return { error: "Non autorizzato." };

  const name = String(formData.get("name") ?? "").trim();
  const isActive = formData.get("isActive") === "on";
  const values = { name, isActive };

  if (!name) return { error: "Compila il nome azienda.", values };
  if (name.length < 2) return { error: "Il nome è troppo corto.", values };

  const existingName = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.name, name))
    .limit(1);

  if (existingName[0]) return { error: "Nome già esistente.", values };

  await db.insert(customers).values({
    name,
    isInternal: false, // fisso
    isActive,
  });

  redirect("/admin/customers");
}