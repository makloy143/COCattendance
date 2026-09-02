"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ASSET_STATUSES,
  ASSET_STATUS_LABELS,
  IT_STAFF_NAMES,
  type AssetStatus,
} from "@/lib/inventory";
import {
  CLOSED_MAINTENANCE_STATUSES,
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_STATUSES,
  type MaintenanceRecordDto,
  type MaintenanceStatusValue,
} from "@/lib/maintenance-shared";

function defaultRestoreHintLocal(status: MaintenanceStatusValue): AssetStatus {
  return status === "UNREPAIRABLE" ? "DAMAGED" : "AVAILABLE";
}

type UpdateMaintenanceStatusDialogProps = {
  record: MaintenanceRecordDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updated: MaintenanceRecordDto) => void;
};

function StatusForm({
  record,
  onOpenChange,
  onSuccess,
}: {
  record: MaintenanceRecordDto;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updated: MaintenanceRecordDto) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<MaintenanceStatusValue>(record.status);
  const [assignedTechnician, setAssignedTechnician] = useState(
    record.assignedTechnician ?? ""
  );
  const [remarks, setRemarks] = useState(record.remarks ?? "");
  const [dateCompleted, setDateCompleted] = useState(
    record.dateCompleted
      ? record.dateCompleted.slice(0, 10)
      : format(new Date(), "yyyy-MM-dd")
  );
  const [restoreAssetStatus, setRestoreAssetStatus] = useState<AssetStatus>(
    defaultRestoreHintLocal(record.status)
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setLoading(true);
    try {
      const response = await fetch(`/api/inventory/maintenance/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          assignedTechnician,
          remarks,
          dateCompleted: status === "COMPLETED" ? dateCompleted : undefined,
          restoreAssetStatus: CLOSED_MAINTENANCE_STATUSES.includes(status)
            ? restoreAssetStatus
            : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Failed to update status");
        return;
      }

      toast.success("Maintenance status updated successfully.");
      onSuccess(data);
      onOpenChange(false);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DialogContent className="sm:max-w-md">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Update Status</DialogTitle>
          <DialogDescription>
            {record.maintenanceNumber} · {record.itemName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="maintenance-status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => {
                if (value) setStatus(value as MaintenanceStatusValue);
              }}
            >
              <SelectTrigger id="maintenance-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MAINTENANCE_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {MAINTENANCE_STATUS_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedTechnician">Assigned technician</Label>
            <Input
              id="assignedTechnician"
              value={assignedTechnician}
              onChange={(e) => setAssignedTechnician(e.target.value)}
              list="it-staff-status-list"
            />
            <datalist id="it-staff-status-list">
              {IT_STAFF_NAMES.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          {status === "COMPLETED" && (
            <div className="space-y-2">
              <Label htmlFor="dateCompleted">Date completed</Label>
              <Input
                id="dateCompleted"
                type="date"
                value={dateCompleted}
                onChange={(e) => setDateCompleted(e.target.value)}
              />
            </div>
          )}

          {CLOSED_MAINTENANCE_STATUSES.includes(status) &&
            record.receivedItemId && (
              <div className="space-y-2">
                <Label htmlFor="restoreAssetStatus">
                  Return inventory status to
                </Label>
                <Select
                  value={restoreAssetStatus}
                  onValueChange={(value) => {
                    if (value) setRestoreAssetStatus(value as AssetStatus);
                  }}
                >
                  <SelectTrigger id="restoreAssetStatus" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_STATUSES.filter(
                      (value) => value !== "UNDER_MAINTENANCE"
                    ).map((value) => (
                      <SelectItem key={value} value={value}>
                        {ASSET_STATUS_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

          <div className="space-y-2">
            <Label htmlFor="status-remarks">Remarks</Label>
            <Textarea
              id="status-remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Update status"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export function UpdateMaintenanceStatusDialog({
  record,
  open,
  onOpenChange,
  onSuccess,
}: UpdateMaintenanceStatusDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {record ? (
        <StatusForm
          key={record.id}
          record={record}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      ) : null}
    </Dialog>
  );
}
