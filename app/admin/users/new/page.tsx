// app/admin/users/new/page.tsx
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import Link from "next/link";
import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";
import CreateUserForm from "./CreateUserForm";

function suggestNextOpCode(last?: string | null) {
  // last es: "OP001"
  const m = last?.match(/^OP(\d+)$/i);
  const n = m ? parseInt(m[1], 10) : 0;
  const next = n + 1;
  return `OP${String(next).padStart(3, "0")}`;
}

export default async function NewUserPage() {
  const me = await requireUser();
  if (me.role !== "ADMIN") redirect("/worker");

  // Prendiamo l'ultimo OPxxx creato (ordinando per createdAt è ok)
  const last = await db
    .select({ employeeCode: users.employeeCode })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(50);

  const lastOp = last.map(r => r.employeeCode).find(c => /^OP\d+$/i.test(c)) ?? null;
  const suggestedEmployeeCode = suggestNextOpCode(lastOp);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-black">Crea utente</h1>
        <Link href="/admin/users" className="text-sm text-black underline">
          Torna alla lista
        </Link>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <CreateUserForm suggestedEmployeeCode={suggestedEmployeeCode} />
      </div>
    </div>
  );
}
