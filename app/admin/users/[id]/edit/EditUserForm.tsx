// app/admin/users/[id]/edit/EditUserForm.tsx
"use client";

import { useActionState } from "react";
import { updateUserAction, type EditUserState } from "./actions";

export default function EditUserForm({
  userId,
  defaultFirstName,
  defaultLastName,
  defaultIsActive,
}: {
  userId: string;
  defaultFirstName: string;
  defaultLastName: string;
  defaultIsActive: boolean;
}) {
  const initialState: EditUserState = {
    values: {
      firstName: defaultFirstName,
      lastName: defaultLastName,
      isActive: defaultIsActive,
    },
  };

  const boundAction = updateUserAction.bind(null, userId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4 text-black">
      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Nome</label>
          <input
            name="firstName"
            defaultValue={state.values?.firstName ?? ""}
            className="mt-1 w-full rounded-md border px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Cognome</label>
          <input
            name="lastName"
            defaultValue={state.values?.lastName ?? ""}
            className="mt-1 w-full rounded-md border px-3 py-2"
            required
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isActive"
          name="isActive"
          type="checkbox"
          defaultChecked={state.values?.isActive ?? true}
        />
        <label htmlFor="isActive" className="text-sm">
          Attivo
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-black px-4 py-2 text-white text-sm disabled:opacity-60"
      >
        {pending ? "Salvataggio..." : "Salva"}
      </button>
    </form>
  );
}