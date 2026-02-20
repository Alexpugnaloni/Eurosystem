// app/admin/customers/new/page.tsx
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import CreateCustomerForm from "./CreateCustomerForm";

export default async function NewCustomerPage() {
  const me = await requireUser();
  if (me.role !== "ADMIN") redirect("/worker");

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-black">Nuova azienda</h1>
        <p className="mt-1 text-sm text-black">
          Crea un&apos;azienda cliente. L&apos;azienda interna è unica ed è gestita automaticamente.
        </p>
      </div>

      <CreateCustomerForm />
    </div>
  );
}