"use client";

import { useMemo, useState } from "react";
import { useVolunteer } from "@/components/VolunteerProvider";

export default function NamePicker() {
  const { names, selectedName, setSelected, clearSelected } = useVolunteer();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return names.slice(0, 25);
    const q = query.trim().toLowerCase();
    return names.filter((n) => n.full_name.toLowerCase().includes(q)).slice(0, 25);
  }, [names, query]);

  if (selectedName && !open) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Viewing as</p>
          <p className="font-medium text-slate-900 dark:text-slate-100">{selectedName}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setOpen(true);
          }}
          className="text-sm font-medium text-blue-600 dark:text-blue-400"
        >
          Switch
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Search your name..."
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
      {open && (
        <ul className="mt-1 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">No matches</li>
          )}
          {filtered.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(n.id, n.full_name);
                  setQuery("");
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-slate-900 hover:bg-blue-50 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                {n.full_name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {selectedName && (
        <button
          type="button"
          onClick={() => {
            clearSelected();
            setOpen(false);
          }}
          className="mt-2 text-sm text-slate-500 underline dark:text-slate-400"
        >
          Clear selection
        </button>
      )}
    </div>
  );
}
