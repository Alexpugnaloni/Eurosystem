// app/admin/models/[id]/edit/actions.ts
"use server";

import { db } from "@/db";
import { customers, models } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export type EditModelState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<"customerId" | "name" | "code", string>>;
  values?: { customerId?: string; name?: string; code?: string; isActive?: boolean };
};

function isNonEmpty(s: string | undefined | null) {
  return !!s && s.trim().length > 0;
}

export async function updateModel(
  modelIdStr: string,
  _prev: EditModelState,
  formData: FormData
): Promise<EditModelState> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/worker");

  let modelId: bigint;
  try {
    modelId = BigInt(modelIdStr);
  } catch {
    return { ok: false, message: "ID modello non valido." };
  }

  const customerIdStr = String(formData.get("customerId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const isActive = formData.get("isActive") === "on";

  const fieldErrors: EditModelState["fieldErrors"] = {};

  if (!isNonEmpty(customerIdStr)) fieldErrors.customerId = "Seleziona un’azienda.";
  if (!isNonEmpty(name)) fieldErrors.name = "Il nome è obbligatorio.";

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "Correggi i campi evidenziati.",
      fieldErrors,
      values: { customerId: customerIdStr, name, code, isActive },
    };
  }

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

  // modello deve esistere
  const existingModel = await db
    .select({ id: models.id })
    .from(models)
    .where(eq(models.id, modelId))
    .limit(1);

  if (existingModel.length === 0) {
    return { ok: false, message: "Modello non trovato." };
  }

  // customer deve esistere ed essere attivo
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

  // unicità name per customer (escludendo il record corrente)
  const nameConflict = await db
    .select({ id: models.id })
    .from(models)
    .where(
      and(
        eq(models.customerId, customerId),
        eq(models.name, name),
        ne(models.id, modelId)
      )
    )
    .limit(1);

  if (nameConflict.length > 0) {
    return {
      ok: false,
      message: "Esiste già un modello con questo nome per l’azienda selezionata.",
      fieldErrors: { name: "Nome già usato per questa azienda." },
      values: { customerId: customerIdStr, name, code, isActive },
    };
  }

  // unicità code per customer solo se valorizzato (escludendo record corrente)
  if (isNonEmpty(code)) {
    const codeConflict = await db
      .select({ id: models.id })
      .from(models)
      .where(
        and(
          eq(models.customerId, customerId),
          eq(models.code, code),
          ne(models.id, modelId)
        )
      )
      .limit(1);

    if (codeConflict.length > 0) {
      return {
        ok: false,
        message: "Esiste già un modello con questo codice per l’azienda selezionata.",
        fieldErrors: { code: "Codice già usato per questa azienda." },
        values: { customerId: customerIdStr, name, code, isActive },
      };
    }
  }

  await db
    .update(models)
    .set({
      customerId,
      name,
      code: isNonEmpty(code) ? code : null,
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(models.id, modelId));

  redirect("/admin/models");
}