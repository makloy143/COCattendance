import { InkDashboard } from "@/components/ink-dashboard";
import { requireInventorySession } from "@/lib/inventory-auth";
import { getInkDashboard } from "@/lib/ink-dashboard-data";

export const dynamic = "force-dynamic";

export default async function InksPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireInventorySession();
  const params = await searchParams;
  const view = await getInkDashboard(params.from, params.to);
  return <InkDashboard view={view} />;
}
