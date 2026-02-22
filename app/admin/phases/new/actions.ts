// app/admin/phases/new/actions.ts
"use server";

import { db } from "@/db";
import { customers, phases } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type CreatePhaseState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<"customerId" | "name" | "sortOrder", string>>;
  values?: { customerId?: string; name?: string; sortOrder?: string; isFinal?: boolean; isActive?: boolean };
};

function isNonEmpty(s: string | undefined | null) {
  return !!s && s.trim().length > 0;
}

export async function createPhase(_prev: CreatePhaseState, formData: FormData): Promise<CreatePhaseState> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/worker");

  const customerIdStr = String(formData.get("customerId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const sortOrderStr = String(formData.get("sortOrder") ?? "").trim();
  const isFinal = formData.get("isFinal") === "on";
  const isActive = formData.get("isActive") === "on";

  const fieldErrors: CreatePhaseState["fieldErrors"] = {};

  if (!isNonEmpty(customerIdStr)) fieldErrors.customerId = "Seleziona un’azienda.";
  if (!isNonEmpty(name)) fieldErrors.name = "Il nome è obbligatorio.";
  if (!isNonEmpty(sortOrderStr)) fieldErrors.sortOrder = "L’ordine è obbligatorio.";

  const sortOrder = Number(sortOrderStr);
  if (!Number.isInteger(sortOrder) || sortOrder < 1) {
    fieldErrors.sortOrder = "L’ordine deve essere un intero ≥ 1.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "Correggi i campi evidenziati.",
      fieldErrors,
      values: { customerId: customerIdStr, name, sortOrder: sortOrderStr, isFinal, isActive },
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
      values: { customerId: customerIdStr, name, sortOrder: sortOrderStr, isFinal, isActive },
    };
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
      values: { customerId: customerIdStr, name, sortOrder: sortOrderStr, isFinal, isActive },
    };
  }

  // name unico per customer
  const existing = await db
    .select({ id: phases.id })
    .from(phases)
    .where(and(eq(phases.customerId, customerId), eq(phases.name, name)))
    .limit(1);

  if (existing.length > 0) {
    return {
      ok: false,
      message: "Esiste già una fase con questo nome per l’azienda selezionata.",
      fieldErrors: { name: "Nome già usato per questa azienda." },
      values: { customerId: customerIdStr, name, sortOrder: sortOrderStr, isFinal, isActive },
    };
  }

  await db.transaction(async (tx) => {
    if (isFinal) {
      await tx.update(phases).set({ isFinal: false }).where(eq(phases.customerId, customerId));
    }

    await tx.insert(phases).values({
      customerId,
      name,
      sortOrder,
      isFinal,
      isActive,
    });
  });

  revalidatePath("/admin/phases");
  return { ok: true };
}