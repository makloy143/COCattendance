import { prisma } from "@/lib/db";
import type { CatalogOption } from "@/lib/option-code";

export async function listDepartmentOptions(options?: {
  includeInactive?: boolean;
}): Promise<CatalogOption[]> {
  return prisma.attendanceDepartmentOption.findMany({
    where: options?.includeInactive ? undefined : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });
}

export async function getDepartmentLabelMap(options?: {
  includeInactive?: boolean;
}): Promise<Record<string, string>> {
  const rows = await listDepartmentOptions(options);
  return Object.fromEntries(rows.map((row) => [row.code, row.label]));
}

export async function assertActiveDepartment(code: string): Promise<string> {
  const option = await prisma.attendanceDepartmentOption.findUnique({
    where: { code },
  });
  if (!option || !option.isActive) {
    throw new Error("Invalid department");
  }
  return option.code;
}
