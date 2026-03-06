// app/admin/models/ModelsListClient.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

  const totalResults = filteredGroups.reduce((acc, g) => acc + g.items.length, 0);

  return (
    <div className="space-y-4">
      {/* Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cerca modello</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-2">
            <Label htmlFor="q">Nome o codice</Label>
            <Input
              id="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cerca per nome o codice (es. PA-001)..."
            />
          </div>

          {normalizedQ ? (
            <p className="text-sm text-muted-foreground">Risultati: {totalResults}</p>
          ) : null}
        </CardContent>
      </Card>

      {/* Groups */}
      {filteredGroups.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Nessun modello trovato.
          </CardContent>
        </Card>
      ) : (
        filteredGroups.map((g) => {
          // se stai cercando, apriamo automaticamente i gruppi che hanno match
          const openByDefault = !!normalizedQ;

          return (
            <details
              key={g.customer.id}
              className="overflow-hidden rounded-xl border bg-card"
              open={openByDefault}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold">{g.customer.name}</div>

                  {g.customer.isInternal ? <Badge variant="secondary">Interna</Badge> : null}

                  <Badge variant="outline">{countLabel(g.items.length)}</Badge>
                </div>

                <span className="text-xs text-muted-foreground">Apri/chiudi</span>
              </summary>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50%]">Nome</TableHead>
                      <TableHead className="w-[25%]">Codice</TableHead>
                      <TableHead className="w-[15%]">Attivo</TableHead>
                      <TableHead className="w-[10%] text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {g.items.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className={!m.isActive ? "text-muted-foreground" : ""}>
                          {m.name}
                        </TableCell>

                        <TableCell className={!m.isActive ? "text-muted-foreground" : ""}>
                          {m.code ?? "-"}
                        </TableCell>

                        <TableCell>
                          <Badge variant={m.isActive ? "secondary" : "outline"}>
                            {m.isActive ? "Sì" : "No"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/models/${m.id}/edit`}>Modifica</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </details>
          );
        })
      )}
    </div>
  );
}