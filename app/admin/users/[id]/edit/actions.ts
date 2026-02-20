// app/admin/users/[id]/edit/actions.ts
"use server";

import bcrypt from "bcryptjs";
import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export type EditUserAllState = {
  error?: string;
  values?: {
    firstName: string;
    lastName: string;
    isActive: boolean;
  };
  passwordReset?: {
    password: string; // la mostri una sola volta
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

export async function updateUserAndMaybeResetPasswordAction(
  userId: string,
  _prev: EditUserAllState,
  formData: FormData
): Promise<EditUserAllState> {
  const me = await requireUser();
  if (me.role !== "ADMIN") return { error: "Non autorizzato." };

  const firstName = titleCase(String(formData.get("firstName") ?? ""));
  const lastName = titleCase(String(formData.get("lastName") ?? ""));
  const isActive = formData.get("isActive") === "on";

  const values = { firstName, lastName, isActive };

  if (!firstName || !lastName) return { error: "Nome e cognome sono obbligatori.", values };
  if (!isValidName(firstName)) return { error: "Il nome non può contenere numeri o simboli.", values };
  if (!isValidName(lastName)) return { error: "Il cognome non può contenere numeri o simboli.", values };

  // Password opzionale
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("passwordConfirm") ?? "");

  const wantsReset = password.length > 0 || confirm.length > 0;

  if (wantsReset) {
    if (password.length < 6) return { error: "La password deve avere almeno 6 caratteri.", values };
    if (password !== confirm) return { error: "Le password non coincidono.", values };

    const passwordHash = await bcrypt.hash(password, 10);

    await db
      .update(users)
      .set({ firstName, lastName, isActive, passwordHash })
      .where(eq(users.id, BigInt(userId)));

    // Mostriamo la password una sola volta per copia
    return { values, passwordReset: { password } };
  }

  // Solo dati
  await db
    .update(users)
    .set({ firstName, lastName, isActive })
    .where(eq(users.id, BigInt(userId)));

  // Se non resetti password, ritorniamo ok e rimandiamo alla lista
  redirect("/admin/users");
}