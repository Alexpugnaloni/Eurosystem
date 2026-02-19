// app/admin/page.tsx
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";


export default async function AdminPage() {
  const user = await requireUser();

  if (user.role !== "ADMIN") {
    redirect("/worker");
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <p className="mt-2 text-zinc-600">
        Ciao {user.firstName} {user.lastName} ({user.username})
      </p>

      <div className="mt-6 rounded-lg border bg-white p-4">
        <p className="text-sm text-zinc-600">
          Da qui poi mettiamo gestione: aziende, modelli, fasi, consegne, utenti,
          statistiche.
        </p>
      </div>

      <div className="mt-6">
        <LogoutButton />
      </div>
      
     </div>
    
    
  );
}
