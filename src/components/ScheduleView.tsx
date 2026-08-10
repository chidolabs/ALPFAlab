"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { getPartnerRoomSessions, getVolunteerShifts } from "@/app/actions";
import { useVolunteer } from "@/components/VolunteerProvider";
import NamePicker from "@/components/NamePicker";
import { dayOrderToDate, timeStringToMinutes } from "@/lib/eventDates";
import { formatTime } from "@/lib/format";
import type { RoomSession, Shift } from "@/lib/types";

const CPE_DISCLAIMER =
  "CPE-accredited sessions (CPE badge) require attendees to be scanned in AND out to receive credit. Arrive at least 30 minutes before your scheduled session.";

type ShiftWithPartners = Shift & { partnerMatches: RoomSession[] };

export default function ScheduleView() {
  const { selectedId } = useVolunteer();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [partnerSessions, setPartnerSessions] = useState<RoomSession[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setShifts([]);
      setPartnerSessions([]);
      return;
    }
    setError(null);
    setActiveDay(null);
    startTransition(async () => {
      try {
        const [shiftResult, partnerResult] = await Promise.all([
          getVolunteerShifts(selectedId),
          getPartnerRoomSessions(selectedId),
        ]);
        setShifts(shiftResult);
        setPartnerSessions(partnerResult);
      } catch {
        setError("Could not load your schedule. Please try again.");
      }
    });
  }, [selectedId]);

  const shiftsWithPartners = useMemo<ShiftWithPartners[]>(() => {
    return shifts.map((s) => {
      const startMin = timeStringToMinutes(s.start_time);
      const endMin = timeStringToMinutes(s.end_time);
      const partnerMatches = partnerSessions.filter((p) => {
        if (p.day_order !== s.day_order) return false;
        if (startMin == null || endMin == null || p.time_order == null) return false;
        return p.time_order >= startMin && p.time_order <= endMin;
      });
      return { ...s, partnerMatches };
    });
  }, [shifts, partnerSessions]);

  const unmatchedPartnerSessions = useMemo(() => {
    const matchedIds = new Set(shiftsWithPartners.flatMap((s) => s.partnerMatches.map((m) => m.id)));
    return partnerSessions.filter((p) => !matchedIds.has(p.id));
  }, [shiftsWithPartners, partnerSessions]);

  const hasCpe = useMemo(
    () =>
      shiftsWithPartners.some((s) => s.partnerMatches.some((m) => m.cpe)) ||
      unmatchedPartnerSessions.some((m) => m.cpe),
    [shiftsWithPartners, unmatchedPartnerSessions]
  );

  const upNext = useMemo(() => {
    if (!now) return null;
    for (const s of shiftsWithPartners) {
      const start = dayOrderToDate(s.day_order, s.start_time);
      const end = dayOrderToDate(s.day_order, s.end_time);
      if (!start || !end) continue;
      if (end > now) {
        return { shift: s, status: start <= now ? ("now" as const) : ("next" as const) };
      }
    }
    return null;
  }, [shiftsWithPartners, now]);

  const days = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of shifts) {
      const label = s.day_label ?? "Other";
      if (!map.has(label)) map.set(label, s.day_order ?? 999);
    }
    return [...map.entries()].sort((a, b) => a[1] - b[1]).map(([label]) => label);
  }, [shifts]);

  const grouped = useMemo(() => {
    const map = new Map<string, ShiftWithPartners[]>();
    for (const s of shiftsWithPartners) {
      const key = s.day_label ?? "Other";
      if (activeDay && key !== activeDay) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return [...map.entries()];
  }, [shiftsWithPartners, activeDay]);

  return (
    <div className="flex flex-col gap-4">
      <NamePicker />

      {isPending && <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!selectedId && !isPending && (
        <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Select your name above to see your schedule.
        </p>
      )}

      {selectedId && !isPending && shifts.length === 0 && !error && (
        <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          No shifts assigned yet.
        </p>
      )}

      {upNext && !isPending && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            {upNext.status === "now" ? "Happening now" : "Up next"}
          </p>
          <ShiftCard shift={upNext.shift} highlight />
        </div>
      )}

      {hasCpe && !isPending && (
        <p className="rounded-lg bg-fuchsia-50 px-3 py-2 text-xs text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-300">
          {CPE_DISCLAIMER}
        </p>
      )}

      {unmatchedPartnerSessions.length > 0 && !isPending && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Not covered by your shifts
          </p>
          <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
            These partner sessions don&apos;t fall inside any of your blocked shift times.
          </p>
          <div className="mt-2 flex flex-col gap-1.5">
            {unmatchedPartnerSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-amber-900 dark:text-amber-200">
                  {s.company} &middot; {s.day_label} {s.time_label} &middot; {s.room}
                </span>
                {s.cpe && (
                  <span className="shrink-0 rounded-full bg-fuchsia-100 px-2 py-0.5 text-[10px] font-medium text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300">
                    CPE
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {days.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveDay(null)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              activeDay === null
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            All days
          </button>
          {days.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => setActiveDay(day === activeDay ? null : day)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                activeDay === day
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      )}

      {grouped.map(([day, dayShifts]) => (
        <div key={day} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{day}</h3>
          {dayShifts.map((s) => (
            <ShiftCard key={s.id} shift={s} />
          ))}
        </div>
      ))}
    </div>
  );
}

function ShiftCard({ shift: s, highlight }: { shift: ShiftWithPartners; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-sm ${
        highlight
          ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-semibold text-slate-900 dark:text-slate-100">{s.session}</h4>
      </div>
      <div className="mt-2 flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-400">
        {(s.start_time || s.end_time) && (
          <p>
            {formatTime(s.start_time)}
            {s.end_time ? ` - ${formatTime(s.end_time)}` : ""}
          </p>
        )}
        {s.location && <p>{s.location}</p>}
        {s.team && <p>{s.team}</p>}
        {s.leads.length > 0 && <p>Leads: {s.leads.join(", ")}</p>}
      </div>

      {s.partnerMatches.length > 0 && (
        <div className="mt-3 flex flex-col gap-1 border-t border-dashed border-slate-200 pt-2 dark:border-slate-700">
          {s.partnerMatches.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-blue-700 dark:text-blue-400">
                📍 {p.company} &middot; {p.room} &middot; {p.time_label}
              </span>
              {p.cpe && (
                <span className="shrink-0 rounded-full bg-fuchsia-100 px-2 py-0.5 text-[10px] font-medium text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300">
                  CPE
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
