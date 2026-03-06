// app/admin/phases/[id]/edit/page.tsx
import { db } from "@/db";
import { customers, phases } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import EditPhaseForm from "./EditPhaseForm";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function EditPhasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireUser();
  if (me.role !== "ADMIN") redirect("/worker");

  const { id } = await params;

  let phaseId: bigint;
  try {
    phaseId = BigInt(id);
  } catch {
    notFound();
  }

  const rows = await db
    .select({
      phaseId: phases.id,
      customerId: phases.customerId,
      name: phases.name,
      sortOrder: phases.sortOrder,
      isFinal: phases.isFinal,
      isActive: phases.isActive,

      customerName: customers.name,
      customerIsActive: customers.isActive,
      customerIsInternal: customers.isInternal,
    })
    .from(phases)
    .innerJoin(customers, eq(phases.customerId, customers.id))
    .where(eq(phases.id, phaseId))
    .limit(1);

  if (rows.length === 0) notFound();

  const r = rows[0];

  // customer deve essere attivo (coerente con regole)
  if (!r.customerIsActive) redirect("/admin/phases");

  const phase = {
    id: r.phaseId.toString(),
    customerId: r.customerId.toString(),
    customerName: r.customerName,
    customerIsInternal: r.customerIsInternal,
    name: r.name,
    sortOrder: r.sortOrder,
    isFinal: r.isFinal,
    isActive: r.isActive,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Modifica fase</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Azienda: <span className="font-medium text-foreground">{phase.customerName}</span>{" "}
            {phase.customerIsInternal ? <Badge variant="secondary">Interna</Badge> : null}
          </p>
        </div>

        <Button asChild variant="outline">
          <Link href="/admin/phases">Torna alla lista</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dettagli</CardTitle>
        </CardHeader>
        <CardContent>
          <EditPhaseForm phase={phase} />
        </CardContent>
      </Card>
    </div>
  );
}