import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AppNavbar() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* LOGO */}
        <Link href="/admin" className="flex items-center gap-3">
          <Image
            src="/logo/eurosystem.png"
            alt="Eurosystem"
            width={140}
            height={40}
            priority
          />
        </Link>

        {/* MENU */}
        <nav className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost">
            <Link href="/admin">Dashboard</Link>
          </Button>

          <Button asChild variant="ghost">
            <Link href="/admin/worklogs">Schede dipendenti</Link>
          </Button>

          <Button asChild variant="ghost">
            <Link href="/admin/customers">Aziende</Link>
          </Button>

          <Button asChild variant="ghost">
            <Link href="/admin/models">Modelli</Link>
          </Button>

          <Button asChild variant="ghost">
            <Link href="/admin/phases">Fasi</Link>
          </Button>

          <Button asChild variant="ghost">
            <Link href="/admin/reports">Report</Link>
          </Button>
        </nav>

        {/* LOGOUT */}
        <Button asChild variant="destructive">
          <Link href="/api/logout">Esci</Link>
        </Button>

      </div>
    </header>
  );
}