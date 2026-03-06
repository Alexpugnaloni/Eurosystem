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

  const inputBase =
    "mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-black/10";
  const labelBase = "text-sm font-medium text-gray-900";
  const errorText = "mt-1 text-sm text-red-600";

  return (
    <div className="max-w-[920px] p-4 text-gray-900">
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-bold">Modifica attività</h1>
        <span className="text-gray-400">•</span>
        <Link href="/admin/worklogs" className="text-sm underline underline-offset-2">
          Torna alle schede
        </Link>
      </div>

      {/* Worker info */}
      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3">
        <div className="text-sm">
          <span className="font-semibold">Dipendente:</span> {props.worker.label}{" "}
          {!props.worker.isActive && <span className="font-medium text-red-600">(non attivo)</span>}
        </div>
      </div>

      {/* Message */}
      {state.message && (
        <div
          className={[
            "mb-4 rounded-lg border p-3 text-sm",
            state.ok
              ? "border-green-200 bg-green-50 text-green-900"
              : "border-red-200 bg-red-50 text-red-900",
          ].join(" ")}
        >
          {state.message}
        </div>
      )}

      {/* Form */}
      <form action={onSubmit} className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4">
        <input type="hidden" name="id" value={props.id} />

        {/* Top row */}
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-1">
            <span className={labelBase}>Data</span>
            <input
              name="workDate"
              type="date"
              defaultValue={props.initial.workDate}
              className={inputBase}
            />
            {state.fieldErrors?.workDate && (
              <span className={errorText}>{state.fieldErrors.workDate}</span>
            )}
          </label>

          <label className="grid gap-1">
            <span className={labelBase}>Tipo attività</span>
            <select
              name="activityType"
              defaultValue={props.initial.activityType}
              onChange={(e) => setActivityType(e.target.value as any)}
              className={inputBase}
            >
              <option value="PRODUCTION">Produzione</option>
              <option value="CLEANING">Pulizie</option>
            </select>
            {state.fieldErrors?.activityType && (
              <span className={errorText}>{state.fieldErrors.activityType}</span>
            )}
          </label>

          <label className="grid gap-1">
            <span className={labelBase}>Azienda</span>
            <select
              name="customerId"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className={inputBase}
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
              <span className={errorText}>{state.fieldErrors.customerId}</span>
            )}
          </label>
        </div>

        {/* Times */}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1">
            <span className={labelBase}>Inizio</span>
            <input
              name="startTime"
              type="time"
              defaultValue={props.initial.startTime}
              className={inputBase}
            />
            {state.fieldErrors?.startTime && (
              <span className={errorText}>{state.fieldErrors.startTime}</span>
            )}
          </label>

          <label className="grid gap-1">
            <span className={labelBase}>Fine</span>
            <input
              name="endTime"
              type="time"
              defaultValue={props.initial.endTime}
              className={inputBase}
            />
            {state.fieldErrors?.endTime && (
              <span className={errorText}>{state.fieldErrors.endTime}</span>
            )}
          </label>
        </div>

        {/* Production fields */}
        {activityType === "PRODUCTION" ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1">
                <span className={labelBase}>Modello</span>
                <select name="modelId" defaultValue={props.initial.modelId} className={inputBase}>
                  <option value="">Seleziona</option>
                  {filteredModels.map((m) => (
                    <option key={String(m.id)} value={String(m.id)}>
                      {m.name}
                      {m.code ? ` (${m.code})` : ""}
                    </option>
                  ))}
                </select>
                {state.fieldErrors?.modelId && (
                  <span className={errorText}>{state.fieldErrors.modelId}</span>
                )}
              </label>

              <label className="grid gap-1">
                <span className={labelBase}>Fase</span>
                <select name="phaseId" defaultValue={props.initial.phaseId} className={inputBase}>
                  <option value="">Seleziona</option>
                  {filteredPhases.map((p) => (
                    <option key={String(p.id)} value={String(p.id)}>
                      {p.name}
                      {p.isFinal ? " (finale)" : ""}
                    </option>
                  ))}
                </select>
                {state.fieldErrors?.phaseId && (
                  <span className={errorText}>{state.fieldErrors.phaseId}</span>
                )}
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1">
                <span className={labelBase}>Qta OK</span>
                <input
                  name="qtyOk"
                  type="number"
                  min={0}
                  defaultValue={props.initial.qtyOk}
                  className={inputBase}
                />
                {state.fieldErrors?.qtyOk && (
                  <span className={errorText}>{state.fieldErrors.qtyOk}</span>
                )}
              </label>

              <label className="grid gap-1">
                <span className={labelBase}>Qta KO</span>
                <input
                  name="qtyKo"
                  type="number"
                  min={0}
                  defaultValue={props.initial.qtyKo}
                  className={inputBase}
                />
                {state.fieldErrors?.qtyKo && (
                  <span className={errorText}>{state.fieldErrors.qtyKo}</span>
                )}
              </label>
            </div>
          </>
        ) : (
          <>
            {/* Cleaning: forziamo valori vuoti/zero */}
            <input type="hidden" name="modelId" value="" />
            <input type="hidden" name="phaseId" value="" />
            <input type="hidden" name="qtyOk" value="0" />
            <input type="hidden" name="qtyKo" value="0" />
          </>
        )}

        {/* Notes */}
        <label className="grid gap-1">
          <span className={labelBase}>Note</span>
          <textarea
            name="notes"
            defaultValue={props.initial.notes}
            rows={4}
            className={inputBase}
          />
          {state.fieldErrors?.notes && <span className={errorText}>{state.fieldErrors.notes}</span>}
        </label>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "Salvataggio..." : "Salva modifiche"}
          </button>

          <Link
            href="/admin/worklogs"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900"
          >
            Annulla
          </Link>
        </div>
      </form>
    </div>
  );
}