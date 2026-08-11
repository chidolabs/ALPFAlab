"use client";

import { useEffect, useMemo, useState } from "react";
import { getVolunteersActiveOnDay } from "@/app/actions";
import { getTodayDayOrder, timeStringToMinutes } from "@/lib/eventDates";
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

  const { rooms, times, timeOrders, cellMap } = useMemo(() => {
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
    return { rooms, times, timeOrders: timeMap, cellMap: map };
  }, [data, selectedDay]);

  const partnershipVolunteers = useMemo(
    () => dayVolunteers.filter((v) => v.team === PARTNERSHIP_TEAM),
    [dayVolunteers]
  );

  const availableByBlock = useMemo(() => {
    return times.map((timeLabel) => {
      const blockOrder = timeOrders.get(timeLabel) ?? null;
      const names = partnershipVolunteers.filter((v) => {
        const onShift = v.shiftRanges.some((r) => {
          const start = timeStringToMinutes(r.start_time);
          const end = timeStringToMinutes(r.end_time);
          return start != null && end != null && blockOrder != null && start <= blockOrder && blockOrder <= end;
        });
        if (!onShift) return false;
        const busyThisBlock = v.covering.some((c) => c.time_label === timeLabel);
        return !busyThisBlock;
      });
      return [timeLabel, names] as const;
    });
  }, [times, timeOrders, partnershipVolunteers]);

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
                          {(cell.support_volunteer || cell.support_volunteer_name) && (
                            <p className="text-emerald-600 dark:text-emerald-500">
                              + {cell.support_volunteer?.full_name ?? cell.support_volunteer_name}
                            </p>
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
          <tfoot>
            <tr className="border-t-2 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
              <td className="sticky left-0 z-10 whitespace-nowrap bg-blue-50 px-3 py-2 align-top font-medium text-blue-900 dark:bg-blue-950 dark:text-blue-200">
                Available to help
              </td>
              {availableByBlock.map(([timeLabel, names]) => (
                <td key={timeLabel} className="min-w-[140px] px-3 py-2 align-top">
                  <details>
                    <summary className="cursor-pointer text-blue-800 dark:text-blue-300">
                      {names.length}
                    </summary>
                    {names.length === 0 ? (
                      <p className="mt-1 text-blue-600 dark:text-blue-400">Everyone assigned</p>
                    ) : (
                      <div className="mt-1 flex flex-col gap-1">
                        {names.map((v) => (
                          <div key={v.id} className="flex flex-col">
                            <span className="text-blue-900 dark:text-blue-200">{v.full_name}</span>
                            {v.phone && telHref(v.phone) && (
                              <a href={telHref(v.phone)!} className="text-blue-700 dark:text-blue-400">
                                {formatPhone(v.phone)}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </details>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
