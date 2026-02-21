// app/admin/page.tsx
import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Link
        href="/admin/users"
        className="rounded-lg border bg-white p-5 shadow-sm transition hover:bg-zinc-50"
      >
        <div className="text-lg font-medium text-zinc-900">Utenti</div>
        <div className="mt-2 text-sm text-zinc-700">
          Crea e gestisci dipendenti
        </div>
      </Link>

      <Link
        href="/admin/models"
        className="block rounded-md border bg-white p-6 hover:bg-gray-50"
      >
        <div className="text-lg font-semibold text-black">Modelli</div>
        <div className="text-sm text-gray-600">Crea e gestisci prodotti/modelli</div>
      </Link>

      <div className="rounded-lg border bg-white p-5 text-sm text-zinc-700 shadow-sm">
        A breve: Aziende, Modelli, Fasi, Consegne, Statistiche…
      </div>
    </div>
  );
}
