import { ComputerDashboard } from "@/components/computer-dashboard";
import { getComputerDashboard } from "@/lib/computers-data";
import { requireInventorySession } from "@/lib/inventory-auth";

export const dynamic = "force-dynamic";

export default async function ComputersDashboardPage() {
  await requireInventorySession();
  const data = await getComputerDashboard();
  return <ComputerDashboard data={data} />;
}
