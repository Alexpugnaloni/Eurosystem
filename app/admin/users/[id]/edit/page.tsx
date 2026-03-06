// app/admin/users/[id]/edit/page.tsx
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import EditUserForm from "./EditUserForm";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me.role !== "ADMIN") redirect("/worker");

  const { id } = await params;
  if (!/^\d+$/.test(id)) redirect("/admin/users");
  const userId = BigInt(id);

  const rows = await db
    .select({
      id: users.id,
      employeeCode: users.employeeCode,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      isActive: users.isActive,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const u = rows[0];
  if (!u) redirect("/admin/users");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Modifica utente</h1>
          <p className="text-sm text-muted-foreground">Aggiorna dati e (se serve) resetta password.</p>
        </div>

        <Button asChild variant="outline">
          <Link href="/admin/users">Torna alla lista</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dettagli</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            <div>
              <span className="font-semibold">Employee code:</span> {u.employeeCode}
            </div>
            <div>
              <span className="font-semibold">Username:</span> {u.username}
            </div>
          </div>

          <EditUserForm
            userId={String(u.id)}
            defaultFirstName={u.firstName}
            defaultLastName={u.lastName}
            defaultIsActive={u.isActive}
          />
        </CardContent>
      </Card>
    </div>
  );
}