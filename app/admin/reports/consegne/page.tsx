import { db } from "@/db";
import { customers, deliveries, models, phases, workLogs } from "@/db/schema";
import { and, asc, eq, sql } from "drizzle-orm";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

  const readyWhere = [
    eq(workLogs.activityType, "PRODUCTION"),
    eq(phases.isFinal, true),
  ];

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

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Report consegne
        </h1>

        <p className="text-sm text-muted-foreground">
          Prodotti disponibili per consegna (OK finali − consegne registrate).
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
          <form method="get" className="flex flex-wrap items-end gap-3">

            <div className="flex flex-col gap-1">
              <label className="text-sm">
                Azienda
              </label>

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

            <Button type="submit">
              Applica
            </Button>

            <Button asChild variant="outline">
              <a href="/admin/reports/consegne">
                Reset
              </a>
            </Button>

          </form>
        </CardContent>
      </Card>

      {/* Tabella risultati */}
      <Card>

        <CardHeader>
          <CardTitle className="text-base">
            Disponibili per consegna
          </CardTitle>
        </CardHeader>

        <CardContent className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="border-b text-left">
              <tr className="text-muted-foreground">
                <th className="py-2 pr-4">Azienda</th>
                <th className="py-2 pr-4">Modello</th>
                <th className="py-2 pr-4">Pronti</th>
                <th className="py-2 pr-4">Consegnati</th>
                <th className="py-2 pr-4">Disponibili</th>
              </tr>
            </thead>

            <tbody>

              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-muted-foreground">
                    Nessun modello disponibile per consegna.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={`${r.customerId}-${r.modelId}`} className="border-b">

                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">

                        <span className="font-medium">
                          {r.customerName}
                        </span>

                        {r.isInternal && (
                          <Badge variant="outline">
                            Interna
                          </Badge>
                        )}

                      </div>
                    </td>

                    <td className="py-2 pr-4 font-medium">
                      {r.modelName}
                    </td>

                    <td className="py-2 pr-4">
                      {r.readyQty}
                    </td>

                    <td className="py-2 pr-4">
                      {r.deliveredQty}
                    </td>

                    <td className="py-2 pr-4">
                      <Badge>
                        {r.availableQty}
                      </Badge>
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