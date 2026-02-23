// app/worker/logs/page.tsx
import { db } from "@/db";
import { customers, models, phases, workLogs } from "@/db/schema";
import { requireWorker } from "@/lib/auth";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import WorkerLogsClient from "./WorkerLogsClient";

type SearchParams = {
  date?: string; // YYYY-MM-DD
  customerId?: string;
  type?: "PRODUCTION" | "CLEANING";
};

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default async function WorkerLogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireWorker();
  const sp = await searchParams;

  const workDate = sp.date ?? todayISO();
  const customerId = sp.customerId ? BigInt(sp.customerId) : null;
  const type = sp.type ?? null;

  const activeCustomers = await db
  .select()
  .from(customers)
  .where(eq(customers.isActive, true))
  .orderBy(asc(customers.name));

  // Query logs for that day (and optional filters), with joined names
  const whereParts = [
    eq(workLogs.userId, user.id),
    eq(workLogs.workDate, workDate),
  ];

  if (customerId) whereParts.push(eq(workLogs.customerId, customerId));
  if (type) whereParts.push(eq(workLogs.activityType, type));

  const rows = await db
    .select({
      id: workLogs.id,
      workDate: workLogs.workDate,
      activityType: workLogs.activityType,
      startTime: workLogs.startTime,
      endTime: workLogs.endTime,
      durationMinutes: workLogs.durationMinutes,
      qtyOk: workLogs.qtyOk,
      qtyKo: workLogs.qtyKo,
      notes: workLogs.notes,

      customerName: customers.name,
      modelName: models.name,
      phaseName: phases.name,
    })
    .from(workLogs)
    .innerJoin(customers, eq(customers.id, workLogs.customerId))
    .leftJoin(models, eq(models.id, workLogs.modelId))
    .leftJoin(phases, eq(phases.id, workLogs.phaseId))
    .where(and(...whereParts))
    .orderBy(asc(workLogs.startTime), desc(workLogs.id));

  return (
    <WorkerLogsClient
      customers={activeCustomers}
      initialDate={workDate}
      initialCustomerId={sp.customerId ?? ""}
      initialType={sp.type ?? ""}
      rows={rows}
    />
  );
}