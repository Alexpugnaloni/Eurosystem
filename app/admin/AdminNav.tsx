// app/admin/AdminNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string };

const items: Item[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Utenti" },
  { href: "/admin/worklogs", label: "Schede dipendenti" },
  { href: "/admin/customers", label: "Aziende" },
  { href: "/admin/models", label: "Modelli" },
  { href: "/admin/phases", label: "Fasi" },
  { href: "/admin/reports", label: "Report" },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1">
      {items.map((it) => {
        const active = isActive(pathname, it.href);

        return (
          <Button
            key={it.href}
            asChild
            variant={active ? "default" : "ghost"}
            size="sm"
            className={cn(
              "h-9",
              active
                ? "shadow-sm"
                : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <Link href={it.href}>{it.label}</Link>
          </Button>
        );
      })}
    </nav>
  );
}