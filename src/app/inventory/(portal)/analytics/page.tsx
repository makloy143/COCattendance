import Link from "next/link";
import { BarChart3, Package, PackageMinus, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/button-link";
import {
  FullStockTable,
  InkColorNetCard,
  RestockRecommendationsCard,
} from "@/components/inventory-analytics-cards";
import { InventoryStatCard } from "@/components/inventory-stat-card";
import { Badge } from "@/components/ui/badge";
import { requireInventorySession } from "@/lib/inventory-auth";
import { getInventoryAnalyticsData } from "@/lib/inventory-analytics";

export default async function InventoryAnalyticsPage() {
  await requireInventorySession();
  const data = await getInventoryAnalyticsData();

  const stats = [
    {
      title: "Net On Hand",
      value: data.summary.netOnHand,
      icon: Package,
      description: `${data.summary.totalReceived} received · ${data.summary.totalReleased} released`,
      accent: "emerald" as const,
    },
    {
      title: "Needs Restock",
      value: data.summary.needsRestock,
      icon: ShoppingCart,
      description: "Items at or below threshold",
      accent: "orange" as const,
    },
    {
      title: "Out of Stock",
      value: data.summary.criticalCount,
      icon: PackageMinus,
      description: "Items with zero remaining",
      accent: "red" as const,
    },
    {
      title: "Low Ink Colors",
      value: data.summary.lowInkColors,
      icon: BarChart3,
      description: "Ink colors below threshold",
      accent: "cyan" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Inventory Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor net stock levels, track supplies, and get restock
            recommendations
          </p>
        </div>
        <ButtonLink href="/inventory/received/new" variant="outline" size="sm">
          Log Received Item
        </ButtonLink>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <InventoryStatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {data.byCategory.map((cat) => (
          <Card key={cat.category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {cat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cat.totalRemaining}</div>
              <p className="text-xs text-muted-foreground">
                {cat.itemCount} item type{cat.itemCount !== 1 ? "s" : ""} · net
                on hand
              </p>
              {(cat.lowStockCount > 0 || cat.criticalCount > 0) && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {cat.criticalCount > 0 && (
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      {cat.criticalCount} out of stock
                    </Badge>
                  )}
                  {cat.lowStockCount > 0 && (
                    <Badge
                      variant="outline"
                      className="bg-orange-50 text-orange-700"
                    >
                      {cat.lowStockCount} low
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <RestockRecommendationsCard recommendations={data.restockRecommendations} />

      <InkColorNetCard inkByColor={data.inkByColor} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Full Stock Ledger</CardTitle>
          <Link
            href="/inventory/received"
            className="text-xs text-primary hover:underline"
          >
            View received items
          </Link>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-xs text-muted-foreground">
            Net on hand = total received minus total released. Thresholds: Ink ≤
            2, ID Supplies ≤ 5, General ≤ 3.
          </p>
          <FullStockTable stock={data.allStock} />
        </CardContent>
      </Card>
    </div>
  );
}
