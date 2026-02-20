"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createCustomerAction, type CreateCustomerState } from "./actions";

const initialState: CreateCustomerState = {};

export default function CreateCustomerForm() {
  const [state, formAction, pending] = useActionState(createCustomerAction, initialState);

  return (
    <div className="space-y-6 text-black">
      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-black">Nome azienda</label>
          <input
            name="name"
            defaultValue={state.values?.name ?? ""}
            className="mt-1 w-full rounded-md border px-3 py-2 text-black"
            required
          />
        </div>

        <div className="flex items-end gap-2">
          <input
            id="isActive"
            name="isActive"
            type="checkbox"
            defaultChecked={state.values?.isActive ?? true}
          />
          <label htmlFor="isActive" className="text-sm text-black">
            Attiva
          </label>
        </div>

        <div className="rounded-md border bg-gray-50 p-3 text-sm text-black">
          L&apos;azienda interna è unica ed è gestita dal seed. Qui puoi creare solo aziende esterne.
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-black px-4 py-2 text-white text-sm disabled:opacity-60"
          >
            {pending ? "Creazione..." : "Crea azienda"}
          </button>

          <Link
            href="/admin/customers"
            className="rounded-md border px-4 py-2 text-sm text-black hover:bg-gray-100"
          >
            Annulla
          </Link>
        </div>
      </form>
    </div>
  );
}