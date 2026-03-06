// app/admin/customers/new/CreateCustomerForm.tsx
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createCustomerAction, type CreateCustomerState } from "./actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: CreateCustomerState = {};

export default function CreateCustomerForm() {
  const [state, formAction, pending] = useActionState(createCustomerAction, initialState);

  return (
    <div className="space-y-6">
      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
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
            className="h-4 w-4 rounded border border-input"
          />
          <Label htmlFor="isActive" className="font-normal">
            Attiva
          </Label>
        </div>

        <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
          L&apos;azienda interna è unica ed è gestita dal seed. Qui puoi creare solo aziende esterne.
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Creazione..." : "Crea azienda"}
          </Button>

          <Button asChild variant="outline">
            <Link href="/admin/customers">Annulla</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}