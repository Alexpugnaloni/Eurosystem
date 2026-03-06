// app/admin/phases/new/page.tsx
import { db } from "@/db";
import { customers } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import CreatePhaseForm from "./CreatePhaseForm";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function NewPhasePage() {
  const me = await requireUser();
  if (me.role !== "ADMIN") redirect("/worker");

  const rows = await db
    .select({ id: customers.id, name: customers.name, isInternal: customers.isInternal })
    .from(customers)
    .where(eq(customers.isActive, true))
    .orderBy(asc(customers.name));

  const options = rows.map((c) => ({
    id: c.id.toString(),
    name: c.name,
    isInternal: c.isInternal,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nuova fase</h1>
          <p className="text-sm text-muted-foreground">Crea una fase per una specifica azienda.</p>
        </div>

        <Button asChild variant="outline">
          <Link href="/admin/phases">Torna alla lista</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dati fase</CardTitle>
        </CardHeader>
        <CardContent>
          <CreatePhaseForm customers={options} />
        </CardContent>
      </Card>
    </div>
  );
}