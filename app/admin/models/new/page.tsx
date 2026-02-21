// app/admin/models/new/page.tsx

import { db } from "@/db";
import { customers } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import CreateModelForm from "./CreateModelForm";

export default async function NewModelPage() {
  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      isInternal: customers.isInternal,
    })
    .from(customers)
    .where(eq(customers.isActive, true))
    .orderBy(asc(customers.name));

  // ✅ converto bigint -> string per il componente client
  const activeCustomers = rows.map((c) => ({
    ...c,
    id: c.id.toString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-black">Nuovo Modello</h1>
          <p className="text-sm text-gray-600">
            Crea un prodotto/modello e associalo a un’azienda.
          </p>
        </div>

        <Link
          href="/admin/models"
          className="rounded-md border px-3 py-2 text-sm text-black hover:bg-gray-100"
        >
          ← Indietro
        </Link>
      </div>

      <div className="rounded-md border bg-white p-6">
        <CreateModelForm customers={activeCustomers} />
      </div>
    </div>
  );
}