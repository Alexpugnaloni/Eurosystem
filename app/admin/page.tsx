// app/admin/page.tsx
import Link from "next/link";
import DashboardDonut from "./DashboardDonut";
import { db } from "@/db";
import { customers, deliveries, phases, workLogs } from "@/db/schema";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Panoramica mese corrente e disponibilità consegne.
        </p>
      </div>

      {/* DONUT (lo lasciamo com’è, poi lo convertiamo) */}
      <DashboardDonut
        title="Distribuzione ore per azienda (mese corrente)"
        subtitle={`Periodo: ${isoToIT(mtd.from)} → ${isoToIT(mtd.to)} (month-to-date).`}
        slices={donutSlices}
      />

      {/* Prodotti pronti per consegna */}
      <Card>
        <CardHeader>
          <CardTitle>Prodotti pronti per consegna</CardTitle>
          <CardDescription>
            Totale pezzi disponibili per azienda. Il dettaglio per modello è in Report → Consegne.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Azienda</TableHead>
                  <TableHead className="text-right">Pronti (pezzi)</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {availableByCustomer.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground">
                      Nessun prodotto pronto per consegna (in base ai dati attuali).
                    </TableCell>
                  </TableRow>
                ) : (
                  availableByCustomer.map((r) => (
                    <TableRow key={String(r.customerId)}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{r.customerName}</span>
                          {r.isInternal ? <Badge variant="secondary">Interna</Badge> : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{r.availableQty}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Azioni rapide */}
      <Card>
        <CardHeader>
          <CardTitle>Azioni rapide</CardTitle>
          <CardDescription>Vai direttamente alle sezioni operative.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/reports/ore">Report → Ore</Link>
            </Button>

            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/reports/produzione">Report → Produzione</Link>
            </Button>

            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/reports/consegne">Report → Consegne</Link>
            </Button>

            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/customers">Gestisci Aziende</Link>
            </Button>

            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/models">Gestisci Modelli</Link>
            </Button>

            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/phases">Gestisci Fasi</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}