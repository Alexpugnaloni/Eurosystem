// app/login/page.tsx
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  // Se già loggato, NON deve vedere la pagina login
  const user = await getSessionUser();
  if (user) {
    redirect(user.role === "ADMIN" ? "/admin" : "/worker");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
      <div className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Login</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Accedi per inserire la produzione.
        </p>

        <LoginForm />

        <div className="mt-4 text-xs text-zinc-500">
          Seed: admin/admin123 — mrossi/operaio123
        </div>
      </div>
    </div>
  );
}
