// app/admin/worklogs/[id]/edit/EditWorkLogAdminForm.tsx
"use client";

import Link from "next/link";
import { useMemo, useState, useTransition, useActionState } from "react";
import { updateWorkLogAdminAction, type UpdateWorkLogAdminState } from "./actions";

type Customer = {
  id: bigint;
  name: string;
  isInternal: boolean;
};

type Model = {
  id: bigint;
  customerId: bigint;
  name: string;
  code: string | null;
  isActive: boolean;
};

type Phase = {
  id: bigint;
  customerId: bigint;
  name: string;
  sortOrder: number;
  isFinal: boolean;
  isActive: boolean;
};

type Props = {
  id: string;
  worker: { id: string; label: string; isActive: boolean };
  initial: {
    workDate: string;
    activityType: "PRODUCTION" | "CLEANING";
    customerId: string;
    modelId: string; // "" se null
    phaseId: string; // "" se null
    startTime: string; // "HH:MM"
    endTime: string; // "HH:MM"
    qtyOk: string;
    qtyKo: string;
    notes: string;
  };
  customers: Customer[];
  models: Model[];
  phases: Phase[];
};

export default function EditWorkLogAdminForm(props: Props) {
  const [pending, startTransition] = useTransition();

  const [activityType, setActivityType] = useState<Props["initial"]["activityType"]>(
    props.initial.activityType
  );

  const [customerId, setCustomerId] = useState(props.initial.customerId);

  const filteredModels = useMemo(() => {
    const cid = customerId ? BigInt(customerId) : null;
    if (!cid) return [];
    return props.models.filter((m) => m.customerId === cid && m.isActive);
  }, [customerId, props.models]);

  const filteredPhases = useMemo(() => {
    const cid = customerId ? BigInt(customerId) : null;
    if (!cid) return [];
    return props.phases.filter((p) => p.customerId === cid && p.isActive);
  }, [customerId, props.phases]);

  const initialState: UpdateWorkLogAdminState = { ok: false, message: null, fieldErrors: {} };

  const [state, formAction] = useActionState(updateWorkLogAdminAction, initialState);

  function onSubmit(formData: FormData) {
    startTransition(() => formAction(formData));
  }

  return (
    <div style={{ padding: 16, maxWidth: 920 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Modifica attività</h1>
        <span style={{ opacity: 0.7 }}>•</span>
        <Link href="/admin/worklogs" style={{ textDecoration: "underline" }}>
          Torna alle schede
        </Link>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div>
          <b>Dipendente:</b> {props.worker.label}{" "}
          {!props.worker.isActive && <span style={{ color: "crimson" }}>(non attivo)</span>}
        </div>
      </div>

      {state.message && (
        <div
          style={{
            marginBottom: 12,
            padding: 10,
            border: "1px solid #ddd",
            borderRadius: 6,
            background: state.ok ? "#f3fff3" : "#fff3f3",
          }}
        >
          {state.message}
        </div>
      )}

      <form action={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input type="hidden" name="id" value={props.id} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <label style={{ display: "grid", gap: 4 }}>
            <span>Data</span>
            <input
              name="workDate"
              type="date"
              defaultValue={props.initial.workDate}
              style={{ padding: 8, color: "black" }}
            />
            {state.fieldErrors?.workDate && (
              <span style={{ color: "crimson" }}>{state.fieldErrors.workDate}</span>
            )}
          </label>

          <label style={{ display: "grid", gap: 4 }}>
            <span>Tipo attività</span>
            <select
              name="activityType"
              defaultValue={props.initial.activityType}
              onChange={(e) => setActivityType(e.target.value as any)}
              style={{ padding: 8, color: "black" }}
            >
              <option value="PRODUCTION">Produzione</option>
              <option value="CLEANING">Pulizie</option>
            </select>
            {state.fieldErrors?.activityType && (
              <span style={{ color: "crimson" }}>{state.fieldErrors.activityType}</span>
            )}
          </label>

          <label style={{ display: "grid", gap: 4 }}>
            <span>Azienda</span>
            <select
              name="customerId"
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
              }}
              style={{ padding: 8, color: "black" }}
            >
              <option value="">Seleziona</option>
              {props.customers.map((c) => (
                <option key={String(c.id)} value={String(c.id)}>
                  {c.name}
                  {c.isInternal ? " (interna)" : ""}
                </option>
              ))}
            </select>
            {state.fieldErrors?.customerId && (
              <span style={{ color: "crimson" }}>{state.fieldErrors.customerId}</span>
            )}
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "grid", gap: 4 }}>
            <span>Inizio</span>
            <input
              name="startTime"
              type="time"
              defaultValue={props.initial.startTime}
              style={{ padding: 8, color: "black" }}
            />
            {state.fieldErrors?.startTime && (
              <span style={{ color: "crimson" }}>{state.fieldErrors.startTime}</span>
            )}
          </label>

          <label style={{ display: "grid", gap: 4 }}>
            <span>Fine</span>
            <input
              name="endTime"
              type="time"
              defaultValue={props.initial.endTime}
              style={{ padding: 8, color: "black" }}
            />
            {state.fieldErrors?.endTime && (
              <span style={{ color: "crimson" }}>{state.fieldErrors.endTime}</span>
            )}
          </label>
        </div>

        {/* Campi produzione */}
        {activityType === "PRODUCTION" ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={{ display: "grid", gap: 4 }}>
                <span>Modello</span>
                <select
                  name="modelId"
                  defaultValue={props.initial.modelId}
                  style={{ padding: 8, color: "black" }}
                >
                  <option value="">Seleziona</option>
                  {filteredModels.map((m) => (
                    <option key={String(m.id)} value={String(m.id)}>
                      {m.name}
                      {m.code ? ` (${m.code})` : ""}
                    </option>
                  ))}
                </select>
                {state.fieldErrors?.modelId && (
                  <span style={{ color: "crimson" }}>{state.fieldErrors.modelId}</span>
                )}
              </label>

              <label style={{ display: "grid", gap: 4 }}>
                <span>Fase</span>
                <select
                  name="phaseId"
                  defaultValue={props.initial.phaseId}
                  style={{ padding: 8, color: "black" }}
                >
                  <option value="">Seleziona</option>
                  {filteredPhases.map((p) => (
                    <option key={String(p.id)} value={String(p.id)}>
                      {p.name}
                      {p.isFinal ? " (finale)" : ""}
                    </option>
                  ))}
                </select>
                {state.fieldErrors?.phaseId && (
                  <span style={{ color: "crimson" }}>{state.fieldErrors.phaseId}</span>
                )}
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={{ display: "grid", gap: 4 }}>
                <span>Qta OK</span>
                <input
                  name="qtyOk"
                  type="number"
                  min={0}
                  defaultValue={props.initial.qtyOk}
                  style={{ padding: 8, color: "black" }}
                />
                {state.fieldErrors?.qtyOk && (
                  <span style={{ color: "crimson" }}>{state.fieldErrors.qtyOk}</span>
                )}
              </label>

              <label style={{ display: "grid", gap: 4 }}>
                <span>Qta KO</span>
                <input
                  name="qtyKo"
                  type="number"
                  min={0}
                  defaultValue={props.initial.qtyKo}
                  style={{ padding: 8, color: "black" }}
                />
                {state.fieldErrors?.qtyKo && (
                  <span style={{ color: "crimson" }}>{state.fieldErrors.qtyKo}</span>
                )}
              </label>
            </div>
          </>
        ) : (
          // Campi pulizie: forziamo a vuoto lato form (lato server valideremo e setteremo null)
          <>
            <input type="hidden" name="modelId" value="" />
            <input type="hidden" name="phaseId" value="" />
            <input type="hidden" name="qtyOk" value="0" />
            <input type="hidden" name="qtyKo" value="0" />
          </>
        )}

        <label style={{ display: "grid", gap: 4 }}>
          <span>Note</span>
          <textarea
            name="notes"
            defaultValue={props.initial.notes}
            rows={4}
            style={{ padding: 8, color: "black" }}
          />
          {state.fieldErrors?.notes && (
            <span style={{ color: "crimson" }}>{state.fieldErrors.notes}</span>
          )}
        </label>

        <button
          type="submit"
          disabled={pending}
          style={{
            padding: "10px 14px",
            borderRadius: 6,
            border: "1px solid #333",
            width: "fit-content",
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? "Salvataggio..." : "Salva modifiche"}
        </button>
      </form>
    </div>
  );
}