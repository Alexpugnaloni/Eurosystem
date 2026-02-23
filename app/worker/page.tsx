// app/worker/page.tsx
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export default async function WorkerPage() {
  const user = await requireUser();

  if (user.role !== "WORKER") {
    redirect("/admin");
  }

  redirect("/worker/logs");
}