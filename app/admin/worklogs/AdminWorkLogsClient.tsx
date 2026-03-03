// app/admin/worklogs/AdminWorkLogsClient.tsx
"use client";

import Link from "next/link";
import { useActionState, useTransition } from "react";
import { deleteWorkLogAdminAction, type DeleteWorkLogAdminState } from "./actions";

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

  userId: bigint;
  firstName: string;
  lastName: string;
  employeeCode: string;

  customerName: string;
  modelName: string | null;
  phaseName: string | null;
};

type Day = { workDate: string; rows: Row[] };

function fmtMin(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function formatIT(iso: string) {
  // iso = "YYYY-MM-DD"
  // Uso UTC per evitare edge-case di timezone (es. giorno che slitta)
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("it-IT");
}

export default function AdminWorkLogsClient({ days }: { days: Day[] }) {
  const [pending, startTransition] = useTransition();

  const initialState: DeleteWorkLogAdminState = { ok: false, message: null };
  const [state, formAction] = useActionState(deleteWorkLogAdminAction, initialState);

  function onDelete(id: bigint) {
    const ok = confirm("Vuoi eliminare questa attività?");
    if (!ok) return;

    const fd = new FormData();
    fd.set("id", String(id));

    startTransition(() => formAction(fd));
  }

  return (
    <div>
      {state.message && (
        <div
          className="mb-3 p-2 border rounded"
          style={{ background: state.ok ? "#f3fff3" : "#fff3f3" }}
        >
          {state.message}
        </div>
      )}

      {days.length === 0 && <div>Nessuna attività trovata.</div>}

      <div className="grid gap-3">
        {days.map((d) => {
          const totalDay = d.rows.reduce((sum, r) => sum + (r.durationMinutes ?? 0), 0);
          const prodDay = d.rows
            .filter((r) => r.activityType === "PRODUCTION")
            .reduce((sum, r) => sum + (r.durationMinutes ?? 0), 0);
          const cleanDay = totalDay - prodDay;

          return (
            <details key={d.workDate} className="border rounded p-3 bg-white">
              <summary className="cursor-pointer select-none flex items-center gap-3">
                {/* ✅ Data in formato gg/mm/aaaa */}
                <b className="text-black">{formatIT(d.workDate)}</b>

                <span className="text-black">
                  • Totale: {fmtMin(totalDay)} (Prod: {fmtMin(prodDay)} • Pul: {fmtMin(cleanDay)})
                </span>
                <span className="ml-auto text-black">Attività: {d.rows.length}</span>
              </summary>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full border-collapse text-sm text-black">
                  <thead>
                    <tr>
                      {[
                        "Dipendente",
                        "Azienda",
                        "Tipo",
                        "Modello",
                        "Fase",
                        "Inizio",
                        "Fine",
                        "Durata",
                        "OK",
                        "KO",
                        "Note",
                        "Azioni",
                      ].map((h) => (
                        <th key={h} className="text-left border-b p-2 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {d.rows.map((r) => (
                      <tr key={String(r.id)}>
                        <td className="p-2 border-b">
                          {r.lastName} {r.firstName} ({r.employeeCode})
                        </td>
                        <td className="p-2 border-b">{r.customerName}</td>
                        <td className="p-2 border-b">
                          {r.activityType === "PRODUCTION" ? "Produzione" : "Pulizie"}
                        </td>
                        <td className="p-2 border-b">{r.modelName ?? "—"}</td>
                        <td className="p-2 border-b">{r.phaseName ?? "—"}</td>
                        <td className="p-2 border-b">{String(r.startTime ?? "").slice(0, 5)}</td>
                        <td className="p-2 border-b">{String(r.endTime ?? "").slice(0, 5)}</td>
                        <td className="p-2 border-b">{r.durationMinutes}m</td>
                        <td className="p-2 border-b">
                          {r.activityType === "PRODUCTION" ? r.qtyOk : "—"}
                        </td>
                        <td className="p-2 border-b">
                          {r.activityType === "PRODUCTION" ? r.qtyKo : "—"}
                        </td>
                        <td className="p-2 border-b" style={{ maxWidth: 320 }}>
                          {r.notes ?? ""}
                        </td>
                        <td className="p-2 border-b whitespace-nowrap">
                          <Link href={`/admin/worklogs/${String(r.id)}/edit`}>Modifica</Link>
                          {"  "}•{"  "}
                          <button
                            type="button"
                            onClick={() => onDelete(r.id)}
                            disabled={pending}
                            className="underline"
                            style={{
                              border: "none",
                              background: "transparent",
                              padding: 0,
                              color: pending ? "#777" : "crimson",
                              cursor: pending ? "not-allowed" : "pointer",
                            }}
                          >
                            Elimina
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}