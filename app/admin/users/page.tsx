// app/admin/users/page.tsx
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { desc } from "drizzle-orm";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminUsersPage() {
  const me = await requireUser();
  if (me.role !== "ADMIN") redirect("/worker");

  const rows = await db
    .select({
      id: users.id,
      employeeCode: users.employeeCode,
      firstName: users.firstName,
      lastName: users.lastName,
      username: users.username,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Utenti</h1>
          <p className="text-sm text-muted-foreground">Gestisci dipendenti e amministratori.</p>
        </div>

        <Button asChild>
          <Link href="/admin/users/new">Nuovo utente</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Elenco utenti</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Codice</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cognome</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead className="w-[120px]">Ruolo</TableHead>
                  <TableHead className="w-[90px]">Attivo</TableHead>
                  <TableHead className="w-[110px] text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground">
                      Nessun utente trovato.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((u) => (
                    <TableRow key={String(u.id)}>
                      <TableCell className="font-medium">{u.employeeCode}</TableCell>
                      <TableCell>{u.firstName}</TableCell>
                      <TableCell>{u.lastName}</TableCell>
                      <TableCell>{u.username}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.isActive ? "secondary" : "outline"}>
                          {u.isActive ? "Sì" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/users/${u.id}/edit`}>Modifica</Link>
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