// app/admin/users/new/CreateUserForm.tsx
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createUserAction, type CreateUserState } from "./actions";

const initialState: CreateUserState = {};

export default function CreateUserForm({
  suggestedEmployeeCode,
}: {
  suggestedEmployeeCode: string;
}) {
  const [state, formAction, pending] = useActionState(createUserAction, initialState);

  async function copyCredentials() {
    if (!state.created) return;
    const text = `Username: ${state.created.username}\nPassword: ${state.created.password}`;
    await navigator.clipboard.writeText(text);
  }

  const created = state.created;

  return (
    <div className="space-y-6 text-black">
      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {created && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-medium text-black">Utente creato</h2>
              <p className="mt-2 text-sm text-black">
                <span className="font-semibold">Username:</span> {created.username}
                <br />
                <span className="font-semibold">Password:</span> {created.password}
              </p>
              <p className="mt-2 text-xs text-black">
                Copia ora le credenziali: non saranno più visibili dopo refresh.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={copyCredentials}
                className="rounded-md bg-black px-3 py-2 text-sm text-white"
              >
                Copia
              </button>

              <Link
                href="/admin/users"
                className="rounded-md border px-3 py-2 text-sm text-black text-center hover:bg-gray-100"
              >
                Torna alla lista
              </Link>
            </div>
          </div>
        </div>
      )}

            {!created && (
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-black">Nome</label>
              <input
                name="firstName"
                defaultValue={state.values?.firstName ?? ""}
                className="mt-1 w-full rounded-md border px-3 py-2 text-black"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-black">Cognome</label>
              <input
                name="lastName"
                defaultValue={state.values?.lastName ?? ""}
                className="mt-1 w-full rounded-md border px-3 py-2 text-black"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-black">Employee code</label>
            <input
                name="employeeCode"
                defaultValue={state.values?.employeeCode ?? suggestedEmployeeCode}
                readOnly
                className="mt-1 w-full rounded-md border px-3 py-2 text-black bg-gray-100"
                required
                />
          </div>

          <div>
            <label className="text-sm font-medium text-black">Username</label>
            <input
              name="username"
              defaultValue={state.values?.username ?? ""}
              className="mt-1 w-full rounded-md border px-3 py-2 text-black"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-black">Password</label>
              <input
                name="password"
                type="password"
                className="mt-1 w-full rounded-md border px-3 py-2 text-black"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-black">Conferma password</label>
              <input
                name="passwordConfirm"
                type="password"
                className="mt-1 w-full rounded-md border px-3 py-2 text-black"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-black">Ruolo</label>
              <select
                name="role"
                className="mt-1 w-full rounded-md border px-3 py-2 text-black"
                defaultValue={state.values?.role ?? "WORKER"}
              >
                <option value="WORKER">WORKER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                defaultChecked={state.values?.isActive ?? true}
              />
              <label htmlFor="isActive" className="text-sm text-black">
                Attivo
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-black px-4 py-2 text-white text-sm disabled:opacity-60"
          >
            {pending ? "Creazione..." : "Crea utente"}
          </button>
        </form>
      )}

    </div>
  );
}
