"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };

const items: Item[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Utenti" },
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
    <nav className="flex flex-wrap items-center gap-2">
      {items.map((it) => {
        const active = isActive(pathname, it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={[
              "rounded-md border px-3 py-2 text-sm transition",
              active
                ? "bg-black text-white border-black"
                : "bg-white text-black hover:bg-gray-100 border-gray-300",
            ].join(" ")}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}