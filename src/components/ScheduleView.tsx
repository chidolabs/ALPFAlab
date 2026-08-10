"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { getPartnerRoomSessions, getVolunteerShifts } from "@/app/actions";
import { useVolunteer } from "@/components/VolunteerProvider";
import NamePicker from "@/components/NamePicker";
import { formatTime } from "@/lib/format";
import type { RoomSession, Shift } from "@/lib/types";

export default function ScheduleView() {
  const { selectedId } = useVolunteer();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [partnerSessions, setPartnerSessions] = useState<RoomSession[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState<string | null>(null);

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

  const days = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of shifts) {
      const label = s.day_label ?? "Other";
      if (!map.has(label)) map.set(label, s.day_order ?? 999);
    }
    return [...map.entries()].sort((a, b) => a[1] - b[1]).map(([label]) => label);
  }, [shifts]);

  const grouped = useMemo(() => {
    const map = new Map<string, Shift[]>();
    for (const s of shifts) {
      const key = s.day_label ?? "Other";
      if (activeDay && key !== activeDay) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return [...map.entries()];
  }, [shifts, activeDay]);

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

      {partnerSessions.length > 0 && !isPending && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
            Your partner sessions
          </p>
          <div className="mt-2 flex flex-col gap-1.5">
            {partnerSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-blue-800 dark:text-blue-300">
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
            <div
              key={s.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
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
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
