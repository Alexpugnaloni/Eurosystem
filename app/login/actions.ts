// app/login/actions.ts
"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSession, verifyPassword } from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "")
  .trim()
  .toLowerCase();

  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Inserisci username e password." };
  }

  const rows = await db
    .select({
      id: users.id,
      passwordHash: users.passwordHash,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  const u = rows[0];

  // Messaggio sempre uguale (non rivela se l’utente esiste)
  if (!u || !u.isActive) {
    return { error: "Username o password non corretti." };
  }

  const ok = await verifyPassword(password, u.passwordHash);
  if (!ok) {
    return { error: "Username o password non corretti." };
  }

  await createSession(u.id);

  redirect(u.role === "ADMIN" ? "/admin" : "/worker");
}
