// app/admin/models/page.tsx

import { db } from "@/db";
import { customers, models } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import ModelsListClient from "./ModelsListClient";

type Row = {
  modelId: bigint;
  modelName: string;
  modelCode: string | null;
  modelIsActive: boolean;

  customerId: bigint;
  customerName: string;
  customerIsInternal: boolean;
};

export default async function ModelsPage() {
  const rows: Row[] = await db
    .select({
      modelId: models.id,
      modelName: models.name,
      modelCode: models.code,
      modelIsActive: models.isActive,

      customerId: customers.id,
      customerName: customers.name,
      customerIsInternal: customers.isInternal,
    })
    .from(models)
    .innerJoin(customers, eq(models.customerId, customers.id))
    .orderBy(asc(customers.name), asc(models.name));

  const grouped = new Map<
    string,
    {
      customer: { id: string; name: string; isInternal: boolean };
      items: { id: string; name: string; code: string | null; isActive: boolean }[];
    }
  >();

  for (const r of rows) {
    const key = r.customerId.toString();

    if (!grouped.has(key)) {
      grouped.set(key, {
        customer: {
          id: key,
          name: r.customerName,
          isInternal: r.customerIsInternal,
        },
        items: [],
      });
    }

    grouped.get(key)!.items.push({
      id: r.modelId.toString(),
      name: r.modelName,
      code: r.modelCode,
      isActive: r.modelIsActive,
    });
  }

  const groups = Array.from(grouped.values());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-black">Modelli</h1>
          <p className="text-sm text-gray-600">
            Prodotti/modelli raggruppati per azienda.
          </p>
        </div>

        <Link
          href="/admin/models/new"
          className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          Nuovo Modello
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-md border bg-white p-6 text-sm text-gray-600">
          Nessun modello presente.
        </div>
      ) : (
        <ModelsListClient groups={groups} />
      )}
    </div>
  );
}