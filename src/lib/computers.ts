export const COMPUTER_GROUPS = ["COMLAB", "LIBRARY", "DEPARTMENT"] as const;
export type ComputerGroup = (typeof COMPUTER_GROUPS)[number];

export const COMPUTER_GROUP_LABELS: Record<ComputerGroup, string> = {
  COMLAB: "COMLAB",
  LIBRARY: "Library",
  DEPARTMENT: "Departments",
};

export const COMPUTER_GROUP_PLACE_LABELS: Record<ComputerGroup, string> = {
  COMLAB: "room",
  LIBRARY: "area",
  DEPARTMENT: "office",
};

export const COMPUTER_STATUSES = ["WORKING", "UNDER_REPAIR", "DEFECTIVE", "RETIRED"] as const;
export type ComputerStatus = (typeof COMPUTER_STATUSES)[number];

export const COMPUTER_STATUS_LABELS: Record<ComputerStatus, string> = {
  WORKING: "Working",
  UNDER_REPAIR: "Under repair",
  DEFECTIVE: "Defective",
  RETIRED: "Retired",
};

export function parseComputerGroup(value: string | null | undefined): ComputerGroup {
  return (COMPUTER_GROUPS as readonly string[]).includes(value ?? "")
    ? (value as ComputerGroup)
    : "DEPARTMENT";
}

export function parseComputerStatus(value: string | null | undefined): ComputerStatus {
  return (COMPUTER_STATUSES as readonly string[]).includes(value ?? "")
    ? (value as ComputerStatus)
    : "WORKING";
}

export function isComputerPath(pathname: string) {
  return pathname === "/inventory/computers" || pathname.startsWith("/inventory/computers/");
}

// A department office named "Library" and the student Library area are
// different places, so labels always carry the group when it is ambiguous.
export function computerLocationLabel(location: { name: string; group: string }) {
  return location.group === "DEPARTMENT" ? `${location.name} office` : location.name;
}

export type ComputerLocationRow = {
  id: string;
  name: string;
  group: ComputerGroup;
  active: boolean;
  computerCount: number;
};

export type ComputerRow = {
  id: string;
  assetTag: string;
  locationId: string;
  locationName: string;
  group: ComputerGroup;
  seatLabel: string;
  assignedTo: string;
  brand: string;
  model: string;
  serialNumber: string;
  processor: string;
  ram: string;
  storage: string;
  operatingSystem: string;
  monitor: string;
  status: ComputerStatus;
  issue: string;
  dateAcquired: string;
  warrantyEnd: string;
  notes: string;
  updatedAt: string;
};

export type ComputerStatusCounts = Record<ComputerStatus, number> & { total: number };

export function emptyComputerCounts(): ComputerStatusCounts {
  return { WORKING: 0, UNDER_REPAIR: 0, DEFECTIVE: 0, RETIRED: 0, total: 0 };
}

export function computerSpecSummary(row: Pick<ComputerRow, "processor" | "ram" | "storage">) {
  return [row.processor, row.ram, row.storage].filter(Boolean).join(" · ");
}
