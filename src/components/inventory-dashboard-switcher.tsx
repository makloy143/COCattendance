"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  INVENTORY_DASHBOARDS,
  inventoryDashboardIdFromPath,
} from "@/lib/id-maintenance";

export function InventoryDashboardSwitcher({
  tone = "default",
}: {
  tone?: "default" | "inverse";
}) {
  const pathname = usePathname();
  const current = inventoryDashboardIdFromPath(pathname);
  const inverse = tone === "inverse";

  return (
    <div className="space-y-1">
      <p
        className={cn(
          "px-2 text-[11px] font-semibold uppercase tracking-wide",
          inverse ? "text-white/60" : "text-muted-foreground"
        )}
      >
        Dashboards
      </p>
      {INVENTORY_DASHBOARDS.map((dashboard) => {
        const active = dashboard.id === current;
        if (!dashboard.available) {
          return (
            <div
              key={dashboard.id}
              className={cn(
                "flex items-center justify-between rounded-md px-2 py-1.5 text-sm",
                inverse ? "text-white/45" : "text-muted-foreground"
              )}
              title={dashboard.description}
            >
              <span>{dashboard.label}</span>
              <span className="text-[10px] font-medium uppercase">Soon</span>
            </div>
          );
        }

        return (
          <Link
            key={dashboard.id}
            href={dashboard.href}
            className={cn(
              "flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors",
              inverse
                ? active
                  ? "bg-white/15 font-medium text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
                : active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
            title={dashboard.description}
          >
            <span>{dashboard.label}</span>
            {active ? (
              <span className="text-[10px] font-medium uppercase">Current</span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
