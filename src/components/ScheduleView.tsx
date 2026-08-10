"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { getVolunteerShifts } from "@/app/actions";
import { useVolunteer } from "@/components/VolunteerProvider";
import NamePicker from "@/components/NamePicker";
import { formatTime } from "@/lib/format";
import type { Shift } from "@/lib/types";

export default function ScheduleView() {
  const { selectedId } = useVolunteer();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId) {
      setShifts([]);
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const result = await getVolunteerShifts(selectedId);
        setShifts(result);
      } catch {
        setError("Could not load your schedule. Please try again.");
      }
    });
  }, [selectedId]);

  const grouped = useMemo(() => {
    const map = new Map<string, Shift[]>();
    for (const s of shifts) {
      const key = s.day_label ?? "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return [...map.entries()];
  }, [shifts]);

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
