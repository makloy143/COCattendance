import { InkDashboard } from "@/components/ink-dashboard";
import { requireInventorySession } from "@/lib/inventory-auth";
import { ID_PERIOD_LABELS, parseIdPeriod } from "@/lib/id-maintenance";
import { getInkDashboard } from "@/lib/ink-dashboard-data";

export const dynamic = "force-dynamic";

export default async function InksPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireInventorySession();
  const params = await searchParams;
  const period = parseIdPeriod(params.period);
  const view = await getInkDashboard(period);
  return <InkDashboard view={view} periodLabel={ID_PERIOD_LABELS[period]} />;
}
