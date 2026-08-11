"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutGrid, PhoneCall, Table2, UserRound, Users } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const TABS = [
  { href: "/", label: "Rooms", icon: Table2 },
  { href: "/me", label: "My Info", icon: UserRound },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/directory", label: "Directory", icon: Users },
  { href: "/conference", label: "Sessions", icon: LayoutGrid },
  { href: "/contacts", label: "Contacts", icon: PhoneCall },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
            ALPFA Convention
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Volunteer Hub</p>
        </div>
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-4 pb-20">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-md justify-around">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium ${
                  active
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
