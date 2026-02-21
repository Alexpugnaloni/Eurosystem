// app/admin/models/new/actions.ts
"use server";

import { db } from "@/db";
import { customers, models } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export type CreateModelState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<"customerId" | "name" | "code", string>>;
  values?: { customerId?: string; name?: string; code?: string; isActive?: boolean };
};

function isNonEmpty(s: string | undefined | null) {
  return !!s && s.trim().length > 0;
}

function toBigIntOrNull(value: string): bigint | null {
  if (!isNonEmpty(value)) return null;
  try {
    return BigInt(value.trim());
  } catch {
    return null;
  }
}

export async function createModel(
  _prev: CreateModelState,
  formData: FormData
): Promise<CreateModelState> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/worker");

  const customerIdStr = String(formData.get("customerId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const isActive = formData.get("isActive") === "on";

const fieldErrors: CreateModelState["fieldErrors"] = {};

if (!isNonEmpty(customerIdStr)) {
  fieldErrors.customerId = "Seleziona un’azienda.";
}

if (!isNonEmpty(name)) {
  fieldErrors.name = "Il nome è obbligatorio.";
}

if (Object.keys(fieldErrors).length > 0) {
  return {
    ok: false,
    message: "Correggi i campi evidenziati.",
    fieldErrors,
    values: { customerId: customerIdStr, name, code, isActive },
  };
}

// ✅ qui customerIdStr è non vuota, quindi posso convertire e se fallisce è errore "azienda non valida"
let customerId: bigint;
try {
  customerId = BigInt(customerIdStr);
} catch {
  return {
    ok: false,
    message: "Azienda non valida.",
    fieldErrors: { customerId: "Azienda non valida." },
    values: { customerId: customerIdStr, name, code, isActive },
  };
}

  // 1) customer deve esistere ed essere attivo
  const cust = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.isActive, true)))
    .limit(1);

  if (cust.length === 0) {
    return {
      ok: false,
      message: "Azienda non valida o non attiva.",
      fieldErrors: { customerId: "Azienda non valida o non attiva." },
      values: { customerId: customerIdStr, name, code, isActive },
    };
  }

  // 2) Unicità per customer: name (sempre)
  const existingName = await db
    .select({ id: models.id })
    .from(models)
    .where(and(eq(models.customerId, customerId), eq(models.name, name)))
    .limit(1);

  if (existingName.length > 0) {
    return {
      ok: false,
      message: "Esiste già un modello con questo nome per l’azienda selezionata.",
      fieldErrors: { name: "Nome già usato per questa azienda." },
      values: { customerId: customerIdStr, name, code, isActive },
    };
  }

  // 3) code unico per customer solo se valorizzato
  if (isNonEmpty(code)) {
    const existingCode = await db
      .select({ id: models.id })
      .from(models)
      .where(and(eq(models.customerId, customerId), eq(models.code, code)))
      .limit(1);

    if (existingCode.length > 0) {
      return {
        ok: false,
        message: "Esiste già un modello con questo codice per l’azienda selezionata.",
        fieldErrors: { code: "Codice già usato per questa azienda." },
        values: { customerId: customerIdStr, name, code, isActive },
      };
    }
  }

  await db.insert(models).values({
    customerId,
    name,
    code: isNonEmpty(code) ? code : null,
    isActive,
  });

  redirect("/admin/models");
}