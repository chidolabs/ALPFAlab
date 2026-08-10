"use client";

import { useEffect, useState, useTransition } from "react";
import { getVolunteerDetail } from "@/app/actions";
import { useVolunteer } from "@/components/VolunteerProvider";
import NamePicker from "@/components/NamePicker";
import { formatPhone, telHref } from "@/lib/format";
import type { VolunteerDetail } from "@/lib/types";

export default function MyInfoView() {
  const { selectedId } = useVolunteer();
  const [detail, setDetail] = useState<VolunteerDetail | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const result = await getVolunteerDetail(selectedId);
        setDetail(result);
      } catch {
        setError("Could not load your info. Please try again.");
      }
    });
  }, [selectedId]);

  return (
    <div className="flex flex-col gap-4">
      <NamePicker />

      {isPending && <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {detail && !isPending && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {detail.full_name}
            </h2>
            <dl className="mt-3 flex flex-col gap-2 text-sm">
              {detail.team && (
                <Row label="Team" value={detail.team} />
              )}
              {detail.member_type && <Row label="Type" value={detail.member_type.trim()} />}
              {detail.email && (
                <Row
                  label="Email"
                  value={
                    <a href={`mailto:${detail.email}`} className="text-blue-600 dark:text-blue-400 break-all">
                      {detail.email}
                    </a>
                  }
                />
              )}
              {detail.phone && (
                <Row
                  label="Phone"
                  value={
                    telHref(detail.phone) ? (
                      <a href={telHref(detail.phone)!} className="text-blue-600 dark:text-blue-400">
                        {formatPhone(detail.phone)}
                      </a>
                    ) : (
                      detail.phone
                    )
                  }
                />
              )}
              {detail.roles.length > 0 && (
                <Row label="Roles" value={detail.roles.join(", ")} />
              )}
            </dl>
          </div>

          {detail.partnerships.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Your assigned partners
              </h3>
              {detail.partnerships.map((p, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{p.sponsor_company}</p>
                  {p.contact ? (
                    <div className="mt-2 flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-400">
                      <p>
                        {[p.contact.first_name, p.contact.last_name].filter(Boolean).join(" ")}
                        {p.contact.title ? ` · ${p.contact.title}` : ""}
                      </p>
                      {p.contact.phone && telHref(p.contact.phone) && (
                        <a href={telHref(p.contact.phone)!} className="text-blue-600 dark:text-blue-400">
                          {formatPhone(p.contact.phone)}
                        </a>
                      )}
                      {p.contact.email && (
                        <a href={`mailto:${p.contact.email}`} className="break-all text-blue-600 dark:text-blue-400">
                          {p.contact.email}
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      No contact on file yet.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-right font-medium text-slate-900 dark:text-slate-100">{value}</dd>
    </div>
  );
}
