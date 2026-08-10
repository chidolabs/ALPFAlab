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
          <span className="inline-block rounded-full bg-fuchsia-100 px-2 py-0.5 text-[10px] font-medium text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300">
            CPE
          </span>{" "}
          = CPE accredited
        </p>
      </div>
      <RoomScheduleView data={data} />
    </div>
  );
}
