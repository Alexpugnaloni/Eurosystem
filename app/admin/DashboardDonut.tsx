"use client";

type Slice = {
  label: string;
  value: number; // minutes
  percent: number; // 0..100
  isInternal?: boolean;
};

function fmtPercent(p: number) {
  // 1 decimale se serve
  const rounded = Math.round(p * 10) / 10;
  return `${rounded}%`;
}

function fmtMinutes(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

const palette = [
  "#111827", // quasi nero
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

  // se per arrotondamenti non arriva a 100:
  if (acc < 100) {
    parts.push(`#E5E7EB ${acc}% 100%`);
  }

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
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-black">{title}</h2>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        {/* Donut */}
        <div className="flex items-center justify-center">
          <div
            className="relative h-56 w-56 rounded-full border"
            style={{ background: gradient }}
            aria-label="Distribuzione ore per azienda"
          >
            {/* foro centrale */}
            <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border" />
            {/* testo centro */}
            <div className="absolute left-1/2 top-1/2 w-32 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-xs text-gray-600">Totale</div>
              <div className="text-lg font-semibold text-black">
                {fmtMinutes(total)}
              </div>
            </div>
          </div>
        </div>

        {/* Legenda */}
        <div className="flex-1">
          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr className="text-gray-700">
                  <th className="px-4 py-3">Azienda</th>
                  <th className="px-4 py-3">%</th>
                  <th className="px-4 py-3">Ore</th>
                </tr>
              </thead>
              <tbody>
                {topSlices.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-gray-600" colSpan={3}>
                      Nessun dato nel periodo selezionato.
                    </td>
                  </tr>
                ) : (
                  topSlices.map((s, i) => (
                    <tr key={s.label} className="border-t">
                      <td className="px-4 py-3 text-black">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-sm border"
                            style={{ background: palette[i % palette.length] }}
                          />
                          <span className="font-medium">{s.label}</span>
                          {s.isInternal ? (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                              Interna
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-black">{fmtPercent(s.percent)}</td>
                      <td className="px-4 py-3 text-black">{fmtMinutes(s.value)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-gray-600">
            Nota: include Produzione + Pulizie (anche pulizie “interne” se esiste azienda interna).
          </p>
        </div>
      </div>
    </section>
  );
}