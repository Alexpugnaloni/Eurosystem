// app/admin/customers/[id]/edit/page.tsx
import { redirect, notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import EditCustomerForm from "./EditCustomerForm";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireUser();
  if (me.role !== "ADMIN") redirect("/worker");

  const { id } = await params;

  const row = await db
    .select({
      id: customers.id,
      name: customers.name,
      isInternal: customers.isInternal,
      isActive: customers.isActive,
    })
    .from(customers)
    .where(eq(customers.id, BigInt(id)))
    .limit(1);

  const c = row[0];
  if (!c) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Modifica azienda</h1>
          <p className="mt-1 text-sm text-muted-foreground">Aggiorna i dati dell&apos;azienda.</p>
        </div>

        <Button asChild variant="outline">
          <Link href="/admin/customers">Torna alla lista</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dettagli</CardTitle>
        </CardHeader>

        <CardContent>
          <EditCustomerForm
            customerId={id}
            isInternal={c.isInternal}
            initialValues={{
              name: c.name,
              isActive: c.isActive,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}