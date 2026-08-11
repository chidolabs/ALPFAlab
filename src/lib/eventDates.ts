const DAY_ORDER_TO_ISO_DATE: Record<number, string> = {
  1: "2026-08-08",
  2: "2026-08-09",
  3: "2026-08-10",
  4: "2026-08-11",
  5: "2026-08-12",
  6: "2026-08-13",
};

export function dayOrderToDate(dayOrder: number | null, timeStr: string | null): Date | null {
  if (dayOrder == null) return null;
  const iso = DAY_ORDER_TO_ISO_DATE[dayOrder];
  if (!iso || !timeStr) return null;
  const date = new Date(`${iso}T${timeStr}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

const ISO_DATE_TO_DAY_ORDER: Record<string, number> = Object.fromEntries(
  Object.entries(DAY_ORDER_TO_ISO_DATE).map(([order, iso]) => [iso, Number(order)])
);

export function getTodayDayOrder(): number | null {
  const todayIso = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  return ISO_DATE_TO_DAY_ORDER[todayIso] ?? null;
}

export function timeStringToMinutes(timeStr: string | null): number | null {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}
