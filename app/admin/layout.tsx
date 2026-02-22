// app/admin/layout.tsx
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/worker");

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="flex items-center justify-between border-b bg-white px-8 py-4">
        <div>
          <div className="text-xl font-semibold text-black">
            Admin
          </div>
          <div className="text-sm text-black">
            {user.firstName} {user.lastName} ({user.username})
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="rounded-md border px-3 py-2 text-sm text-black hover:bg-gray-100"
          >
            Utenti
          </Link>

          <Link
            href="/admin/customers"
            className="rounded-md border px-3 py-2 text-sm text-black hover:bg-gray-100"
          >
            Aziende
          </Link>

          <Link
            href="/admin/models"
            className="rounded-md border px-3 py-2 text-sm text-black hover:bg-gray-100"
          >
            Modelli
          </Link>

          <Link
            href="/admin/phases"
            className="rounded-md border border-gray-300 px-3 py-1 text-sm text-black hover:bg-gray-100"
          >
            Fasi
          </Link>
          
          <LogoutButton />
        </div>
        
      </header>

      <main className="p-8">{children}</main>
    </div>
  );
}


