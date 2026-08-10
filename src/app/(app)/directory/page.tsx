import { getPartnershipLeads, getSponsorDirectory } from "@/app/actions";
import DirectoryView from "@/components/DirectoryView";

export const dynamic = "force-dynamic";

export default async function DirectoryPage() {
  const [data, leads] = await Promise.all([getSponsorDirectory(), getPartnershipLeads()]);
  return <DirectoryView data={data} leads={leads} />;
}
