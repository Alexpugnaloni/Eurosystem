// app/admin/phases/[id]/edit/EditPhaseForm.tsx
"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updatePhase, type UpdatePhaseState } from "./actions";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
    <form action={formAction} className="max-w-xl space-y-5">
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

      {/* Azienda */}
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">Azienda</p>
        <p className="text-sm font-medium">
          {phase.customerName}
          {phase.customerIsInternal ? " (Interna)" : ""}
        </p>
      </Card>

      {/* Nome fase */}
      <div className="space-y-2">
        <Label htmlFor="name">Nome fase</Label>
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

      {/* Ordine */}
      <div className="space-y-2">
        <Label htmlFor="sortOrder">Ordine (sortOrder)</Label>
        <Input
          id="sortOrder"
          name="sortOrder"
          type="number"
          min={1}
          defaultValue={v.sortOrder ?? String(phase.sortOrder)}
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

      {/* Azioni */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvataggio..." : "Salva modifiche"}
        </Button>

        <Button asChild variant="outline">
          <Link href="/admin/phases">Torna alle fasi</Link>
        </Button>
      </div>
    </form>
  );
}