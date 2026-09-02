import { DEPARTMENTS } from "@/lib/inventory";

export const MAINTENANCE_STATUSES = [
  "OPEN",
  "DIAGNOSING",
  "UNDER_REPAIR",
  "AWAITING_PARTS",
  "AWAITING_VENDOR",
  "COMPLETED",
  "UNREPAIRABLE",
  "CANCELLED",
] as const;

export type MaintenanceStatusValue = (typeof MAINTENANCE_STATUSES)[number];

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatusValue, string> =
  {
    OPEN: "Open",
    DIAGNOSING: "Diagnosing",
    UNDER_REPAIR: "Under Repair",
    AWAITING_PARTS: "Awaiting Parts",
    AWAITING_VENDOR: "Awaiting Vendor",
    COMPLETED: "Completed",
    UNREPAIRABLE: "Unrepairable",
    CANCELLED: "Cancelled",
  };

export const ACTIVE_MAINTENANCE_STATUSES: MaintenanceStatusValue[] = [
  "OPEN",
  "DIAGNOSING",
  "UNDER_REPAIR",
  "AWAITING_PARTS",
  "AWAITING_VENDOR",
];

export const CLOSED_MAINTENANCE_STATUSES: MaintenanceStatusValue[] = [
  "COMPLETED",
  "UNREPAIRABLE",
  "CANCELLED",
];

export const MAINTENANCE_PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;

export type MaintenancePriorityValue = (typeof MAINTENANCE_PRIORITIES)[number];

export const MAINTENANCE_PRIORITY_LABELS: Record<
  MaintenancePriorityValue,
  string
> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const EQUIPMENT_TYPES = [
  "Desktop Computer",
  "Laptop",
  "Printer",
  "Monitor",
  "Keyboard",
  "Mouse",
  "UPS",
  "Projector",
  "Network Switch",
  "Access Point",
  "Router",
  "ID Printer",
  "Other",
] as const;

export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];

export const MAINTENANCE_LOCATIONS = Array.from(
  new Set([
    ...DEPARTMENTS,
    "Computer Laboratory 1",
    "Computer Laboratory 2",
    "Computer Laboratory 3",
    "ID Station",
    "Server Room",
  ])
);

export const WARRANTY_PRESETS = [
  "In Warranty",
  "Out of Warranty",
  "Unknown",
] as const;

export const MAINTENANCE_STATUS_COLORS: Record<MaintenanceStatusValue, string> =
  {
    OPEN: "#ea580c",
    DIAGNOSING: "#2563eb",
    UNDER_REPAIR: "#7c3aed",
    AWAITING_PARTS: "#d97706",
    AWAITING_VENDOR: "#0891b2",
    COMPLETED: "#16a34a",
    UNREPAIRABLE: "#dc2626",
    CANCELLED: "#64748b",
  };

export const MAINTENANCE_CHART_COLORS = [
  "#166534",
  "#0d9488",
  "#2563eb",
  "#7c3aed",
  "#ea580c",
  "#dc2626",
  "#0891b2",
  "#db2777",
  "#64748b",
];

export type MaintenanceChartSlice = {
  key: string;
  label: string;
  value: number;
  color: string;
};

export type MaintenanceStats = {
  total: number;
  open: number;
  underRepair: number;
  completed: number;
  awaitingParts: number;
  unrepairable: number;
  diagnosing: number;
  awaitingVendor: number;
  cancelled: number;
  byStatus: MaintenanceChartSlice[];
  byEquipmentType: MaintenanceChartSlice[];
  byLocation: MaintenanceChartSlice[];
  monthly: { month: string; label: string; value: number }[];
};

export type MaintenanceEventDto = {
  id: string;
  eventType: string;
  message: string;
  createdBy: string | null;
  createdAt: string;
};

export type MaintenanceRecordDto = {
  id: string;
  maintenanceNumber: string;
  receivedItemId: string | null;
  itemName: string;
  equipmentType: string;
  assetNumber: string;
  serialNumber: string | null;
  problem: string;
  description: string | null;
  dateReported: string;
  reportedBy: string;
  location: string;
  priority: MaintenancePriorityValue;
  status: MaintenanceStatusValue;
  assignedTechnician: string | null;
  diagnosticFindings: string | null;
  actionTaken: string | null;
  partsReplaced: string | null;
  repairCost: number | null;
  dateSentForRepair: string | null;
  dateCompleted: string | null;
  vendor: string | null;
  warranty: string | null;
  remarks: string | null;
  hasAttachment: boolean;
  attachmentName: string | null;
  createdAt: string;
  updatedAt: string;
  inventoryStatus?: { key: string; label: string } | null;
  receivedItem?: {
    id: string;
    itemName: string;
    itemType: string;
    category: string;
    brand: string | null;
    model: string | null;
    serialNumber: string | null;
    receivedByDepartment: string;
    assetStatus: string;
  } | null;
  events?: MaintenanceEventDto[];
};

export function isMaintenanceStatus(
  value: string
): value is MaintenanceStatusValue {
  return (MAINTENANCE_STATUSES as readonly string[]).includes(value);
}

export function isMaintenancePriority(
  value: string
): value is MaintenancePriorityValue {
  return (MAINTENANCE_PRIORITIES as readonly string[]).includes(value);
}

export function isActiveMaintenanceStatus(
  status: MaintenanceStatusValue
): boolean {
  return ACTIVE_MAINTENANCE_STATUSES.includes(status);
}

export function guessEquipmentType(itemName: string): EquipmentType {
  const n = itemName.toLowerCase();
  if (n.includes("laptop") || n.includes("notebook")) return "Laptop";
  if (n.includes("id printer") || n.includes("id card")) return "ID Printer";
  if (n.includes("printer")) return "Printer";
  if (n.includes("monitor") || n.includes("display")) return "Monitor";
  if (n.includes("keyboard")) return "Keyboard";
  if (n.includes("mouse")) return "Mouse";
  if (n.includes("ups")) return "UPS";
  if (n.includes("projector")) return "Projector";
  if (n.includes("switch")) return "Network Switch";
  if (n.includes("access point") || n.includes("ap ")) return "Access Point";
  if (n.includes("router")) return "Router";
  if (
    n.includes("desktop") ||
    n.includes("computer") ||
    /\bpc\b/.test(n) ||
    n.includes("cpu")
  ) {
    return "Desktop Computer";
  }
  return "Other";
}
