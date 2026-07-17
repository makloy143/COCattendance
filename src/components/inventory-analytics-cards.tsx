import {
  AlertTriangle,
  CheckCircle2,
  PackageX,
  ShoppingCart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  INK_COLOR_BADGE_CLASSES,
  getInkColorLabel,
  getItemCategoryLabel,
  type InkColor,
} from "@/lib/inventory";
import type {
  ConsumableStockSummary,
  InkColorNetSummary,
  StockLevel,
} from "@/lib/inventory-analytics";
import { cn } from "@/lib/utils";

const STOCK_LEVEL_CONFIG: Record<
  StockLevel,
  { label: string; badgeClass: string; borderClass: string }
> = {
  critical: {
    label: "Out of Stock",
    badgeClass: "bg-red-600 text-white border-red-700",
    borderClass: "border-l-red-500",
  },
  low: {
    label: "Low Stock",
    badgeClass: "bg-orange-500 text-white border-orange-600",
    borderClass: "border-l-orange-500",
  },
  ok: {
    label: "In Stock",
    badgeClass: "bg-emerald-600 text-white border-emerald-700",
    borderClass: "border-l-emerald-500",
  },
};

function StockLevelBadge({ level }: { level: StockLevel }) {
  const config = STOCK_LEVEL_CONFIG[level];
  return (
    <Badge variant="outline" className={cn("shrink-0", config.badgeClass)}>
      {config.label}
    </Badge>
  );
}

function StockMeter({
  remaining,
  totalReceived,
}: {
  remaining: number;
  totalReceived: number;
}) {
  const pct =
    totalReceived > 0
      ? Math.min(100, Math.round((remaining / totalReceived) * 100))
      : 0;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{remaining} on hand</span>
        <span>{totalReceived} received</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct <= 10
              ? "bg-red-500"
              : pct <= 30
                ? "bg-orange-500"
                : "bg-emerald-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function RestockRecommendationsCard({
  recommendations,
  limit,
  showEmpty = true,
}: {
  recommendations: ConsumableStockSummary[];
  limit?: number;
  showEmpty?: boolean;
}) {
  const items = limit ? recommendations.slice(0, limit) : recommendations;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingCart className="size-4 text-orange-500" />
          Restock Recommendations
        </CardTitle>
        {recommendations.length > 0 && (
          <Badge variant="outline" className="bg-orange-50 text-orange-700">
            {recommendations.length} item
            {recommendations.length !== 1 ? "s" : ""} need attention
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          showEmpty ? (
            <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
              <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
              <p className="text-sm text-emerald-800 dark:text-emerald-200">
                All consumable supplies are above threshold. No restock needed
                right now.
              </p>
            </div>
          ) : null
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.key}
                className={cn(
                  "rounded-lg border border-l-4 p-3",
                  STOCK_LEVEL_CONFIG[item.stockLevel].borderClass
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.itemName}</p>
                      {item.inkColor && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            INK_COLOR_BADGE_CLASSES[item.inkColor as InkColor]
                          )}
                        >
                          {getInkColorLabel(item.inkColor as InkColor)}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {getItemCategoryLabel(item.category)}
                      </Badge>
                    </div>
                    {(item.model || item.brand) && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {[item.model, item.brand].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <p className="mt-2 text-sm text-muted-foreground">
                      {item.recommendation}
                    </p>
                    <StockMeter
                      remaining={item.remaining}
                      totalReceived={item.totalReceived}
                    />
                  </div>
                  <StockLevelBadge level={item.stockLevel} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function InkColorNetCard({
  inkByColor,
}: {
  inkByColor: InkColorNetSummary[];
}) {
  const needsAttention = inkByColor.filter((c) => c.stockLevel !== "ok");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="size-4 text-cyan-500" />
          Ink Net Stock by Color
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {inkByColor.map((color) => (
            <div
              key={color.inkColor}
              className={cn(
                "rounded-lg border border-l-4 p-3",
                STOCK_LEVEL_CONFIG[color.stockLevel].borderClass
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    {color.inkColor !== "OTHER" && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          INK_COLOR_BADGE_CLASSES[color.inkColor]
                        )}
                      >
                        {color.label}
                      </Badge>
                    )}
                    {color.inkColor === "OTHER" && (
                      <p className="font-medium">{color.label}</p>
                    )}
                  </div>
                  <p className="mt-1 text-2xl font-bold">
                    {color.totalRemaining}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      on hand
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {color.totalReceived} received · {color.totalReleased}{" "}
                    released
                  </p>
                </div>
                <StockLevelBadge level={color.stockLevel} />
              </div>
              {color.recommendation && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {color.recommendation}
                </p>
              )}
              {color.models.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {color.models.map((m, i) => (
                    <Badge
                      key={`${m.model}-${i}`}
                      variant="outline"
                      className="text-xs"
                    >
                      {m.model ?? m.itemName}: {m.remaining}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {needsAttention.length === 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            All ink colors are above the low-stock threshold.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function FullStockTable({
  stock,
}: {
  stock: ConsumableStockSummary[];
}) {
  if (stock.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border p-4">
        <PackageX className="size-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No consumable items logged yet.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-medium">Item</th>
            <th className="px-3 py-2 font-medium">Category</th>
            <th className="px-3 py-2 text-right font-medium">Received</th>
            <th className="px-3 py-2 text-right font-medium">Released</th>
            <th className="px-3 py-2 text-right font-medium">Net On Hand</th>
            <th className="px-3 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {stock.map((item) => (
            <tr key={item.key} className="border-b last:border-0">
              <td className="px-3 py-2">
                <p className="font-medium">{item.itemName}</p>
                {(item.model || item.brand) && (
                  <p className="text-xs text-muted-foreground">
                    {[item.model, item.brand].filter(Boolean).join(" · ")}
                  </p>
                )}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {getItemCategoryLabel(item.category)}
              </td>
              <td className="px-3 py-2 text-right">{item.totalReceived}</td>
              <td className="px-3 py-2 text-right">{item.totalReleased}</td>
              <td className="px-3 py-2 text-right font-medium">
                {item.remaining}
              </td>
              <td className="px-3 py-2">
                <StockLevelBadge level={item.stockLevel} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
