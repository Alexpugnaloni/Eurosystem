"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {state.error}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="username">
          Username
        </Label>

        <Input
          id="username"
          name="username"
          autoComplete="username"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          Password
        </Label>

        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={pending}
      >
        {pending ? "Accesso..." : "Entra"}
      </Button>

    </form>
  );
}