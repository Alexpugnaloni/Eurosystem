// app/admin/users/[id]/edit/EditUserForm.tsx
"use client";

import { useActionState } from "react";
import { updateUserAndMaybeResetPasswordAction, type EditUserAllState } from "./actions";
import Link from "next/link";

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
  const initialState: EditUserAllState = {
    values: {
      firstName: defaultFirstName,
      lastName: defaultLastName,
      isActive: defaultIsActive,
    },
  };

  const boundAction = updateUserAndMaybeResetPasswordAction.bind(null, userId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  async function copyPassword() {
    const pwd = state.passwordReset?.password;
    if (!pwd) return;
    await navigator.clipboard.writeText(pwd);
  }

  return (
    <div className="space-y-6 text-black">
      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Se password resettata, mostriamo box con copia */}
      {state.passwordReset && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-medium">Password aggiornata</div>
              <div className="mt-2 text-sm">
                <span className="font-semibold">Nuova password:</span>{" "}
                {state.passwordReset.password}
              </div>
              <div className="mt-2 text-xs">
                Copiala ora: non verrà mostrata dopo refresh.
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={copyPassword}
                className="rounded-md bg-black px-3 py-2 text-sm text-white"
              >
                Copia password
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

      {/* Un solo form: salva dati + (opzionale) password */}
      {!state.passwordReset && (
        <form action={formAction} className="space-y-6">
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

          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold">Reset password (opzionale)</h2>
            <p className="mt-1 text-sm">
              Compila solo se vuoi impostare una nuova password.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nuova password</label>
                <input
                  name="password"
                  type="password"
                  className="mt-1 w-full rounded-md border px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Conferma password</label>
                <input
                  name="passwordConfirm"
                  type="password"
                  className="mt-1 w-full rounded-md border px-3 py-2"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-black px-4 py-2 text-white text-sm disabled:opacity-60"
          >
            {pending ? "Salvataggio..." : "Salva"}
          </button>
        </form>
      )}
    </div>
  );
}