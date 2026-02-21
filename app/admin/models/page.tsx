// app/admin/models/page.tsx

import { db } from "@/db";
import { models, customers } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";

export default async function ModelsPage() {
  const rows = await db
    .select({
      id: models.id,
      name: models.name,
      code: models.code,
      isActive: models.isActive,
      customerName: customers.name,
    })
    .from(models)
    .leftJoin(customers, eq(models.customerId, customers.id))
    .orderBy(desc(models.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-black">Modelli</h1>

        <Link
          href="/admin/models/new"
          className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          Nuovo Modello
        </Link>
      </div>

      <div className="overflow-hidden rounded-md border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left text-black">
            <tr>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Codice</th>
              <th className="px-4 py-2">Azienda</th>
              <th className="px-4 py-2">Attivo</th>
              <th className="px-4 py-2 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="px-4 py-2 text-black">{m.name}</td>

                <td className="px-4 py-2 text-black">
                  {m.code ?? "-"}
                </td>

                <td className="px-4 py-2 text-black">
                  {m.customerName}
                </td>

                <td className="px-4 py-2 text-black">
                  {m.isActive ? "Sì" : "No"}
                </td>

                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/admin/models/${m.id}/edit`}
                    className="text-blue-600 hover:underline"
                  >
                    Modifica
                  </Link>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-gray-500"
                >
                  Nessun modello presente.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}