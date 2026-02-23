// app/worker/layout.tsx
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  if (user.role !== "WORKER") redirect("/admin");

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="flex items-center justify-between border-b bg-white px-8 py-4">
        <div>
          <div className="text-xl font-semibold text-black">Worker</div>
          <div className="text-sm text-black">
            {user.firstName} {user.lastName} ({user.username})
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/worker/logs"
            className="rounded-md border px-3 py-2 text-sm text-black hover:bg-gray-100"
          >
            Lavorazioni
          </Link>

          <LogoutButton />
        </div>
      </header>

      <main className="p-8">{children}</main>
    </div>
  );
}