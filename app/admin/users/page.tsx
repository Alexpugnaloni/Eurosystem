// app/admin/users/page.tsx
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { desc } from "drizzle-orm";
import Link from "next/link";

export default async function AdminUsersPage() {
  const me = await requireUser();
  if (me.role !== "ADMIN") redirect("/worker");

  const rows = await db
    .select({
      id: users.id,
      employeeCode: users.employeeCode,
      firstName: users.firstName,
      lastName: users.lastName,
      username: users.username,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-black">Utenti</h1>

        <Link
          href="/admin/users/new"
          className="rounded-md bg-black px-4 py-2 text-white text-sm"
        >
          Nuovo utente
        </Link>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm text-black">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Codice</th>
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left">Cognome</th>
              <th className="p-3 text-left">Username</th>
              <th className="p-3 text-left">Ruolo</th>
              <th className="p-3 text-left">Attivo</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((u) => (
              <tr key={String(u.id)} className="border-t hover:bg-gray-50">
                <td className="p-3">{u.employeeCode}</td>
                <td className="p-3">{u.firstName}</td>
                <td className="p-3">{u.lastName}</td>
                <td className="p-3">{u.username}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">{u.isActive ? "Sì" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
