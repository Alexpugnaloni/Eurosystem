// app/worker/logs/new/page.tsx
import { db } from "@/db";
import { customers, models, phases } from "@/db/schema";
import { requireWorker } from "@/lib/auth";
import { asc, eq } from "drizzle-orm";
import CreateWorkLogForm from "./CreateWorkLogForm";

type SearchParams = { date?: string };

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default async function NewWorkLogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireWorker();
  const sp = await searchParams;

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
    <CreateWorkLogForm
      customers={activeCustomers}
      models={activeModels}
      phases={activePhases}
      defaultDate={sp.date ?? todayISO()}
    />
  );
}