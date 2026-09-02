"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ButtonLink } from "@/components/button-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaintenancePriorityBadge } from "@/components/maintenance-priority-badge";
import { MaintenanceStatusBadge } from "@/components/maintenance-status-badge";
import { UpdateMaintenanceStatusDialog } from "@/components/update-maintenance-status-dialog";
import { formatDate, formatDateTime } from "@/lib/date-utils";
import type { MaintenanceRecordDto } from "@/lib/maintenance-shared";

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[160px_1fr] sm:items-start">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="text-sm">{value || "—"}</div>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm whitespace-pre-wrap">
        {children}
      </CardContent>
    </Card>
  );
}

export default function MaintenanceDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [record, setRecord] = useState<MaintenanceRecordDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusOpen, setStatusOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`/api/inventory/maintenance/${params.id}`);
        const data = await response.json();
        if (!response.ok) {
          toast.error(data.error ?? "Failed to load maintenance record");
          setRecord(null);
          return;
        }
        setRecord(data);
      } catch {
        toast.error("Failed to load maintenance record");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [params.id]);

  async function handleDelete() {
    if (!record) return;
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
      router.push("/inventory/maintenance");
      router.refresh();
    } catch {
      toast.error("Failed to delete maintenance record");
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Loading maintenance record...</p>
    );
  }

  if (!record) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Maintenance record not found.
        </p>
        <ButtonLink href="/inventory/maintenance" variant="outline">
          Back to Maintenance
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Maintenance
          </p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {record.maintenanceNumber}
          </h1>
          <p className="text-sm text-muted-foreground">{record.itemName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/inventory/maintenance" variant="outline" size="sm">
            Back
          </ButtonLink>
          <ButtonLink
            href={`/inventory/maintenance/${record.id}/edit`}
            variant="outline"
            size="sm"
          >
            Edit
          </ButtonLink>
          <Button size="sm" variant="outline" onClick={() => setStatusOpen(true)}>
            Update Status
          </Button>
          <Button size="sm" variant="destructive" onClick={() => void handleDelete()}>
            Delete
          </Button>
        </div>
      </div>

      <Card className="border-l-4 border-l-violet-500">
        <CardHeader>
          <CardTitle className="text-base">Equipment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <DetailRow label="Equipment" value={record.itemName} />
          <DetailRow label="Equipment type" value={record.equipmentType} />
          <DetailRow label="Asset number" value={record.assetNumber} />
          <DetailRow label="Serial number" value={record.serialNumber} />
          <DetailRow label="Location" value={record.location} />
          <DetailRow label="Problem" value={record.problem} />
          <DetailRow
            label="Priority"
            value={<MaintenancePriorityBadge priority={record.priority} />}
          />
          <DetailRow
            label="Status"
            value={<MaintenanceStatusBadge status={record.status} />}
          />
          <DetailRow label="Reported by" value={record.reportedBy} />
          <DetailRow
            label="Assigned technician"
            value={record.assignedTechnician}
          />
          <DetailRow
            label="Date reported"
            value={formatDate(record.dateReported)}
          />
          {record.inventoryStatus && (
            <DetailRow
              label="Inventory status"
              value={record.inventoryStatus.label}
            />
          )}
          {record.description && (
            <DetailRow label="Description" value={record.description} />
          )}
        </CardContent>
      </Card>

      {record.diagnosticFindings && (
        <SectionCard title="Diagnostic Findings">
          {record.diagnosticFindings}
        </SectionCard>
      )}
      {record.actionTaken && (
        <SectionCard title="Action Taken">{record.actionTaken}</SectionCard>
      )}
      {record.partsReplaced && (
        <SectionCard title="Parts Replaced">{record.partsReplaced}</SectionCard>
      )}
      {record.remarks && (
        <SectionCard title="Remarks">{record.remarks}</SectionCard>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Repair info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow
              label="Vendor"
              value={record.vendor}
            />
            <DetailRow label="Warranty" value={record.warranty} />
            <DetailRow
              label="Repair cost"
              value={
                record.repairCost !== null && record.repairCost !== undefined
                  ? `₱${Number(record.repairCost).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}`
                  : "—"
              }
            />
            <DetailRow
              label="Date sent for repair"
              value={
                record.dateSentForRepair
                  ? formatDate(record.dateSentForRepair)
                  : "—"
              }
            />
            <DetailRow
              label="Date completed"
              value={
                record.dateCompleted ? formatDate(record.dateCompleted) : "—"
              }
            />
          </CardContent>
        </Card>

        {record.hasAttachment && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attachment / Photo</CardTitle>
            </CardHeader>
            <CardContent>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/inventory/maintenance/${record.id}/attachment`}
                alt={record.attachmentName ?? "Maintenance attachment"}
                className="max-h-72 rounded-lg border object-contain"
              />
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">History / Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {!record.events || record.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No timeline events yet.</p>
          ) : (
            <ol className="relative space-y-4 border-l border-border pl-5">
              {record.events.map((event, index) => (
                <li key={event.id} className="relative">
                  <span className="absolute top-1.5 -left-[27px] size-3 rounded-full border-2 border-background bg-violet-500" />
                  <p className="text-sm font-medium">{event.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(event.createdAt)}
                    {event.createdBy ? ` · ${event.createdBy}` : ""}
                  </p>
                  {index < (record.events?.length ?? 0) - 1 && (
                    <p className="mt-1 text-[10px] tracking-widest text-muted-foreground uppercase">
                      ↓
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <UpdateMaintenanceStatusDialog
        record={record}
        open={statusOpen}
        onOpenChange={setStatusOpen}
        onSuccess={setRecord}
      />
    </div>
  );
}
