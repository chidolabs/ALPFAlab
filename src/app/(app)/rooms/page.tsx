import { getRoomSessions } from "@/app/actions";
import RoomScheduleView from "@/components/RoomScheduleView";

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const data = await getRoomSessions();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Room Quick View
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-block rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-950 dark:text-purple-300">
            CPE
          </span>{" "}
          = CPE accredited
        </p>
      </div>
      <p className="rounded-lg bg-purple-50 px-3 py-2 text-xs text-purple-800 dark:bg-purple-950 dark:text-purple-300">
        CPE-accredited sessions require attendees to be scanned in AND out to
        receive credit. Arrive at least 30 minutes before your scheduled
        session.
      </p>
      <RoomScheduleView data={data} />
    </div>
  );
}
