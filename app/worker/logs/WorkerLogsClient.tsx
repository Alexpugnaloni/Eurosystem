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

  // ✅ serve per chiamare deleteAction dentro una transition (evita warning Next/React)
  const [isPendingDelete, startDeleteTransition] = useTransition();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function applyFilters() {
    const sp = new URLSearchParams();

    // ✅ In today-mode NON mettiamo la data nella querystring
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

  // layout filtri: in today-mode togliamo la colonna data
  const filterGridCols = isTodayMode ? "1fr 200px 120px" : "160px 1fr 200px 120px";

  const disableDeleteUI = isDeleting || isPendingDelete;

  return (
    <div style={{ padding: 16 }}>
      {/* ✅ HEADER centrato + bottoni centrati sotto */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{ textAlign: "center", width: "100%" }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
            {isTodayMode ? "Le mie attività di oggi" : "Storico attività"}
          </h1>

          <p style={{ marginTop: 8, color: "#666", fontSize: 15 }}>
            {isTodayMode
              ? "Qui puoi registrare e monitorare le attività della giornata corrente."
              : "Consulta e filtra le attività dei giorni precedenti."}
          </p>

          <div
            style={{
              marginTop: 10,
              display: "inline-block",
              padding: "6px 14px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              background: isTodayMode ? "#e6f4ea" : "#eef2ff",
              color: isTodayMode ? "#137333" : "#3730a3",
            }}
          >
            {isTodayMode ? "Modalità Operativa (Oggi)" : "Modalità Consultazione (Storico)"}
          </div>

          <p style={{ marginTop: 14, fontSize: 16 }}>
            Totale {isTodayMode ? "oggi" : "giornata selezionata"}:{" "}
            <strong>{fmtMinutes(totalMinutes)}</strong>
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {/* ✅ In today-mode: bottone storico */}
          {isTodayMode ? (
            <Link
              href={`/worker/logs/history?date=${encodeURIComponent(date)}`}
              style={{
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: 10,
                textDecoration: "none",
                background: "white",
              }}
            >
              📚 Consulta Storico
            </Link>
          ) : (
            <Link
              href="/worker/logs"
              style={{
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: 10,
                textDecoration: "none",
                background: "white",
              }}
            >
              Torna alla produzione Odierna
            </Link>
          )}

          {/* ✅ Nuova attività SOLO in today-mode */}
          {isTodayMode ? (
            <Link
              href={`/worker/logs/new?date=${encodeURIComponent(date)}`}
              style={{
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: 10,
                textDecoration: "none",
                background: "white",
              }}
            >
              + Nuova attività
            </Link>
          ) : null}
        </div>
      </div>

      {/* FILTRI */}
      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: filterGridCols,
          gap: 12,
          alignItems: "end",
          padding: 12,
          border: "1px solid #eee",
          borderRadius: 12,
          background: "#fafafa",
        }}
      >
        {/* ✅ DATA: solo nello storico */}
        {!isTodayMode ? (
          <label>
            <div style={{ fontSize: 12, color: "#666" }}>Data</div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: "100%", padding: 8 }}
            />
          </label>
        ) : null}

        <label>
          <div style={{ fontSize: 12, color: "#666" }}>Azienda</div>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          >
            <option value="">Tutte</option>
            {props.customers.map((c) => (
              <option key={String(c.id)} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <div style={{ fontSize: 12, color: "#666" }}>Tipo</div>
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: "100%", padding: 8 }}>
            <option value="">Tutti</option>
            <option value="PRODUCTION">Produzione</option>
            <option value="CLEANING">Pulizie</option>
          </select>
        </label>

        <button
          type="button"
          onClick={applyFilters}
          style={{
            padding: "10px 12px",
            border: "1px solid #ddd",
            borderRadius: 10,
            background: "white",
            cursor: "pointer",
          }}
        >
          Filtra
        </button>
      </div>

      {deleteState.error ? <p style={{ color: "crimson", marginTop: 12 }}>{deleteState.error}</p> : null}

      {confirmDeleteId ? (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            border: "1px solid #f2c2c2",
            borderRadius: 12,
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ color: "#7a1f1f" }}>
            <strong>Sei sicuro di voler eliminare questa attività?</strong>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              disabled={disableDeleteUI}
              onClick={() => {
                const fd = new FormData();
                fd.set("id", confirmDeleteId);

                startDeleteTransition(() => {
                  deleteAction(fd);
                });

                setConfirmDeleteId(null);
              }}
              style={{
                padding: "8px 10px",
                border: "1px solid #f2c2c2",
                color: "crimson",
                borderRadius: 10,
                background: "white",
                cursor: "pointer",
              }}
            >
              Sì, elimina
            </button>

            <button
              type="button"
              disabled={disableDeleteUI}
              onClick={() => setConfirmDeleteId(null)}
              style={{
                padding: "8px 10px",
                border: "1px solid #ddd",
                borderRadius: 10,
                background: "white",
                cursor: "pointer",
              }}
            >
              No
            </button>
          </div>
        </div>
      ) : null}

      {/* TABELLA */}
      <div style={{ marginTop: 16, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
              <th style={{ padding: 10, width: 120 }}>Orario</th>
              <th style={{ padding: 10, width: 140 }}>Tipo</th>
              <th style={{ padding: 10 }}>Dettagli</th>
              <th style={{ padding: 10, width: 120 }}>Durata</th>
              <th style={{ padding: 10, width: 120 }}>Quantità</th>
              <th style={{ padding: 10, width: 160 }}></th>
            </tr>
          </thead>

          <tbody>
            {props.rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 12, color: "#666" }}>
                  {isTodayMode ? "Nessuna attività per oggi." : "Nessuna attività per questa data."}
                </td>
              </tr>
            ) : null}

            {props.rows.map((r) => (
              <tr key={String(r.id)} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: 10 }}>
                  <div>
                    <strong>
                      {(r.startTime ?? "").slice(0, 5)}–{(r.endTime ?? "").slice(0, 5)}
                    </strong>
                  </div>
                </td>

                <td style={{ padding: 10 }}>{r.activityType === "PRODUCTION" ? "Produzione" : "Pulizie"}</td>

                <td style={{ padding: 10 }}>
                  <div>
                    <strong>{r.customerName}</strong>
                  </div>

                  {r.activityType === "PRODUCTION" ? (
                    <div style={{ color: "#666" }}>
                      {r.modelName ?? "-"} • {r.phaseName ?? "-"}
                    </div>
                  ) : (
                    <div style={{ color: "#666" }}>Attività di pulizia</div>
                  )}

                  {r.notes ? <div style={{ marginTop: 6, color: "#444" }}>{r.notes}</div> : null}
                </td>

                <td style={{ padding: 10 }}>{fmtMinutes(r.durationMinutes)}</td>

                <td style={{ padding: 10 }}>
                  {r.activityType === "PRODUCTION" ? (
                    <span>
                      OK {r.qtyOk} / KO {r.qtyKo}
                    </span>
                  ) : (
                    <span style={{ color: "#666" }}>—</span>
                  )}
                </td>

                <td style={{ padding: 10, textAlign: "right" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                    <Link
                      href={`/worker/logs/${r.id}/edit`}
                      style={{
                        padding: "8px 10px",
                        border: "1px solid #ddd",
                        borderRadius: 10,
                        textDecoration: "none",
                        display: "inline-block",
                        minWidth: 96,
                        textAlign: "center",
                        background: "white",
                      }}
                    >
                      Modifica
                    </Link>

                    <button
                      type="button"
                      disabled={disableDeleteUI}
                      onClick={() => setConfirmDeleteId(String(r.id))}
                      style={{
                        padding: "8px 10px",
                        border: "1px solid #f2c2c2",
                        color: "crimson",
                        borderRadius: 10,
                        background: "white",
                        cursor: "pointer",
                        minWidth: 96,
                      }}
                    >
                      Elimina
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}