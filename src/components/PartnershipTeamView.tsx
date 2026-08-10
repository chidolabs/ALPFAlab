"use client";

import { formatPhone, telHref } from "@/lib/format";
import type { PartnershipTeamMember } from "@/lib/types";

export default function PartnershipTeamView({ data }: { data: PartnershipTeamMember[] }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {data.length} {data.length === 1 ? "volunteer" : "volunteers"}
      </p>

      <div className="flex flex-col gap-3">
        {data.map((v) => (
          <div
            key={v.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="font-semibold text-slate-900 dark:text-slate-100">{v.full_name}</p>
            <div className="mt-1 flex flex-col gap-0.5 text-sm">
              {v.phone && telHref(v.phone) && (
                <a href={telHref(v.phone)!} className="text-blue-600 dark:text-blue-400">
                  {formatPhone(v.phone)}
                </a>
              )}
              {v.email && (
                <a href={`mailto:${v.email}`} className="break-all text-blue-600 dark:text-blue-400">
                  {v.email}
                </a>
              )}
            </div>

            <div className="mt-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Assigned partners
              </p>
              {v.sponsor_companies.length === 0 ? (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">None assigned</p>
              ) : (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {v.sponsor_companies.map((c) => (
                    <span
                      key={c}
                      className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
