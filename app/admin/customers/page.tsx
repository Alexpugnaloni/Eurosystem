import { redirect } from "next/navigation";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { desc } from "drizzle-orm";
import Link from "next/link";

export default async function AdminCustomersPage() {
  const me = await requireUser();
  if (me.role !== "ADMIN") redirect("/worker");

  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      isInternal: customers.isInternal,
      isActive: customers.isActive,
      createdAt: customers.createdAt,
    })
    .from(customers)
    .orderBy(desc(customers.createdAt));

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-black">Aziende</h1>

        <Link
          href="/admin/customers/new"
          className="rounded-md bg-black px-4 py-2 text-white text-sm"
        >
          Nuova azienda
        </Link>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm text-black">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left">Attiva</th>
              <th className="p-3 text-left">Azioni</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((c) => (
              <tr key={String(c.id)} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  {c.name}{" "}
                  {c.isInternal && (
                    <span className="ml-2 rounded border px-2 py-0.5 text-xs">
                      Interna
                    </span>
                  )}
                </td>
                <td className="p-3">{c.isActive ? "Sì" : "No"}</td>
                <td className="p-3">
                  <Link href={`/admin/customers/${c.id}/edit`} className="underline">
                    Modifica
                  </Link>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td className="p-3" colSpan={3}>
                  Nessuna azienda presente.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-black">
        Nota: l&apos;azienda interna è unica ed è gestita dal seed.
      </div>
    </div>
  );
}