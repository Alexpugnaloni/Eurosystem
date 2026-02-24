"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { updateWorkLogAction, type CreateWorkLogState } from "../../actions";

type Customer = { id: bigint; name: string };
type Model = { id: bigint; customerId: bigint; name: string; code: string | null };
type Phase = { id: bigint; customerId: bigint; name: string; sortOrder: number; isFinal: boolean };

type ActivityType = "PRODUCTION" | "CLEANING";

const ui = {
  page: { padding: 24, display: "flex", justifyContent: "center" as const },
  card: {
    width: "100%",
    maxWidth: 860,
    background: "white",
    border: "1px solid #eee",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
  },
  titleWrap: { textAlign: "center" as const, width: "100%" },
  h1: { margin: 0, fontSize: 28, fontWeight: 700 },
  subtitle: { marginTop: 8, color: "#666", fontSize: 15, marginBottom: 0 },
  topActions: { display: "flex", gap: 10, justifyContent: "center" as const, flexWrap: "wrap" as const },
  btn: {
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: 10,
    background: "white",
    textDecoration: "none",
    display: "inline-block",
  },
  btnPrimary: {
    padding: "10px 12px",
    border: "1px solid #111",
    borderRadius: 10,
    background: "#111",
    color: "white",
    cursor: "pointer",
  },
  btnSecondary: {
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: 10,
    background: "white",
    cursor: "pointer",
  },
  form: { marginTop: 18 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
  },
  gridFull: { gridColumn: "1 / -1" },
  label: { display: "block" },
  labelText: { fontSize: 12, color: "#666", marginBottom: 6 },
  field: {
    width: "100%",
    height: 42,
    padding: "0 12px",
    border: "1px solid #ddd",
    borderRadius: 10,
    background: "white",
    outline: "none",
  },
  textarea: {
    width: "100%",
    padding: 12,
    border: "1px solid #ddd",
    borderRadius: 10,
    background: "white",
    outline: "none",
    minHeight: 110,
    resize: "vertical" as const,
  },
  footer: { marginTop: 16, display: "flex", gap: 12, justifyContent: "center" as const, flexWrap: "wrap" as const },
  hint: { marginTop: 12, color: "#888", fontSize: 12, textAlign: "center" as const },
  err: { color: "crimson", marginTop: 12, textAlign: "center" as const },
};

