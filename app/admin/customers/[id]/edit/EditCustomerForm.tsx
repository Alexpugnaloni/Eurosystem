"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateCustomerAction, type EditCustomerState } from "./actions";

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
    <div className="space-y-6 text-black">
      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {isInternal && (
        <div className="rounded-md border bg-gray-50 p-3 text-sm text-black">
          <div className="font-medium">Azienda interna</div>
          <div className="mt-1">È unica (solo voi). Non è disattivabile.</div>
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
            disabled={isInternal}
          />
          <label htmlFor="isActive" className="text-sm text-black">
            Attiva
          </label>
          {isInternal && <span className="text-xs text-black">(bloccato)</span>}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-black px-4 py-2 text-white text-sm disabled:opacity-60"
          >
            {pending ? "Salvataggio..." : "Salva"}
          </button>

          <Link
            href="/admin/customers"
            className="rounded-md border px-4 py-2 text-sm text-black hover:bg-gray-100"
          >
            Torna alla lista
          </Link>
        </div>
      </form>
    </div>
  );
}