"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { updateWorkLogAction, type CreateWorkLogState } from "../../actions";

type Customer = { id: bigint; name: string };
type Model = { id: bigint; customerId: bigint; name: string; code: string | null };
type Phase = { id: bigint; customerId: bigint; name: string; sortOrder: number; isFinal: boolean };

type ActivityType = "PRODUCTION" | "CLEANING";

type Log = {
  id: bigint;
  workDate: string; // YYYY-MM-DD
  activityType: ActivityType;
  customerId: bigint;
  modelId: bigint | null;
  phaseId: bigint | null;
  startTime: string; // HH:MM:SS
  endTime: string; // HH:MM:SS
  qtyOk: number;
  qtyKo: number;
  notes: string | null;
};

function hhmm(t: string) {
  return (t ?? "").slice(0, 5);
}

function parseNonNegInt(s: string) {
  const n = Number(String(s ?? "").trim());
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function todayISOClient() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function EditWorkLogForm(props: {
  log: Log;
  customers: Customer[];
  models: Model[];
  phases: Phase[];
}) {
  // stato iniziale per la server action (serve solo se torna un errore lato server)
  const [serverState, action, pending] = useActionState<CreateWorkLogState, FormData>(
    updateWorkLogAction,
    {
      values: {
        workDate: props.log.workDate,
        activityType: props.log.activityType,
        customerId: String(props.log.customerId),
        modelId: props.log.modelId ? String(props.log.modelId) : "",
        phaseId: props.log.phaseId ? String(props.log.phaseId) : "",
        startTime: hhmm(props.log.startTime),
        endTime: hhmm(props.log.endTime),
        qtyOk: String(props.log.qtyOk ?? 0),
        qtyKo: String(props.log.qtyKo ?? 0),
        notes: props.log.notes ?? "",
      },
    }
  );

  // ✅ campi controlled (così non “spariscono”)
  const [activityType, setActivityType] = useState<ActivityType>(props.log.activityType);
  const [workDate, setWorkDate] = useState(props.log.workDate);
  const [customerId, setCustomerId] = useState(String(props.log.customerId));
  const [modelId, setModelId] = useState(props.log.modelId ? String(props.log.modelId) : "");
  const [phaseId, setPhaseId] = useState(props.log.phaseId ? String(props.log.phaseId) : "");
  const [qtyOk, setQtyOk] = useState(String(props.log.qtyOk ?? 0));
  const [qtyKo, setQtyKo] = useState(String(props.log.qtyKo ?? 0));
  const [startTime, setStartTime] = useState(hhmm(props.log.startTime));
  const [endTime, setEndTime] = useState(hhmm(props.log.endTime));
  const [notes, setNotes] = useState(props.log.notes ?? "");

  const [clientError, setClientError] = useState<string>("");

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

    // come richiesto: se cambio struttura (pulizie), reset campi produzione
    if (next === "CLEANING") {
      setModelId("");
      setPhaseId("");
      setQtyOk("0");
      setQtyKo("0");
    }
  }

  function validateClient(): string | null {
    // ordine di compilazione (come vuoi tu)
    if (!workDate) return "Seleziona la data.";
    if (workDate > todayISOClient()) return "La data non può essere futura.";

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
      e.preventDefault(); // niente server action => non perdi valori
      setClientError(err);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 820 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Modifica attività</h1>
          <p style={{ marginTop: 6, color: "#666" }}>
            Modifica produzione o pulizie. Nessun overlap permesso.
          </p>
        </div>

        <Link
          href="/worker/logs"
          style={{
            alignSelf: "flex-start",
            padding: "10px 12px",
            border: "1px solid #ddd",
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          ← Indietro
        </Link>
      </div>

      {clientError ? <p style={{ color: "crimson", marginTop: 12 }}>{clientError}</p> : null}
      {serverState.error ? (
        <p style={{ color: "crimson", marginTop: clientError ? 8 : 12 }}>{serverState.error}</p>
      ) : null}

      <form action={action} onSubmit={handleSubmit} style={{ marginTop: 16 }}>
        {/* id necessario per update */}
        <input type="hidden" name="id" value={String(props.log.id)} />

        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 12 }}>
          <label>
            <div style={{ fontSize: 12, color: "#666" }}>Tipo attività</div>
            <select
              name="activityType"
              value={activityType}
              onChange={(e) => onChangeActivityType(e.target.value as ActivityType)}
              style={{ width: "100%", padding: 8 }}
            >
              <option value="PRODUCTION">Produzione</option>
              <option value="CLEANING">Pulizie</option>
            </select>
          </label>

          <label>
            <div style={{ fontSize: 12, color: "#666" }}>Data</div>
            <input
              type="date"
              name="workDate"
              value={workDate}
              onChange={(e) => {
                setWorkDate(e.target.value);
                setClientError("");
              }}
              style={{ width: "100%", padding: 8 }}
            />
          </label>

          <label style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontSize: 12, color: "#666" }}>Azienda</div>
            <select
              name="customerId"
              value={customerId}
              onChange={(e) => onChangeCustomer(e.target.value)}
              style={{ width: "100%", padding: 8 }}
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
              <label>
                <div style={{ fontSize: 12, color: "#666" }}>Modello</div>
                <select
                  name="modelId"
                  value={modelId}
                  onChange={(e) => {
                    setModelId(e.target.value);
                    setClientError("");
                  }}
                  style={{ width: "100%", padding: 8 }}
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

              <label>
                <div style={{ fontSize: 12, color: "#666" }}>Fase</div>
                <select
                  name="phaseId"
                  value={phaseId}
                  onChange={(e) => {
                    setPhaseId(e.target.value);
                    setClientError("");
                  }}
                  style={{ width: "100%", padding: 8 }}
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

              <label>
                <div style={{ fontSize: 12, color: "#666" }}>Quantità OK</div>
                <input
                  type="number"
                  name="qtyOk"
                  min={0}
                  value={qtyOk}
                  onChange={(e) => {
                    setQtyOk(e.target.value);
                    setClientError("");
                  }}
                  style={{ width: "100%", padding: 8 }}
                />
              </label>

              <label>
                <div style={{ fontSize: 12, color: "#666" }}>Quantità KO</div>
                <input
                  type="number"
                  name="qtyKo"
                  min={0}
                  value={qtyKo}
                  onChange={(e) => {
                    setQtyKo(e.target.value);
                    setClientError("");
                  }}
                  style={{ width: "100%", padding: 8 }}
                />
              </label>
            </>
          ) : (
            <>
              {/* CLEANING: niente modello/fase/quantità */}
              <input type="hidden" name="modelId" value="" />
              <input type="hidden" name="phaseId" value="" />
              <input type="hidden" name="qtyOk" value="0" />
              <input type="hidden" name="qtyKo" value="0" />
            </>
          )}

          <label>
            <div style={{ fontSize: 12, color: "#666" }}>Ora inizio</div>
            <input
              type="time"
              name="startTime"
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                setClientError("");
              }}
              style={{ width: "100%", padding: 8 }}
            />
          </label>

          <label>
            <div style={{ fontSize: 12, color: "#666" }}>Ora fine</div>
            <input
              type="time"
              name="endTime"
              value={endTime}
              onChange={(e) => {
                setEndTime(e.target.value);
                setClientError("");
              }}
              style={{ width: "100%", padding: 8 }}
            />
          </label>

          <label style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontSize: 12, color: "#666" }}>Note (opzionale)</div>
            <textarea
              name="notes"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setClientError("");
              }}
              rows={4}
              style={{ width: "100%", padding: 8 }}
            />
          </label>
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
          <button
            type="submit"
            disabled={pending}
            style={{
              padding: "10px 12px",
              border: "1px solid #ddd",
              borderRadius: 8,
              background: "white",
              cursor: "pointer",
            }}
          >
            Salva modifiche
          </button>

          <Link href="/worker/logs" style={{ padding: "10px 12px", textDecoration: "none" }}>
            Annulla
          </Link>
        </div>
      </form>
    </div>
  );
}