export default function EditWorkLogForm(props: {
  id: string;
  customers: Customer[];
  models: Model[];
  phases: Phase[];
  initial: CreateWorkLogState["values"];
}) {
  const [serverState, action, pending] = useActionState<CreateWorkLogState, FormData>(updateWorkLogAction, {
    values: props.initial,
  });

  const [activityType, setActivityType] = useState<ActivityType>(props.initial.activityType);
  const [workDate, setWorkDate] = useState(props.initial.workDate);
  const [customerId, setCustomerId] = useState(props.initial.customerId);
  const [modelId, setModelId] = useState(props.initial.modelId);
  const [phaseId, setPhaseId] = useState(props.initial.phaseId);
  const [qtyOk, setQtyOk] = useState(props.initial.qtyOk);
  const [qtyKo, setQtyKo] = useState(props.initial.qtyKo);
  const [startTime, setStartTime] = useState(props.initial.startTime);
  const [endTime, setEndTime] = useState(props.initial.endTime);
  const [notes, setNotes] = useState(props.initial.notes);

  const [clientError, setClientError] = useState("");

  const isProduction = activityType === "PRODUCTION";
  const selectedCustomerId = customerId ? BigInt(customerId) : null;

  const filteredModels = useMemo(() => {
    if (!selectedCustomerId) return [];
    return props.models.filter((m) => m.customerId === selectedCustomerId);
  }, [props.models, selectedCustomerId]);

  const filteredPhases = useMemo(() => {
    if (!selectedCustomerId) return [];
    return props.phases.filter((p) => p.customerId === selectedCustomerId);
  }, [props.phases, selectedCustomerId]);

  function onChangeCustomer(next: string) {
    setCustomerId(next);
    setModelId("");
    setPhaseId("");
    setClientError("");
  }

  function onChangeActivityType(next: ActivityType) {
    setActivityType(next);
    setClientError("");

    if (next === "CLEANING") {
      setModelId("");
      setPhaseId("");
      setQtyOk("0");
      setQtyKo("0");
    }
  }

  function parseNonNegInt(s: string) {
    const n = Number(String(s ?? "").trim());
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.floor(n));
  }

  function validateClient(): string | null {
    if (activityType !== "PRODUCTION" && activityType !== "CLEANING") return "Tipo attività non valido.";
    if (!workDate) return "Seleziona la data.";

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const todayISO = `${yyyy}-${mm}-${dd}`;
    if (workDate > todayISO) return "La data non può essere futura.";

    if (!customerId) return "Seleziona l'azienda.";

    if (activityType === "PRODUCTION") {
      if (!modelId) return "Seleziona il modello.";
      if (!phaseId) return "Seleziona la fase.";
      const ok = parseNonNegInt(qtyOk);
      const ko = parseNonNegInt(qtyKo);
      if (ok === 0 && ko === 0) return "Inserisci almeno 1 pezzo (OK o KO).";
    }

    if (!startTime) return "Seleziona l'ora di inizio.";
    if (!endTime) return "Seleziona l'ora di fine.";
    if (startTime >= endTime) return "L'orario di fine deve essere dopo l'orario di inizio.";

    return null;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    setClientError("");
    const err = validateClient();
    if (err) {
      e.preventDefault();
      setClientError(err);
    }
  }

  return (
    <div style={ui.page}>
      <div style={ui.card}>
        <div style={ui.titleWrap}>
          <h1 style={ui.h1}>Modifica attività</h1>
          <p style={ui.subtitle}>Modifica produzione o pulizie. Nessun overlap permesso.</p>
        </div>

        

        {clientError ? <div style={ui.err}>{clientError}</div> : null}
        {serverState.error ? <div style={ui.err}>{serverState.error}</div> : null}

        <form action={action} onSubmit={handleSubmit} style={ui.form}>
          <input type="hidden" name="id" value={props.id} />

          <div style={ui.grid}>
            <label style={ui.label}>
              <div style={ui.labelText}>Tipo attività</div>
              <select
                name="activityType"
                value={activityType}
                onChange={(e) => onChangeActivityType(e.target.value as ActivityType)}
                style={ui.field}
              >
                <option value="PRODUCTION">Produzione</option>
                <option value="CLEANING">Pulizie</option>
              </select>
            </label>

            <label style={ui.label}>
              <div style={ui.labelText}>Data</div>
              <input
                type="date"
                name="workDate"
                value={workDate}
                onChange={(e) => {
                  setWorkDate(e.target.value);
                  setClientError("");
                }}
                style={ui.field}
              />
            </label>

            <label style={{ ...ui.label, ...ui.gridFull }}>
              <div style={ui.labelText}>Azienda</div>
              <select
                name="customerId"
                value={customerId}
                onChange={(e) => onChangeCustomer(e.target.value)}
                style={ui.field}
              >
                <option value="">Seleziona…</option>
                {props.customers.map((c) => (
                  <option key={String(c.id)} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            {isProduction ? (
              <>
                <label style={ui.label}>
                  <div style={ui.labelText}>Modello</div>
                  <select
                    name="modelId"
                    value={modelId}
                    onChange={(e) => {
                      setModelId(e.target.value);
                      setClientError("");
                    }}
                    style={ui.field}
                    disabled={!customerId}
                  >
                    <option value="">{customerId ? "Seleziona…" : "Seleziona prima un'azienda"}</option>
                    {filteredModels.map((m) => (
                      <option key={String(m.id)} value={String(m.id)}>
                        {m.name}
                        {m.code ? ` (${m.code})` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={ui.label}>
                  <div style={ui.labelText}>Fase</div>
                  <select
                    name="phaseId"
                    value={phaseId}
                    onChange={(e) => {
                      setPhaseId(e.target.value);
                      setClientError("");
                    }}
                    style={ui.field}
                    disabled={!customerId}
                  >
                    <option value="">{customerId ? "Seleziona…" : "Seleziona prima un'azienda"}</option>
                    {filteredPhases.map((p) => (
                      <option key={String(p.id)} value={String(p.id)}>
                        {p.sortOrder}. {p.name}
                        {p.isFinal ? " (finale)" : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={ui.label}>
                  <div style={ui.labelText}>Quantità OK</div>
                  <input
                    type="number"
                    name="qtyOk"
                    min={0}
                    value={qtyOk}
                    onChange={(e) => {
                      setQtyOk(e.target.value);
                      setClientError("");
                    }}
                    style={ui.field}
                  />
                </label>

                <label style={ui.label}>
                  <div style={ui.labelText}>Quantità KO</div>
                  <input
                    type="number"
                    name="qtyKo"
                    min={0}
                    value={qtyKo}
                    onChange={(e) => {
                      setQtyKo(e.target.value);
                      setClientError("");
                    }}
                    style={ui.field}
                  />
                </label>
              </>
            ) : (
              <>
                <input type="hidden" name="modelId" value="" />
                <input type="hidden" name="phaseId" value="" />
                <input type="hidden" name="qtyOk" value="0" />
                <input type="hidden" name="qtyKo" value="0" />
              </>
            )}

            <label style={ui.label}>
              <div style={ui.labelText}>Ora inizio</div>
              <input
                type="time"
                name="startTime"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setClientError("");
                }}
                style={ui.field}
              />
            </label>

            <label style={ui.label}>
              <div style={ui.labelText}>Ora fine</div>
              <input
                type="time"
                name="endTime"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setClientError("");
                }}
                style={ui.field}
              />
            </label>

            <label style={{ ...ui.label, ...ui.gridFull }}>
              <div style={ui.labelText}>Note (opzionale)</div>
              <textarea
                name="notes"
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setClientError("");
                }}
                rows={4}
                style={ui.textarea}
              />
            </label>
          </div>

          <div style={ui.footer}>
            <button type="submit" disabled={pending} style={ui.btnPrimary}>
              Salva modifiche
            </button>

            <Link href="/worker/logs" style={ui.btnSecondary}>
              Annulla
            </Link>
          </div>
        </form>

        <p style={ui.hint}>Suggerimento: se cambi Azienda, potresti dover riselezionare Modello/Fase.</p>

        <style jsx>{`
          @media (max-width: 720px) {
            form > div {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}