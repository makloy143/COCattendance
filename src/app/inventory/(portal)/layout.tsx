import { InventoryShell } from "@/components/inventory-sidebar";
import { getInventorySession } from "@/lib/inventory-auth";

export default async function InventoryPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getInventorySession();

  return (
    <InventoryShell username={session?.username}>{children}</InventoryShell>
  );
}
