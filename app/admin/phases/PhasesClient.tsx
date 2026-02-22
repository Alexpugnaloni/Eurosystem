"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type CustomerOption = {
  id: string;
  name: string;
  isInternal: boolean;
};

type PhaseItem = {
  id: string;
  customerId: string;
  name: string;
  sortOrder: number;
  isFinal: boolean;
  isActive: boolean;
};

export default function PhasesClient({
  customers,
  phases,
}: {
  customers: CustomerOption[];
  phases: PhaseItem[];
}) {
  const [customerId, setCustomerId] = useState<string>(customers[0]?.id ?? "");
  const [search, setSearch] = useState("");

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return phases
      .filter((p) => p.customerId === customerId)
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }, [phases, customerId, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-sm font-medium text-black">Azienda</label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-72 rounded-md border border-gray-300 px-3 py-2 text-sm text-black"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.isInternal ? " (Interna)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-black">Cerca</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome fase..."
            className="w-72 rounded-md border border-gray-300 px-3 py-2 text-sm text-black"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm text-black">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left w-24">Ordine</th>
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left w-24">Finale</th>
              <th className="p-3 text-left w-24">Attiva</th>
              <th className="p-3 text-left w-28">Azioni</th>
            </tr>
          </thead>

          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{p.sortOrder}</td>
                <td className="p-3">{p.name}</td>
                <td className="p-3">{p.isFinal ? "Sì" : "No"}</td>
                <td className="p-3">{p.isActive ? "Sì" : "No"}</td>
                <td className="p-3">
                  <Link href={`/admin/phases/${p.id}/edit`} className="underline">
                    Modifica
                  </Link>
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td className="p-3" colSpan={5}>
                  Nessuna fase trovata.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}