"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { createWorkLogAction, type CreateWorkLogState } from "../actions";

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
  headerRow: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" as const },
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

export default function CreateWorkLogForm(props: {
  customers: Customer[];
  models: Model[];
  phases: Phase[];
  defaultDate: string;
}) {
  const [serverState, action, pending] = useActionState<CreateWorkLogState, FormData>(createWorkLogAction, {
    values: {
      workDate: props.defaultDate,
      activityType: "PRODUCTION",
      customerId: "",
      modelId: "",
      phaseId: "",
      startTime: "",
      endTime: "",
      qtyOk: "0",
      qtyKo: "0",
      notes: "",
    },
  });

  // ✅ Controlled fields (non si resettano)
  const [activityType, setActivityType] = useState<ActivityType>("PRODUCTION");
  const [workDate, setWorkDate] = useState(props.defaultDate);
  const [customerId, setCustomerId] = useState("");
  const [modelId, setModelId] = useState("");
  const [phaseId, setPhaseId] = useState("");
  const [qtyOk, setQtyOk] = useState("0");
  const [qtyKo, setQtyKo] = useState("0");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");

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
  <div className="flex justify-center p-6">
    <div className="w-full max-w-3xl rounded-xl border bg-white p-6 shadow-sm">

      <div className="text-center">
        <h1 className="text-2xl font-semibold">
          Nuova attività
        </h1>

        <p className="text-sm text-zinc-600 mt-2">
          Inserisci produzione o pulizie. Nessun overlap permesso.
        </p>
      </div>

      {clientError && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 text-center">
          {clientError}
        </div>
      )}

      {serverState.error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 text-center">
          {serverState.error}
        </div>
      )}

      <form
        action={action}
        onSubmit={handleSubmit}
        className="mt-6 grid gap-4 md:grid-cols-2"
      >

        {/* Tipo */}
        <div>
          <label className="text-sm text-zinc-600">Tipo attività</label>
          <select
            name="activityType"
            value={activityType}
            onChange={(e) => onChangeActivityType(e.target.value as ActivityType)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="PRODUCTION">Produzione</option>
            <option value="CLEANING">Pulizie</option>
          </select>
        </div>

        {/* Data */}
        <div>
          <label className="text-sm text-zinc-600">Data</label>
          <input
            type="date"
            name="workDate"
            value={workDate}
            onChange={(e) => {
              setWorkDate(e.target.value);
              setClientError("");
            }}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        {/* Azienda */}
        <div className="md:col-span-2">
          <label className="text-sm text-zinc-600">Azienda</label>
          <select
            name="customerId"
            value={customerId}
            onChange={(e) => onChangeCustomer(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Seleziona…</option>
            {props.customers.map((c) => (
              <option key={String(c.id)} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {isProduction && (
          <>
            {/* Modello */}
            <div>
              <label className="text-sm text-zinc-600">Modello</label>
              <select
                name="modelId"
                value={modelId}
                onChange={(e) => {
                  setModelId(e.target.value);
                  setClientError("");
                }}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                disabled={!customerId}
              >
                <option value="">
                  {customerId ? "Seleziona…" : "Seleziona prima un'azienda"}
                </option>
                {filteredModels.map((m) => (
                  <option key={String(m.id)} value={String(m.id)}>
                    {m.name} {m.code ? `(${m.code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Fase */}
            <div>
              <label className="text-sm text-zinc-600">Fase</label>
              <select
                name="phaseId"
                value={phaseId}
                onChange={(e) => {
                  setPhaseId(e.target.value);
                  setClientError("");
                }}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                disabled={!customerId}
              >
                <option value="">
                  {customerId ? "Seleziona…" : "Seleziona prima un'azienda"}
                </option>
                {filteredPhases.map((p) => (
                  <option key={String(p.id)} value={String(p.id)}>
                    {p.sortOrder}. {p.name} {p.isFinal ? "(finale)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantità */}
            <div>
              <label className="text-sm text-zinc-600">Quantità OK</label>
              <input
                type="number"
                name="qtyOk"
                min={0}
                value={qtyOk}
                onChange={(e) => setQtyOk(e.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-600">Quantità KO</label>
              <input
                type="number"
                name="qtyKo"
                min={0}
                value={qtyKo}
                onChange={(e) => setQtyKo(e.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </>
        )}

        {/* Orari */}
        <div>
          <label className="text-sm text-zinc-600">Ora inizio</label>
          <input
            type="time"
            name="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm text-zinc-600">Ora fine</label>
          <input
            type="time"
            name="endTime"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        {/* Note */}
        <div className="md:col-span-2">
          <label className="text-sm text-zinc-600">Note</label>
          <textarea
            name="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        {/* BOTTONI */}
        <div className="md:col-span-2 flex justify-center gap-3 mt-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-black px-5 py-2 text-sm text-white disabled:opacity-60"
          >
            Salva
          </button>

          <Link
            href="/worker/logs"
            className="rounded-md border px-5 py-2 text-sm hover:bg-zinc-100"
          >
            Annulla
          </Link>
        </div>
      </form>

      <p className="mt-4 text-xs text-center text-zinc-500">
        Suggerimento: se cambi Azienda, potresti dover riselezionare Modello/Fase.
      </p>
    </div>
  </div>
);
}