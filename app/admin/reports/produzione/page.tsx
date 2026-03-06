import { db } from "@/db";
import { customers, models, workLogs } from "@/db/schema";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { fmtMinutes, isoToday } from "../_lib";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Report produzione
        </h1>

        <p className="text-sm text-muted-foreground">
          Produzione aggregata per azienda e modello.
        </p>
      </div>

      {/* Filtri */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Filtri
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form method="get" className="grid gap-4 md:grid-cols-4">

            <div className="flex flex-col gap-1">
              <label className="text-sm">Da</label>

              <input
                type="date"
                name="from"
                defaultValue={from}
                className="h-10 rounded-md border border-input px-3"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm">A</label>

              <input
                type="date"
                name="to"
                defaultValue={to}
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
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">

              <Button type="submit">
                Applica
              </Button>

              <Button asChild variant="outline">
                <a href="/admin/reports/produzione">
                  Reset
                </a>
              </Button>

            </div>

          </form>
        </CardContent>
      </Card>

      {/* Tabella risultati */}
      <Card>

        <CardHeader>
          <CardTitle className="text-base">
            Top modelli lavorati
          </CardTitle>
        </CardHeader>

        <CardContent className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="border-b text-left">
              <tr className="text-muted-foreground">
                <th className="py-2 pr-4">Azienda</th>
                <th className="py-2 pr-4">Modello</th>
                <th className="py-2 pr-4">Tot</th>
                <th className="py-2 pr-4">OK</th>
                <th className="py-2 pr-4">KO</th>
                <th className="py-2 pr-4">Ore</th>
              </tr>
            </thead>

            <tbody>

              {norm.length === 0 ? (
                <tr>
                  <td className="py-4 text-muted-foreground" colSpan={6}>
                    Nessun dato nel periodo selezionato.
                  </td>
                </tr>
              ) : (
                norm.map((r) => (
                  <tr key={`${r.customerId}-${r.modelId}`} className="border-b">

                    <td className="py-2 pr-4">
                      {r.customerName}
                    </td>

                    <td className="py-2 pr-4 font-medium">
                      {r.modelName}
                    </td>

                    <td className="py-2 pr-4">
                      <Badge variant="secondary">
                        {r.qtyTot}
                      </Badge>
                    </td>

                    <td className="py-2 pr-4">
                      {r.qtyOk}
                    </td>

                    <td className="py-2 pr-4">
                      {r.qtyKo}
                    </td>

                    <td className="py-2 pr-4">
                      {fmtMinutes(r.minutes)}
                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </CardContent>

      </Card>

    </div>
  );
}