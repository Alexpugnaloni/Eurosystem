// app/admin/models/[id]/edit/EditModelForm.tsx
"use client";

import { useActionState } from "react";
import { updateModel, type EditModelState } from "./actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <form action={formAction} className="space-y-5">
      {state.ok === false && state.message && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Azienda */}
      <div className="space-y-2">
        <Label htmlFor="customerId">Azienda</Label>

        <select
          id="customerId"
          name="customerId"
          defaultValue={v.customerId ?? ""}
          className={`h-10 w-full rounded-md border bg-background px-3 text-sm ${
            state.fieldErrors?.customerId ? "border-red-400" : "border-input"
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

      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="name">Nome modello</Label>

        <Input
          id="name"
          name="name"
          defaultValue={v.name ?? ""}
          className={state.fieldErrors?.name ? "border-red-400" : ""}
        />

        {state.fieldErrors?.name && (
          <p className="text-sm text-red-600">{state.fieldErrors.name}</p>
        )}
      </div>

      {/* Codice */}
      <div className="space-y-2">
        <Label htmlFor="code">Codice (opzionale)</Label>

        <Input
          id="code"
          name="code"
          defaultValue={v.code ?? ""}
          className={state.fieldErrors?.code ? "border-red-400" : ""}
        />

        {state.fieldErrors?.code && (
          <p className="text-sm text-red-600">{state.fieldErrors.code}</p>
        )}
      </div>

      {/* Attivo */}
      <div className="flex items-center gap-2">
        <input
          id="isActive"
          type="checkbox"
          name="isActive"
          defaultChecked={v.isActive ?? true}
          className="h-4 w-4 rounded border border-input"
        />
        <Label htmlFor="isActive" className="font-normal">
          Attivo
        </Label>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Salvataggio..." : "Salva modifiche"}
      </Button>
    </form>
  );
}