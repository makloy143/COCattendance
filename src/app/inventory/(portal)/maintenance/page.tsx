"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Clock,
  Download,
  PackageX,
  Plus,
  Search,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { ButtonLink } from "@/components/button-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResponsiveTableShell } from "@/components/responsive-table-shell";
import { InventoryStatCard } from "@/components/inventory-stat-card";
import { MaintenanceCharts } from "@/components/maintenance-charts";
import { MaintenancePriorityBadge } from "@/components/maintenance-priority-badge";
import { MaintenanceStatusBadge } from "@/components/maintenance-status-badge";
import { UpdateMaintenanceStatusDialog } from "@/components/update-maintenance-status-dialog";
import { formatDate } from "@/lib/date-utils";
import {
  EQUIPMENT_TYPES,
  MAINTENANCE_LOCATIONS,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_STATUSES,
  type MaintenanceRecordDto,
  type MaintenanceStats,
} from "@/lib/maintenance-shared";

const emptyStats: MaintenanceStats = {
  total: 0,
  open: 0,
  underRepair: 0,
  completed: 0,
  awaitingParts: 0,
  unrepairable: 0,
  diagnosing: 0,
  awaitingVendor: 0,
  cancelled: 0,
  byStatus: [],
  byEquipmentType: [],
  byLocation: [],
  monthly: [],
};

