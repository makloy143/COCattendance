import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Clock,
  PackageX,
  Plus,
  Wrench,
} from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryStatCard } from "@/components/inventory-stat-card";
import { MaintenanceCharts } from "@/components/maintenance-charts";
import { MaintenancePriorityBadge } from "@/components/maintenance-priority-badge";
import { MaintenanceStatusBadge } from "@/components/maintenance-status-badge";
import { requireInventorySession } from "@/lib/inventory-auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/date-utils";
import {
  getMaintenanceStats,
  maintenanceItemInclude,
  serializeMaintenance,
} from "@/lib/maintenance";
import { ACTIVE_MAINTENANCE_STATUSES } from "@/lib/maintenance-shared";

async function getMaintenanceDashboardData() {
  const [stats, recentOpen, recentCompleted] = await Promise.all([
    getMaintenanceStats(),
    prisma.maintenanceRecord.findMany({
      where: { status: { in: [...ACTIVE_MAINTENANCE_STATUSES] } },
      include: maintenanceItemInclude,
      orderBy: [{ dateReported: "desc" }, { createdAt: "desc" }],
      take: 6,
    }),
    prisma.maintenanceRecord.findMany({
      where: { status: "COMPLETED" },
      include: maintenanceItemInclude,
      orderBy: [{ dateCompleted: "desc" }, { updatedAt: "desc" }],
      take: 5,
    }),
  ]);

  return {
    stats,
    recentOpen: recentOpen.map(serializeMaintenance),
    recentCompleted: recentCompleted.map(serializeMaintenance),
  };
}

export default async function MaintenanceDashboardPage() {
  await requireInventorySession();
  const data = await getMaintenanceDashboardData();

  const summaryCards = [
    {
      title: "Total Issues",
      value: data.stats.total,
      icon: Wrench,
      description: "All maintenance records",
      accent: "violet" as const,
    },
    {
      title: "Open Issues",
      value: data.stats.open,
      icon: CircleDot,
      description: "Open or diagnosing",
      accent: "orange" as const,
    },
    {
      title: "Under Repair",
      value: data.stats.underRepair,
      icon: Clock,
      description: "Currently being repaired",
      accent: "amber" as const,
    },
    {
      title: "Completed",
      value: data.stats.completed,
      icon: CheckCircle2,
      description: "Repairs finished",
      accent: "emerald" as const,
    },
    {
      title: "Awaiting Parts",
      value: data.stats.awaitingParts,
      icon: AlertTriangle,
      description: "Waiting for replacement parts",
      accent: "cyan" as const,
    },
    {
      title: "Unrepairable",
      value: data.stats.unrepairable,
      icon: PackageX,
      description: "Marked as unrepairable",
      accent: "red" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Maintenance Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor broken, damaged, and malfunctioning equipment
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <ButtonLink href="/maintenance/records" variant="outline">
            View records
          </ButtonLink>
          <ButtonLink href="/maintenance/new">
            <Plus className="size-4" />
            Report Issue
          </ButtonLink>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {summaryCards.map((stat) => (
          <InventoryStatCard key={stat.title} {...stat} />
        ))}
      </div>

      <MaintenanceCharts stats={data.stats} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Open & In Progress</CardTitle>
            <Link
              href="/maintenance/records"
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentOpen.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No open maintenance issues.
              </p>
            ) : (
              <div className="space-y-3">
                {data.recentOpen.map((record) => (
                  <Link
                    key={record.id}
                    href={`/maintenance/${record.id}`}
                    className="block rounded-lg border border-l-4 border-l-violet-500 p-3 hover:bg-muted/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          {record.maintenanceNumber}
                        </p>
                        <p className="truncate font-medium">{record.itemName}</p>
                        <p className="text-xs text-muted-foreground">
                          {record.assetNumber} · {record.location}
                        </p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {record.problem}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <MaintenanceStatusBadge status={record.status} />
                        <MaintenancePriorityBadge priority={record.priority} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recently Completed</CardTitle>
            <Link
              href="/maintenance/records"
              className="text-xs text-primary hover:underline"
            >
              View records
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentCompleted.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No completed repairs yet.
              </p>
            ) : (
              <div className="space-y-3">
                {data.recentCompleted.map((record) => (
                  <Link
                    key={record.id}
                    href={`/maintenance/${record.id}`}
                    className="block rounded-lg border border-l-4 border-l-emerald-500 p-3 hover:bg-muted/40"
                  >
                    <p className="truncate font-medium">{record.itemName}</p>
                    <p className="text-xs text-muted-foreground">
                      {record.maintenanceNumber} · {record.assetNumber}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {record.dateCompleted
                        ? formatDate(record.dateCompleted)
                        : formatDate(record.updatedAt)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
