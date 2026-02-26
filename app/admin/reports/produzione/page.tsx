// app/admin/reports/produzione/page.tsx
import { db } from "@/db";
import { customers, models, workLogs } from "@/db/schema";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { fmtMinutes, isoToday } from "../_lib";

type SearchParams = {
  from?: string;
  to?: string;
  customerId?: string;
};

export default async function ReportsProduzionePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const today = isoToday();
  const from = sp.from ?? today;
  const to = sp.to ?? today;
  const customerId = sp.customerId ? BigInt(sp.customerId) : null;

  const activeCustomers = await db
    .select({ id: customers.id, name: customers.name })
    .from(customers)
    .where(eq(customers.isActive, true))
    .orderBy(asc(customers.name));

  const whereParts = [
    eq(workLogs.activityType, "PRODUCTION"),
    gte(workLogs.workDate, from),
    lte(workLogs.workDate, to),
  ];
  if (customerId) whereParts.push(eq(workLogs.customerId, customerId));

  const rows = await db
    .select({
      customerId: customers.id,
      customerName: customers.name,
      modelId: models.id,
      modelName: models.name,
      qtyOk: sql<number>`coalesce(sum(${workLogs.qtyOk}), 0)`,
      qtyKo: sql<number>`coalesce(sum(${workLogs.qtyKo}), 0)`,
      qtyTot: sql<number>`coalesce(sum(${workLogs.qtyOk} + ${workLogs.qtyKo}), 0)`,
      minutes: sql<number>`coalesce(sum(${workLogs.durationMinutes}), 0)`,
    })
    .from(workLogs)
    .innerJoin(customers, eq(customers.id, workLogs.customerId))
    .innerJoin(models, eq(models.id, workLogs.modelId))
    .where(and(...whereParts))
    .groupBy(customers.id, customers.name, models.id, models.name)
    .orderBy(sql`coalesce(sum(${workLogs.qtyOk} + ${workLogs.qtyKo}),0) desc`)
    .limit(50);

  const norm = rows.map((r) => ({
    ...r,
    qtyOk: Number(r.qtyOk),
    qtyKo: Number(r.qtyKo),
    qtyTot: Number(r.qtyTot),
    minutes: Number(r.minutes),
  }));

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-white p-5">
        <h2 className="text-lg font-semibold text-black">Top modelli lavorati</h2>
        <p className="text-sm text-gray-600">
          Produzione aggregata per azienda e modello (range selezionato).
        </p>

        <form method="get" className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-black">Da</label>
            <input
              type="date"
              name="from"
              defaultValue={from}
              className="rounded-md border px-3 py-2 text-sm text-black"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-black">A</label>
            <input
              type="date"
              name="to"
              defaultValue={to}
              className="rounded-md border px-3 py-2 text-sm text-black"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-black">Azienda (opzionale)</label>
            <select
              name="customerId"
              defaultValue={sp.customerId ?? ""}
              className="rounded-md border px-3 py-2 text-sm text-black"
            >
              <option value="">Tutte</option>
              {activeCustomers.map((c) => (
                <option key={String(c.id)} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button className="rounded-md bg-black px-4 py-2 text-sm text-white">
              Applica
            </button>
            <a
              href="/admin/reports/produzione"
              className="rounded-md border px-4 py-2 text-sm text-black hover:bg-gray-100"
            >
              Reset
            </a>
          </div>
        </form>
      </section>

      <section className="rounded-lg border bg-white p-5">
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr className="text-gray-700">
                <th className="px-4 py-3">Azienda</th>
                <th className="px-4 py-3">Modello</th>
                <th className="px-4 py-3">Tot</th>
                <th className="px-4 py-3">OK</th>
                <th className="px-4 py-3">KO</th>
                <th className="px-4 py-3">Ore</th>
              </tr>
            </thead>
            <tbody>
              {norm.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-gray-600" colSpan={6}>
                    Nessun dato nel periodo selezionato.
                  </td>
                </tr>
              ) : (
                norm.map((r) => (
                  <tr key={`${r.customerId}-${r.modelId}`} className="border-t">
                    <td className="px-4 py-3 text-black">{r.customerName}</td>
                    <td className="px-4 py-3 text-black">{r.modelName}</td>
                    <td className="px-4 py-3 text-black">{r.qtyTot}</td>
                    <td className="px-4 py-3 text-black">{r.qtyOk}</td>
                    <td className="px-4 py-3 text-black">{r.qtyKo}</td>
                    <td className="px-4 py-3 text-black">{fmtMinutes(r.minutes)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}