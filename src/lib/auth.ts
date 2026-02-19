import "server-only";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { eq } from "drizzle-orm";

const COOKIE_NAME = "prod_session";

function generateToken() {
  return crypto.randomBytes(48).toString("hex"); // 96 chars
}

export async function createSession(userId: bigint) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14); // 14 giorni

  await db.insert(sessions).values({
    userId,
    token,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  cookieStore.set(COOKIE_NAME, "", { path: "/", expires: new Date(0) });
}

export async function requireUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      firstName: users.firstName,
      lastName: users.lastName,
      isActive: users.isActive,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.token, token));

  const user = rows[0];
  if (!user || !user.isActive) return null;

  return user;
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
