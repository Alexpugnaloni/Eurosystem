// app/admin/reports/ore/page.tsx
import { db } from "@/db";
import { customers, workLogs } from "@/db/schema";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import {
  currentWorkWeekRange,
  fmtMinutes,
  isoToday,
  isoToIT,
  previousMonthRange,
} from "../_lib";

type SearchParams = {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  customerId?: string; // bigint string
};

type Row = {
  customerId: bigint;
  customerName: string;
  isInternal: boolean;
  totalMinutes: number;
  productionMinutes: number;
  cleaningMinutes: number;
};

async function hoursByCompany({
  from,
  to,
  customerId,
}: {
  from: string;
  to: string;
  customerId?: bigint | null;
}): Promise<Row[]> {
  const whereParts = [gte(workLogs.workDate, from), lte(workLogs.workDate, to)];
  if (customerId) whereParts.push(eq(workLogs.customerId, customerId));

  const rows = await db
    .select({
      customerId: customers.id,
      customerName: customers.name,
      isInternal: customers.isInternal,

      totalMinutes: sql<number>`coalesce(sum(${workLogs.durationMinutes}), 0)`,
      productionMinutes: sql<number>`coalesce(sum(case when ${workLogs.activityType} = 'PRODUCTION' then ${workLogs.durationMinutes} else 0 end), 0)`,
      cleaningMinutes: sql<number>`coalesce(sum(case when ${workLogs.activityType} = 'CLEANING' then ${workLogs.durationMinutes} else 0 end), 0)`,
    })
    .from(workLogs)
    .innerJoin(customers, eq(customers.id, workLogs.customerId))
    .where(and(...whereParts))
    .groupBy(customers.id, customers.name, customers.isInternal)
    .orderBy(asc(customers.name));

  return rows.map((r) => ({
    customerId: r.customerId,
    customerName: r.customerName,
    isInternal: r.isInternal,
    totalMinutes: Number(r.totalMinutes),
    productionMinutes: Number(r.productionMinutes),
    cleaningMinutes: Number(r.cleaningMinutes),
  }));
}

function Section({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: Row[];
}) {
  const grandTotal = rows.reduce((acc, r) => acc + r.totalMinutes, 0);

  return (
    <section className="rounded-lg border bg-white p-5">
      <div className="mb-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-black">{title}</h2>
            <p className="text-sm text-gray-600">{subtitle}</p>
          </div>
          <div className="text-sm text-black">
            Totale: <span className="font-semibold">{fmtMinutes(grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr className="text-gray-700">
              {/* ✅ ordine richiesto */}
              <th className="px-4 py-3">Azienda</th>
              <th className="px-4 py-3">Produzione</th>
              <th className="px-4 py-3">Pulizie</th>
              <th className="px-4 py-3">Totale</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-gray-600" colSpan={4}>
                  Nessun dato nel periodo selezionato.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
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
                  <td className="px-4 py-3 text-black">{fmtMinutes(r.productionMinutes)}</td>
                  <td className="px-4 py-3 text-black">{fmtMinutes(r.cleaningMinutes)}</td>
                  <td className="px-4 py-3 text-black">{fmtMinutes(r.totalMinutes)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function ReportsOrePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const todayIso = isoToday();
  const now = new Date();

  const week = currentWorkWeekRange(now);
  const prevMonth = previousMonthRange(now);

  const customFrom = sp.from ?? "";
  const customTo = sp.to ?? "";
  const customCustomerId = sp.customerId ? BigInt(sp.customerId) : null;

  const activeCustomers = await db
    .select({ id: customers.id, name: customers.name, isInternal: customers.isInternal })
    .from(customers)
    .where(eq(customers.isActive, true))
    .orderBy(asc(customers.name));

  const rowsToday = await hoursByCompany({ from: todayIso, to: todayIso });
  const rowsWeek = await hoursByCompany({ from: week.from, to: week.to });
  const rowsPrevMonth = await hoursByCompany({ from: prevMonth.from, to: prevMonth.to });

  const canRunCustom = Boolean(customFrom && customTo && customFrom <= customTo);
  const rowsCustom = canRunCustom
    ? await hoursByCompany({
        from: customFrom,
        to: customTo,
        customerId: customCustomerId,
      })
    : [];

  return (
    <div className="space-y-6">
      <Section
        title="Ore giornaliere"
        subtitle={`Totale ore per azienda in data ${isoToIT(todayIso)}.`}
        rows={rowsToday}
      />

      <Section
        title="Settimana corrente (Lun→Ven)"
        subtitle={`Totale ore per azienda dal ${isoToIT(week.from)} al ${isoToIT(
          week.to
        )} (se oggi è in mezzo alla settimana, conta fino a oggi).`}
        rows={rowsWeek}
      />

      <Section
        title="Mese precedente"
        subtitle={`Totale ore per azienda dal ${isoToIT(prevMonth.from)} al ${isoToIT(
          prevMonth.to
        )}.`}
        rows={rowsPrevMonth}
      />

      <section className="rounded-lg border bg-white p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-black">Filtro personalizzato</h2>
          <p className="text-sm text-gray-600">
            Seleziona un intervallo (da…a…) e opzionalmente un’azienda per vedere le ore.
          </p>
        </div>

        <form method="get" className="mb-4 grid gap-3 md:grid-cols-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-black">Da</label>
            <input
              type="date"
              name="from"
              defaultValue={customFrom}
              className="rounded-md border px-3 py-2 text-sm text-black"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-black">A</label>
            <input
              type="date"
              name="to"
              defaultValue={customTo}
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
                  {c.isInternal ? " (Interna)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button className="rounded-md bg-black px-4 py-2 text-sm text-white">
              Applica
            </button>

            <a
              href="/admin/reports/ore"
              className="rounded-md border px-4 py-2 text-sm text-black hover:bg-gray-100"
            >
              Reset
            </a>
          </div>
        </form>

        {!canRunCustom && (customFrom || customTo) ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Intervallo non valido: assicurati che “Da” e “A” siano valorizzati e che Da ≤ A.
          </div>
        ) : null}

        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr className="text-gray-700">
                {/* ✅ ordine richiesto */}
                <th className="px-4 py-3">Azienda</th>
                <th className="px-4 py-3">Produzione</th>
                <th className="px-4 py-3">Pulizie</th>
                <th className="px-4 py-3">Totale</th>
              </tr>
            </thead>
            <tbody>
              {!canRunCustom ? (
                <tr>
                  <td className="px-4 py-4 text-gray-600" colSpan={4}>
                    Inserisci un intervallo valido per visualizzare i risultati.
                  </td>
                </tr>
              ) : rowsCustom.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-gray-600" colSpan={4}>
                    Nessun dato nel periodo selezionato.
                  </td>
                </tr>
              ) : (
                rowsCustom.map((r) => (
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
                    <td className="px-4 py-3 text-black">{fmtMinutes(r.productionMinutes)}</td>
                    <td className="px-4 py-3 text-black">{fmtMinutes(r.cleaningMinutes)}</td>
                    <td className="px-4 py-3 text-black">{fmtMinutes(r.totalMinutes)}</td>
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