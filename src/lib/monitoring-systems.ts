export const MONITORING_CATEGORIES = [
  "INTERNET",
  "NETWORK_SECURITY_CLOUD",
  "APPLICATIONS",
  "COM_LAB",
] as const;

export type MonitoringCategory = (typeof MONITORING_CATEGORIES)[number];

export const MONITORING_SHIFT_OPTIONS = ["IN", "OUT"] as const;

export type MonitoringShift = (typeof MONITORING_SHIFT_OPTIONS)[number];

export const MONITORING_STATUS_OPTIONS = [
  "Up",
  "With Degradation",
  "Down",
] as const;

export type MonitoringStatus = (typeof MONITORING_STATUS_OPTIONS)[number];

export const INTERNET_UX_OPTIONS = ["Fast", "Slow", "Intermittent"] as const;
export const NETWORK_UX_OPTIONS = [
  "Excellent",
  "Good",
  "Fair",
  "Weak",
  "No signal",
] as const;
export const APPLICATION_UX_OPTIONS = [
  "Can access with no issues",
  "Can access with issue and/or degradation",
  "Can't access",
] as const;

export type MonitoringSystemSeed = {
  name: string;
  category: MonitoringCategory;
  accountNo?: string;
  sortOrder: number;
};

export const MONITORING_SYSTEM_CATALOG: MonitoringSystemSeed[] = [
  { name: "PLDT", category: "INTERNET", accountNo: "6009660443", sortOrder: 1 },
  { name: "Globe", category: "INTERNET", accountNo: "930032550", sortOrder: 2 },
  { name: "Peplink", category: "NETWORK_SECURITY_CLOUD", sortOrder: 1 },
  { name: "Firewall", category: "NETWORK_SECURITY_CLOUD", sortOrder: 2 },
  { name: "Core Switch", category: "NETWORK_SECURITY_CLOUD", sortOrder: 3 },
  { name: "Access Points", category: "NETWORK_SECURITY_CLOUD", sortOrder: 4 },
  {
    name: "SSID - Employee",
    category: "NETWORK_SECURITY_CLOUD",
    sortOrder: 5,
  },
  {
    name: "SSID - Community",
    category: "NETWORK_SECURITY_CLOUD",
    sortOrder: 6,
  },
  { name: "SSID - OP", category: "NETWORK_SECURITY_CLOUD", sortOrder: 7 },
  {
    name: "SSID - PHINMA_Students",
    category: "NETWORK_SECURITY_CLOUD",
    sortOrder: 8,
  },
  { name: "Proxmox", category: "NETWORK_SECURITY_CLOUD", sortOrder: 9 },
  { name: "SIS", category: "APPLICATIONS", sortOrder: 1 },
  {
    name: "Employee Portal (Network Wide)",
    category: "APPLICATIONS",
    sortOrder: 2,
  },
  { name: "Hubspot", category: "APPLICATIONS", sortOrder: 3 },
  { name: "Adobe", category: "APPLICATIONS", sortOrder: 4 },
  { name: "Gmail", category: "APPLICATIONS", sortOrder: 5 },
  { name: "Google Workspace", category: "APPLICATIONS", sortOrder: 6 },
  { name: "Aruba Central", category: "APPLICATIONS", sortOrder: 7 },
  { name: "Zoom", category: "APPLICATIONS", sortOrder: 8 },
  {
    name: "Forticlient End Point",
    category: "APPLICATIONS",
    sortOrder: 9,
  },
  { name: "ODRS", category: "APPLICATIONS", sortOrder: 10 },
  { name: "Comlab 1", category: "COM_LAB", sortOrder: 1 },
];

export const CATEGORY_LABELS: Record<MonitoringCategory, string> = {
  INTERNET: "Internet",
  NETWORK_SECURITY_CLOUD: "Network, Security and Cloud Platforms",
  APPLICATIONS: "Applications",
  COM_LAB: "Com Lab",
};

export const CATEGORY_BG_COLORS: Record<MonitoringCategory, string> = {
  INTERNET: "#7eb2ea",
  NETWORK_SECURITY_CLOUD: "#7bc47f",
  APPLICATIONS: "#e8c547",
  COM_LAB: "#e89554",
};

export const CATEGORY_BG_ALPHA = 0.72;

export function getCategoryBgColor(
  category: MonitoringCategory,
  { transparent = false }: { transparent?: boolean } = {}
) {
  const color = CATEGORY_BG_COLORS[category];
  if (!transparent) return color;

  const normalized = color.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${CATEGORY_BG_ALPHA})`;
}

export const STATUS_BG_COLORS: Record<MonitoringStatus, string> = {
  Up: "#166534",
  Down: "#dc2626",
  "With Degradation": "#d97706",
};

export function getUserExperienceOptions(category: MonitoringCategory) {
  switch (category) {
    case "INTERNET":
      return INTERNET_UX_OPTIONS;
    case "NETWORK_SECURITY_CLOUD":
      return NETWORK_UX_OPTIONS;
    case "APPLICATIONS":
    case "COM_LAB":
      return APPLICATION_UX_OPTIONS;
  }
}

export function getDefaultUserExperience(category: MonitoringCategory) {
  switch (category) {
    case "INTERNET":
      return "Fast";
    case "NETWORK_SECURITY_CLOUD":
      return "Excellent";
    case "APPLICATIONS":
    case "COM_LAB":
      return "Can access with no issues";
  }
}
