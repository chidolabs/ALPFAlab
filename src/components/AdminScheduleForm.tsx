"use client";

import { useMemo, useState, useTransition } from "react";
import { getVolunteerShifts } from "@/app/actions";
import { addShift, deleteShift } from "@/app/admin/actions";
import { formatTime } from "@/lib/format";
import type { Shift, VolunteerName } from "@/lib/types";

const DAYS = [
  { value: 1, label: "Saturday" },
  { value: 2, label: "Sunday" },
  { value: 3, label: "Monday" },
  { value: 4, label: "Tuesday" },
  { value: 5, label: "Wednesday" },
  { value: 6, label: "Thursday" },
];

const emptyForm = {
  dayOrder: "3",
  startTime: "",
  endTime: "",
  session: "",
  location: "",
  team: "",
  leads: "",
};

export default function AdminScheduleForm({ names }: { names: VolunteerName[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<VolunteerName | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return names.filter((n) => n.full_name.toLowerCase().includes(q)).slice(0, 25);
  }, [names, query]);

  function loadShifts(volunteerId: string) {
    startTransition(async () => {
      try {
        const result = await getVolunteerShifts(volunteerId);
        setShifts(result);
      } catch {
        setError("Could not load shifts.");
      }
    });
  }

  function selectVolunteer(v: VolunteerName) {
    setSelected(v);
    setQuery("");
    setError(null);
    loadShifts(v.id);
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      try {
        await addShift({
          volunteerId: selected.id,
          dayOrder: Number(form.dayOrder),
          startTime: form.startTime,
          endTime: form.endTime,
          session: form.session,
          location: form.location,
          team: form.team,
          leads: form.leads,
        });
        setForm(emptyForm);
        loadShifts(selected.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add shift.");
      }
    });
  }

  function handleDelete(shiftId: string) {
    if (!selected) return;
    startTransition(async () => {
      try {
        await deleteShift(shiftId);
        loadShifts(selected.id);
      } catch {
        setError("Could not delete shift.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search volunteer by name..."
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        {filtered.length > 0 && (
          <ul className="mt-1 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
            {filtered.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => selectVolunteer(n)}
                  className="block w-full px-3 py-2 text-left text-sm text-slate-900 hover:bg-blue-50 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  {n.full_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">Managing shifts for</p>
            <p className="font-medium text-slate-900 dark:text-slate-100">{selected.full_name}</p>
          </div>

          {isPending && <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-col gap-2">
            {shifts.map((s) => (
              <div
                key={s.id}
                className="flex items-start justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="text-sm">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{s.session}</p>
                  <p className="text-slate-600 dark:text-slate-400">
                    {s.day_label} &middot; {formatTime(s.start_time)} - {formatTime(s.end_time)}
                  </p>
                  {s.location && <p className="text-slate-500 dark:text-slate-400">{s.location}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(s.id)}
                  className="shrink-0 text-sm font-medium text-red-600"
                >
                  Delete
                </button>
              </div>
            ))}
            {shifts.length === 0 && !isPending && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No shifts yet.</p>
            )}
          </div>

          <form
            onSubmit={handleAdd}
            className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Add a shift</p>

            <select
              value={form.dayOrder}
              onChange={(e) => setForm((f) => ({ ...f, dayOrder: e.target.value }))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <input
                type="time"
                required
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <input
                type="time"
                required
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <input
              required
              placeholder="Session name"
              value={form.session}
              onChange={(e) => setForm((f) => ({ ...f, session: e.target.value }))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <input
              placeholder="Location (optional)"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <input
              placeholder="Team (optional)"
              value={form.team}
              onChange={(e) => setForm((f) => ({ ...f, team: e.target.value }))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <input
              placeholder="Leads, comma separated (optional)"
              value={form.leads}
              onChange={(e) => setForm((f) => ({ ...f, leads: e.target.value }))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />

            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {isPending ? "Saving..." : "Add shift"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
