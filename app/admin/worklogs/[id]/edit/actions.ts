// app/admin/worklogs/[id]/edit/actions.ts
"use server";

import { db } from "@/db";
import { customers, models, phases, workLogs } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type UpdateWorkLogAdminState = {
  ok: boolean;
  message: string | null;
  fieldErrors?: Partial<
    Record<
      | "workDate"
      | "activityType"
      | "customerId"
      | "modelId"
      | "phaseId"
      | "startTime"
      | "endTime"
      | "qtyOk"
      | "qtyKo"
      | "notes",
      string
    >
  >;
};

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

function todayISO() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function updateWorkLogAdminAction(
  prev: UpdateWorkLogAdminState,
  formData: FormData
): Promise<UpdateWorkLogAdminState> {
  await requireAdmin();

  const id = parseBigintField(formData.get("id"));
  if (!id) {
    return { ok: false, message: "ID attività non valido.", fieldErrors: {} };
  }

  // Leggo il log esistente per ricavare userId (dipendente proprietario)
  const existingRows = await db.select().from(workLogs).where(eq(workLogs.id, id)).limit(1);
  if (existingRows.length === 0) {
    return { ok: false, message: "Attività non trovata.", fieldErrors: {} };
  }
  const existing = existingRows[0];
  const targetUserId = existing.userId;

  const fieldErrors: UpdateWorkLogAdminState["fieldErrors"] = {};

  const workDate = String(formData.get("workDate") ?? "").trim();
  const activityType = (String(formData.get("activityType") ?? "PRODUCTION") as
    | "PRODUCTION"
    | "CLEANING");
  const customerIdStr = String(formData.get("customerId") ?? "").trim();
  const modelIdStr = String(formData.get("modelId") ?? "").trim();
  const phaseIdStr = String(formData.get("phaseId") ?? "").trim();
  const startTimeStr = String(formData.get("startTime") ?? "").trim();
  const endTimeStr = String(formData.get("endTime") ?? "").trim();
  const qtyOkStr = String(formData.get("qtyOk") ?? "0").trim();
  const qtyKoStr = String(formData.get("qtyKo") ?? "0").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const customerId = parseBigintField(customerIdStr);
  const modelId = parseBigintField(modelIdStr);
  const phaseId = parseBigintField(phaseIdStr);

  const start = toTimeStringHHMM(startTimeStr);
  const end = toTimeStringHHMM(endTimeStr);

  if (!workDate) fieldErrors.workDate = "Data obbligatoria.";
  if (!customerId) fieldErrors.customerId = "Azienda obbligatoria.";
  if (!start) fieldErrors.startTime = "Ora inizio obbligatoria.";
  if (!end) fieldErrors.endTime = "Ora fine obbligatoria.";

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Controlla i campi evidenziati.", fieldErrors };
  }

  // ✅ Non permettere date future
  const tISO = todayISO();
  if (workDate > tISO) {
    return {
      ok: false,
      message: "Non puoi registrare un'attività con una data futura.",
      fieldErrors: { workDate: "Data futura non consentita." },
    };
  }

  const startMin = timeToMinutes(start!);
  const endMin = timeToMinutes(end!);
  if (startMin === null) fieldErrors.startTime = "Orario non valido.";
  if (endMin === null) fieldErrors.endTime = "Orario non valido.";
  if (startMin !== null && endMin !== null && startMin >= endMin) {
    fieldErrors.endTime = "L'orario di fine deve essere dopo l'orario di inizio.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Controlla gli orari.", fieldErrors };
  }

  const durationMinutes = (endMin as number) - (startMin as number);

  // customer must exist and be active
  const cust = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.id, customerId!), eq(customers.isActive, true)))
    .limit(1);

  if (cust.length === 0) {
    return {
      ok: false,
      message: "Azienda non valida o non attiva.",
      fieldErrors: { customerId: "Azienda non valida." },
    };
  }

  if (activityType === "PRODUCTION") {
    if (!modelId) fieldErrors.modelId = "Seleziona un modello.";
    if (!phaseId) fieldErrors.phaseId = "Seleziona una fase.";

    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, message: "Controlla i campi produzione.", fieldErrors };
    }

    const m = await db
      .select({ id: models.id })
      .from(models)
      .where(
        and(eq(models.id, modelId!), eq(models.customerId, customerId!), eq(models.isActive, true))
      )
      .limit(1);

    if (m.length === 0) {
      return {
        ok: false,
        message: "Modello non valido per questa azienda (o non attivo).",
        fieldErrors: { modelId: "Modello non valido." },
      };
    }

    const p = await db
      .select({ id: phases.id })
      .from(phases)
      .where(
        and(eq(phases.id, phaseId!), eq(phases.customerId, customerId!), eq(phases.isActive, true))
      )
      .limit(1);

    if (p.length === 0) {
      return {
        ok: false,
        message: "Fase non valida per questa azienda (o non attiva).",
        fieldErrors: { phaseId: "Fase non valida." },
      };
    }
  }

  const qtyOk = Math.max(0, Number(qtyOkStr || 0));
  const qtyKo = Math.max(0, Number(qtyKoStr || 0));
  if (!Number.isFinite(qtyOk)) fieldErrors.qtyOk = "Quantità non valida.";
  if (!Number.isFinite(qtyKo)) fieldErrors.qtyKo = "Quantità non valida.";

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Controlla le quantità.", fieldErrors };
  }

  // ✅ produzione: almeno uno tra OK/KO > 0
  if (activityType === "PRODUCTION" && qtyOk === 0 && qtyKo === 0) {
    return {
      ok: false,
      message: "Inserisci almeno 1 pezzo (OK o KO).",
      fieldErrors: { qtyOk: "Obbligatorio almeno 1 pezzo.", qtyKo: "Obbligatorio almeno 1 pezzo." },
    };
  }

  // ✅ no overlap sul dipendente del log
  const overlap = await ensureNoOverlap({
    userId: targetUserId,
    workDate,
    startTime: start!,
    endTime: end!,
    excludeId: id,
  });

  if (overlap) {
    return {
      ok: false,
      message: "Esiste già un'attività in sovrapposizione con questi orari.",
      fieldErrors: { startTime: "Sovrapposizione.", endTime: "Sovrapposizione." },
    };
  }

  await db
    .update(workLogs)
    .set({
      workDate,
      customerId: customerId!,
      activityType,
      modelId: activityType === "PRODUCTION" ? modelId! : null,
      phaseId: activityType === "PRODUCTION" ? phaseId! : null,
      startTime: start!,
      endTime: end!,
      durationMinutes,
      qtyOk: activityType === "PRODUCTION" ? qtyOk : 0,
      qtyKo: activityType === "PRODUCTION" ? qtyKo : 0,
      notes: notes ? notes : null,
    })
    .where(eq(workLogs.id, id));

  // Revalidate (admin + report + worker)
  revalidatePath("/admin/worklogs");
  revalidatePath("/admin");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/reports/ore");
  revalidatePath("/admin/reports/produzione");
  revalidatePath("/admin/reports/consegne");
  revalidatePath("/worker/logs");

  // Redirect comodo: torna alla lista filtrata su quel dipendente e quella data
  redirect(
    `/admin/worklogs?userId=${encodeURIComponent(String(targetUserId))}&dateFrom=${encodeURIComponent(
      workDate
    )}&dateTo=${encodeURIComponent(workDate)}`
  );
}