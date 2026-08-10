import { getVolunteerNames } from "@/app/actions";
import { VolunteerProvider } from "@/components/VolunteerProvider";
import AppShell from "@/components/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const names = await getVolunteerNames();

  return (
    <VolunteerProvider names={names}>
      <AppShell>{children}</AppShell>
    </VolunteerProvider>
  );
}
