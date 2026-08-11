import RoomCoverageAdmin from "@/components/RoomCoverageAdmin";

export default function AdminPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 bg-slate-50 px-4 py-6 dark:bg-slate-950">
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Admin: Room Coverage
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Assign a volunteer to cover each room session. Unassigned sessions
          show a suggested partner lead when there is one on file.
        </p>
      </div>
      <RoomCoverageAdmin />
    </main>
  );
}
