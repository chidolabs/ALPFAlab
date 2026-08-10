import { getSponsorDirectory } from "@/app/actions";
import DirectoryView from "@/components/DirectoryView";

export const dynamic = "force-dynamic";

export default async function DirectoryPage() {
  const data = await getSponsorDirectory();
  return <DirectoryView data={data} />;
}
