// app/admin/models/new/page.tsx
import { db } from "@/db";
import { customers } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import CreateModelForm from "./CreateModelForm";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function NewModelPage() {
  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      isInternal: customers.isInternal,
    })
    .from(customers)
    .where(eq(customers.isActive, true))
    .orderBy(asc(customers.name));

  // ✅ converto bigint -> string per il componente client
  const activeCustomers = rows.map((c) => ({
    ...c,
    id: c.id.toString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nuovo modello</h1>
          <p className="text-sm text-muted-foreground">
            Crea un prodotto/modello e associalo a un’azienda.
          </p>
        </div>

        <Button asChild variant="outline">
          <Link href="/admin/models">Torna alla lista</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dati modello</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateModelForm customers={activeCustomers} />
        </CardContent>
      </Card>
    </div>
  );
}