"use server";

import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { redirect } from "next/navigation";

export type EditCustomerState = {
  error?: string;
  values?: {
    name: string;
    isActive: boolean;
  };
};

export async function updateCustomerAction(
  customerId: string,
  isInternal: boolean,
  _prev: EditCustomerState,
  formData: FormData
): Promise<EditCustomerState> {
  const me = await requireUser();
  if (me.role !== "ADMIN") return { error: "Non autorizzato." };

  const name = String(formData.get("name") ?? "").trim();
  const requestedIsActive = formData.get("isActive") === "on";

  const isActive = isInternal ? true : requestedIsActive;
  const values = { name, isActive };

  if (!name) return { error: "Compila il nome azienda.", values };
  if (name.length < 2) return { error: "Il nome è troppo corto.", values };

  const id = BigInt(customerId);

  const existingName = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.name, name), ne(customers.id, id)))
    .limit(1);

  if (existingName[0]) return { error: "Nome già esistente.", values };

  await db
    .update(customers)
    .set({
      name,
      isActive,
      // isInternal non si tocca
    })
    .where(eq(customers.id, id));

  redirect("/admin/customers");
}