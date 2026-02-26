"use client";

// app/admin/reports/tabs-nav.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";

function TabLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "rounded-md border px-3 py-2 text-sm",
        active ? "bg-black text-white border-black" : "bg-white text-black hover:bg-gray-100",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default function TabsNav() {
  const pathname = usePathname();

  const isOre = pathname.startsWith("/admin/reports/ore");
  const isProd = pathname.startsWith("/admin/reports/produzione");
  const isCons = pathname.startsWith("/admin/reports/consegne");

  return (
    <div className="flex gap-2">
      <TabLink href="/admin/reports/ore" label="Ore" active={isOre} />
      <TabLink href="/admin/reports/produzione" label="Produzione" active={isProd} />
      <TabLink href="/admin/reports/consegne" label="Consegne" active={isCons} />
    </div>
  );
}