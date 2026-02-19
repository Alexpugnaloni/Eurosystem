// app/login/LoginForm.tsx
"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label className="text-sm font-medium">Username</label>
        <input
          name="username"
          className="mt-1 w-full rounded-md border px-3 py-2"
          autoComplete="username"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium">Password</label>
        <input
          name="password"
          type="password"
          className="mt-1 w-full rounded-md border px-3 py-2"
          autoComplete="current-password"
          required
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
      >
        {pending ? "Accesso..." : "Entra"}
      </button>
    </form>
  );
}
