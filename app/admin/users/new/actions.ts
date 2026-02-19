// app/admin/users/new/actions.ts
"use server";

import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

export type CreateUserState = {
  error?: string;
  values?: {
    firstName: string;
    lastName: string;
    employeeCode: string;
    username: string;
    role: "ADMIN" | "WORKER";
    isActive: boolean;
  };
  created?: { username: string; password: string };
};

function isValidName(s: string) {
  return /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(s);
}

export async function createUserAction(
  _prev: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  const me = await requireUser();
  if (me.role !== "ADMIN") return { error: "Non autorizzato." };

  // ====== NORMALIZZAZIONI ======
  const rawFirstName = String(formData.get("firstName") ?? "").trim();
  const rawLastName = String(formData.get("lastName") ?? "").trim();

  // Iniziale maiuscola automatica
  const firstName =
    rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1).toLowerCase();
  const lastName =
    rawLastName.charAt(0).toUpperCase() + rawLastName.slice(1).toLowerCase();

  // Username sempre lowercase
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();

  const employeeCode = String(formData.get("employeeCode") ?? "").trim();

  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  const role = (String(formData.get("role") ?? "WORKER") as "ADMIN" | "WORKER");
  const isActive = formData.get("isActive") === "on";

  const values = { firstName, lastName, employeeCode, username, role, isActive };

  // ====== VALIDAZIONI ======

  if (!firstName || !lastName || !employeeCode || !username || !password || !passwordConfirm) {
    return { error: "Compila tutti i campi obbligatori.", values };
  }

  if (!isValidName(firstName)) {
    return { error: "Il nome non può contenere numeri o simboli.", values };
  }

  if (!isValidName(lastName)) {
    return { error: "Il cognome non può contenere numeri o simboli.", values };
  }

  // Username solo lowercase lettere, numeri, punto, trattino, underscore
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
    return {
      error: "Username non valido (solo lettere minuscole, numeri, ., -, _).",
      values,
    };
  }

  if (!/^OP\d{3}$/i.test(employeeCode)) {
    return { error: "Employee code non valido (formato: OP001).", values };
  }

  if (password.length < 6) {
    return { error: "La password deve avere almeno 6 caratteri.", values };
  }

  if (password !== passwordConfirm) {
    return { error: "Le password non coincidono.", values };
  }

  const existingUsername = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existingUsername[0]) {
    return { error: "Username già esistente.", values };
  }

  const existingCode = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.employeeCode, employeeCode))
    .limit(1);

  if (existingCode[0]) {
    return { error: "Employee code già esistente.", values };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    firstName,
    lastName,
    employeeCode,
    username,
    passwordHash,
    role,
    isActive,
  });

  return { created: { username, password } };
}

