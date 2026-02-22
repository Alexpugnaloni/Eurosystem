// app/admin/models/[id]/edit/EditModelForm.tsx
"use client";

import { useActionState } from "react";
import { updateModel, type EditModelState } from "./actions";

type CustomerOption = {
  id: string;
  name: string;
  isInternal: boolean;
};

type ModelData = {
  id: string;
  customerId: string;
  name: string;
  code: string;
  isActive: boolean;
};

const initialState: EditModelState = { ok: true };

export default function EditModelForm({
  model,
  customers,
}: {
  model: ModelData;
  customers: CustomerOption[];
}) {
  const boundAction = updateModel.bind(null, model.id);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  const v = state.values ?? {
    customerId: model.customerId,
    name: model.name,
    code: model.code,
    isActive: model.isActive,
  };

  return (
    <form action={formAction} className="space-y-4">
      {state.ok === false && state.message && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.message}
        </div>
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
        {state.fieldErrors?.customerId && (
          <p className="text-sm text-red-600">{state.fieldErrors.customerId}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-black">Nome modello</label>
        <input
          name="name"
          defaultValue={v.name ?? ""}
          className={`w-full rounded-md border px-3 py-2 text-sm text-black ${
            state.fieldErrors?.name ? "border-red-400" : "border-gray-300"
          }`}
        />
        {state.fieldErrors?.name && (
          <p className="text-sm text-red-600">{state.fieldErrors.name}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-black">Codice (opzionale)</label>
        <input
          name="code"
          defaultValue={v.code ?? ""}
          className={`w-full rounded-md border px-3 py-2 text-sm text-black ${
            state.fieldErrors?.code ? "border-red-400" : "border-gray-300"
          }`}
        />
        {state.fieldErrors?.code && (
          <p className="text-sm text-red-600">{state.fieldErrors.code}</p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-black">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={v.isActive ?? true}
          className="h-4 w-4"
        />
        Attivo
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-60"
      >
        {pending ? "Salvataggio..." : "Salva modifiche"}
      </button>
    </form>
  );
}