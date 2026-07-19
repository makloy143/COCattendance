import { prisma } from "@/lib/db";
import type { CatalogOption } from "@/lib/option-code";

export async function listAssignmentOptions(options?: {
  includeInactive?: boolean;
}): Promise<CatalogOption[]> {
  return prisma.studentAssignmentOption.findMany({
    where: options?.includeInactive ? undefined : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });
}

export async function getAssignmentLabelMap(options?: {
  includeInactive?: boolean;
}): Promise<Record<string, string>> {
  const rows = await listAssignmentOptions(options);
  return Object.fromEntries(rows.map((row) => [row.code, row.label]));
}

export async function assertActiveAssignment(code: string): Promise<string> {
  const option = await prisma.studentAssignmentOption.findUnique({
    where: { code },
  });
  if (!option || !option.isActive) {
    throw new Error("Invalid assignment");
  }
  return option.code;
}
