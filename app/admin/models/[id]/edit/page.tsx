// app/admin/models/[id]/edit/page.tsx

import { db } from "@/db";
import { customers, models } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import EditModelForm from "./EditModelForm";

export default async function EditModelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let modelId: bigint;
  try {
    modelId = BigInt(id);
  } catch {
    notFound();
  }

  const modelRows = await db
    .select({
      id: models.id,
      customerId: models.customerId,
      name: models.name,
      code: models.code,
      isActive: models.isActive,
    })
    .from(models)
    .where(eq(models.id, modelId))
    .limit(1);

  const model = modelRows[0];
  if (!model) notFound();

  const customerRows = await db
    .select({
      id: customers.id,
      name: customers.name,
      isInternal: customers.isInternal,
    })
    .from(customers)
    .where(eq(customers.isActive, true))
    .orderBy(asc(customers.name));

  const customerOptions = customerRows.map((c) => ({
    ...c,
    id: c.id.toString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-black">Modifica Modello</h1>
          <p className="text-sm text-gray-600">
            Aggiorna dati e stato del modello.
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
        <EditModelForm
          model={{
            id: model.id.toString(),
            customerId: model.customerId.toString(),
            name: model.name,
            code: model.code ?? "",
            isActive: model.isActive,
          }}
          customers={customerOptions}
        />
      </div>
    </div>
  );
}