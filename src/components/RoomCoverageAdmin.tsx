"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { getPartnershipLeads, getRoomSessions, getVolunteersActiveOnDay } from "@/app/actions";
import { assignRoomCoverageFreeName, assignRoomCoverageVolunteer } from "@/app/admin/actions";
import { companiesMatch } from "@/lib/company";
import { formatTime } from "@/lib/format";
import { getTodayDayOrder, timeStringToMinutes } from "@/lib/eventDates";
import type { DayVolunteer, PartnerLead, RoomSession } from "@/lib/types";

const OTHER_VALUE = "__other__";
const PARTNERSHIP_TEAM = "Partnership Support";

export default function RoomCoverageAdmin() {
  const [sessions, setSessions] = useState<RoomSession[]>([]);
  const [leads, setLeads] = useState<PartnerLead[]>([]);
  const [dayVolunteers, setDayVolunteers] = useState<DayVolunteer[]>([]);
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [otherOpen, setOtherOpen] = useState<Record<string, boolean>>({});
  const [otherDraft, setOtherDraft] = useState<Record<string, string>>({});

  const days = useMemo(() => {
    const map = new Map<number, string>();
    for (const s of sessions) {
      if (s.day_order != null) map.set(s.day_order, s.day_label ?? String(s.day_order));
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [sessions]);

  const partnershipVolunteers = useMemo(
    () => dayVolunteers.filter((v) => v.team === PARTNERSHIP_TEAM),
    [dayVolunteers]
  );

  useEffect(() => {
    startTransition(async () => {
      try {
        const [sessionResult, leadResult] = await Promise.all([getRoomSessions(), getPartnershipLeads()]);
        setSessions(sessionResult);
        setLeads(leadResult);
        const availableDays = [...new Set(sessionResult.map((s) => s.day_order).filter((d): d is number => d != null))].sort(
          (a, b) => a - b
        );
        const today = getTodayDayOrder();
        const defaultDay = today != null && availableDays.includes(today) ? today : availableDays[0];
        if (defaultDay != null) setActiveDay(defaultDay);
      } catch {
        setError("Could not load room sessions.");
      }
    });
  }, []);

  useEffect(() => {
    if (activeDay == null) return;
    startTransition(async () => {
      try {
        const result = await getVolunteersActiveOnDay(activeDay);
        setDayVolunteers(result);
      } catch {
        setError("Could not load active volunteers.");
      }
    });
  }, [activeDay]);

  function refresh() {
    startTransition(async () => {
      try {
        const [sessionResult, volunteerResult] = await Promise.all([
          getRoomSessions(),
          activeDay != null ? getVolunteersActiveOnDay(activeDay) : Promise.resolve([]),
        ]);
        setSessions(sessionResult);
        setDayVolunteers(volunteerResult);
      } catch {
        setError("Could not refresh.");
      }
    });
  }

  function handleSelectChange(roomSessionId: string, value: string) {
    setError(null);
    if (value === OTHER_VALUE) {
      setOtherOpen((prev) => ({ ...prev, [roomSessionId]: true }));
      return;
    }
    setOtherOpen((prev) => ({ ...prev, [roomSessionId]: false }));
    startTransition(async () => {
      try {
        await assignRoomCoverageVolunteer(roomSessionId, value || null);
        refresh();
      } catch {
        setError("Could not update assignment.");
      }
    });
  }

  function handleSaveOther(roomSessionId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await assignRoomCoverageFreeName(roomSessionId, otherDraft[roomSessionId] ?? "");
        setOtherOpen((prev) => ({ ...prev, [roomSessionId]: false }));
        refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save name.");
      }
    });
  }

  function suggestedLead(company: string) {
    return leads.find((l) => companiesMatch(l.sponsor_company, company))?.volunteer ?? null;
  }

  function poolFor(session: RoomSession) {
    const overlapping: DayVolunteer[] = [];
    const others: DayVolunteer[] = [];
    for (const v of partnershipVolunteers) {
      const isOverlapping = v.shiftRanges.some((r) => {
        const start = timeStringToMinutes(r.start_time);
        const end = timeStringToMinutes(r.end_time);
        return start != null && end != null && session.time_order != null && start <= session.time_order && session.time_order <= end;
      });
      (isOverlapping ? overlapping : others).push(v);
    }
    return [...overlapping, ...others];
  }

  const { rooms, times, cellMap } = useMemo(() => {
    const daySessions = sessions.filter((s) => s.day_order === activeDay);
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
  }, [sessions, activeDay]);

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {days.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {days.map(([order, label]) => (
            <button
              key={order}
              type="button"
              onClick={() => setActiveDay(order)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                activeDay === order
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {isPending && <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>}

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
                  const s = cellMap.get(`${room}__${t}`);
                  if (!s) {
                    return (
                      <td key={t} className="px-3 py-2 align-top text-slate-300 dark:text-slate-700">
                        &mdash;
                      </td>
                    );
                  }

                  const pool = poolFor(s);
                  const suggested =
                    !s.covering_volunteer_id && !s.covering_volunteer_name ? suggestedLead(s.company) : null;
                  const selectValue = s.covering_volunteer_id
                    ? s.covering_volunteer_id
                    : otherOpen[s.id] || s.covering_volunteer_name
                      ? OTHER_VALUE
                      : "";

                  return (
                    <td key={t} className="min-w-[180px] px-3 py-2 align-top">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {s.company}
                        {s.cpe && (
                          <span className="ml-1 rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-medium text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                            CPE
                          </span>
                        )}
                      </p>

                      {s.covering_volunteer ? (
                        <p className="text-emerald-700 dark:text-emerald-400">{s.covering_volunteer.full_name}</p>
                      ) : s.covering_volunteer_name ? (
                        <p className="text-emerald-700 dark:text-emerald-400">
                          {s.covering_volunteer_name} (not on roster)
                        </p>
                      ) : (
                        <p className="text-amber-700 dark:text-amber-400">Unassigned</p>
                      )}
                      {suggested && (
                        <p className="text-slate-500 dark:text-slate-400">Suggested: {suggested.full_name}</p>
                      )}

                      <select
                        value={selectValue}
                        onChange={(e) => handleSelectChange(s.id, e.target.value)}
                        className="mt-1 w-full rounded border border-slate-300 bg-white px-1.5 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        <option value="">— Unassigned —</option>
                        {pool.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.full_name}
                          </option>
                        ))}
                        <option value={OTHER_VALUE}>— Not on list —</option>
                      </select>

                      {selectValue === OTHER_VALUE && (
                        <div className="mt-1 flex gap-1">
                          <input
                            type="text"
                            placeholder="Type a name"
                            defaultValue={s.covering_volunteer_name ?? ""}
                            onChange={(e) => setOtherDraft((prev) => ({ ...prev, [s.id]: e.target.value }))}
                            className="w-full rounded border border-slate-300 bg-white px-1.5 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveOther(s.id)}
                            className="shrink-0 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white"
                          >
                            Save
                          </button>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeDay != null && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Partnership Support active this day ({partnershipVolunteers.length})
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Shifts</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {partnershipVolunteers.map((v) => (
                  <tr key={v.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                    <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{v.full_name}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                      {v.shiftRanges
                        .map((r) => `${formatTime(r.start_time)}-${formatTime(r.end_time)}`)
                        .join(", ")}
                    </td>
                    <td className="px-3 py-2">
                      {v.covering.length > 0 ? (
                        <span className="text-emerald-700 dark:text-emerald-400">
                          {v.covering
                            .map((c) => `${c.company} @ ${c.room} (${c.time_label})`)
                            .join(", ")}
                        </span>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400">Available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
