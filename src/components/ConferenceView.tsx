"use client";

import { useMemo, useState } from "react";
import { formatTime } from "@/lib/format";
import type { ConfSession } from "@/lib/types";

export default function ConferenceView({ data }: { data: ConfSession[] }) {
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState<string | null>(null);

  const types = useMemo(() => {
    const set = new Set<string>();
    for (const s of data) if (s.type) set.add(s.type);
    return [...set].sort();
  }, [data]);

  const days = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of data) {
      const label = s.day_label ?? "Other";
      if (!map.has(label)) map.set(label, s.day_order ?? 999);
    }
    return [...map.entries()].sort((a, b) => a[1] - b[1]).map(([label]) => label);
  }, [data]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = data.filter((s) => {
      if (activeType && s.type !== activeType) return false;
      if (activeDay && (s.day_label ?? "Other") !== activeDay) return false;
      if (q && !s.session.toLowerCase().includes(q)) return false;
      return true;
    });
    const map = new Map<string, ConfSession[]>();
    for (const s of filtered) {
      const key = s.day_label ?? "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return [...map.entries()];
  }, [data, query, activeType, activeDay]);

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search sessions..."
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />

      {days.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveDay(null)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              activeDay === null
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
            }`}
          >
            All days
          </button>
          {days.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setActiveDay(d === activeDay ? null : d)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                activeDay === d
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveType(null)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            activeType === null
              ? "bg-blue-600 text-white"
              : "bg-white text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
          }`}
        >
          All categories
        </button>
        {types.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveType(t === activeType ? null : t)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              activeType === t
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {grouped.map(([day, sessions]) => (
        <div key={day} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{day}</h3>
          {sessions.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100">{s.session}</h4>
                {s.type && (
                  <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {s.type}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-400">
                {(s.start_time || s.end_time) && (
                  <p>
                    {formatTime(s.start_time)}
                    {s.end_time ? ` - ${formatTime(s.end_time)}` : ""}
                  </p>
                )}
                {s.room && <p>{s.room}</p>}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
