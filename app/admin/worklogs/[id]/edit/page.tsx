// app/admin/worklogs/[id]/edit/page.tsx
import { db } from "@/db";
import { customers, models, phases, users, workLogs } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import EditWorkLogAdminForm from "./EditWorkLogAdminForm";

export default async function AdminEditWorkLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  let logId: bigint;
  try {
    logId = BigInt(id);
  } catch {
    notFound();
  }

  // Log (admin può vedere qualsiasi log)
  const logRows = await db.select().from(workLogs).where(eq(workLogs.id, logId)).limit(1);
  if (logRows.length === 0) notFound();
  const log = logRows[0];

  // Dipendente collegato (per mostrare chi è / e per eventuale cambio in futuro)
  const userRows = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      employeeCode: users.employeeCode,
      isActive: users.isActive,
      role: users.role,
    })
    .from(users)
    .where(and(eq(users.id, log.userId), eq(users.role, "WORKER")))
    .limit(1);

  if (userRows.length === 0) notFound();
  const worker = userRows[0];

  const activeCustomers = await db
    .select()
    .from(customers)
    .where(eq(customers.isActive, true))
    .orderBy(asc(customers.name));

  const activeModels = await db
    .select()
    .from(models)
    .where(eq(models.isActive, true))
    .orderBy(asc(models.name));

  const activePhases = await db
    .select()
    .from(phases)
    .where(eq(phases.isActive, true))
    .orderBy(asc(phases.customerId), asc(phases.sortOrder), asc(phases.name));

  return (
    <EditWorkLogAdminForm
      id={String(log.id)}
      worker={{
        id: String(worker.id),
        label: `${worker.lastName} ${worker.firstName} (${worker.employeeCode})`,
        isActive: worker.isActive,
      }}
      initial={{
        workDate: log.workDate,
        activityType: log.activityType,
        customerId: String(log.customerId),
        modelId: log.modelId ? String(log.modelId) : "",
        phaseId: log.phaseId ? String(log.phaseId) : "",
        startTime: (log.startTime ?? "").slice(0, 5), // HH:MM
        endTime: (log.endTime ?? "").slice(0, 5), // HH:MM
        qtyOk: String(log.qtyOk ?? 0),
        qtyKo: String(log.qtyKo ?? 0),
        notes: log.notes ?? "",
      }}
      customers={activeCustomers}
      models={activeModels}
      phases={activePhases}
    />
  );
}