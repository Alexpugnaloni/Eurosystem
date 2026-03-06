// app/admin/layout.tsx
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";
import AdminNav from "./AdminNav";
import Image from "next/image";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/worker");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          {/* Left: Logo + title */}
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-3">
              <Image
                src="/logo/eurosystem.png"
                alt="Eurosystem"
                width={150}
                height={40}
                priority
                className="h-8 w-auto"
              />
            </Link>

            <div className="hidden md:block">
              <div className="text-sm font-semibold leading-none">Admin</div>
              <div className="text-xs text-muted-foreground">
                {user.firstName} {user.lastName} ({user.username})
              </div>
            </div>
          </div>

          {/* Right: Nav + Logout */}
          <div className="flex items-center gap-2">
            <AdminNav />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-8">{children}</main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 text-sm text-muted-foreground">
          <div>Eurosystem</div>
          <div>© {new Date().getFullYear()}</div>
        </div>
      </footer>
    </div>
  );
}