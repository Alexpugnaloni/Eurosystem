// app/admin/customers/[id]/edit/EditCustomerForm.tsx
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateCustomerAction, type EditCustomerState } from "./actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function EditCustomerForm({
  customerId,
  initialValues,
  isInternal,
}: {
  customerId: string;
  initialValues: { name: string; isActive: boolean };
  isInternal: boolean;
}) {
  const initialState: EditCustomerState = { values: initialValues };
  const boundAction = updateCustomerAction.bind(null, customerId, isInternal);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <div className="space-y-6">
      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {isInternal && (
        <div className="rounded-md border bg-muted/40 p-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="font-medium">Azienda interna</div>
            <Badge variant="secondary">Interna</Badge>
          </div>
          <div className="mt-1 text-muted-foreground">
            È unica (solo voi). Non è disattivabile.
          </div>
        </div>
      )}

      <form action={formAction} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Nome azienda</Label>
          <Input id="name" name="name" defaultValue={state.values?.name ?? ""} required />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isActive"
            name="isActive"
            type="checkbox"
            defaultChecked={state.values?.isActive ?? true}
            disabled={isInternal}
            className="h-4 w-4 rounded border border-input disabled:cursor-not-allowed disabled:opacity-60"
          />
          <Label htmlFor="isActive" className="font-normal">
            Attiva
          </Label>
          {isInternal ? (
            <span className="text-xs text-muted-foreground">(bloccato)</span>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvataggio..." : "Salva"}
          </Button>

          <Button asChild variant="outline">
            <Link href="/admin/customers">Torna alla lista</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}