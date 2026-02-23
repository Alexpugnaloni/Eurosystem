"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { createWorkLogAction, type CreateWorkLogState } from "../actions";

type Customer = { id: bigint; name: string };
type Model = { id: bigint; customerId: bigint; name: string; code: string | null };
type Phase = { id: bigint; customerId: bigint; name: string; sortOrder: number; isFinal: boolean };

export default function CreateWorkLogForm(props: {
  customers: Customer[];
  models: Model[];
  phases: Phase[];
  defaultDate: string;
}) {
  const [state, action, pending] = useActionState<CreateWorkLogState, FormData>(
    createWorkLogAction,
    {
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
    }
  );

  const v = state.values;

  const selectedCustomerId = v.customerId ? BigInt(v.customerId) : null;

  const filteredModels = useMemo(() => {
    if (!selectedCustomerId) return [];
    return props.models.filter((m) => m.customerId === selectedCustomerId);
  }, [props.models, selectedCustomerId]);

  const filteredPhases = useMemo(() => {
    if (!selectedCustomerId) return [];
    return props.phases.filter((p) => p.customerId === selectedCustomerId);
  }, [props.phases, selectedCustomerId]);

  const isProduction = v.activityType === "PRODUCTION";

  return (
    <div style={{ padding: 16, maxWidth: 820 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Nuova attività</h1>
          <p style={{ marginTop: 6, color: "#666" }}>
            Inserisci produzione o pulizie. Nessun overlap permesso.
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

      {state.error ? <p style={{ color: "crimson" }}>{state.error}</p> : null}

      <form action={action} style={{ marginTop: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 12 }}>
          <label>
            <div style={{ fontSize: 12, color: "#666" }}>Tipo attività</div>
            <select name="activityType" defaultValue={v.activityType} style={{ width: "100%", padding: 8 }}>
              <option value="PRODUCTION">Produzione</option>
              <option value="CLEANING">Pulizie</option>
            </select>
          </label>

          <label>
            <div style={{ fontSize: 12, color: "#666" }}>Data</div>
            <input type="date" name="workDate" defaultValue={v.workDate} style={{ width: "100%", padding: 8 }} />
          </label>

          <label style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontSize: 12, color: "#666" }}>Azienda</div>
            <select name="customerId" defaultValue={v.customerId} style={{ width: "100%", padding: 8 }}>
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
                <select name="modelId" defaultValue={v.modelId} style={{ width: "100%", padding: 8 }}>
                  <option value="">Seleziona…</option>
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
                <select name="phaseId" defaultValue={v.phaseId} style={{ width: "100%", padding: 8 }}>
                  <option value="">Seleziona…</option>
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
                <input type="number" name="qtyOk" min={0} defaultValue={v.qtyOk} style={{ width: "100%", padding: 8 }} />
              </label>

              <label>
                <div style={{ fontSize: 12, color: "#666" }}>Quantità KO</div>
                <input type="number" name="qtyKo" min={0} defaultValue={v.qtyKo} style={{ width: "100%", padding: 8 }} />
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
            <input type="time" name="startTime" defaultValue={v.startTime} style={{ width: "100%", padding: 8 }} />
          </label>

          <label>
            <div style={{ fontSize: 12, color: "#666" }}>Ora fine</div>
            <input type="time" name="endTime" defaultValue={v.endTime} style={{ width: "100%", padding: 8 }} />
          </label>

          <label style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontSize: 12, color: "#666" }}>Note (opzionale)</div>
            <textarea name="notes" defaultValue={v.notes} rows={4} style={{ width: "100%", padding: 8 }} />
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
            Salva
          </button>
          <Link href="/worker/logs" style={{ padding: "10px 12px", textDecoration: "none" }}>
            Annulla
          </Link>
        </div>
      </form>

      <p style={{ marginTop: 12, color: "#888", fontSize: 12 }}>
        Suggerimento: se cambi Azienda, potresti dover riselezionare Modello/Fase.
      </p>
    </div>
  );
}