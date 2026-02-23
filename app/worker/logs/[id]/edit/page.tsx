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
      log={log}
      customers={activeCustomers}
      models={activeModels}
      phases={activePhases}
    />
  );
}