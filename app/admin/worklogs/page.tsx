// app/admin/worklogs/page.tsx
import { db } from "@/db";
import { customers, models, phases, users, workLogs } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import AdminWorkLogsClient from "./AdminWorkLogsClient";

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

  // Date inserite dall'utente (possono essere vuote)
  const rawDateFrom = parseStringParam(sp.dateFrom);
  const rawDateTo = parseStringParam(sp.dateTo);

  let dateFrom: string | null = rawDateFrom;
  let dateTo: string | null = rawDateTo;

  const hasAnyDate = Boolean(rawDateFrom || rawDateTo);
  const hasUserOnly = Boolean(userId && !hasAnyDate);

  // ✅ solo dipendente (senza date) => ultimi 30 giorni
  if (hasUserOnly) {
    dateFrom = daysAgoISO(29);
    dateTo = todayISO();
  }

  // Worker list (select)
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

  // Customer list (select)
  const custs = await db
    .select({ id: customers.id, name: customers.name })
    .from(customers)
    .where(eq(customers.isActive, true))
    .orderBy(asc(customers.name));

  // ✅ Se non c'è nessun filtro utile, non queryiamo
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

  // Group by day (cards)
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

  // ✅ Label periodo sopra le card
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
      // es: filtri solo azienda/tipo senza date
      periodLabel = "Periodo non specificato";
    }
  }

  return (
    <div className="p-4 text-black">
      <h1 className="text-xl font-bold mb-3">Schede dipendenti</h1>

      <form
        method="GET"
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))", alignItems: "end" }}
      >
        <label className="grid gap-1">
          <span>Da</span>
          <input
            name="dateFrom"
            type="date"
            defaultValue={rawDateFrom ?? ""}
            className="p-2 border rounded text-black"
          />
        </label>

        <label className="grid gap-1">
          <span>A</span>
          <input
            name="dateTo"
            type="date"
            defaultValue={rawDateTo ?? ""}
            className="p-2 border rounded text-black"
          />
        </label>

        <label className="grid gap-1">
          <span>Dipendente</span>
          <select
            name="userId"
            defaultValue={userId ? String(userId) : ""}
            className="p-2 border rounded text-black"
          >
            <option value="">(seleziona)</option>
            {workers.map((w) => (
              <option key={String(w.id)} value={String(w.id)}>
                {w.lastName} {w.firstName} ({w.employeeCode})
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span>Tipo</span>
          <select
            name="activityType"
            defaultValue={activityType ?? ""}
            className="p-2 border rounded text-black"
          >
            <option value="">Tutti</option>
            <option value="PRODUCTION">Produzione</option>
            <option value="CLEANING">Pulizie</option>
          </select>
        </label>

        <label className="grid gap-1">
          <span>Azienda</span>
          <select
            name="customerId"
            defaultValue={customerId ? String(customerId) : ""}
            className="p-2 border rounded text-black"
          >
            <option value="">Tutte</option>
            {custs.map((c) => (
              <option key={String(c.id)} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" className="p-2 border rounded">
          Applica
        </button>
      </form>

      {showHint ? (
        <div className="mt-4 p-3 border rounded bg-white">
          Seleziona un <b>dipendente</b> per vedere automaticamente gli <b>ultimi 30 giorni</b>,
          oppure imposta un <b>periodo</b> (Da / A) e premi <b>Applica</b>.
        </div>
      ) : (
        <>
          {periodLabel && (
            <div className="mt-4 mb-2 p-2 border rounded bg-white">
              <b>Periodo ricerca:</b> {periodLabel}
            </div>
          )}

          <div className="flex gap-3 mt-2 mb-3">
            <div>
              <b>Produzione:</b> {fmtMin(totalProd)}
            </div>
            <div>
              <b>Pulizie:</b> {fmtMin(totalClean)}
            </div>
            <div>
              <b>Totale:</b> {fmtMin(totalAll)}
            </div>
            <div className="ml-auto">
              <b>Righe:</b> {rows.length}
            </div>
          </div>

          <AdminWorkLogsClient days={days} />
        </>
      )}
    </div>
  );
}