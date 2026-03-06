// app/admin/DashboardDonut.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Slice = {
  label: string;
  value: number; // minutes
  percent: number; // 0..100
  isInternal?: boolean;
};

function fmtPercent(p: number) {
  const rounded = Math.round(p * 10) / 10;
  return `${rounded}%`;
}

function fmtMinutes(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

// palette sobria (puoi cambiarla dopo)
const palette = [
  "#111827",
  "#374151",
  "#6B7280",
  "#9CA3AF",
  "#D1D5DB",
  "#4B5563",
  "#1F2937",
  "#52525B",
];

function buildConicGradient(slices: Slice[]) {
  let acc = 0;
  const parts: string[] = [];

  slices.forEach((s, i) => {
    const start = acc;
    const end = acc + s.percent;
    const color = palette[i % palette.length];
    parts.push(`${color} ${start}% ${end}%`);
    acc = end;
  });

  if (acc < 100) parts.push(`#E5E7EB ${acc}% 100%`);
  return `conic-gradient(${parts.join(", ")})`;
}

export default function DashboardDonut({
  title,
  subtitle,
  slices,
}: {
  title: string;
  subtitle: string;
  slices: Slice[];
}) {
  const total = slices.reduce((a, s) => a + s.value, 0);

  const topSlices = slices
    .filter((s) => s.percent > 0)
    .sort((a, b) => b.value - a.value);

  const gradient = buildConicGradient(topSlices);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          {/* Donut */}
          <div className="flex items-center justify-center">
            <div
              className="relative h-56 w-56 rounded-full border"
              style={{ background: gradient }}
              aria-label="Distribuzione ore per azienda"
            >
              {/* foro centrale */}
              <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background border" />

              {/* testo centro */}
              <div className="absolute left-1/2 top-1/2 w-32 -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-xs text-muted-foreground">Totale</div>
                <div className="text-lg font-semibold">{fmtMinutes(total)}</div>
              </div>
            </div>
          </div>

          {/* Legenda */}
          <div className="flex-1">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Azienda</TableHead>
                    <TableHead className="w-[90px]">%</TableHead>
                    <TableHead className="w-[120px]">Ore</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {topSlices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-muted-foreground">
                        Nessun dato nel periodo selezionato.
                      </TableCell>
                    </TableRow>
                  ) : (
                    topSlices.map((s, i) => (
                      <TableRow key={s.label}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className="h-3 w-3 rounded-sm border"
                              style={{ background: palette[i % palette.length] }}
                            />
                            <span className="font-medium">{s.label}</span>
                            {s.isInternal ? <Badge variant="secondary">Interna</Badge> : null}
                          </div>
                        </TableCell>
                        <TableCell>{fmtPercent(s.percent)}</TableCell>
                        <TableCell>{fmtMinutes(s.value)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Nota: include Produzione + Pulizie (anche pulizie “interne” se esiste azienda interna).
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}