import { getVolunteerNames } from "@/app/actions";
import AdminScheduleForm from "@/components/AdminScheduleForm";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const names = await getVolunteerNames();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 bg-slate-50 px-4 py-6 dark:bg-slate-950">
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Admin: Shift Assignments
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Search a volunteer to add or remove shifts on their schedule.
        </p>
      </div>
      <AdminScheduleForm names={names} />
    </main>
  );
}
