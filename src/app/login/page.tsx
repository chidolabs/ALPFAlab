import { submitPasscode } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <form
        action={submitPasscode}
        className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          ALPFA Convention
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Enter the team passcode to continue.
        </p>
        <input type="hidden" name="next" value={params.next ?? "/"} />
        <input
          type="password"
          name="passcode"
          autoFocus
          required
          placeholder="Passcode"
          className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        {params.error && (
          <p className="mt-2 text-sm text-red-600">Incorrect passcode, try again.</p>
        )}
        <button
          type="submit"
          className="mt-4 w-full rounded-lg bg-blue-600 py-3 text-base font-medium text-white transition hover:bg-blue-700"
        >
          Continue
        </button>
      </form>
    </main>
  );
}
