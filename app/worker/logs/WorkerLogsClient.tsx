"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useMemo, useState, useTransition } from "react";
import { deleteWorkLogAction, type DeleteWorkLogState } from "./actions";

type Customer = {
  id: bigint;
  name: string;
};

type Row = {
  id: bigint;
  workDate: string;
  activityType: "PRODUCTION" | "CLEANING";
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number;
  qtyOk: number;
  qtyKo: number;
  notes: string | null;
  customerName: string;
  modelName: string | null;
  phaseName: string | null;
};

function fmtMinutes(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export default function WorkerLogsClient(props: {
  mode?: "today" | "history";
  customers: Customer[];
  initialDate: string;
  initialCustomerId: string;
  initialType: string;
  rows: Row[];
}) {
  const router = useRouter();

  const mode = props.mode ?? "history";
  const isTodayMode = mode === "today";

  const [date, setDate] = useState(props.initialDate);
  const [customerId, setCustomerId] = useState(props.initialCustomerId);
  const [type, setType] = useState(props.initialType);

  const [deleteState, deleteAction, isDeleting] = useActionState<DeleteWorkLogState, FormData>(
    deleteWorkLogAction,
    {}
  );

  const [isPendingDelete, startDeleteTransition] = useTransition();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function applyFilters() {
    const sp = new URLSearchParams();

    if (!isTodayMode && date) sp.set("date", date);
    if (customerId) sp.set("customerId", customerId);
    if (type) sp.set("type", type);

    const basePath = isTodayMode ? "/worker/logs" : "/worker/logs/history";
    const qs = sp.toString();

    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  const totalMinutes = useMemo(
    () => props.rows.reduce((acc, r) => acc + (r.durationMinutes ?? 0), 0),
    [props.rows]
  );

  const disableDeleteUI = isDeleting || isPendingDelete;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-semibold">
          {isTodayMode ? "Le mie attività di oggi" : "Storico attività"}
        </h1>

        <p className="text-sm text-zinc-600">
          {isTodayMode
            ? "Qui puoi registrare e monitorare le attività della giornata corrente."
            : "Consulta e filtra le attività dei giorni precedenti."}
        </p>

        <div>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium
            ${isTodayMode ? "bg-green-100 text-green-800" : "bg-indigo-100 text-indigo-800"}`}>
            {isTodayMode ? "Modalità Operativa (Oggi)" : "Modalità Consultazione (Storico)"}
          </span>
        </div>

        <p className="text-base">
          Totale {isTodayMode ? "oggi" : "giornata selezionata"}:{" "}
          <span className="font-semibold">{fmtMinutes(totalMinutes)}</span>
        </p>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-center flex-wrap gap-3">

        {isTodayMode ? (
          <Link
            href={`/worker/logs/history?date=${encodeURIComponent(date)}`}
            className="rounded-md border px-4 py-2 text-sm hover:bg-zinc-100"
          >
            📚 Consulta Storico
          </Link>
        ) : (
          <Link
            href="/worker/logs"
            className="rounded-md border px-4 py-2 text-sm hover:bg-zinc-100"
          >
            Torna alla produzione odierna
          </Link>
        )}

        {isTodayMode && (
          <Link
            href={`/worker/logs/new?date=${encodeURIComponent(date)}`}
            className="rounded-md border px-4 py-2 text-sm hover:bg-zinc-100"
          >
            + Nuova attività
          </Link>
        )}

      </div>

      {/* FILTRI */}
      <div className="rounded-lg border bg-white p-4 grid gap-3 md:grid-cols-4">

        {!isTodayMode && (
          <div className="flex flex-col gap-1">
            <label className="text-sm">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
            />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-sm">Azienda</label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Tutte</option>
            {props.customers.map((c) => (
              <option key={String(c.id)} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm">Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Tutti</option>
            <option value="PRODUCTION">Produzione</option>
            <option value="CLEANING">Pulizie</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={applyFilters}
            className="rounded-md border px-4 py-2 text-sm hover:bg-zinc-100"
          >
            Filtra
          </button>
        </div>
      </div>

      {/* DELETE CONFIRM */}
      {confirmDeleteId && (
        <div className="flex items-center justify-between gap-4 rounded-md border border-red-200 bg-red-50 p-3">
          <div className="text-sm font-medium text-red-800">
            Sei sicuro di voler eliminare questa attività?
          </div>

          <div className="flex gap-2">
            <button
              disabled={disableDeleteUI}
              onClick={() => {
                const fd = new FormData();
                fd.set("id", confirmDeleteId);

                startDeleteTransition(() => deleteAction(fd));
                setConfirmDeleteId(null);
              }}
              className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-100"
            >
              Sì, elimina
            </button>

            <button
              disabled={disableDeleteUI}
              onClick={() => setConfirmDeleteId(null)}
              className="rounded-md border px-3 py-1 text-sm hover:bg-zinc-100"
            >
              No
            </button>
          </div>
        </div>
      )}

      {/* TABELLA */}
      <div className="overflow-x-auto rounded-md border bg-white">
        <table className="w-full text-sm">

          <thead className="bg-zinc-50 text-left">
            <tr>
              <th className="px-4 py-3">Orario</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Dettagli</th>
              <th className="px-4 py-3">Durata</th>
              <th className="px-4 py-3">Quantità</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>

          <tbody>
            {props.rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                  {isTodayMode
                    ? "Nessuna attività per oggi."
                    : "Nessuna attività per questa data."}
                </td>
              </tr>
            ) : (
              props.rows.map((r) => (
                <tr key={String(r.id)} className="border-t">

                  <td className="px-4 py-3 font-medium">
                    {(r.startTime ?? "").slice(0, 5)}–{(r.endTime ?? "").slice(0, 5)}
                  </td>

                  <td className="px-4 py-3">
                    {r.activityType === "PRODUCTION" ? "Produzione" : "Pulizie"}
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-medium">{r.customerName}</div>

                    {r.activityType === "PRODUCTION" ? (
                      <div className="text-zinc-500 text-sm">
                        {r.modelName ?? "-"} • {r.phaseName ?? "-"}
                      </div>
                    ) : (
                      <div className="text-zinc-500 text-sm">Attività di pulizia</div>
                    )}

                    {r.notes && (
                      <div className="text-sm text-zinc-600 mt-1">{r.notes}</div>
                    )}
                  </td>

                  <td className="px-4 py-3">{fmtMinutes(r.durationMinutes)}</td>

                  <td className="px-4 py-3">
                    {r.activityType === "PRODUCTION"
                      ? `OK ${r.qtyOk} / KO ${r.qtyKo}`
                      : "—"}
                  </td>

                  <td className="px-4 py-3 text-right space-x-2">

                    <Link
                      href={`/worker/logs/${r.id}/edit`}
                      className="inline-block rounded-md border px-3 py-1 text-sm hover:bg-zinc-100"
                    >
                      Modifica
                    </Link>

                    <button
                      disabled={disableDeleteUI}
                      onClick={() => setConfirmDeleteId(String(r.id))}
                      className="inline-block rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-100"
                    >
                      Elimina
                    </button>

                  </td>

                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
}