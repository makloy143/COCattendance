import Link from "next/link";
import {
  ArrowLeftRight,
  BarChart3,
  Droplets,
  IdCard,
  Package,
  AlertTriangle,
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
    analytics,
    recentReceived,
    recentBorrows,
    recentIdErrors,
  ] = await Promise.all([
    prisma.receivedItem.count(),
    prisma.borrowRecord.count({
      where: { status: "ACTIVE", receivedItem: { itemType: "EQUIPMENT" } },
    }),
    prisma.idErrorRecord.count({ where: { status: "REPRINT" } }),
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
    inkStockCount: analytics.allStock.filter((s) => s.category === "INK")
      .length,
    lowInkAlerts: analytics.summary.lowInkColors,
    needsRestock: analytics.summary.needsRestock,
    netOnHand: analytics.summary.netOnHand,
    restockRecommendations: analytics.restockRecommendations,
    recentReceived,
    recentBorrows,
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
  ];

  const quickActions = [
    { href: "/inventory/received/new", label: "Log Received Item" },
    { href: "/inventory/received/release", label: "Release Item" },
    { href: "/inventory/borrows/new", label: "Borrow Item" },
    { href: "/inventory/returns", label: "Item Return" },
    { href: "/inventory/id-errors/new", label: "Log ID Error" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Inventory Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Overview of received items, borrows, and ID errors
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <InventoryStatCard key={stat.title} {...stat} />
        ))}
      </div>

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

      <div className="grid gap-4 lg:grid-cols-3">
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
