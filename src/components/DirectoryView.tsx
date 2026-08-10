"use client";

import { useMemo, useState } from "react";
import { formatPhone, telHref } from "@/lib/format";
import type { SponsorContact } from "@/lib/types";

export default function DirectoryView({ data }: { data: SponsorContact[] }) {
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? data.filter((c) => {
          const name = `${c.first_name ?? ""} ${c.last_name ?? ""}`.toLowerCase();
          return c.company_name.toLowerCase().includes(q) || name.includes(q);
        })
      : data;

    const map = new Map<string, SponsorContact[]>();
    for (const c of filtered) {
      if (!map.has(c.company_name)) map.set(c.company_name, []);
      map.get(c.company_name)!.push(c);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [data, query]);

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search company or contact..."
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {grouped.length} {grouped.length === 1 ? "company" : "companies"}
      </p>

      <div className="flex flex-col gap-3">
        {grouped.map(([company, contacts]) => (
          <div
            key={company}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="font-semibold text-slate-900 dark:text-slate-100">{company}</p>
            <div className="mt-2 flex flex-col gap-3">
              {contacts.map((c) => (
                <div key={c.id} className="text-sm text-slate-600 dark:text-slate-400">
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    {[c.first_name, c.last_name].filter(Boolean).join(" ")}
                    {c.title ? ` · ${c.title}` : ""}
                  </p>
                  {c.sponsorship_level && <p>{c.sponsorship_level}</p>}
                  <div className="mt-1 flex flex-col gap-0.5">
                    {c.phone && telHref(c.phone) && (
                      <a href={telHref(c.phone)!} className="text-blue-600 dark:text-blue-400">
                        {formatPhone(c.phone)}
                      </a>
                    )}
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="break-all text-blue-600 dark:text-blue-400">
                        {c.email}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
