// app/admin/models/ModelsListClient.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type ModelItem = {
  id: string;
  name: string;
  code: string | null;
  isActive: boolean;
};

type Group = {
  customer: { id: string; name: string; isInternal: boolean };
  items: ModelItem[];
};

function countLabel(n: number) {
  return n === 1 ? "1 modello" : `${n} modelli`;
}

export default function ModelsListClient({ groups }: { groups: Group[] }) {
  const [q, setQ] = useState("");

  const normalizedQ = q.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!normalizedQ) return groups;

    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((m) => {
            const nameMatch = m.name.toLowerCase().includes(normalizedQ);
            const codeMatch = (m.code ?? "").toLowerCase().includes(normalizedQ);
            return nameMatch || codeMatch;
        }),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, normalizedQ]);

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-white p-4">
        <label className="block text-sm font-medium text-black">Cerca modello</label>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca per nome o codice (es. PA-001)..."
          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black"
        />
        {normalizedQ && (
          <p className="mt-2 text-sm text-gray-600">
            Risultati: {filteredGroups.reduce((acc, g) => acc + g.items.length, 0)}
          </p>
        )}
      </div>

      {filteredGroups.length === 0 ? (
        <div className="rounded-md border bg-white p-6 text-sm text-gray-600">
          Nessun modello trovato.
        </div>
      ) : (
        filteredGroups.map((g) => {
          // ✅ se stai cercando, apriamo automaticamente i gruppi che hanno match
          const openByDefault = !!normalizedQ;

          return (
            <details
              key={g.customer.id}
              className="overflow-hidden rounded-md border bg-white"
              open={openByDefault}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="text-base font-semibold text-black">{g.customer.name}</div>

                  {g.customer.isInternal && (
                    <span className="rounded-full bg-black px-2 py-0.5 text-xs text-white">
                      Interna
                    </span>
                  )}

                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-black">
                    {countLabel(g.items.length)}
                  </span>
                </div>

                <span className="text-sm text-gray-600">Apri/chiudi</span>
              </summary>

              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed text-sm">
                  <thead className="bg-white text-left text-black">
                    <tr>
                      <th className="w-[50%] px-4 py-2">Nome</th>
                      <th className="w-[25%] px-4 py-2">Codice</th>
                      <th className="w-[15%] px-4 py-2">Attivo</th>
                      <th className="w-[10%] px-4 py-2 text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.items.map((m) => (
                      <tr key={m.id} className="border-t">
                        <td className="px-4 py-2 text-black">
                          <span className={!m.isActive ? "text-gray-400" : ""}>
                            {m.name}
                          </span>
                        </td>

                        <td className="px-4 py-2 text-black">
                          <span className={!m.isActive ? "text-gray-400" : ""}>
                            {m.code ?? "-"}
                          </span>
                        </td>

                        <td className="px-4 py-2 text-black">
                          {m.isActive ? "Sì" : <span className="text-gray-500">No</span>}
                        </td>

                        <td className="px-4 py-2 text-right">
                          <Link
                            href={`/admin/models/${m.id}/edit`}
                            className="text-blue-600 hover:underline"
                          >
                            Modifica
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          );
        })
      )}
    </div>
  );
}