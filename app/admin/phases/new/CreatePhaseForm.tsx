// app/admin/phases/new/CreatePhaseForm.tsx
"use client";

import { useActionState } from "react";
import { createPhase, type CreatePhaseState } from "./actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <form action={formAction} className="max-w-xl space-y-5">
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

      {/* Nome fase */}
      <div className="space-y-2">
        <Label htmlFor="name">Nome fase</Label>
        <Input
          id="name"
          name="name"
          defaultValue={v.name ?? ""}
          className={state.fieldErrors?.name ? "border-red-400" : ""}
        />
        {state.fieldErrors?.name && <p className="text-sm text-red-600">{state.fieldErrors.name}</p>}
      </div>

      {/* Sort order */}
      <div className="space-y-2">
        <Label htmlFor="sortOrder">Ordine (sortOrder)</Label>
        <Input
          id="sortOrder"
          name="sortOrder"
          type="number"
          min={1}
          defaultValue={v.sortOrder ?? "1"}
          className={state.fieldErrors?.sortOrder ? "border-red-400" : ""}
        />
        {state.fieldErrors?.sortOrder && (
          <p className="text-sm text-red-600">{state.fieldErrors.sortOrder}</p>
        )}
      </div>

      {/* Finale */}
      <div className="flex items-start gap-2">
        <input
          id="isFinal"
          type="checkbox"
          name="isFinal"
          defaultChecked={v.isFinal ?? false}
          className="mt-1 h-4 w-4 rounded border border-input"
        />
        <Label htmlFor="isFinal" className="font-normal leading-snug">
          Fase finale (se attiva, disattiva le altre fasi finali della stessa azienda)
        </Label>
      </div>

      {/* Attiva */}
      <div className="flex items-center gap-2">
        <input
          id="isActive"
          type="checkbox"
          name="isActive"
          defaultChecked={v.isActive ?? true}
          className="h-4 w-4 rounded border border-input"
        />
        <Label htmlFor="isActive" className="font-normal">
          Attiva
        </Label>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Salvataggio..." : "Salva"}
      </Button>
    </form>
  );
}