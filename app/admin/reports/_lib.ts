// app/admin/reports/_lib.ts
export function isoToday() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function fmtMinutes(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function isoToIT(iso: string) {
  // iso: YYYY-MM-DD -> DD-MM-YYYY
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}-${m}-${y}`;
}

export function mondayOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day; // monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function fridayOfWeek(date: Date) {
  const mon = mondayOfWeek(date);
  const fri = new Date(mon);
  fri.setDate(mon.getDate() + 4);
  fri.setHours(0, 0, 0, 0);
  return fri;
}

export function dateToISO(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function previousMonthRange(base: Date) {
  const firstOfThis = new Date(base.getFullYear(), base.getMonth(), 1);
  const lastOfPrev = new Date(firstOfThis);
  lastOfPrev.setDate(0); // last day previous month

  const firstOfPrev = new Date(lastOfPrev.getFullYear(), lastOfPrev.getMonth(), 1);

  return {
    from: dateToISO(firstOfPrev),
    to: dateToISO(lastOfPrev),
  };
}

/**
 * Settimana corrente Lun->Ven,
 * ma "to" è min(oggi, venerdì). Se oggi è sab/dom -> venerdì.
 */
export function currentWorkWeekRange(base: Date) {
  const mon = mondayOfWeek(base);
  const fri = fridayOfWeek(base);

  const end = new Date(base);
  end.setHours(0, 0, 0, 0);

  const toDate = end.getTime() > fri.getTime() ? fri : end;

  return {
    from: dateToISO(mon),
    to: dateToISO(toDate),
  };
}