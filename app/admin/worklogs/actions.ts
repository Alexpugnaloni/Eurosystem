// app/admin/worklogs/actions.ts
"use server";

import { db } from "@/db";
import { workLogs } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type DeleteWorkLogAdminState = {
  ok: boolean;
  message: string | null;
};

function parseBigint(v: FormDataEntryValue | null) {
  if (!v) return null;
  const s = String(v).trim();
  if (!s) return null;
  try {
    return BigInt(s);
  } catch {
    return null;
  }
}

export async function deleteWorkLogAdminAction(
  prev: DeleteWorkLogAdminState,
  formData: FormData
): Promise<DeleteWorkLogAdminState> {
  await requireAdmin();

  const id = parseBigint(formData.get("id"));
  if (!id) return { ok: false, message: "ID non valido." };

  await db.delete(workLogs).where(eq(workLogs.id, id));

  // Aggiorna UI e report
  revalidatePath("/admin/worklogs");
  revalidatePath("/admin");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/reports/ore");
  revalidatePath("/admin/reports/produzione");
  revalidatePath("/admin/reports/consegne");
  revalidatePath("/worker/logs");

  return { ok: true, message: "Attività eliminata." };
}