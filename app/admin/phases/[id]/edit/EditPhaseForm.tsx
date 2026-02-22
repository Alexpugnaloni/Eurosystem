// app/admin/phases/[id]/edit/EditPhaseForm.tsx
"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updatePhase, type UpdatePhaseState } from "./actions";

type Phase = {
  id: string;
  customerId: string;
  customerName: string;
  customerIsInternal: boolean;
  name: string;
  sortOrder: number;
  isFinal: boolean;
  isActive: boolean;
};

const initialState: UpdatePhaseState = { ok: true };

export default function EditPhaseForm({ phase }: { phase: Phase }) {
  const boundAction = updatePhase.bind(null, phase.id);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  const v = state.values ?? {
    name: phase.name,
    sortOrder: String(phase.sortOrder),
    isFinal: phase.isFinal,
    isActive: phase.isActive,
  };

  return (
    <form action={formAction} className="space-y-4 max-w-xl">
      {state.ok === true && state.message && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {state.message}
        </div>
      )}

      {state.ok === false && state.message && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <div className="rounded-lg border bg-white p-4 space-y-1">
        <p className="text-sm text-gray-600">Azienda</p>
        <p className="text-sm font-medium text-black">
          {phase.customerName}
          {phase.customerIsInternal ? " (Interna)" : ""}
        </p>
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
          defaultValue={v.sortOrder ?? String(phase.sortOrder)}
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

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {pending ? "Salvataggio..." : "Salva modifiche"}
        </button>

        <Link href="/admin/phases" className="text-sm underline text-black">
          Torna alle fasi
        </Link>
      </div>
    </form>
  );
}