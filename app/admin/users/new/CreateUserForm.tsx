// app/admin/users/new/CreateUserForm.tsx
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createUserAction, type CreateUserState } from "./actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

const initialState: CreateUserState = {};

export default function CreateUserForm({ suggestedEmployeeCode }: { suggestedEmployeeCode: string }) {
  const [state, formAction, pending] = useActionState(createUserAction, initialState);

  async function copyCredentials() {
    if (!state.created) return;
    const text = `Username: ${state.created.username}\nPassword: ${state.created.password}`;
    await navigator.clipboard.writeText(text);
  }

  const created = state.created;

  return (
    <div className="space-y-6">
      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {created ? (
        <Card className="border-emerald-200 bg-emerald-50 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-sm font-semibold">Utente creato</div>
              <p className="mt-2 text-sm">
                <span className="font-semibold">Username:</span> {created.username}
                <br />
                <span className="font-semibold">Password:</span> {created.password}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Copia ora le credenziali: non saranno più visibili dopo refresh.
              </p>
            </div>

            <div className="flex gap-2 sm:flex-col">
              <Button type="button" onClick={copyCredentials}>
                Copia
              </Button>

              <Button asChild variant="outline">
                <Link href="/admin/users">Torna alla lista</Link>
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <form action={formAction} className="space-y-5">
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

          <div className="space-y-2">
            <Label htmlFor="employeeCode">Employee code</Label>
            <Input
              id="employeeCode"
              name="employeeCode"
              defaultValue={state.values?.employeeCode ?? suggestedEmployeeCode}
              readOnly
            />
            <p className="text-xs text-muted-foreground">Generato automaticamente (OPxxx).</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              defaultValue={state.values?.username ?? ""}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">Conferma password</Label>
              <Input id="passwordConfirm" name="passwordConfirm" type="password" required />
            </div>
          </div>

          {/* Role + Active (native select/checkbox ma stilizzati coerenti) */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="role">Ruolo</Label>
              <select
                id="role"
                name="role"
                defaultValue={state.values?.role ?? "WORKER"}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="WORKER">WORKER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-6">
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
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? "Creazione..." : "Crea utente"}
          </Button>
        </form>
      )}
    </div>
  );
}