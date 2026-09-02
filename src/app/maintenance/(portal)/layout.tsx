import { MaintenanceShell } from "@/components/maintenance-sidebar";
import { getInventorySession } from "@/lib/inventory-auth";

export default async function MaintenancePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getInventorySession();

  return (
    <MaintenanceShell username={session?.username}>{children}</MaintenanceShell>
  );
}