export default function MaintenancePage() {
  const [records, setRecords] = useState<MaintenanceRecordDto[]>([]);
  const [stats, setStats] = useState<MaintenanceStats>(emptyStats);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [equipmentFilter, setEquipmentFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusRecord, setStatusRecord] = useState<MaintenanceRecordDto | null>(
    null
  );
  const [exporting, setExporting] = useState(false);

  const hasFilters =
    Boolean(search) ||
    statusFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    equipmentFilter !== "ALL" ||
    locationFilter !== "ALL" ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (priorityFilter !== "ALL") params.set("priority", priorityFilter);
    if (equipmentFilter !== "ALL") params.set("equipmentType", equipmentFilter);
    if (locationFilter !== "ALL") params.set("location", locationFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    return params.toString();
  }, [
    search,
    statusFilter,
    priorityFilter,
    equipmentFilter,
    locationFilter,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [recordsResponse, statsResponse] = await Promise.all([
          fetch(`/api/inventory/maintenance?${queryString}`),
          fetch(`/api/inventory/maintenance/stats?${queryString}`),
        ]);
        const recordsData = await recordsResponse.json();
        const statsData = await statsResponse.json();
        setRecords(Array.isArray(recordsData) ? recordsData : []);
        if (statsResponse.ok) setStats(statsData);
      } catch {
        toast.error("Failed to load maintenance records");
      } finally {
        setLoading(false);
      }
    }

    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [queryString]);

  function clearFilters() {
    setSearch("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setEquipmentFilter("ALL");
    setLocationFilter("ALL");
    setDateFrom("");
    setDateTo("");
  }

  async function handleDelete(record: MaintenanceRecordDto) {
    if (
      !confirm(
        `Delete maintenance record ${record.maintenanceNumber}? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/inventory/maintenance/${record.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Failed to delete maintenance record");
        return;
      }
      toast.success("Maintenance record deleted successfully.");
      setRecords((current) => current.filter((item) => item.id !== record.id));
      setStats((current) => ({
        ...current,
        total: Math.max(0, current.total - 1),
      }));
    } catch {
      toast.error("Failed to delete maintenance record");
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const response = await fetch(
        `/api/inventory/maintenance/export?${queryString}`
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to export records");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "maintenance-records.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to export records");
    } finally {
      setExporting(false);
    }
  }

  const countLabel = loading
    ? "Loading..."
    : `${records.length} record${records.length === 1 ? "" : "s"}`;

  const summaryCards = [
    {
      title: "Total Issues",
      value: stats.total,
      icon: Wrench,
      description: "All maintenance records",
      accent: "violet" as const,
    },
    {
      title: "Open Issues",
      value: stats.open,
      icon: CircleDot,
      description: "Open or diagnosing",
      accent: "orange" as const,
    },
    {
      title: "Under Repair",
      value: stats.underRepair,
      icon: Clock,
      description: "Currently being repaired",
      accent: "amber" as const,
    },
    {
      title: "Completed",
      value: stats.completed,
      icon: CheckCircle2,
      description: "Repairs finished",
      accent: "emerald" as const,
    },
    {
      title: "Awaiting Parts",
      value: stats.awaitingParts,
      icon: AlertTriangle,
      description: "Waiting for replacement parts",
      accent: "cyan" as const,
    },
    {
      title: "Unrepairable",
      value: stats.unrepairable,
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
            Maintenance
          </h1>
          <p className="text-sm text-muted-foreground">
            Log and monitor broken, damaged, or malfunctioning equipment ·{" "}
            {countLabel}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleExport()}
            disabled={exporting || loading}
          >
            <Download className="size-4" />
            {exporting ? "Exporting..." : "Export CSV"}
          </Button>
          <ButtonLink href="/inventory/maintenance/new">
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

      <MaintenanceCharts stats={stats} />

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, asset, item, problem, reporter..."
              className="pl-9"
            />
          </div>
          {hasFilters && (
            <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <select
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All statuses</option>
            {MAINTENANCE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {MAINTENANCE_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <select
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="ALL">All priorities</option>
            {MAINTENANCE_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {MAINTENANCE_PRIORITY_LABELS[priority]}
              </option>
            ))}
          </select>
          <select
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            value={equipmentFilter}
            onChange={(e) => setEquipmentFilter(e.target.value)}
          >
            <option value="ALL">All equipment</option>
            {EQUIPMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="ALL">All locations</option>
            {MAINTENANCE_LOCATIONS.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label="From date"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label="To date"
            />
          </div>
        </div>
      </div>

      {!loading && records.length === 0 ? (
        <p className="rounded-xl border bg-card py-10 text-center text-sm text-muted-foreground">
          No maintenance records found.
        </p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {records.map((record) => (
              <div
                key={record.id}
                className="rounded-xl border border-l-4 border-l-violet-500 bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {record.maintenanceNumber}
                    </p>
                    <p className="font-medium">{record.itemName}</p>
                    <p className="text-xs text-muted-foreground">
                      {record.assetNumber} · {record.location}
                    </p>
                  </div>
                  <MaintenanceStatusBadge status={record.status} />
                </div>
                <p className="mt-2 text-sm">{record.problem}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <MaintenancePriorityBadge priority={record.priority} />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(record.dateReported)}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <ButtonLink
                    href={`/inventory/maintenance/${record.id}`}
                    variant="outline"
                    size="sm"
                  >
                    View
                  </ButtonLink>
                  <ButtonLink
                    href={`/inventory/maintenance/${record.id}/edit`}
                    variant="outline"
                    size="sm"
                  >
                    Edit
                  </ButtonLink>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setStatusRecord(record)}
                  >
                    Update Status
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => void handleDelete(record)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <ResponsiveTableShell
            className="hidden md:block"
            minWidthClassName="min-w-[1200px]"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Maintenance ID</TableHead>
                  <TableHead>Asset/Item</TableHead>
                  <TableHead>Equipment Type</TableHead>
                  <TableHead>Asset Number</TableHead>
                  <TableHead>Problem</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reported By</TableHead>
                  <TableHead>Date Reported</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Date Completed</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.maintenanceNumber}
                    </TableCell>
                    <TableCell>{record.itemName}</TableCell>
                    <TableCell>{record.equipmentType}</TableCell>
                    <TableCell>{record.assetNumber}</TableCell>
                    <TableCell className="max-w-[180px] truncate">
                      {record.problem}
                    </TableCell>
                    <TableCell>{record.location}</TableCell>
                    <TableCell>
                      <MaintenancePriorityBadge priority={record.priority} />
                    </TableCell>
                    <TableCell>
                      <MaintenanceStatusBadge status={record.status} />
                    </TableCell>
                    <TableCell>{record.reportedBy}</TableCell>
                    <TableCell>{formatDate(record.dateReported)}</TableCell>
                    <TableCell>{record.assignedTechnician ?? "—"}</TableCell>
                    <TableCell>
                      {record.dateCompleted
                        ? formatDate(record.dateCompleted)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <ButtonLink
                          href={`/inventory/maintenance/${record.id}`}
                          variant="ghost"
                          size="xs"
                        >
                          View
                        </ButtonLink>
                        <ButtonLink
                          href={`/inventory/maintenance/${record.id}/edit`}
                          variant="ghost"
                          size="xs"
                        >
                          Edit
                        </ButtonLink>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => setStatusRecord(record)}
                        >
                          Status
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => void handleDelete(record)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ResponsiveTableShell>
        </>
      )}

      <UpdateMaintenanceStatusDialog
        record={statusRecord}
        open={Boolean(statusRecord)}
        onOpenChange={(open) => {
          if (!open) setStatusRecord(null);
        }}
        onSuccess={(updated) => {
          setRecords((current) =>
            current.map((item) => (item.id === updated.id ? updated : item))
          );
        }}
      />
    </div>
  );
}
