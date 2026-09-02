"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ASSET_STATUS_LABELS,
  IT_STAFF_NAMES,
  getItemCategoryLabel,
  type AssetStatus,
  type ItemCategory,
  type ItemType,
} from "@/lib/inventory";
import {
  EQUIPMENT_TYPES,
  guessEquipmentType,
  MAINTENANCE_LOCATIONS,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_STATUSES,
  WARRANTY_PRESETS,
  type MaintenancePriorityValue,
  type MaintenanceRecordDto,
  type MaintenanceStatusValue,
} from "@/lib/maintenance-shared";
import type { MaintenanceRecordFormValues } from "@/lib/validations";

type InventorySearchItem = {
  id: string;
  itemName: string;
  itemType: ItemType;
  category: ItemCategory;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  receivedByDepartment: string;
  assetStatus?: AssetStatus;
  displayAssetStatus?: { key: string; label: string };
};

type MaintenanceFormProps = {
  mode?: "create" | "edit";
  record?: MaintenanceRecordDto;
};

function toDateInput(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function emptyValues(): MaintenanceRecordFormValues {
  return {
    receivedItemId: "",
    itemName: "",
    equipmentType: "Desktop Computer",
    assetNumber: "",
    serialNumber: "",
    problem: "",
    description: "",
    dateReported: format(new Date(), "yyyy-MM-dd"),
    reportedBy: "",
    location: MAINTENANCE_LOCATIONS[0] ?? "ITSD",
    priority: "MEDIUM",
    status: "OPEN",
    assignedTechnician: "",
    diagnosticFindings: "",
    actionTaken: "",
    partsReplaced: "",
    repairCost: "",
    dateSentForRepair: "",
    dateCompleted: "",
    vendor: "",
    warranty: "",
    remarks: "",
  };
}

function valuesFromRecord(
  record: MaintenanceRecordDto
): MaintenanceRecordFormValues {
  return {
    receivedItemId: record.receivedItemId ?? "",
    itemName: record.itemName,
    equipmentType: record.equipmentType,
    assetNumber: record.assetNumber,
    serialNumber: record.serialNumber ?? "",
    problem: record.problem,
    description: record.description ?? "",
    dateReported: toDateInput(record.dateReported),
    reportedBy: record.reportedBy,
    location: record.location,
    priority: record.priority,
    status: record.status,
    assignedTechnician: record.assignedTechnician ?? "",
    diagnosticFindings: record.diagnosticFindings ?? "",
    actionTaken: record.actionTaken ?? "",
    partsReplaced: record.partsReplaced ?? "",
    repairCost: record.repairCost ?? "",
    dateSentForRepair: toDateInput(record.dateSentForRepair),
    dateCompleted: toDateInput(record.dateCompleted),
    vendor: record.vendor ?? "",
    warranty: record.warranty ?? "",
    remarks: record.remarks ?? "",
  };
}

async function fileToAttachment(file: File) {
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
  return {
    data,
    mimeType: file.type,
    name: file.name,
  };
}

export function MaintenanceForm({
  mode = "create",
  record,
}: MaintenanceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<MaintenanceRecordFormValues>(
    record ? valuesFromRecord(record) : emptyValues()
  );
  const [itemQuery, setItemQuery] = useState("");
  const [itemResults, setItemResults] = useState<InventorySearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventorySearchItem | null>(
    null
  );
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);

  useEffect(() => {
    if (itemQuery.length < 2) {
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(
          `/api/inventory/received?itemType=EQUIPMENT&search=${encodeURIComponent(itemQuery)}`
        );
        const data = await response.json();
        setItemResults(Array.isArray(data) ? data : []);
      } catch {
        setItemResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [itemQuery]);

  function updateField<K extends keyof MaintenanceRecordFormValues>(
    field: K,
    value: MaintenanceRecordFormValues[K]
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function selectItem(item: InventorySearchItem) {
    setSelectedItem(item);
    setValues((current) => ({
      ...current,
      receivedItemId: item.id,
      itemName: item.itemName,
      equipmentType: guessEquipmentType(item.itemName),
      assetNumber: item.serialNumber ?? current.assetNumber,
      serialNumber: item.serialNumber ?? "",
      location: item.receivedByDepartment || current.location,
    }));
    setItemQuery("");
    setItemResults([]);
  }

  function clearSelectedItem() {
    setSelectedItem(null);
    updateField("receivedItemId", "");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    try {
      const payload: MaintenanceRecordFormValues & {
        attachment?: {
          data: string;
          mimeType: string;
          name?: string;
        } | null;
      } = { ...values };

      if (attachmentFile) {
        payload.attachment = await fileToAttachment(attachmentFile);
      } else if (mode === "edit" && removeAttachment) {
        payload.attachment = null;
      }

      const response = await fetch(
        mode === "edit" && record
          ? `/api/inventory/maintenance/${record.id}`
          : "/api/inventory/maintenance",
        {
          method: mode === "edit" ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        toast.error(
          data.error ??
            (mode === "edit"
              ? "Failed to update maintenance record"
              : "Failed to report maintenance issue")
        );
        return;
      }

      toast.success(
        mode === "edit"
          ? "Maintenance record updated successfully."
          : "Maintenance issue reported successfully."
      );
      router.push(
        mode === "edit" && record
          ? `/inventory/maintenance/${record.id}`
          : "/inventory/maintenance"
      );
      router.refresh();
    } catch {
      toast.error(
        mode === "edit"
          ? "Failed to update maintenance record"
          : "Failed to report maintenance issue"
      );
    } finally {
      setLoading(false);
    }
  }

  const inventoryStatusLabel =
    selectedItem?.displayAssetStatus?.label ??
    (selectedItem?.assetStatus
      ? ASSET_STATUS_LABELS[selectedItem.assetStatus]
      : record?.inventoryStatus?.label);

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <Card className="border-l-4 border-l-violet-500">
        <CardHeader>
          <CardTitle>Select inventory item</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={itemQuery}
              onChange={(e) => {
                const value = e.target.value;
                setItemQuery(value);
                if (value.length < 2) setItemResults([]);
              }}
              placeholder="Search inventory item..."
              className="pl-9"
            />
          </div>
          {searching && (
            <p className="text-xs text-muted-foreground">Searching...</p>
          )}
          {itemResults.length > 0 && (
            <div className="rounded-lg border bg-background">
              {itemResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="flex w-full flex-col items-start gap-0.5 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted"
                  onClick={() => selectItem(item)}
                >
                  <span className="font-medium">{item.itemName}</span>
                  <span className="text-xs text-muted-foreground">
                    {[
                      item.serialNumber ? `Asset/SN: ${item.serialNumber}` : null,
                      item.receivedByDepartment,
                      item.displayAssetStatus?.label,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </button>
              ))}
            </div>
          )}

          {(selectedItem || values.receivedItemId) && (
            <div className="rounded-lg border border-l-4 border-l-violet-500 bg-muted/30 p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-medium">{values.itemName}</p>
                  <p className="text-xs text-muted-foreground">
                    Asset No: {values.assetNumber || "—"}
                    {values.serialNumber
                      ? ` · Serial No: ${values.serialNumber}`
                      : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Location: {values.location || "—"}
                    {selectedItem?.category
                      ? ` · ${getItemCategoryLabel(selectedItem.category)}`
                      : ""}
                  </p>
                  {inventoryStatusLabel && (
                    <Badge variant="outline">{inventoryStatusLabel}</Badge>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSelectedItem}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Search an existing equipment record, or enter details manually below.
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-violet-500/60">
        <CardHeader>
          <CardTitle>Issue details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="itemName">Asset / Item</Label>
            <Input
              id="itemName"
              value={values.itemName}
              onChange={(e) => updateField("itemName", e.target.value)}
              placeholder="e.g. HP Desktop Computer"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipmentType">Equipment type</Label>
            <Select
              value={values.equipmentType}
              onValueChange={(value) => {
                if (value) updateField("equipmentType", value);
              }}
            >
              <SelectTrigger id="equipmentType" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EQUIPMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assetNumber">Asset / Inventory number</Label>
            <Input
              id="assetNumber"
              value={values.assetNumber}
              onChange={(e) => updateField("assetNumber", e.target.value)}
              placeholder="e.g. COMLAB1-PC-023"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serialNumber">Serial number</Label>
            <Input
              id="serialNumber"
              value={values.serialNumber ?? ""}
              onChange={(e) => updateField("serialNumber", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={values.location}
              onChange={(e) => updateField("location", e.target.value)}
              list="maintenance-locations"
              required
            />
            <datalist id="maintenance-locations">
              {MAINTENANCE_LOCATIONS.map((location) => (
                <option key={location} value={location} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="problem">Problem / Issue</Label>
            <Input
              id="problem"
              value={values.problem}
              onChange={(e) => updateField("problem", e.target.value)}
              placeholder="e.g. Computer does not power on"
              required
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={values.description ?? ""}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              placeholder="Additional details about the issue"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={values.priority}
              onValueChange={(value) => {
                if (value) {
                  updateField("priority", value as MaintenancePriorityValue);
                }
              }}
            >
              <SelectTrigger id="priority" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MAINTENANCE_PRIORITIES.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {MAINTENANCE_PRIORITY_LABELS[priority]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={values.status}
              onValueChange={(value) => {
                if (value) {
                  updateField("status", value as MaintenanceStatusValue);
                }
              }}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MAINTENANCE_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {MAINTENANCE_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reportedBy">Reported by</Label>
            <Input
              id="reportedBy"
              value={values.reportedBy}
              onChange={(e) => updateField("reportedBy", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateReported">Date reported</Label>
            <Input
              id="dateReported"
              type="date"
              value={values.dateReported}
              onChange={(e) => updateField("dateReported", e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Repair details (optional)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="assignedTechnician">Assigned technician</Label>
            <Input
              id="assignedTechnician"
              value={values.assignedTechnician ?? ""}
              onChange={(e) =>
                updateField("assignedTechnician", e.target.value)
              }
              list="it-staff-maintenance-list"
            />
            <datalist id="it-staff-maintenance-list">
              {IT_STAFF_NAMES.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor / Service center</Label>
            <Input
              id="vendor"
              value={values.vendor ?? ""}
              onChange={(e) => updateField("vendor", e.target.value)}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="diagnosticFindings">Diagnostic findings</Label>
            <Textarea
              id="diagnosticFindings"
              value={values.diagnosticFindings ?? ""}
              onChange={(e) =>
                updateField("diagnosticFindings", e.target.value)
              }
              rows={3}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="actionTaken">Action taken</Label>
            <Textarea
              id="actionTaken"
              value={values.actionTaken ?? ""}
              onChange={(e) => updateField("actionTaken", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="partsReplaced">Parts replaced</Label>
            <Input
              id="partsReplaced"
              value={values.partsReplaced ?? ""}
              onChange={(e) => updateField("partsReplaced", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="repairCost">Repair cost</Label>
            <Input
              id="repairCost"
              type="number"
              min="0"
              step="0.01"
              value={values.repairCost ?? ""}
              onChange={(e) => updateField("repairCost", e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="warranty">Warranty</Label>
            <Input
              id="warranty"
              value={values.warranty ?? ""}
              onChange={(e) => updateField("warranty", e.target.value)}
              list="warranty-presets"
            />
            <datalist id="warranty-presets">
              {WARRANTY_PRESETS.map((preset) => (
                <option key={preset} value={preset} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateSentForRepair">Date sent for repair</Label>
            <Input
              id="dateSentForRepair"
              type="date"
              value={values.dateSentForRepair ?? ""}
              onChange={(e) =>
                updateField("dateSentForRepair", e.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateCompleted">Date completed</Label>
            <Input
              id="dateCompleted"
              type="date"
              value={values.dateCompleted ?? ""}
              onChange={(e) => updateField("dateCompleted", e.target.value)}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={values.remarks ?? ""}
              onChange={(e) => updateField("remarks", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="attachment">Attachment / Photo</Label>
            <Input
              id="attachment"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => {
                setAttachmentFile(e.target.files?.[0] ?? null);
                setRemoveAttachment(false);
              }}
            />
            {mode === "edit" && record?.hasAttachment && !removeAttachment && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Current: {record.attachmentName ?? "photo attached"}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRemoveAttachment(true);
                    setAttachmentFile(null);
                  }}
                >
                  Remove
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Saving..."
            : mode === "edit"
              ? "Save changes"
              : "Report issue"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            router.push(
              mode === "edit" && record
                ? `/inventory/maintenance/${record.id}`
                : "/inventory/maintenance"
            )
          }
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
