// app/admin/worklogs/page.tsx
import { db } from "@/db";
import { customers, models, phases, users, workLogs } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import AdminWorkLogsClient from "./AdminWorkLogsClient";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function isoDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function todayISO() {
  return isoDate(new Date());
}

function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return isoDate(d);
}

function formatIT(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString("it-IT");
}

function parseBigintParam(v: string | string[] | undefined) {
  const s = Array.isArray(v) ? v[0] : v;
  if (!s) return null;
  try {
    return BigInt(String(s));
  } catch {
    return null;
  }
}

function parseStringParam(v: string | string[] | undefined) {
  const s = Array.isArray(v) ? v[0] : v;
  return (s ?? "").trim() || null;
}

function fmtMin(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export default async function AdminWorkLogsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();

  const sp = (await searchParams) ?? {};

  const userId = parseBigintParam(sp.userId);
  const activityType = (parseStringParam(sp.activityType) as
    | "PRODUCTION"
    | "CLEANING"
    | null) ?? null;

  const customerId = parseBigintParam(sp.customerId);

  const rawDateFrom = parseStringParam(sp.dateFrom);
  const rawDateTo = parseStringParam(sp.dateTo);

  let dateFrom: string | null = rawDateFrom;
  let dateTo: string | null = rawDateTo;

  const hasAnyDate = Boolean(rawDateFrom || rawDateTo);
  const hasUserOnly = Boolean(userId && !hasAnyDate);

  if (hasUserOnly) {
    dateFrom = daysAgoISO(29);
    dateTo = todayISO();
  }

  const workers = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      employeeCode: users.employeeCode,
    })
    .from(users)
    .where(and(eq(users.role, "WORKER"), eq(users.isActive, true)))
    .orderBy(asc(users.lastName), asc(users.firstName));

  const custs = await db
    .select({ id: customers.id, name: customers.name })
    .from(customers)
    .where(eq(customers.isActive, true))
    .orderBy(asc(customers.name));

  const shouldQuery = Boolean(userId || hasAnyDate || customerId || activityType);

  const whereParts = [
    dateFrom ? sql`${workLogs.workDate} >= ${dateFrom}::date` : undefined,
    dateTo ? sql`${workLogs.workDate} <= ${dateTo}::date` : undefined,
    userId ? eq(workLogs.userId, userId) : undefined,
    activityType ? eq(workLogs.activityType, activityType) : undefined,
    customerId ? eq(workLogs.customerId, customerId) : undefined,
  ].filter(Boolean);

  const rows = shouldQuery
    ? await db
        .select({
          id: workLogs.id,
          workDate: workLogs.workDate,
          activityType: workLogs.activityType,
          startTime: workLogs.startTime,
          endTime: workLogs.endTime,
          durationMinutes: workLogs.durationMinutes,
          qtyOk: workLogs.qtyOk,
          qtyKo: workLogs.qtyKo,
          notes: workLogs.notes,

          userId: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          employeeCode: users.employeeCode,

          customerName: customers.name,
          modelName: models.name,
          phaseName: phases.name,
        })
        .from(workLogs)
        .innerJoin(users, eq(users.id, workLogs.userId))
        .innerJoin(customers, eq(customers.id, workLogs.customerId))
        .leftJoin(models, eq(models.id, workLogs.modelId))
        .leftJoin(phases, eq(phases.id, workLogs.phaseId))
        .where(and(...(whereParts as any)))
        .orderBy(desc(workLogs.workDate), asc(workLogs.startTime))
        .limit(userId ? 2000 : 300)
    : [];

  const byDate = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = r.workDate;
    const arr = byDate.get(key) ?? [];
    arr.push(r);
    byDate.set(key, arr);
  }

  const days = Array.from(byDate.entries())
    .map(([workDate, dayRows]) => ({ workDate, rows: dayRows }))
    .sort((a, b) => (a.workDate < b.workDate ? 1 : -1));

  const totalProd = rows
    .filter((r) => r.activityType === "PRODUCTION")
    .reduce((sum, r) => sum + (r.durationMinutes ?? 0), 0);

  const totalClean = rows
    .filter((r) => r.activityType === "CLEANING")
    .reduce((sum, r) => sum + (r.durationMinutes ?? 0), 0);

  const totalAll = totalProd + totalClean;

  const showHint = !shouldQuery;

  let periodLabel: string | null = null;

  if (!showHint) {
    if (hasUserOnly) {
      periodLabel = "Ultimi 30 giorni";
    } else if (rawDateFrom && rawDateTo) {
      periodLabel = `Dal ${formatIT(rawDateFrom)} al ${formatIT(rawDateTo)}`;
    } else if (rawDateFrom) {
      periodLabel = `Dal ${formatIT(rawDateFrom)}`;
    } else if (rawDateTo) {
      periodLabel = `Fino al ${formatIT(rawDateTo)}`;
    } else {
      periodLabel = "Periodo non specificato";
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Schede dipendenti</h1>
        <p className="text-sm text-muted-foreground">
          Consulta e modifica le attività registrate dai dipendenti.
        </p>
      </div>

      {/* Filtri */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtri</CardTitle>
        </CardHeader>

        <CardContent>
          <form method="GET" className="grid gap-4 md:grid-cols-6 items-end">
            <label className="grid gap-1 text-sm">
              <span>Da</span>
              <input
                name="dateFrom"
                type="date"
                defaultValue={rawDateFrom ?? ""}
                className="h-10 rounded-md border border-input px-3"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span>A</span>
              <input
                name="dateTo"
                type="date"
                defaultValue={rawDateTo ?? ""}
                className="h-10 rounded-md border border-input px-3"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span>Dipendente</span>
              <select
                name="userId"
                defaultValue={userId ? String(userId) : ""}
                className="h-10 rounded-md border border-input px-3"
              >
                <option value="">(seleziona)</option>
                {workers.map((w) => (
                  <option key={String(w.id)} value={String(w.id)}>
                    {w.lastName} {w.firstName} ({w.employeeCode})
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm">
              <span>Tipo</span>
              <select
                name="activityType"
                defaultValue={activityType ?? ""}
                className="h-10 rounded-md border border-input px-3"
              >
                <option value="">Tutti</option>
                <option value="PRODUCTION">Produzione</option>
                <option value="CLEANING">Pulizie</option>
              </select>
            </label>

            <label className="grid gap-1 text-sm">
              <span>Azienda</span>
              <select
                name="customerId"
                defaultValue={customerId ? String(customerId) : ""}
                className="h-10 rounded-md border border-input px-3"
              >
                <option value="">Tutte</option>
                {custs.map((c) => (
                  <option key={String(c.id)} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <Button type="submit">Applica</Button>
          </form>
        </CardContent>
      </Card>

      {showHint ? (
        <Card>
          <CardContent className="py-6 text-sm">
            Seleziona un <b>dipendente</b> per vedere automaticamente gli{" "}
            <b>ultimi 30 giorni</b>, oppure imposta un <b>periodo</b>.
          </CardContent>
        </Card>
      ) : (
        <>
          {periodLabel && (
            <Card>
              <CardContent className="py-3 text-sm">
                <b>Periodo ricerca:</b> {periodLabel}
              </CardContent>
            </Card>
          )}

          {/* Totali */}
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary">Produzione: {fmtMin(totalProd)}</Badge>
            <Badge variant="secondary">Pulizie: {fmtMin(totalClean)}</Badge>
            <Badge>Totale: {fmtMin(totalAll)}</Badge>

            <div className="ml-auto text-sm text-muted-foreground">
              Righe: {rows.length}
            </div>
          </div>

          <AdminWorkLogsClient days={days} />
        </>
      )}
    </div>
  );
}