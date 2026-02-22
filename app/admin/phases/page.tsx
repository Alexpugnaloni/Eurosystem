// app/admin/phases/page.tsx
import { db } from "@/db";
import { customers, phases } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import PhasesClient from "./PhasesClient";

type Row = {
  phaseId: bigint;
  phaseName: string;
  phaseSortOrder: number;
  phaseIsFinal: boolean;
  phaseIsActive: boolean;

  customerId: bigint;
  customerName: string;
  customerIsInternal: boolean;
  customerIsActive: boolean;
};

export default async function PhasesPage() {
  const me = await requireUser();
  if (me.role !== "ADMIN") redirect("/worker");

  const rows: Row[] = await db
    .select({
      phaseId: phases.id,
      phaseName: phases.name,
      phaseSortOrder: phases.sortOrder,
      phaseIsFinal: phases.isFinal,
      phaseIsActive: phases.isActive,

      customerId: customers.id,
      customerName: customers.name,
      customerIsInternal: customers.isInternal,
      customerIsActive: customers.isActive,
    })
    .from(phases)
    .innerJoin(customers, eq(phases.customerId, customers.id))
    .orderBy(asc(customers.name), asc(phases.sortOrder), asc(phases.name));

  // customers (solo attivi) per select
  const customerOptions = await db
    .select({
      id: customers.id,
      name: customers.name,
      isInternal: customers.isInternal,
    })
    .from(customers)
    .where(eq(customers.isActive, true))
    .orderBy(asc(customers.name));

  const phasesList = rows.map((r) => ({
    id: r.phaseId.toString(),
    customerId: r.customerId.toString(),
    name: r.phaseName,
    sortOrder: r.phaseSortOrder,
    isFinal: r.phaseIsFinal,
    isActive: r.phaseIsActive,
  }));

  const customersList = customerOptions.map((c) => ({
    id: c.id.toString(),
    name: c.name,
    isInternal: c.isInternal,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-black">Fasi</h1>
          <p className="text-sm text-gray-600">Fasi di produzione per azienda (ordinate per sortOrder).</p>
        </div>

        <Link
          href="/admin/phases/new"
          className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          Nuova fase
        </Link>
      </div>

      <PhasesClient customers={customersList} phases={phasesList} />
    </div>
  );
}