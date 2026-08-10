import { getConfSchedule } from "@/app/actions";
import ConferenceView from "@/components/ConferenceView";

export const dynamic = "force-dynamic";

export default async function ConferencePage() {
  const data = await getConfSchedule();
  return <ConferenceView data={data} />;
}
