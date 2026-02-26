// app/admin/reports/consegne/page.tsx
import { db } from "@/db";
import { customers, deliveries, models, phases, workLogs } from "@/db/schema";
import { and, asc, eq, sql } from "drizzle-orm";

type SearchParams = {
  customerId?: string;
};

type Key = string;

function key(customerId: bigint, modelId: bigint): Key {
  return `${customerId.toString()}::${modelId.toString()}`;
}

export default async function ReportsConsegnePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const customerId = sp.customerId ? BigInt(sp.customerId) : null;

  const activeCustomers = await db
    .select({ id: customers.id, name: customers.name, isInternal: customers.isInternal })
    .from(customers)
    .where(eq(customers.isActive, true))
    .orderBy(asc(customers.name));

  const readyWhere = [eq(workLogs.activityType, "PRODUCTION"), eq(phases.isFinal, true)];
  if (customerId) readyWhere.push(eq(workLogs.customerId, customerId));

  const ready = await db
    .select({
      customerId: customers.id,
      customerName: customers.name,
      isInternal: customers.isInternal,
      modelId: models.id,
      modelName: models.name,
      readyQty: sql<number>`coalesce(sum(${workLogs.qtyOk}), 0)`,
    })
    .from(workLogs)
    .innerJoin(phases, eq(phases.id, workLogs.phaseId))
    .innerJoin(customers, eq(customers.id, workLogs.customerId))
    .innerJoin(models, eq(models.id, workLogs.modelId))
    .where(and(...readyWhere))
    .groupBy(customers.id, customers.name, customers.isInternal, models.id, models.name)
    .orderBy(asc(customers.name), asc(models.name));

  const delWhere = [];
  if (customerId) delWhere.push(eq(deliveries.customerId, customerId));

  const delivered = await db
    .select({
      customerId: customers.id,
      modelId: models.id,
      deliveredQty: sql<number>`coalesce(sum(${deliveries.quantity}), 0)`,
    })
    .from(deliveries)
    .innerJoin(customers, eq(customers.id, deliveries.customerId))
    .innerJoin(models, eq(models.id, deliveries.modelId))
    .where(delWhere.length ? and(...delWhere) : undefined)
    .groupBy(customers.id, models.id);

  const deliveredMap = new Map<Key, number>();
  for (const d of delivered) {
    deliveredMap.set(key(d.customerId, d.modelId), Number(d.deliveredQty));
  }

  const rows = ready
    .map((r) => {
      const deliveredQty = deliveredMap.get(key(r.customerId, r.modelId)) ?? 0;
      const availableQty = Number(r.readyQty) - deliveredQty;
      return {
        customerId: r.customerId,
        customerName: r.customerName,
        isInternal: r.isInternal,
        modelId: r.modelId,
        modelName: r.modelName,
        readyQty: Number(r.readyQty),
        deliveredQty,
        availableQty,
      };
    })
    .filter((r) => r.availableQty > 0);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-white p-5">
        <h2 className="text-lg font-semibold text-black">Disponibili per consegna</h2>
        <p className="text-sm text-gray-600">
          Calcolo: OK registrati in fasi finali − quantità consegnate (deliveries).
        </p>

        <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
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
                  {c.isInternal ? " (Interna)" : ""}
                </option>
              ))}
            </select>
          </div>

          <button className="rounded-md bg-black px-4 py-2 text-sm text-white">
            Applica
          </button>

          <a
            href="/admin/reports/consegne"
            className="rounded-md border px-4 py-2 text-sm text-black hover:bg-gray-100"
          >
            Reset
          </a>
        </form>
      </section>

      <section className="rounded-lg border bg-white p-5">
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr className="text-gray-700">
                <th className="px-4 py-3">Azienda</th>
                <th className="px-4 py-3">Modello</th>
                <th className="px-4 py-3">Pronti</th>
                <th className="px-4 py-3">Consegnati</th>
                <th className="px-4 py-3">Disponibili</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-gray-600" colSpan={5}>
                    Nessun modello disponibile per consegna (in base ai dati attuali).
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={`${r.customerId}-${r.modelId}`} className="border-t">
                    <td className="px-4 py-3 text-black">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{r.customerName}</span>
                        {r.isInternal ? (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                            Interna
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-black">{r.modelName}</td>
                    <td className="px-4 py-3 text-black">{r.readyQty}</td>
                    <td className="px-4 py-3 text-black">{r.deliveredQty}</td>
                    <td className="px-4 py-3 text-black font-semibold">{r.availableQty}</td>
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