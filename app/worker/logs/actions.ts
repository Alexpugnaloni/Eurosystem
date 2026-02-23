"use server";

import { db } from "@/db";
import { customers, models, phases, workLogs } from "@/db/schema";
import { requireWorker } from "@/lib/auth";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CreateWorkLogState = {
  error?: string;
  values: {
    workDate: string;
    activityType: "PRODUCTION" | "CLEANING";
    customerId: string;
    modelId: string;
    phaseId: string;
    startTime: string;
    endTime: string;
    qtyOk: string;
    qtyKo: string;
    notes: string;
  };
};

export type DeleteWorkLogState = { error?: string };

function parseBigintField(v: FormDataEntryValue | null) {
  if (!v) return null;
  const s = String(v).trim();
  if (!s) return null;
  try {
    return BigInt(s);
  } catch {
    return null;
  }
}

function toTimeStringHHMM(v: string) {
  const s = (v ?? "").trim();
  if (!s) return null;
  // input type=time gives HH:MM (sometimes HH:MM:SS)
  return s.length === 5 ? `${s}:00` : s;
}

function timeToMinutes(t: string) {
  // expects HH:MM:SS
  const [hh, mm] = t.split(":");
  const h = Number(hh);
  const m = Number(mm);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

async function ensureNoOverlap(params: {
  userId: bigint;
  workDate: string;
  startTime: string;
  endTime: string;
  excludeId?: bigint;
}) {
  const { userId, workDate, startTime, endTime, excludeId } = params;

  // Postgres: (a,b) OVERLAPS (c,d)  <=> a < d AND c < b (adjacent ok)
  const overlapWhere = and(
    eq(workLogs.userId, userId),
    eq(workLogs.workDate, workDate),
    excludeId ? sql`${workLogs.id} <> ${excludeId}` : sql`true`,
    sql`(${workLogs.startTime}, ${workLogs.endTime}) OVERLAPS (${startTime}::time, ${endTime}::time)`
  );

  const found = await db
    .select({ id: workLogs.id })
    .from(workLogs)
    .where(overlapWhere)
    .limit(1);

  return found.length > 0;
}

export async function createWorkLogAction(
  prev: CreateWorkLogState,
  formData: FormData
): Promise<CreateWorkLogState> {
  const user = await requireWorker();

  const values: CreateWorkLogState["values"] = {
    workDate: String(formData.get("workDate") ?? prev.values.workDate ?? "").trim(),
    activityType: (String(formData.get("activityType") ?? prev.values.activityType ?? "PRODUCTION") as
      | "PRODUCTION"
      | "CLEANING"),
    customerId: String(formData.get("customerId") ?? prev.values.customerId ?? "").trim(),
    modelId: String(formData.get("modelId") ?? prev.values.modelId ?? "").trim(),
    phaseId: String(formData.get("phaseId") ?? prev.values.phaseId ?? "").trim(),
    startTime: String(formData.get("startTime") ?? prev.values.startTime ?? "").trim(),
    endTime: String(formData.get("endTime") ?? prev.values.endTime ?? "").trim(),
    qtyOk: String(formData.get("qtyOk") ?? prev.values.qtyOk ?? "0").trim(),
    qtyKo: String(formData.get("qtyKo") ?? prev.values.qtyKo ?? "0").trim(),
    notes: String(formData.get("notes") ?? prev.values.notes ?? "").trim(),
  };

  const customerId = parseBigintField(values.customerId);
  const modelId = parseBigintField(values.modelId);
  const phaseId = parseBigintField(values.phaseId);

  const start = toTimeStringHHMM(values.startTime);
  const end = toTimeStringHHMM(values.endTime);

  if (!values.workDate || !customerId || !start || !end) {
    return { error: "Compila data, azienda, ora inizio e ora fine.", values };
  }

// ✅ Non permettere date future (consenti passato e oggi)
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayISO = `${yyyy}-${mm}-${dd}`;

  if (values.workDate > todayISO) {
    return { error: "Non puoi registrare un'attività con una data futura.", values };
  }

  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  if (startMin === null || endMin === null) {
    return { error: "Orari non validi.", values };
  }
  if (startMin >= endMin) {
    return { error: "L'orario di fine deve essere dopo l'orario di inizio.", values };
  }

  const durationMinutes = endMin - startMin;

  // customer must exist and be active
  const cust = await db
  .select({ id: customers.id })
  .from(customers)
  .where(and(eq(customers.id, customerId), eq(customers.isActive, true)))
  .limit(1);

if (cust.length === 0) {
  return { error: "Azienda non valida o non attiva.", values };
}
  if (!cust) {
    return { error: "Azienda non valida o non attiva.", values };
  }

  if (values.activityType === "PRODUCTION") {
    if (!modelId || !phaseId) {
      return { error: "Per la produzione devi selezionare modello e fase.", values };
    }

    const m = await db
  .select({ id: models.id })
  .from(models)
  .where(and(eq(models.id, modelId), eq(models.customerId, customerId), eq(models.isActive, true)))
  .limit(1);

if (m.length === 0) {
  return { error: "Modello non valido per questa azienda (o non attivo).", values };
}

    const p = await db
  .select({ id: phases.id })
  .from(phases)
  .where(and(eq(phases.id, phaseId), eq(phases.customerId, customerId), eq(phases.isActive, true)))
  .limit(1);

if (p.length === 0) {
  return { error: "Fase non valida per questa azienda (o non attiva).", values };
    }
  }

  const qtyOk = Math.max(0, Number(values.qtyOk || 0));
  const qtyKo = Math.max(0, Number(values.qtyKo || 0));
  if (!Number.isFinite(qtyOk) || !Number.isFinite(qtyKo)) {
    return { error: "Quantità non valide.", values };
  }

// ✅ Validazione: in produzione almeno uno tra OK/KO deve essere > 0
  if (values.activityType === "PRODUCTION" && qtyOk === 0 && qtyKo === 0) {
    return { error: "Inserisci almeno 1 pezzo (OK o KO).", values };
  }

  const overlap = await ensureNoOverlap({
    userId: user.id,
    workDate: values.workDate,
    startTime: start,
    endTime: end,
  });
  if (overlap) {
    return { error: "Esiste già un'attività in sovrapposizione con questi orari.", values };
  }

  await db.insert(workLogs).values({
    workDate: values.workDate,
    userId: user.id,
    customerId,
    activityType: values.activityType,
    modelId: values.activityType === "PRODUCTION" ? modelId : null,
    phaseId: values.activityType === "PRODUCTION" ? phaseId : null,
    startTime: start,
    endTime: end,
    durationMinutes,
    qtyOk: values.activityType === "PRODUCTION" ? qtyOk : 0,
    qtyKo: values.activityType === "PRODUCTION" ? qtyKo : 0,
    notes: values.notes ? values.notes : null,
  });

  revalidatePath("/worker/logs");
  redirect(`/worker/logs?date=${encodeURIComponent(values.workDate)}`);
}

export async function updateWorkLogAction(
  prev: CreateWorkLogState,
  formData: FormData
): Promise<CreateWorkLogState> {
  const user = await requireWorker();

  const id = parseBigintField(formData.get("id"));
  if (!id) return { error: "ID attività non valido.", values: prev.values };

  const values: CreateWorkLogState["values"] = {
    workDate: String(formData.get("workDate") ?? prev.values.workDate ?? "").trim(),
    activityType: (String(formData.get("activityType") ?? prev.values.activityType ?? "PRODUCTION") as
      | "PRODUCTION"
      | "CLEANING"),
    customerId: String(formData.get("customerId") ?? prev.values.customerId ?? "").trim(),
    modelId: String(formData.get("modelId") ?? prev.values.modelId ?? "").trim(),
    phaseId: String(formData.get("phaseId") ?? prev.values.phaseId ?? "").trim(),
    startTime: String(formData.get("startTime") ?? prev.values.startTime ?? "").trim(),
    endTime: String(formData.get("endTime") ?? prev.values.endTime ?? "").trim(),
    qtyOk: String(formData.get("qtyOk") ?? prev.values.qtyOk ?? "0").trim(),
    qtyKo: String(formData.get("qtyKo") ?? prev.values.qtyKo ?? "0").trim(),
    notes: String(formData.get("notes") ?? prev.values.notes ?? "").trim(),
  };

  const customerId = parseBigintField(values.customerId);
  const modelId = parseBigintField(values.modelId);
  const phaseId = parseBigintField(values.phaseId);

  const start = toTimeStringHHMM(values.startTime);
  const end = toTimeStringHHMM(values.endTime);

  if (!values.workDate || !customerId || !start || !end) {
    return { error: "Compila data, azienda, ora inizio e ora fine.", values };
  }

  // ✅ no date future (passato e oggi ok)
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayISO = `${yyyy}-${mm}-${dd}`;
  if (values.workDate > todayISO) {
    return { error: "Non puoi registrare un'attività con una data futura.", values };
  }

  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  if (startMin === null || endMin === null) {
    return { error: "Orari non validi.", values };
  }
  if (startMin >= endMin) {
    return { error: "L'orario di fine deve essere dopo l'orario di inizio.", values };
  }

  const durationMinutes = endMin - startMin;

  // customer must exist and be active
  const cust = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.isActive, true)))
    .limit(1);

  if (cust.length === 0) {
    return { error: "Azienda non valida o non attiva.", values };
  }

  if (values.activityType === "PRODUCTION") {
    if (!modelId || !phaseId) {
      return { error: "Per la produzione devi selezionare modello e fase.", values };
    }

    const m = await db
      .select({ id: models.id })
      .from(models)
      .where(and(eq(models.id, modelId), eq(models.customerId, customerId), eq(models.isActive, true)))
      .limit(1);

    if (m.length === 0) {
      return { error: "Modello non valido per questa azienda (o non attivo).", values };
    }

    const p = await db
      .select({ id: phases.id })
      .from(phases)
      .where(and(eq(phases.id, phaseId), eq(phases.customerId, customerId), eq(phases.isActive, true)))
      .limit(1);

    if (p.length === 0) {
      return { error: "Fase non valida per questa azienda (o non attiva).", values };
    }
  }

  const qtyOk = Math.max(0, Number(values.qtyOk || 0));
  const qtyKo = Math.max(0, Number(values.qtyKo || 0));
  if (!Number.isFinite(qtyOk) || !Number.isFinite(qtyKo)) {
    return { error: "Quantità non valide.", values };
  }

  // ✅ produzione: almeno uno tra OK/KO > 0
  if (values.activityType === "PRODUCTION" && qtyOk === 0 && qtyKo === 0) {
    return { error: "Inserisci almeno 1 pezzo (OK o KO).", values };
  }

  // ✅ no overlap (escludo la riga stessa)
  const overlap = await ensureNoOverlap({
    userId: user.id,
    workDate: values.workDate,
    startTime: start,
    endTime: end,
    excludeId: id,
  });
  if (overlap) {
    return { error: "Esiste già un'attività in sovrapposizione con questi orari.", values };
  }

  const updated = await db
    .update(workLogs)
    .set({
      workDate: values.workDate,
      customerId,
      activityType: values.activityType,
      modelId: values.activityType === "PRODUCTION" ? modelId : null,
      phaseId: values.activityType === "PRODUCTION" ? phaseId : null,
      startTime: start,
      endTime: end,
      durationMinutes,
      qtyOk: values.activityType === "PRODUCTION" ? qtyOk : 0,
      qtyKo: values.activityType === "PRODUCTION" ? qtyKo : 0,
      notes: values.notes ? values.notes : null,
    })
    .where(and(eq(workLogs.id, id), eq(workLogs.userId, user.id)))
    .returning({ id: workLogs.id });

  if (updated.length === 0) {
    return { error: "Attività non trovata o non autorizzato.", values };
  }

  revalidatePath("/worker/logs");
  redirect(`/worker/logs?date=${encodeURIComponent(values.workDate)}`);
}

export async function deleteWorkLogAction(
  prev: DeleteWorkLogState,
  formData: FormData
): Promise<DeleteWorkLogState> {
  const user = await requireWorker();
  const id = parseBigintField(formData.get("id"));
  if (!id) return { error: "ID non valido." };

  // Hard delete, but only own logs
  const deleted = await db
    .delete(workLogs)
    .where(and(eq(workLogs.id, id), eq(workLogs.userId, user.id)))
    .returning({ id: workLogs.id });

  if (deleted.length === 0) return { error: "Attività non trovata o non autorizzato." };

  revalidatePath("/worker/logs");
  return {};
}