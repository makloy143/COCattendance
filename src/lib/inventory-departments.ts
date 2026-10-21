import { prisma } from "@/lib/db";
import { IdStockError } from "@/lib/id-maintenance";

function normalizeDepartmentName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function departmentKey(name: string) {
  return normalizeDepartmentName(name).toLowerCase();
}

async function assertUniqueDepartmentName(name: string, exceptId?: string) {
  const options = await prisma.inventoryDepartment.findMany({
    select: { id: true, name: true },
  });
  const clash = options.find(
    (option) => option.id !== exceptId && departmentKey(option.name) === departmentKey(name)
  );
  if (clash) {
    throw new IdStockError("That department is already in the list.");
  }
}

async function usageCount(name: string) {
  const [received, borrows, checks] = await Promise.all([
    prisma.receivedItem.count({ where: { receivedByDepartment: name } }),
    prisma.borrowRecord.count({ where: { department: name } }),
    prisma.checkTemplate.count({ where: { department: name } }),
  ]);
  return received + borrows + checks;
}

export async function listInventoryDepartments() {
  const options = await prisma.inventoryDepartment.findMany({
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
  return Promise.all(
    options.map(async (option) => ({
      id: option.id,
      name: option.name,
      active: option.active,
      usageCount: await usageCount(option.name),
    }))
  );
}

export async function listActiveDepartmentNames() {
  const options = await prisma.inventoryDepartment.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { name: true },
  });
  return options.map((option) => option.name);
}

export async function createInventoryDepartment(name: string) {
  const label = normalizeDepartmentName(name);
  await assertUniqueDepartmentName(label);
  const maxSort = await prisma.inventoryDepartment.aggregate({ _max: { sortOrder: true } });
  return prisma.inventoryDepartment.create({
    data: {
      name: label,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });
}

export async function updateInventoryDepartment(
  id: string,
  input: { name?: string; active?: boolean }
) {
  const existing = await prisma.inventoryDepartment.findUnique({ where: { id } });
  if (!existing) {
    throw new IdStockError("Department was not found.");
  }

  const nextName = input.name === undefined ? existing.name : normalizeDepartmentName(input.name);
  if (departmentKey(nextName) !== departmentKey(existing.name)) {
    await assertUniqueDepartmentName(nextName, id);
  }

  return prisma.$transaction(async (tx) => {
    if (nextName !== existing.name) {
      await tx.receivedItem.updateMany({
        where: { receivedByDepartment: existing.name },
        data: { receivedByDepartment: nextName },
      });
      await tx.borrowRecord.updateMany({
        where: { department: existing.name },
        data: { department: nextName },
      });
      await tx.checkTemplate.updateMany({
        where: { department: existing.name },
        data: { department: nextName },
      });
    }

    return tx.inventoryDepartment.update({
      where: { id },
      data: {
        name: nextName,
        ...(input.active === undefined ? {} : { active: input.active }),
      },
    });
  });
}

export async function removeInventoryDepartment(id: string) {
  const existing = await prisma.inventoryDepartment.findUnique({ where: { id } });
  if (!existing) {
    throw new IdStockError("Department was not found.");
  }
  const used = await usageCount(existing.name);
  if (used > 0) {
    await prisma.inventoryDepartment.update({
      where: { id },
      data: { active: false },
    });
    return { deactivated: true as const };
  }
  await prisma.inventoryDepartment.delete({ where: { id } });
  return { deactivated: false as const };
}
