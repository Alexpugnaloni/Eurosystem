// app/admin/phases/[id]/edit/page.tsx
import { db } from "@/db";
import { customers, phases } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import EditPhaseForm from "./EditPhaseForm";

export default async function EditPhasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireUser();
  if (me.role !== "ADMIN") redirect("/worker");

  const { id } = await params;

  let phaseId: bigint;
  try {
    phaseId = BigInt(id);
  } catch {
    notFound();
  }

  const rows = await db
    .select({
      phaseId: phases.id,
      customerId: phases.customerId,
      name: phases.name,
      sortOrder: phases.sortOrder,
      isFinal: phases.isFinal,
      isActive: phases.isActive,

      customerName: customers.name,
      customerIsActive: customers.isActive,
      customerIsInternal: customers.isInternal,
    })
    .from(phases)
    .innerJoin(customers, eq(phases.customerId, customers.id))
    .where(eq(phases.id, phaseId))
    .limit(1);

  if (rows.length === 0) notFound();

  const r = rows[0];

  // customer deve essere attivo (coerente con regole)
  if (!r.customerIsActive) redirect("/admin/phases");

  const phase = {
    id: r.phaseId.toString(),
    customerId: r.customerId.toString(),
    customerName: r.customerName,
    customerIsInternal: r.customerIsInternal,
    name: r.name,
    sortOrder: r.sortOrder,
    isFinal: r.isFinal,
    isActive: r.isActive,
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-black">Modifica fase</h1>
        <p className="text-sm text-gray-600">
          Azienda: <span className="font-medium">{phase.customerName}</span>
          {phase.customerIsInternal ? " (Interna)" : ""}
        </p>
      </div>

      <EditPhaseForm phase={phase} />
    </div>
  );
}