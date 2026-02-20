import { redirect, notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import EditCustomerForm from "./EditCustomerForm";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireUser();
  if (me.role !== "ADMIN") redirect("/worker");

  const { id } = await params;

  const row = await db
    .select({
      id: customers.id,
      name: customers.name,
      isInternal: customers.isInternal,
      isActive: customers.isActive,
    })
    .from(customers)
    .where(eq(customers.id, BigInt(id)))
    .limit(1);

  const c = row[0];
  if (!c) notFound();

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-black">Modifica azienda</h1>
        <p className="mt-1 text-sm text-black">
          Aggiorna i dati dell&apos;azienda.
        </p>
      </div>

      <EditCustomerForm
        customerId={id}
        isInternal={c.isInternal}
        initialValues={{
          name: c.name,
          isActive: c.isActive,
        }}
      />
    </div>
  );
}