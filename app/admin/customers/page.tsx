// app/admin/customers/page.tsx
import { redirect } from "next/navigation";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { desc } from "drizzle-orm";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminCustomersPage() {
  const me = await requireUser();
  if (me.role !== "ADMIN") redirect("/worker");

  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      isInternal: customers.isInternal,
      isActive: customers.isActive,
      createdAt: customers.createdAt,
    })
    .from(customers)
    .orderBy(desc(customers.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Aziende</h1>
          <p className="text-sm text-muted-foreground">Gestisci aziende clienti e azienda interna.</p>
        </div>

        <Button asChild>
          <Link href="/admin/customers/new">Nuova azienda</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Elenco aziende</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-[100px]">Attiva</TableHead>
                  <TableHead className="w-[110px] text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground">
                      Nessuna azienda presente.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((c) => (
                    <TableRow key={String(c.id)}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{c.name}</span>
                          {c.isInternal ? <Badge variant="secondary">Interna</Badge> : null}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant={c.isActive ? "secondary" : "outline"}>
                          {c.isActive ? "Sì" : "No"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/customers/${c.id}/edit`}>Modifica</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Nota: l&apos;azienda interna è unica ed è gestita dal seed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}