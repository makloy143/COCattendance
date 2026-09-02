import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  Droplets,
  IdCard,
  Package,
  Wrench,
} from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RestockRecommendationsCard } from "@/components/inventory-analytics-cards";
import { InventoryStatCard } from "@/components/inventory-stat-card";
import { requireInventorySession } from "@/lib/inventory-auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/date-utils";
import {
  formatDateTime,
  formatItemDescription,
} from "@/lib/inventory";
import { getInventoryAnalyticsData } from "@/lib/inventory-analytics";
import { BorrowStatusBadge } from "@/components/borrow-status-badge";

async function getInventoryDashboardData() {
  const [
    totalReceivedItems,
    activeBorrows,
    pendingIdErrors,
    maintenanceTotal,
    maintenanceOpen,
    maintenanceUnderRepair,
    maintenanceCompleted,
    maintenanceUnrepairable,
    analytics,
    recentReceived,
    recentBorrows,
    recentReleases,
    recentIdErrors,
  ] = await Promise.all([
    prisma.receivedItem.count(),
    prisma.borrowRecord.count({
      where: { status: "ACTIVE", receivedItem: { itemType: "EQUIPMENT" } },
    }),
    prisma.idErrorRecord.count({ where: { status: "REPRINT" } }),
    prisma.maintenanceRecord.count(),
    prisma.maintenanceRecord.count({
      where: { status: { in: ["OPEN", "DIAGNOSING"] } },
    }),
    prisma.maintenanceRecord.count({ where: { status: "UNDER_REPAIR" } }),
    prisma.maintenanceRecord.count({ where: { status: "COMPLETED" } }),
    prisma.maintenanceRecord.count({ where: { status: "UNREPAIRABLE" } }),
    getInventoryAnalyticsData(),
    prisma.receivedItem.findMany({
      orderBy: [{ dateReceived: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
    prisma.borrowRecord.findMany({
      where: { status: "ACTIVE", receivedItem: { itemType: "EQUIPMENT" } },
      orderBy: [{ dateBorrowed: "desc" }, { createdAt: "desc" }],
      take: 5,
      include: {
        receivedItem: {
          select: {
            itemName: true,
            brand: true,
            model: true,
            color: true,
            serialNumber: true,
          },
        },
      },
    }),
    prisma.borrowRecord.findMany({
      where: { receivedItem: { itemType: "CONSUMABLE" } },
      orderBy: [{ dateBorrowed: "desc" }, { createdAt: "desc" }],
      take: 5,
      include: {
        receivedItem: {
          select: {
            itemName: true,
            brand: true,
            model: true,
            color: true,
            serialNumber: true,
          },
        },
      },
    }),
    prisma.idErrorRecord.findMany({
      where: { status: "REPRINT" },
      orderBy: [{ datePrintedError: "desc" }],
      take: 5,
    }),
  ]);

  return {
    totalReceivedItems,
    activeBorrows,
    pendingIdErrors,
    maintenanceTotal,
    maintenanceOpen,
    maintenanceUnderRepair,
    maintenanceCompleted,
    maintenanceUnrepairable,
    inkStockCount: analytics.allStock.filter((s) => s.category === "INK")
      .length,
    lowInkAlerts: analytics.summary.lowInkColors,
    needsRestock: analytics.summary.needsRestock,
    netOnHand: analytics.summary.netOnHand,
    restockRecommendations: analytics.restockRecommendations,
    recentReceived,
    recentBorrows,
    recentReleases,
    recentIdErrors,
  };
}

export default async function InventoryDashboardPage() {
  await requireInventorySession();
  const data = await getInventoryDashboardData();

  const stats = [
    {
      title: "Received Items",
      value: data.totalReceivedItems,
      icon: Package,
      description: "Items logged from COC Main",
      accent: "emerald" as const,
    },
    {
      title: "Ink Stock Types",
      value: data.inkStockCount,
      icon: Droplets,
      description: "Distinct ink models in stock",
      accent: "cyan" as const,
    },
    {
      title: "Active Borrows",
      value: data.activeBorrows,
      icon: ArrowLeftRight,
      description: "Equipment currently out",
      accent: "amber" as const,
    },
    {
      title: "Pending ID Reprints",
      value: data.pendingIdErrors,
      icon: IdCard,
      description: "ID errors awaiting reprint",
      accent: "red" as const,
    },
    {
      title: "Needs Restock",
      value: data.needsRestock,
      icon: AlertTriangle,
      description: "Items at or below threshold",
      accent: "orange" as const,
    },
    {
      title: "Net On Hand",
      value: data.netOnHand,
      icon: BarChart3,
      description: "Total consumable units available",
      accent: "cyan" as const,
    },
    {
      title: "Maintenance Issues",
      value: data.maintenanceTotal,
      icon: Wrench,
      description: `${data.maintenanceOpen} open · ${data.maintenanceUnderRepair} under repair`,
      accent: "violet" as const,
    },
  ];

  const quickActions = [
    { href: "/inventory/received/new", label: "Log Received Item" },
    { href: "/inventory/received/release", label: "Release Item" },
    { href: "/inventory/releases", label: "Release Logs" },
    { href: "/inventory/borrows/new", label: "Borrow Item" },
    { href: "/inventory/returns", label: "Item Return" },
    { href: "/inventory/id-errors/new", label: "Log ID Error" },
    { href: "/inventory/maintenance/new", label: "Report Issue" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Inventory Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Overview of received items, borrows, ID errors, and maintenance
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stats.map((stat) => (
          <InventoryStatCard key={stat.title} {...stat} />
        ))}
      </div>

      <Card className="border-l-4 border-l-violet-500">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Maintenance Issues</CardTitle>
          <Link
            href="/inventory/maintenance"
            className="text-xs text-primary hover:underline"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Open</p>
            <p className="text-xl font-semibold">{data.maintenanceOpen}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Under Repair</p>
            <p className="text-xl font-semibold">{data.maintenanceUnderRepair}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-xl font-semibold">{data.maintenanceCompleted}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Unrepairable</p>
            <p className="text-xl font-semibold">
              {data.maintenanceUnrepairable}
            </p>
          </div>
        </CardContent>
      </Card>

      <RestockRecommendationsCard
        recommendations={data.restockRecommendations}
        limit={5}
      />

      {data.restockRecommendations.length > 5 && (
        <div className="flex justify-end">
          <ButtonLink href="/inventory/analytics" variant="outline" size="sm">
            View all {data.restockRecommendations.length} restock alerts
          </ButtonLink>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <ButtonLink key={action.href} href={action.href} variant="outline" size="sm">
              {action.label}
            </ButtonLink>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Received</CardTitle>
            <Link
              href="/inventory/received"
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentReceived.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No received items yet.
              </p>
            ) : (
              <div className="space-y-3">
                {data.recentReceived.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-l-4 border-l-emerald-500 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.itemName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatItemDescription(item)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.senderName} · {formatDate(item.dateReceived)}
                      </p>
                    </div>
                    <Package className="size-4 shrink-0 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Active Borrows</CardTitle>
            <Link
              href="/inventory/returns"
              className="text-xs text-primary hover:underline"
            >
              Process returns
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentBorrows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active borrows right now.
              </p>
            ) : (
              <div className="space-y-3">
                {data.recentBorrows.map((borrow) => (
                  <div
                    key={borrow.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-l-4 border-l-amber-500 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{borrow.borrowerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {borrow.department} ·{" "}
                        {formatItemDescription(borrow.receivedItem)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(borrow.dateBorrowed, borrow.timeBorrowed)}
                      </p>
                    </div>
                    <BorrowStatusBadge status={borrow.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Releases</CardTitle>
            <Link
              href="/inventory/releases"
              className="text-xs text-primary hover:underline"
            >
              View logs
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentReleases.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No item releases logged yet.
              </p>
            ) : (
              <div className="space-y-3">
                {data.recentReleases.map((release) => (
                  <div
                    key={release.id}
                    className="rounded-lg border border-l-4 border-l-cyan-500 p-3"
                  >
                    <p className="truncate font-medium">
                      {formatItemDescription(release.receivedItem)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {release.borrowerName} · {release.department} · qty{" "}
                      {release.quantityBorrowed}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(release.dateBorrowed, release.timeBorrowed)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Pending ID Reprints</CardTitle>
            <Link
              href="/inventory/id-errors"
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentIdErrors.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pending ID reprints.
              </p>
            ) : (
              <div className="space-y-3">
                {data.recentIdErrors.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-lg border border-l-4 border-l-yellow-500 p-3"
                  >
                    <p className="truncate font-medium">{record.personName}</p>
                    <p className="text-xs text-muted-foreground">
                      {record.course} · {record.idNumber}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {record.reason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
