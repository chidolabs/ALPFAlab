"use client";

import { useEffect, useMemo, useState } from "react";
import { getVolunteersActiveOnDay } from "@/app/actions";
import { getTodayDayOrder } from "@/lib/eventDates";
import { formatPhone, telHref } from "@/lib/format";
import type { DayVolunteer, RoomSession } from "@/lib/types";

const PARTNERSHIP_TEAM = "Partnership Support";

export default function RoomGridView({ data, lastUpdated }: { data: RoomSession[]; lastUpdated: string }) {
  const days = useMemo(() => {
    const map = new Map<number, string>();
    for (const s of data) {
      if (s.day_order != null) map.set(s.day_order, s.day_label ?? String(s.day_order));
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [data]);

  const [activeDay, setActiveDay] = useState<number | null>(() => {
    const today = getTodayDayOrder();
    return today != null && data.some((s) => s.day_order === today) ? today : (days[0]?.[0] ?? null);
  });
  const selectedDay = activeDay ?? days[0]?.[0] ?? null;

  const [dayVolunteers, setDayVolunteers] = useState<DayVolunteer[]>([]);

  useEffect(() => {
    if (selectedDay == null) return;
    let cancelled = false;
    getVolunteersActiveOnDay(selectedDay)
      .then((result) => {
        if (!cancelled) setDayVolunteers(result);
      })
      .catch(() => {
        if (!cancelled) setDayVolunteers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDay]);

  const available = useMemo(
    () => dayVolunteers.filter((v) => v.team === PARTNERSHIP_TEAM && !v.covering),
    [dayVolunteers]
  );

  const { rooms, times, cellMap } = useMemo(() => {
    const daySessions = data.filter((s) => s.day_order === selectedDay);
    const roomSet = new Set<string>();
    const timeMap = new Map<string, number>();
    const map = new Map<string, RoomSession>();
    for (const s of daySessions) {
      roomSet.add(s.room);
      if (s.time_label != null) timeMap.set(s.time_label, s.time_order ?? 0);
      map.set(`${s.room}__${s.time_label}`, s);
    }
    const rooms = [...roomSet].sort();
    const times = [...timeMap.entries()].sort((a, b) => a[1] - b[1]).map(([label]) => label);
    return { rooms, times, cellMap: map };
  }, [data, selectedDay]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Room Quick View
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Who&apos;s covering each room session, at a glance.
        </p>
        <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
          Last updated: {lastUpdated}
        </p>
      </div>

      {days.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {days.map(([order, label]) => (
            <button
              key={order}
              type="button"
              onClick={() => setActiveDay(order)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                selectedDay === order
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="sticky left-0 z-10 bg-white px-3 py-2 font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                Room
              </th>
              {times.map((t) => (
                <th
                  key={t}
                  className="whitespace-nowrap px-3 py-2 font-medium text-slate-700 dark:text-slate-300"
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-2 font-medium text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                  {room}
                </td>
                {times.map((t) => {
                  const cell = cellMap.get(`${room}__${t}`);
                  return (
                    <td key={t} className="min-w-[140px] px-3 py-2 align-top">
                      {cell ? (
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {cell.company}
                            {cell.cpe && (
                              <span className="ml-1 rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-medium text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                CPE
                              </span>
                            )}
                          </p>
                          {cell.covering_volunteer ? (
                            <p className="text-emerald-700 dark:text-emerald-400">
                              {cell.covering_volunteer.full_name}
                            </p>
                          ) : cell.covering_volunteer_name ? (
                            <p className="text-emerald-700 dark:text-emerald-400">
                              {cell.covering_volunteer_name}
                            </p>
                          ) : (
                            <p className="text-amber-700 dark:text-amber-400">Unassigned</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700">&mdash;</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {available.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
            Available for rover / other assignments ({available.length})
          </p>
          <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-400">
            Partnership Support volunteers on shift today with no room assigned yet.
          </p>
          <div className="mt-2 flex flex-col gap-1.5">
            {available.map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-blue-900 dark:text-blue-200">{v.full_name}</span>
                {v.phone && telHref(v.phone) && (
                  <a href={telHref(v.phone)!} className="text-blue-700 dark:text-blue-400">
                    {formatPhone(v.phone)}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
