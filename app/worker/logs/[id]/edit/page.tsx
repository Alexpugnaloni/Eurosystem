import { db } from "@/db";
import { customers, models, phases, workLogs } from "@/db/schema";
import { requireWorker } from "@/lib/auth";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import EditWorkLogForm from "./EditWorkLogForm";

export default async function EditWorkLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireWorker();
  const { id } = await params;

  let logId: bigint;
  try {
    logId = BigInt(id);
  } catch {
    notFound();
  }

  const logRows = await db
    .select()
    .from(workLogs)
    .where(and(eq(workLogs.id, logId), eq(workLogs.userId, user.id)))
    .limit(1);

  if (logRows.length === 0) notFound();
  const log = logRows[0];

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
  <EditWorkLogForm
    id={String(log.id)}
    initial={{
      workDate: log.workDate,
      activityType: log.activityType,
      customerId: String(log.customerId),
      modelId: log.modelId ? String(log.modelId) : "",
      phaseId: log.phaseId ? String(log.phaseId) : "",
      startTime: (log.startTime ?? "").slice(0, 5), // HH:MM
      endTime: (log.endTime ?? "").slice(0, 5),     // HH:MM
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