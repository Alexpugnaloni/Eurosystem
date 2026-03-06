// app/admin/users/new/page.tsx
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import Link from "next/link";
import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";
import CreateUserForm from "./CreateUserForm";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function suggestNextOpCode(last?: string | null) {
  const m = last?.match(/^OP(\d+)$/i);
  const n = m ? parseInt(m[1], 10) : 0;
  const next = n + 1;
  return `OP${String(next).padStart(3, "0")}`;
}

export default async function NewUserPage() {
  const me = await requireUser();
  if (me.role !== "ADMIN") redirect("/worker");

  const last = await db
    .select({ employeeCode: users.employeeCode })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(50);

  const lastOp = last.map((r) => r.employeeCode).find((c) => /^OP\d+$/i.test(c)) ?? null;
  const suggestedEmployeeCode = suggestNextOpCode(lastOp);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Crea utente</h1>
          <p className="text-sm text-muted-foreground">Inserisci i dati e genera le credenziali.</p>
        </div>

        <Button asChild variant="outline">
          <Link href="/admin/users">Torna alla lista</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nuovo utente</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateUserForm suggestedEmployeeCode={suggestedEmployeeCode} />
        </CardContent>
      </Card>
    </div>
  );
}