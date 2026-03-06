// app/admin/phases/PhasesClient.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerId">Azienda</Label>
              <select
                id="customerId"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="h-10 w-72 rounded-md border border-input bg-background px-3 text-sm"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.isInternal ? " (Interna)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Cerca</Label>
              <Input
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome fase..."
                className="w-72"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Elenco fasi</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Ordine</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-28">Finale</TableHead>
                  <TableHead className="w-28">Attiva</TableHead>
                  <TableHead className="w-28 text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      Nessuna fase trovata.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.sortOrder}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>
                        <Badge variant={p.isFinal ? "default" : "outline"}>
                          {p.isFinal ? "Sì" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.isActive ? "secondary" : "outline"}>
                          {p.isActive ? "Sì" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/phases/${p.id}/edit`}>Modifica</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}