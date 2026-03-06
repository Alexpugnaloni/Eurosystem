"use client";

import Link from "next/link";
import { useActionState, useTransition } from "react";
import { deleteWorkLogAdminAction, type DeleteWorkLogAdminState } from "./actions";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Row = {
  id: bigint;
  workDate: string;
  activityType: "PRODUCTION" | "CLEANING";
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number;

  qtyOk: number;
  qtyKo: number;
  notes: string | null;

  userId: bigint;
  firstName: string;
  lastName: string;
  employeeCode: string;

  customerName: string;
  modelName: string | null;
  phaseName: string | null;
};

type Day = { workDate: string; rows: Row[] };

function fmtMin(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function formatIT(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("it-IT");
}

export default function AdminWorkLogsClient({ days }: { days: Day[] }) {
  const [pending, startTransition] = useTransition();

  const initialState: DeleteWorkLogAdminState = { ok: false, message: null };
  const [state, formAction] = useActionState(deleteWorkLogAdminAction, initialState);

  function onDelete(id: bigint) {
    const ok = confirm("Vuoi eliminare questa attività?");
    if (!ok) return;

    const fd = new FormData();
    fd.set("id", String(id));

    startTransition(() => formAction(fd));
  }

  return (
    <div className="space-y-4">
      {state.message && (
        <Card>
          <CardContent className="py-3 text-sm">
            {state.message}
          </CardContent>
        </Card>
      )}

      {days.length === 0 && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Nessuna attività trovata.
          </CardContent>
        </Card>
      )}

      {days.map((d) => {
        const totalDay = d.rows.reduce((sum, r) => sum + (r.durationMinutes ?? 0), 0);

        const prodDay = d.rows
          .filter((r) => r.activityType === "PRODUCTION")
          .reduce((sum, r) => sum + (r.durationMinutes ?? 0), 0);

        const cleanDay = totalDay - prodDay;

        return (
          <Card key={d.workDate}>
            <CardHeader className="pb-3">
              <CardTitle className="flex flex-wrap items-center gap-3 text-base">
                <span>{formatIT(d.workDate)}</span>

                <Badge variant="secondary">
                  Totale {fmtMin(totalDay)}
                </Badge>

                <Badge variant="outline">
                  Prod {fmtMin(prodDay)}
                </Badge>

                <Badge variant="outline">
                  Pul {fmtMin(cleanDay)}
                </Badge>

                <span className="ml-auto text-sm text-muted-foreground">
                  Attività: {d.rows.length}
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left">
                  <tr className="text-muted-foreground">
                    <th className="py-2 pr-4">Dipendente</th>
                    <th className="py-2 pr-4">Azienda</th>
                    <th className="py-2 pr-4">Tipo</th>
                    <th className="py-2 pr-4">Modello</th>
                    <th className="py-2 pr-4">Fase</th>
                    <th className="py-2 pr-4">Inizio</th>
                    <th className="py-2 pr-4">Fine</th>
                    <th className="py-2 pr-4">Durata</th>
                    <th className="py-2 pr-4">OK</th>
                    <th className="py-2 pr-4">KO</th>
                    <th className="py-2 pr-4">Note</th>
                    <th className="py-2 text-right">Azioni</th>
                  </tr>
                </thead>

                <tbody>
                  {d.rows.map((r) => (
                    <tr key={String(r.id)} className="border-b">
                      <td className="py-2 pr-4">
                        {r.lastName} {r.firstName} ({r.employeeCode})
                      </td>

                      <td className="py-2 pr-4">{r.customerName}</td>

                      <td className="py-2 pr-4">
                        {r.activityType === "PRODUCTION" ? "Produzione" : "Pulizie"}
                      </td>

                      <td className="py-2 pr-4">{r.modelName ?? "—"}</td>

                      <td className="py-2 pr-4">{r.phaseName ?? "—"}</td>

                      <td className="py-2 pr-4">
                        {String(r.startTime ?? "").slice(0, 5)}
                      </td>

                      <td className="py-2 pr-4">
                        {String(r.endTime ?? "").slice(0, 5)}
                      </td>

                      <td className="py-2 pr-4">{r.durationMinutes}m</td>

                      <td className="py-2 pr-4">
                        {r.activityType === "PRODUCTION" ? r.qtyOk : "—"}
                      </td>

                      <td className="py-2 pr-4">
                        {r.activityType === "PRODUCTION" ? r.qtyKo : "—"}
                      </td>

                      <td className="py-2 pr-4 max-w-xs truncate">
                        {r.notes ?? ""}
                      </td>

                      <td className="py-2 text-right space-x-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/worklogs/${String(r.id)}/edit`}>
                            Modifica
                          </Link>
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={pending}
                          onClick={() => onDelete(r.id)}
                        >
                          Elimina
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}