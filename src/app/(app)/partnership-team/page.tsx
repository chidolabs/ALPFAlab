import { getPartnershipTeamOverview } from "@/app/actions";
import PartnershipTeamView from "@/components/PartnershipTeamView";

export const dynamic = "force-dynamic";

export default async function PartnershipTeamPage() {
  const data = await getPartnershipTeamOverview();
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Partnership Team Overview
      </h2>
      <PartnershipTeamView data={data} />
    </div>
  );
}
