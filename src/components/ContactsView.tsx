"use client";

import { useMemo, useState, useTransition } from "react";
import { addKeyContact } from "@/app/actions";
import { formatPhone, telHref } from "@/lib/format";
import type { KeyContact } from "@/lib/types";

export default function ContactsView({ data }: { data: KeyContact[] }) {
  const [contacts, setContacts] = useState(data);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ area: "", name: "", role: "", phone: "", email: "", notes: "" });

  const areas = useMemo(() => {
    const set = new Set(contacts.map((c) => c.area));
    return [...set];
  }, [contacts]);

  const grouped = useMemo(() => {
    const map = new Map<string, KeyContact[]>();
    for (const c of contacts) {
      if (!map.has(c.area)) map.set(c.area, []);
      map.get(c.area)!.push(c);
    }
    return [...map.entries()];
  }, [contacts]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const created = await addKeyContact(form);
        setContacts((prev) => [...prev, created]);
        setForm({ area: "", name: "", role: "", phone: "", email: "", notes: "" });
        setShowForm(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add contact.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {grouped.map(([area, areaContacts]) => (
          <div
            key={area}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="font-semibold text-slate-900 dark:text-slate-100">{area}</p>
            <div className="mt-2 flex flex-col gap-3">
              {areaContacts.map((c) => (
                <div key={c.id} className="text-sm text-slate-600 dark:text-slate-400">
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    {c.name}
                    {c.role ? ` · ${c.role}` : ""}
                  </p>
                  {c.notes && <p>{c.notes}</p>}
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

      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-lg border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
        >
          + Add a contact
        </button>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Add a contact</p>

          <input
            list="contact-areas"
            required
            placeholder="Area (e.g. Housing)"
            value={form.area}
            onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <datalist id="contact-areas">
            {areas.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>

          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <input
            placeholder="Role (optional)"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <input
            type="tel"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <input
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {isPending ? "Adding..." : "Add contact"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
