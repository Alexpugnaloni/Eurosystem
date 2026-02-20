// app/admin/users/[id]/edit/actions.ts
"use server";

import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export type EditUserState = {
  error?: string;
  values?: {
    firstName: string;
    lastName: string;
    isActive: boolean;
  };
};

function isValidName(s: string) {
  return /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(s);
}

function titleCase(s: string) {
  const x = s.trim();
  if (!x) return "";
  return x.charAt(0).toUpperCase() + x.slice(1).toLowerCase();
}

export async function updateUserAction(
  userId: string,
  _prev: EditUserState,
  formData: FormData
): Promise<EditUserState> {
  const me = await requireUser();
  if (me.role !== "ADMIN") return { error: "Non autorizzato." };

  const firstName = titleCase(String(formData.get("firstName") ?? ""));
  const lastName = titleCase(String(formData.get("lastName") ?? ""));
  const isActive = formData.get("isActive") === "on";

  const values = { firstName, lastName, isActive };

  if (!firstName || !lastName) return { error: "Nome e cognome sono obbligatori.", values };
  if (!isValidName(firstName)) return { error: "Il nome non può contenere numeri o simboli.", values };
  if (!isValidName(lastName)) return { error: "Il cognome non può contenere numeri o simboli.", values };

  await db
    .update(users)
    .set({ firstName, lastName, isActive })
    .where(eq(users.id, BigInt(userId)));

  redirect("/admin/users");
}