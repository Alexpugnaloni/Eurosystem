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
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-lg font-semibold text-black">
              Eurosystem
            </div>
            <div className="text-sm text-zinc-600">
              {user.firstName} {user.lastName} ({user.username})
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/worker/logs"
              className="rounded-md border px-3 py-2 text-sm text-black hover:bg-zinc-100"
            >
              Lavorazioni
            </Link>

            <LogoutButton />
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="mx-auto max-w-7xl p-6">
        {children}
      </main>
    </div>
  );
}