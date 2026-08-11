"use client";

import { useMemo } from "react";
import type { RoomSession } from "@/lib/types";

export default function RoomScheduleView({ data }: { data: RoomSession[] }) {
  const grouped = useMemo(() => {
    const byDay = new Map<string, Map<string, RoomSession[]>>();
    for (const s of data) {
      const day = s.day_label ?? "Other";
      const time = s.time_label ?? "Other";
      if (!byDay.has(day)) byDay.set(day, new Map());
      const byTime = byDay.get(day)!;
      if (!byTime.has(time)) byTime.set(time, []);
      byTime.get(time)!.push(s);
    }
    return [...byDay.entries()].map(([day, byTime]) => [day, [...byTime.entries()]] as const);
  }, [data]);

  return (
    <div className="flex flex-col gap-5">
      {grouped.map(([day, times]) => (
        <div key={day} className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{day}</h3>
          {times.map(([time, sessions]) => (
            <div
              key={time}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{time}</p>
              <div className="mt-2 flex flex-col gap-1.5">
                {sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      <span className="font-medium text-slate-900 dark:text-slate-100">{s.room}</span>
                      {" · "}
                      {s.company}
                      {(s.covering_volunteer || s.covering_volunteer_name) && (
                        <span className="text-emerald-700 dark:text-emerald-400">
                          {" · "}
                          {s.covering_volunteer?.full_name ?? s.covering_volunteer_name}
                        </span>
                      )}
                    </span>
                    {s.cpe && (
                      <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                        CPE
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
