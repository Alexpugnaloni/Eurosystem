// app/admin/page.tsx
import DashboardDonut from "./DashboardDonut";
import { db } from "@/db";
import { customers, deliveries, phases, workLogs } from "@/db/schema";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";

function isoToday() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isoToIT(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}-${m}-${y}`;
}

function monthToDateRange(base: Date) {
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const from = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(
    start.getDate()
  ).padStart(2, "0")}`;

  const to = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(
    end.getDate()
  ).padStart(2, "0")}`;

  return { from, to };
}

type DonutSlice = {
  label: string;
  value: number; // minutes
  percent: number;
  isInternal?: boolean;
};

export default async function AdminPage() {
  const todayIso = isoToday();
  const mtd = monthToDateRange(new Date());

  // 1) Ore mese corrente (month-to-date) per azienda (Produzione + Pulizie)
  const minutesByCustomer = await db
    .select({
      customerId: customers.id,
      customerName: customers.name,
      isInternal: customers.isInternal,
      minutes: sql<number>`coalesce(sum(${workLogs.durationMinutes}), 0)`,
    })
    .from(workLogs)
    .innerJoin(customers, eq(customers.id, workLogs.customerId))
    .where(and(gte(workLogs.workDate, mtd.from), lte(workLogs.workDate, mtd.to)))
    .groupBy(customers.id, customers.name, customers.isInternal)
    .orderBy(asc(customers.name));

  const totalMinutes = minutesByCustomer.reduce((acc, r) => acc + Number(r.minutes), 0);

  const donutSlices: DonutSlice[] = minutesByCustomer
    .map((r) => {
      const minutes = Number(r.minutes);
      const percent = totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0;
      return {
        label: r.customerName,
        value: minutes,
        percent,
        isInternal: r.isInternal,
      };
    })
    .filter((s) => s.value > 0);

  // 2) Pronti per consegna per azienda (aggregato)
  // ready = SUM(qty_ok) in fasi finali
  const readyByCustomer = await db
    .select({
      customerId: customers.id,
      customerName: customers.name,
      isInternal: customers.isInternal,
      readyQty: sql<number>`coalesce(sum(${workLogs.qtyOk}), 0)`,
    })
    .from(workLogs)
    .innerJoin(phases, eq(phases.id, workLogs.phaseId))
    .innerJoin(customers, eq(customers.id, workLogs.customerId))
    .where(and(eq(workLogs.activityType, "PRODUCTION"), eq(phases.isFinal, true)))
    .groupBy(customers.id, customers.name, customers.isInternal)
    .orderBy(asc(customers.name));

  // delivered = SUM(deliveries.quantity) per azienda
  const deliveredByCustomer = await db
    .select({
      customerId: customers.id,
      deliveredQty: sql<number>`coalesce(sum(${deliveries.quantity}), 0)`,
    })
    .from(deliveries)
    .innerJoin(customers, eq(customers.id, deliveries.customerId))
    .groupBy(customers.id);

  const deliveredMap = new Map<string, number>();
  deliveredByCustomer.forEach((r) => {
    deliveredMap.set(String(r.customerId), Number(r.deliveredQty));
  });

  const availableByCustomer = readyByCustomer
    .map((r) => {
      const delivered = deliveredMap.get(String(r.customerId)) ?? 0;
      const ready = Number(r.readyQty);
      const available = Math.max(0, ready - delivered);
      return {
        customerId: r.customerId,
        customerName: r.customerName,
        isInternal: r.isInternal,
        availableQty: available,
      };
    })
    .filter((r) => r.availableQty > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-black">Dashboard</h1>
        <p className="text-sm text-gray-600">
          Panoramica mese corrente e disponibilità consegne.
        </p>
      </div>

      {/* ✅ DONUT: percentuali ore mese corrente */}
      <DashboardDonut
        title="Distribuzione ore per azienda (mese corrente)"
        subtitle={`Periodo: ${isoToIT(mtd.from)} → ${isoToIT(mtd.to)} (month-to-date).`}
        slices={donutSlices}
      />

      {/* ✅ Pronti per consegna per azienda (solo contatore) */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-black">Prodotti pronti per consegna (per azienda)</h2>
          <p className="text-sm text-gray-600">
            Mostra solo il totale pezzi disponibili per azienda. Il dettaglio per modello è in Report → Consegne.
          </p>
        </div>

        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr className="text-gray-700">
                <th className="px-4 py-3">Azienda</th>
                <th className="px-4 py-3">Pronti (pezzi)</th>
              </tr>
            </thead>
            <tbody>
              {availableByCustomer.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-gray-600" colSpan={2}>
                    Nessun prodotto pronto per consegna (in base ai dati attuali).
                  </td>
                </tr>
              ) : (
                availableByCustomer.map((r) => (
                  <tr key={String(r.customerId)} className="border-t">
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
                    <td className="px-4 py-3 text-black font-semibold">{r.availableQty}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Link utili (se vuoi li lasciamo, oppure li togliamo) */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-black">Azioni rapide</h2>
        <p className="text-sm text-gray-600">Vai direttamente alle sezioni operative.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href="/admin/reports/ore"
            className="rounded-md border px-4 py-3 text-sm text-black hover:bg-gray-100"
          >
            Report → Ore
          </a>
          <a
            href="/admin/reports/produzione"
            className="rounded-md border px-4 py-3 text-sm text-black hover:bg-gray-100"
          >
            Report → Produzione
          </a>
          <a
            href="/admin/reports/consegne"
            className="rounded-md border px-4 py-3 text-sm text-black hover:bg-gray-100"
          >
            Report → Consegne
          </a>
          <a
            href="/admin/customers"
            className="rounded-md border px-4 py-3 text-sm text-black hover:bg-gray-100"
          >
            Gestisci Aziende
          </a>
          <a
            href="/admin/models"
            className="rounded-md border px-4 py-3 text-sm text-black hover:bg-gray-100"
          >
            Gestisci Modelli
          </a>
          <a
            href="/admin/phases"
            className="rounded-md border px-4 py-3 text-sm text-black hover:bg-gray-100"
          >
            Gestisci Fasi
          </a>
        </div>
      </section>
    </div>
  );
}