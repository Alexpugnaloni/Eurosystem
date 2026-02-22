// app/admin/phases/new/CreatePhaseForm.tsx
"use client";

import { useActionState } from "react";
import { createPhase, type CreatePhaseState } from "./actions";

type CustomerOption = {
  id: string;
  name: string;
  isInternal: boolean;
};

const initialState: CreatePhaseState = { ok: true };

export default function CreatePhaseForm({ customers }: { customers: CustomerOption[] }) {
  const [state, formAction, pending] = useActionState(createPhase, initialState);
  const v = state.values ?? {};

  return (
    <form action={formAction} className="space-y-4 max-w-xl">
      {state.ok === false && state.message && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.message}</div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium text-black">Azienda</label>
        <select
          name="customerId"
          defaultValue={v.customerId ?? ""}
          className={`w-full rounded-md border px-3 py-2 text-sm text-black ${
            state.fieldErrors?.customerId ? "border-red-400" : "border-gray-300"
          }`}
        >
          <option value="">Seleziona azienda...</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.isInternal ? " (Interna)" : ""}
            </option>
          ))}
        </select>
        {state.fieldErrors?.customerId && <p className="text-sm text-red-600">{state.fieldErrors.customerId}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-black">Nome fase</label>
        <input
          name="name"
          defaultValue={v.name ?? ""}
          className={`w-full rounded-md border px-3 py-2 text-sm text-black ${
            state.fieldErrors?.name ? "border-red-400" : "border-gray-300"
          }`}
        />
        {state.fieldErrors?.name && <p className="text-sm text-red-600">{state.fieldErrors.name}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-black">Ordine (sortOrder)</label>
        <input
          name="sortOrder"
          type="number"
          min={1}
          defaultValue={v.sortOrder ?? "1"}
          className={`w-full rounded-md border px-3 py-2 text-sm text-black ${
            state.fieldErrors?.sortOrder ? "border-red-400" : "border-gray-300"
          }`}
        />
        {state.fieldErrors?.sortOrder && <p className="text-sm text-red-600">{state.fieldErrors.sortOrder}</p>}
      </div>

      <label className="flex items-center gap-2 text-sm text-black">
        <input type="checkbox" name="isFinal" defaultChecked={v.isFinal ?? false} className="h-4 w-4" />
        Fase finale (se attiva, disattiva le altre fasi finali della stessa azienda)
      </label>

      <label className="flex items-center gap-2 text-sm text-black">
        <input type="checkbox" name="isActive" defaultChecked={v.isActive ?? true} className="h-4 w-4" />
        Attiva
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-60"
      >
        {pending ? "Salvataggio..." : "Salva"}
      </button>
    </form>
  );
}