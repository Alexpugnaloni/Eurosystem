// app/admin/users/[id]/edit/EditUserForm.tsx
"use client";

import { useActionState } from "react";
import { updateUserAndMaybeResetPasswordAction, type EditUserAllState } from "./actions";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

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
    <div className="space-y-6">
      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {state.passwordReset ? (
        <Card className="border-emerald-200 bg-emerald-50 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-sm font-semibold">Password aggiornata</div>
              <div className="mt-2 text-sm">
                <span className="font-semibold">Nuova password:</span> {state.passwordReset.password}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Copiala ora: non verrà mostrata dopo refresh.
              </div>
            </div>

            <div className="flex gap-2 sm:flex-col">
              <Button type="button" onClick={copyPassword}>
                Copia password
              </Button>

              <Button asChild variant="outline">
                <Link href="/admin/users">Torna alla lista</Link>
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <form action={formAction} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome</Label>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={state.values?.firstName ?? ""}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Cognome</Label>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={state.values?.lastName ?? ""}
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
              className="h-4 w-4 rounded border border-input"
            />
            <Label htmlFor="isActive" className="font-normal">
              Attivo
            </Label>
          </div>

          <div className="rounded-md border p-4">
            <div className="text-sm font-semibold">Reset password (opzionale)</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Compila solo se vuoi impostare una nuova password.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Nuova password</Label>
                <Input id="password" name="password" type="password" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">Conferma password</Label>
                <Input id="passwordConfirm" name="passwordConfirm" type="password" />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? "Salvataggio..." : "Salva"}
          </Button>
        </form>
      )}
    </div>
  );
}