// app/admin/users/[id]/edit/page.tsx
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import EditUserForm from "./EditUserForm";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-black">Modifica utente</h1>
        <Link href="/admin/users" className="text-sm text-black underline">
          Torna alla lista
        </Link>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <div className="mb-4 text-sm text-black">
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
      </div>
    </div>
  );
}




