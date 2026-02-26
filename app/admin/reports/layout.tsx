// app/admin/reports/layout.tsx
import TabsNav from "./tabs-nav";

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-black">Report</h1>
        <p className="text-sm text-gray-600">
          Statistiche su ore, produzione e disponibilità consegne.
        </p>
      </div>

      <TabsNav />

      <div>{children}</div>
    </div>
  );
}