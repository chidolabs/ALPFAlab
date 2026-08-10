import { submitAdminPasscode } from "./actions";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <form
        action={submitAdminPasscode}
        className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Admin
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Enter the admin passcode to manage schedules.
        </p>
        <input type="hidden" name="next" value={params.next ?? "/admin"} />
        <input
          type="password"
          name="passcode"
          autoFocus
          required
          placeholder="Admin passcode"
          className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        {params.error && (
          <p className="mt-2 text-sm text-red-600">Incorrect passcode, try again.</p>
        )}
        <button
          type="submit"
          className="mt-4 w-full rounded-lg bg-slate-900 py-3 text-base font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          Continue
        </button>
      </form>
    </main>
  );
}
