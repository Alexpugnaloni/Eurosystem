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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SearchParams = {
  from?: string;
  to?: string;
  customerId?: string;
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <Badge variant="secondary">
          Totale {fmtMinutes(grandTotal)}
        </Badge>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b text-left">
            <tr className="text-muted-foreground">
              <th className="py-2 pr-4">Azienda</th>
              <th className="py-2 pr-4">Produzione</th>
              <th className="py-2 pr-4">Pulizie</th>
              <th className="py-2 pr-4">Totale</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="py-4 text-muted-foreground" colSpan={4}>
                  Nessun dato nel periodo selezionato.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={String(r.customerId)} className="border-b">
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.customerName}</span>

                      {r.isInternal && (
                        <Badge variant="outline">Interna</Badge>
                      )}
                    </div>
                  </td>

                  <td className="py-2 pr-4">
                    {fmtMinutes(r.productionMinutes)}
                  </td>

                  <td className="py-2 pr-4">
                    {fmtMinutes(r.cleaningMinutes)}
                  </td>

                  <td className="py-2 pr-4 font-medium">
                    {fmtMinutes(r.totalMinutes)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
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

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Report ore
        </h1>
        <p className="text-sm text-muted-foreground">
          Analisi delle ore lavorate per azienda.
        </p>
      </div>

      <Section
        title="Ore giornaliere"
        subtitle={`Totale ore per azienda in data ${isoToIT(todayIso)}.`}
        rows={rowsToday}
      />

      <Section
        title="Settimana corrente (Lun→Ven)"
        subtitle={`Dal ${isoToIT(week.from)} al ${isoToIT(week.to)}.`}
        rows={rowsWeek}
      />

      <Section
        title="Mese precedente"
        subtitle={`Dal ${isoToIT(prevMonth.from)} al ${isoToIT(prevMonth.to)}.`}
        rows={rowsPrevMonth}
      />

      {/* Filtro personalizzato */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Filtro personalizzato
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Seleziona un intervallo e opzionalmente un’azienda.
          </p>
        </CardHeader>

        <CardContent>

          <form method="get" className="grid gap-4 md:grid-cols-4 mb-4">

            <div className="flex flex-col gap-1">
              <label className="text-sm">Da</label>
              <input
                type="date"
                name="from"
                defaultValue={customFrom}
                className="h-10 rounded-md border border-input px-3"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm">A</label>
              <input
                type="date"
                name="to"
                defaultValue={customTo}
                className="h-10 rounded-md border border-input px-3"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm">Azienda</label>
              <select
                name="customerId"
                defaultValue={sp.customerId ?? ""}
                className="h-10 rounded-md border border-input px-3"
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
              <Button type="submit">Applica</Button>

              <Button asChild variant="outline">
                <a href="/admin/reports/ore">Reset</a>
              </Button>
            </div>

          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left">
                <tr className="text-muted-foreground">
                  <th className="py-2 pr-4">Azienda</th>
                  <th className="py-2 pr-4">Produzione</th>
                  <th className="py-2 pr-4">Pulizie</th>
                  <th className="py-2 pr-4">Totale</th>
                </tr>
              </thead>

              <tbody>
                {!canRunCustom ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-muted-foreground">
                      Inserisci un intervallo valido.
                    </td>
                  </tr>
                ) : rowsCustom.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-muted-foreground">
                      Nessun dato nel periodo selezionato.
                    </td>
                  </tr>
                ) : (
                  rowsCustom.map((r) => (
                    <tr key={String(r.customerId)} className="border-b">
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{r.customerName}</span>
                          {r.isInternal && <Badge variant="outline">Interna</Badge>}
                        </div>
                      </td>

                      <td className="py-2 pr-4">
                        {fmtMinutes(r.productionMinutes)}
                      </td>

                      <td className="py-2 pr-4">
                        {fmtMinutes(r.cleaningMinutes)}
                      </td>

                      <td className="py-2 pr-4 font-medium">
                        {fmtMinutes(r.totalMinutes)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}