// app/admin/customers/new/page.tsx
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import Link from "next/link";
import CreateCustomerForm from "./CreateCustomerForm";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function NewCustomerPage() {
  const me = await requireUser();
  if (me.role !== "ADMIN") redirect("/worker");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nuova azienda</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea un&apos;azienda cliente. L&apos;azienda interna è unica ed è gestita automaticamente.
          </p>
        </div>

        <Button asChild variant="outline">
          <Link href="/admin/customers">Torna alla lista</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dati azienda</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateCustomerForm />
        </CardContent>
      </Card>
    </div>
  );
}