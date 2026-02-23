"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useMemo, useState } from "react";
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
  customers: Customer[];
  initialDate: string;
  initialCustomerId: string;
  initialType: string;
  rows: Row[];
}) {
  const router = useRouter();

  const [date, setDate] = useState(props.initialDate);
  const [customerId, setCustomerId] = useState(props.initialCustomerId);
  const [type, setType] = useState(props.initialType);

  const [deleteState, deleteAction, isDeleting] = useActionState<
    DeleteWorkLogState,
    FormData
  >(deleteWorkLogAction, {});

  // ✅ Conferma eliminazione (banner)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function applyFilters() {
    const sp = new URLSearchParams();
    if (date) sp.set("date", date);
    if (customerId) sp.set("customerId", customerId);
    if (type) sp.set("type", type);
    router.push(`/worker/logs?${sp.toString()}`);
  }

  const totalMinutes = useMemo(
    () => props.rows.reduce((acc, r) => acc + (r.durationMinutes ?? 0), 0),
    [props.rows]
  );

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Le mie attività</h1>
          <p style={{ marginTop: 6, color: "#666" }}>
            Totale giornata: <strong>{fmtMinutes(totalMinutes)}</strong>
          </p>
        </div>
        <Link
          href={`/worker/logs/new?date=${encodeURIComponent(date)}`}
          style={{
            alignSelf: "flex-start",
            padding: "10px 12px",
            border: "1px solid #ddd",
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          + Nuova attività
        </Link>
      </div>

      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "160px 1fr 200px 120px",
          gap: 12,
          alignItems: "end",
          padding: 12,
          border: "1px solid #eee",
          borderRadius: 12,
          background: "#fafafa",
        }}
      >
        <label>
          <div style={{ fontSize: 12, color: "#666" }}>Data</div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

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
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          >
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
            borderRadius: 8,
            background: "white",
            cursor: "pointer",
          }}
        >
          Filtra
        </button>
      </div>

      {deleteState.error ? (
        <p style={{ color: "crimson", marginTop: 12 }}>{deleteState.error}</p>
      ) : null}

      {/* ✅ Banner conferma eliminazione */}
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
              disabled={isDeleting}
              onClick={() => {
                const fd = new FormData();
                fd.set("id", confirmDeleteId);
                deleteAction(fd);
                setConfirmDeleteId(null);
              }}
              style={{
                padding: "8px 10px",
                border: "1px solid #f2c2c2",
                color: "crimson",
                borderRadius: 8,
                background: "white",
                cursor: "pointer",
              }}
            >
              Sì, elimina
            </button>

            <button
              type="button"
              onClick={() => setConfirmDeleteId(null)}
              style={{
                padding: "8px 10px",
                border: "1px solid #ddd",
                borderRadius: 8,
                background: "white",
                cursor: "pointer",
              }}
            >
              No
            </button>
          </div>
        </div>
      ) : null}

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
                  Nessuna attività per questa data.
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

                <td style={{ padding: 10 }}>
                  {r.activityType === "PRODUCTION" ? "Produzione" : "Pulizie"}
                </td>

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

                  {r.notes ? (
                    <div style={{ marginTop: 6, color: "#444" }}>{r.notes}</div>
                  ) : null}
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
                  <Link
                    href={`/worker/logs/${r.id}/edit`}
                    style={{
                      padding: "8px 10px",
                      border: "1px solid #ddd",
                      borderRadius: 8,
                      textDecoration: "none",
                      marginRight: 8,
                      display: "inline-block",
                    }}
                  >
                    Modifica
                  </Link>

                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setConfirmDeleteId(String(r.id))}
                    style={{
                      padding: "8px 10px",
                      border: "1px solid #f2c2c2",
                      color: "crimson",
                      borderRadius: 8,
                      background: "white",
                      cursor: "pointer",
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
    </div>
  );
}