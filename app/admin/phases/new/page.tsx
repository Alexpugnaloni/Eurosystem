// app/admin/phases/new/page.tsx
import { db } from "@/db";
import { customers } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import CreatePhaseForm from "./CreatePhaseForm";

export default async function NewPhasePage() {
  const me = await requireUser();
  if (me.role !== "ADMIN") redirect("/worker");

  const rows = await db
    .select({ id: customers.id, name: customers.name, isInternal: customers.isInternal })
    .from(customers)
    .where(eq(customers.isActive, true))
    .orderBy(asc(customers.name));

  const options = rows.map((c) => ({
    id: c.id.toString(),
    name: c.name,
    isInternal: c.isInternal,
  }));

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-black">Nuova fase</h1>
        <p className="text-sm text-gray-600">Crea una fase per una specifica azienda.</p>
      </div>

      <CreatePhaseForm customers={options} />
    </div>
  );
}