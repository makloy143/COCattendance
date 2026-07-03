import { MonitoringShell } from "@/components/monitoring-sidebar";
import { getMonitoringSession } from "@/lib/monitoring-auth";

export default async function MonitoringPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getMonitoringSession();

  return (
    <MonitoringShell username={session?.username}>{children}</MonitoringShell>
  );
}
