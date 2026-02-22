// app/admin/phases/[id]/edit/actions.ts
"use server";

import { db } from "@/db";
import { customers, phases } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type UpdatePhaseState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<"name" | "sortOrder", string>>;
  values?: { name?: string; sortOrder?: string; isFinal?: boolean; isActive?: boolean };
};

function isNonEmpty(s: string | undefined | null) {
  return !!s && s.trim().length > 0;
}

export async function updatePhase(
  phaseIdStr: string,
  _prev: UpdatePhaseState,
  formData: FormData
): Promise<UpdatePhaseState> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/worker");

  let phaseId: bigint;
  try {
    phaseId = BigInt(phaseIdStr);
  } catch {
    return { ok: false, message: "ID fase non valido." };
  }

  // Carico fase corrente (mi serve customerId e per verificare esistenza)
  const current = await db
    .select({
      id: phases.id,
      customerId: phases.customerId,
    })
    .from(phases)
    .where(eq(phases.id, phaseId))
    .limit(1);

  if (current.length === 0) {
    return { ok: false, message: "Fase non trovata." };
  }

  const customerId = current[0].customerId;

  // customer deve essere attivo
  const cust = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.isActive, true)))
    .limit(1);

  if (cust.length === 0) {
    return { ok: false, message: "Azienda non valida o non attiva." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const sortOrderStr = String(formData.get("sortOrder") ?? "").trim();
  const isFinal = formData.get("isFinal") === "on";
  const isActive = formData.get("isActive") === "on";

  const fieldErrors: UpdatePhaseState["fieldErrors"] = {};

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
      values: { name, sortOrder: sortOrderStr, isFinal, isActive },
    };
  }

  // name unico per customer (escluso se stesso)
  const existing = await db
    .select({ id: phases.id })
    .from(phases)
    .where(and(eq(phases.customerId, customerId), eq(phases.name, name), ne(phases.id, phaseId)))
    .limit(1);

  if (existing.length > 0) {
    return {
      ok: false,
      message: "Esiste già una fase con questo nome per l’azienda selezionata.",
      fieldErrors: { name: "Nome già usato per questa azienda." },
      values: { name, sortOrder: sortOrderStr, isFinal, isActive },
    };
  }

  await db.transaction(async (tx) => {
    // regola: una sola fase finale per customer
    if (isFinal) {
      await tx.update(phases).set({ isFinal: false }).where(eq(phases.customerId, customerId));
    }

    await tx
      .update(phases)
      .set({
        name,
        sortOrder,
        isFinal,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(phases.id, phaseId));
  });

  revalidatePath("/admin/phases");
  revalidatePath(`/admin/phases/${phaseIdStr}/edit`);

  return { ok: true };
}