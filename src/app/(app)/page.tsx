import { getRoomSessions } from "@/app/actions";
import RoomGridView from "@/components/RoomGridView";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getRoomSessions();
  const lastUpdated = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  });
  return <RoomGridView data={data} lastUpdated={`${lastUpdated} ET`} />;
}
