import { prisma } from "@/lib/db";
import { getManilaDayStart } from "@/lib/date-utils";
import {
  IdStockError,
  buildCardBoxRows,
  buildCardPackNote,
  buildSlingPackNote,
  categoryForItemType,
  currentPvcBoxId,
  formatDescriptionCode,
  formatIdDate,
  getIdPeriodRange,
  itemTypeForCategory,
  normalizeDescriptionCode,
  receiptItemTitle,
  wastesCardStock,
  type IdBadPrintStatus,
  type IdHistoryEvent,
  type IdPeriod,
  type IdPeriodActivity,
  type IdReceiptUnit,
  type IdReleaseStatus,
  type IdSlingKind,
  type IdStockCategory,
  type IdStockItemType,
  type IdStockView,
} from "@/lib/id-maintenance";

export async function getIdMaintenanceSettings() {
  return prisma.idMaintenanceSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
}

function periodFilter(period: IdPeriod) {
  const range = getIdPeriodRange(period);
  if (!range) return undefined;
  return { gte: range.start, lte: range.end };
}

export async function getIdStockView(): Promise<IdStockView> {
  const [settings, receipts, itemOptions, releaseGroups, wasteAgg, cardReleases, cardWastes] =
    await Promise.all([
    getIdMaintenanceSettings(),
    prisma.idStockReceipt.findMany({
      select: {
        id: true,
        itemType: true,
        unit: true,
        descriptionCode: true,
        packsReceived: true,
        unitsPerPack: true,
        unitsAdded: true,
        openingRemaining: true,
        balanceRecordedAt: true,
        dateReceived: true,
        createdAt: true,
        itemOption: { select: { id: true, name: true, category: true } },
      },
      orderBy: [{ dateReceived: "asc" }, { createdAt: "asc" }],
    }),
    prisma.idStockItemOption.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.idReleaseEntry.groupBy({
      by: ["slingKind"],
      _sum: { idCardsUsed: true, slingsUsed: true },
    }),
    prisma.idBadPrintEntry.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { quantity: true },
    }),
    prisma.idReleaseEntry.findMany({
      where: { idCardsUsed: { gt: 0 } },
      select: { transactionDate: true, idCardsUsed: true, createdAt: true, pvcCardId: true },
    }),
    prisma.idBadPrintEntry.findMany({
      where: { status: { not: "CANCELLED" }, quantity: { gt: 0 } },
      select: { datePrinted: true, quantity: true, createdAt: true },
    }),
  ]);

  const categoryOf = (row: (typeof receipts)[number]) =>
    row.itemOption?.category ?? categoryForItemType(row.itemType);
  const cardReceipts = receipts.filter((row) => categoryOf(row) === "ID_CARD");
  const slingReceipts = receipts.filter((row) => {
    const category = categoryOf(row);
    return category === "SLING_STUDENT" || category === "SLING_EMPLOYEE";
  });
  const studentSlingReceipts = slingReceipts.filter(
    (row) => categoryOf(row) === "SLING_STUDENT"
  );
  const employeeSlingReceipts = slingReceipts.filter(
    (row) => categoryOf(row) === "SLING_EMPLOYEE"
  );
  const cardsReceived = cardReceipts.reduce((sum, row) => sum + row.unitsAdded, 0);
  const slingsReceived = slingReceipts.reduce((sum, row) => sum + row.unitsAdded, 0);
  const studentSlingsReceived = studentSlingReceipts.reduce(
    (sum, row) => sum + row.unitsAdded,
    0
  );
  const employeeSlingsReceived = employeeSlingReceipts.reduce(
    (sum, row) => sum + row.unitsAdded,
    0
  );
  const cardsReleased = releaseGroups.reduce(
    (sum, row) => sum + (row._sum.idCardsUsed ?? 0),
    0
  );
  const slingsUsed = releaseGroups.reduce(
    (sum, row) => sum + (row._sum.slingsUsed ?? 0),
    0
  );
  const studentSlingsUsed = releaseGroups
    .filter((row) => row.slingKind !== "EMPLOYEE")
    .reduce((sum, row) => sum + (row._sum.slingsUsed ?? 0), 0);
  const employeeSlingsUsed = releaseGroups
    .filter((row) => row.slingKind === "EMPLOYEE")
    .reduce((sum, row) => sum + (row._sum.slingsUsed ?? 0), 0);
  const cardsWasted = wasteAgg._sum.quantity ?? 0;
  const studentSlingsRemaining = studentSlingsReceived - studentSlingsUsed;
  const employeeSlingsRemaining = employeeSlingsReceived - employeeSlingsUsed;
  const cardsRemaining = cardsReceived - cardsReleased - cardsWasted;
  const slingsRemaining = studentSlingsRemaining + employeeSlingsRemaining;
  const cardItemName =
    itemOptions.find((option) => option.category === "ID_CARD" && option.active)?.name ??
    "PLAIN WHITE PVC CARD";
  const supplyBoxesByKey = new Map<string, { id: string; name: string; boxes: number }>();
  for (const option of itemOptions) {
    if (option.category !== "SUPPLY") continue;
    supplyBoxesByKey.set(option.id, { id: option.id, name: option.name, boxes: 0 });
  }
  for (const receipt of receipts) {
    if (categoryOf(receipt) !== "SUPPLY") continue;
    const key = receipt.itemOption?.id ?? receipt.itemType;
    const current = supplyBoxesByKey.get(key) ?? {
      id: key,
      name: receipt.itemOption?.name ?? "Box",
      boxes: 0,
    };
    current.boxes += receipt.unitsAdded;
    supplyBoxesByKey.set(key, current);
  }
  const supplyBoxes = [...supplyBoxesByKey.values()].filter(
    (row) => row.boxes > 0 || itemOptions.some((option) => option.id === row.id && option.active)
  );

  const cardBoxes = buildCardBoxRows(
    cardReceipts.map((receipt) => ({
      id: receipt.id,
      name: receiptItemTitle(receipt),
      unit: receipt.unit,
      unitsPerPack: receipt.unitsPerPack,
      unitsAdded: receipt.unitsAdded,
      openingRemaining: receipt.openingRemaining,
      balanceRecordedAt: receipt.balanceRecordedAt,
      receivedAt: receipt.dateReceived,
      createdAt: receipt.createdAt,
    })),
    [
      ...cardReleases.map((release) => ({
        at: release.transactionDate,
        quantity: release.idCardsUsed,
        createdAt: release.createdAt,
        boxId: release.pvcCardId,
      })),
      ...cardWastes.map((waste) => ({
        at: waste.datePrinted,
        quantity: waste.quantity,
        createdAt: waste.createdAt,
      })),
    ]
  );
  const latestUsedBox = [...cardReleases]
    .filter((release) => release.pvcCardId)
    .sort(
      (a, b) =>
        b.transactionDate.getTime() - a.transactionDate.getTime() ||
        b.createdAt.getTime() - a.createdAt.getTime()
    )[0];

  return {
    cardsPerBox: settings.cardsPerBox,
    slingsPerBundle: settings.slingsPerBundle,
    lowIdCardThreshold: settings.lowIdCardThreshold,
    lowSlingThreshold: settings.lowSlingThreshold,
    cardPacks: cardReceipts.reduce((sum, row) => sum + row.packsReceived, 0),
    cardsReceived,
    cardsReleased,
    cardsWasted,
    cardsRemaining,
    cardPackNote: buildCardPackNote(cardReceipts, settings.cardsPerBox, cardItemName),
    slingPacks: slingReceipts.reduce((sum, row) => sum + row.packsReceived, 0),
    slingsReceived,
    slingsUsed,
    slingsRemaining,
    slingPackNote: buildSlingPackNote(slingReceipts, settings.slingsPerBundle),
    studentSlingsReceived,
    studentSlingsUsed,
    studentSlingsRemaining,
    employeeSlingsReceived,
    employeeSlingsUsed,
    employeeSlingsRemaining,
    cardItemName,
    cardBoxes,
    currentCardBoxId: currentPvcBoxId(cardBoxes, latestUsedBox?.pvcCardId),
    supplyBoxes,
    lowCards: cardReceipts.length > 0 && cardsRemaining <= settings.lowIdCardThreshold,
    lowSlings:
      slingReceipts.length > 0 && slingsRemaining <= settings.lowSlingThreshold,
  };
}

export async function getIdPeriodActivity(period: IdPeriod): Promise<IdPeriodActivity> {
  const range = periodFilter(period);
  const [releases, waste] = await Promise.all([
    prisma.idReleaseEntry.aggregate({
      where: range ? { transactionDate: range } : undefined,
      _sum: { idCardsUsed: true, slingsUsed: true },
      _count: true,
    }),
    prisma.idBadPrintEntry.aggregate({
      where: {
        status: { not: "CANCELLED" },
        ...(range ? { datePrinted: range } : {}),
      },
      _sum: { quantity: true },
      _count: true,
    }),
  ]);

  return {
    cardsReleased: releases._sum.idCardsUsed ?? 0,
    slingsUsed: releases._sum.slingsUsed ?? 0,
    releaseCount: releases._count,
    cardsWasted: waste._sum.quantity ?? 0,
    badPrintCount: waste._count,
  };
}

export async function listIdReleases(period: IdPeriod, filter?: { slingsOnly?: boolean }) {
  const range = periodFilter(period);
  return prisma.idReleaseEntry.findMany({
    where: {
      ...(range ? { transactionDate: range } : {}),
      ...(filter?.slingsOnly ? { slingsUsed: { gt: 0 } } : {}),
    },
    orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
    take: 300,
  });
}

export async function listIdBadPrints(period: IdPeriod) {
  const range = periodFilter(period);
  return prisma.idBadPrintEntry.findMany({
    where: range ? { datePrinted: range } : undefined,
    orderBy: [{ datePrinted: "desc" }, { createdAt: "desc" }],
    take: 300,
  });
}

export async function listIdSurrenders(period: IdPeriod) {
  const range = periodFilter(period);
  return prisma.idSurrenderEntry.findMany({
    where: range ? { surrenderDate: range } : undefined,
    orderBy: [{ surrenderDate: "desc" }, { createdAt: "desc" }],
    take: 300,
  });
}

export async function listIdReceipts(itemType?: IdStockItemType | IdStockItemType[]) {
  return prisma.idStockReceipt.findMany({
    where: itemType
      ? { itemType: Array.isArray(itemType) ? { in: itemType } : itemType }
      : undefined,
    include: { itemOption: true },
    orderBy: [{ dateReceived: "desc" }, { createdAt: "desc" }],
  });
}

async function resolveStudentId(studentId?: string | null) {
  const id = studentId?.trim();
  if (!id) return null;
  const student = await prisma.student.findUnique({
    where: { id },
    select: { id: true },
  });
  return student?.id ?? null;
}

function assertCardsAvailable(remaining: number, requested: number) {
  if (requested > remaining) {
    throw new IdStockError(
      `Not enough ID cards in stock. Remaining ${remaining}, requested ${requested}. Receive stock before recording this card use.`
    );
  }
}

function assertSlingsAvailable(remaining: number, requested: number, label: string) {
  if (requested > remaining) {
    throw new IdStockError(
      `Not enough ${label} in stock. Remaining ${remaining}, requested ${requested}. Receive stock before recording this sling use.`
    );
  }
}

function receiptUnits(input: {
  category: IdStockCategory;
  unit?: IdReceiptUnit;
  cardsPerBox: number;
  slingsPerBundle: number;
}) {
  if (input.category === "SUPPLY") {
    return { unit: "BOX" as const, unitsPerPack: 1 };
  }
  const unit = input.unit === "PIECE" ? "PIECE" : "BOX";
  const packSize =
    input.category === "ID_CARD" ? input.cardsPerBox : input.slingsPerBundle;
  return {
    unit,
    unitsPerPack: unit === "PIECE" ? 1 : packSize,
  } as const;
}

export async function createIdStockReceipt(input: {
  itemOptionId: string;
  unit?: IdReceiptUnit;
  descriptionCode: string;
  packsReceived: number;
  receivedFrom: string;
  dateReceived: string;
  notes?: string | null;
  recordedBy?: string | null;
}) {
  const option = await prisma.idStockItemOption.findUnique({
    where: { id: input.itemOptionId },
  });
  if (!option || !option.active) {
    throw new IdStockError("Choose an item type. Add one in Settings if it is missing.");
  }

  const settings = await getIdMaintenanceSettings();
  const { unit, unitsPerPack } = receiptUnits({
    category: option.category,
    unit: input.unit,
    cardsPerBox: settings.cardsPerBox,
    slingsPerBundle: settings.slingsPerBundle,
  });

  return prisma.idStockReceipt.create({
    data: {
      itemType: itemTypeForCategory(option.category),
      itemOptionId: option.id,
      unit,
      descriptionCode: normalizeDescriptionCode(input.descriptionCode),
      packsReceived: input.packsReceived,
      unitsPerPack,
      unitsAdded: input.packsReceived * unitsPerPack,
      receivedFrom: input.receivedFrom.trim(),
      dateReceived: getManilaDayStart(input.dateReceived),
      notes: input.notes?.trim() || null,
      recordedBy: input.recordedBy?.trim() || null,
    },
  });
}

export async function deleteIdStockReceipt(id: string) {
  const receipt = await prisma.idStockReceipt.findUnique({
    where: { id },
    include: { itemOption: true },
  });
  if (!receipt) {
    throw new IdStockError("Stock receipt was not found.");
  }

  const stock = await getIdStockView();
  const category = receipt.itemOption?.category ?? categoryForItemType(receipt.itemType);
  if (category === "ID_CARD") {
    if (stock.cardsRemaining - receipt.unitsAdded < 0) {
      throw new IdStockError(
        "These cards have already been released or wasted, so this receipt cannot be removed."
      );
    }
  } else if (category === "SLING_STUDENT" || category === "SLING_EMPLOYEE") {
    const remaining =
      category === "SLING_EMPLOYEE"
        ? stock.employeeSlingsRemaining
        : stock.studentSlingsRemaining;
    if (remaining - receipt.unitsAdded < 0) {
      throw new IdStockError(
        "These slings have already been used, so this receipt cannot be removed."
      );
    }
  }

  await prisma.idStockReceipt.delete({ where: { id } });
}

export async function createIdReleaseEntry(input: {
  personName: string;
  course: string;
  idNumber: string;
  transactionDate: string;
  status: IdReleaseStatus;
  reason: string;
  printedBy: string;
  idCardsUsed: number;
  slingsUsed: number;
  slingKind?: IdSlingKind | "" | null;
  pvcCardId?: string | null;
  notes?: string | null;
  studentId?: string | null;
}) {
  const stock = await getIdStockView();
  assertCardsAvailable(stock.cardsRemaining, input.idCardsUsed);
  const pvcCard =
    input.idCardsUsed > 0
      ? stock.cardBoxes.find((box) => box.id === input.pvcCardId && box.remaining > 0)
      : null;
  if (input.idCardsUsed > 0) {
    if (!pvcCard) {
      throw new IdStockError("Choose the PVC card box used for this print.");
    }
    if (input.idCardsUsed > pvcCard.remaining) {
      throw new IdStockError(
        `${pvcCard.name} has ${pvcCard.remaining} cards left. That box holds ${pvcCard.pieces} pieces.`
      );
    }
  }
  const slingKind =
    input.slingKind === "STUDENT" || input.slingKind === "EMPLOYEE"
      ? input.slingKind
      : null;
  if (input.slingsUsed > 0) {
    if (!slingKind) {
      throw new IdStockError("Choose student or employee sling.");
    }
    const remaining =
      slingKind === "EMPLOYEE"
        ? stock.employeeSlingsRemaining
        : stock.studentSlingsRemaining;
    assertSlingsAvailable(
      remaining,
      input.slingsUsed,
      slingKind === "EMPLOYEE" ? "employee slings" : "student slings"
    );
  }

  return prisma.idReleaseEntry.create({
    data: {
      personName: input.personName.trim(),
      course: input.course.trim(),
      idNumber: input.idNumber.trim(),
      transactionDate: getManilaDayStart(input.transactionDate),
      status: input.status,
      reason: input.reason.trim(),
      printedBy: input.printedBy.trim(),
      pvcCardId: pvcCard?.id ?? null,
      pvcCardName: pvcCard?.name ?? null,
      pvcCardEnded: Boolean(pvcCard && input.idCardsUsed > 0 && input.idCardsUsed >= pvcCard.remaining),
      idCardsUsed: input.idCardsUsed,
      slingsUsed: input.slingsUsed,
      slingKind: input.slingsUsed > 0 ? slingKind : null,
      notes: input.notes?.trim() || null,
      studentId: await resolveStudentId(input.studentId),
    },
  });
}

export async function updateIdReleaseReason(id: string, reason: string) {
  const entry = await prisma.idReleaseEntry.findUnique({ where: { id } });
  if (!entry) {
    throw new IdStockError("Release record was not found.");
  }
  return prisma.idReleaseEntry.update({
    where: { id },
    data: { reason: reason.trim() },
  });
}

export async function deleteIdReleaseEntry(id: string) {
  const entry = await prisma.idReleaseEntry.findUnique({ where: { id } });
  if (!entry) {
    throw new IdStockError("Release record was not found.");
  }
  await prisma.idReleaseEntry.delete({ where: { id } });
}

export async function createIdBadPrint(input: {
  personName: string;
  course: string;
  idNumber: string;
  datePrinted: string;
  status: IdBadPrintStatus;
  reason: string;
  quantity: number;
  notes?: string | null;
  studentId?: string | null;
}) {
  if (wastesCardStock(input.status)) {
    const stock = await getIdStockView();
    assertCardsAvailable(stock.cardsRemaining, input.quantity);
  }

  return prisma.idBadPrintEntry.create({
    data: {
      personName: input.personName.trim(),
      course: input.course.trim(),
      idNumber: input.idNumber.trim(),
      datePrinted: getManilaDayStart(input.datePrinted),
      status: input.status,
      reason: input.reason.trim(),
      quantity: input.quantity,
      notes: input.notes?.trim() || null,
      studentId: await resolveStudentId(input.studentId),
    },
  });
}

export async function updateIdBadPrintStatus(id: string, status: IdBadPrintStatus) {
  const record = await prisma.idBadPrintEntry.findUnique({ where: { id } });
  if (!record) {
    throw new IdStockError("Bad printing record was not found.");
  }

  const wasWasting = wastesCardStock(record.status);
  const willWaste = wastesCardStock(status);
  if (!wasWasting && willWaste) {
    const stock = await getIdStockView();
    assertCardsAvailable(stock.cardsRemaining, record.quantity);
  }

  return prisma.idBadPrintEntry.update({
    where: { id },
    data: { status },
  });
}

export async function deleteIdBadPrint(id: string) {
  const record = await prisma.idBadPrintEntry.findUnique({ where: { id } });
  if (!record) {
    throw new IdStockError("Bad printing record was not found.");
  }
  await prisma.idBadPrintEntry.delete({ where: { id } });
}

export async function createIdSurrender(input: {
  personName: string;
  course: string;
  yearLevel?: string | null;
  idNumber: string;
  surrenderDate: string;
  reason: string;
  idCardsReturned: number;
  slingsReturned: number;
  receivedBy: string;
  notes?: string | null;
  studentId?: string | null;
}) {
  if (input.idCardsReturned < 1 && input.slingsReturned < 1) {
    throw new IdStockError("Record the ID card, the sling, or both.");
  }

  return prisma.idSurrenderEntry.create({
    data: {
      personName: input.personName.trim(),
      course: input.course.trim(),
      yearLevel: input.yearLevel?.trim() || null,
      idNumber: input.idNumber.trim(),
      surrenderDate: getManilaDayStart(input.surrenderDate),
      reason: input.reason.trim(),
      idCardsReturned: input.idCardsReturned,
      slingsReturned: input.slingsReturned,
      receivedBy: input.receivedBy.trim(),
      notes: input.notes?.trim() || null,
      studentId: await resolveStudentId(input.studentId),
    },
  });
}

export async function deleteIdSurrender(id: string) {
  const record = await prisma.idSurrenderEntry.findUnique({ where: { id } });
  if (!record) {
    throw new IdStockError("Withdrawal record was not found.");
  }
  await prisma.idSurrenderEntry.delete({ where: { id } });
}

export async function updateIdMaintenanceSettings(input: {
  cardsPerBox: number;
  slingsPerBundle: number;
  lowIdCardThreshold: number;
  lowSlingThreshold: number;
}) {
  return prisma.idMaintenanceSettings.upsert({
    where: { id: "default" },
    update: input,
    create: { id: "default", ...input },
  });
}

function normalizeItemTypeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

async function assertUniqueItemTypeName(name: string, exceptId?: string) {
  const options = await prisma.idStockItemOption.findMany({
    select: { id: true, name: true, active: true },
  });
  const clash = options.find(
    (option) =>
      option.id !== exceptId &&
      option.name.trim().toLowerCase() === name.trim().toLowerCase()
  );
  if (clash) {
    throw new IdStockError(
      clash.active
        ? "That item type already exists."
        : "That item type was removed. Restore it from the list instead of adding it again."
    );
  }
}

export async function listIdItemOptions(filter?: {
  activeOnly?: boolean;
  categories?: IdStockCategory[];
}) {
  return prisma.idStockItemOption.findMany({
    where: {
      ...(filter?.activeOnly ? { active: true } : {}),
      ...(filter?.categories?.length ? { category: { in: filter.categories } } : {}),
    },
    include: { _count: { select: { receipts: true } } },
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function createIdItemOption(input: { name: string; category: IdStockCategory }) {
  const name = normalizeItemTypeName(input.name);
  if (!name) {
    throw new IdStockError("Item type name is required.");
  }
  await assertUniqueItemTypeName(name);
  const last = await prisma.idStockItemOption.aggregate({ _max: { sortOrder: true } });
  return prisma.idStockItemOption.create({
    data: {
      name,
      category: input.category,
      sortOrder: (last._max.sortOrder ?? 0) + 1,
    },
  });
}

export async function updateIdItemOption(
  id: string,
  input: { name?: string; category?: IdStockCategory; active?: boolean }
) {
  const option = await prisma.idStockItemOption.findUnique({
    where: { id },
    include: { _count: { select: { receipts: true } } },
  });
  if (!option) {
    throw new IdStockError("Item type was not found.");
  }

  const name = input.name === undefined ? option.name : normalizeItemTypeName(input.name);
  if (!name) {
    throw new IdStockError("Item type name is required.");
  }
  if (name.toLowerCase() !== option.name.trim().toLowerCase()) {
    await assertUniqueItemTypeName(name, option.id);
  }
  if (input.category && input.category !== option.category && option._count.receipts > 0) {
    throw new IdStockError(
      "This item type already has receipts, so its stock rule cannot change. Rename it instead."
    );
  }

  return prisma.idStockItemOption.update({
    where: { id },
    data: {
      name,
      ...(input.category ? { category: input.category } : {}),
      ...(input.active === undefined ? {} : { active: input.active }),
    },
  });
}

export async function removeIdItemOption(id: string) {
  const option = await prisma.idStockItemOption.findUnique({
    where: { id },
    include: { _count: { select: { receipts: true } } },
  });
  if (!option) {
    throw new IdStockError("Item type was not found.");
  }
  if (option._count.receipts > 0) {
    await prisma.idStockItemOption.update({
      where: { id },
      data: { active: false },
    });
    return { deactivated: true as const };
  }
  await prisma.idStockItemOption.delete({ where: { id } });
  return { deactivated: false as const };
}

export async function listIdHistory(period: IdPeriod): Promise<IdHistoryEvent[]> {
  const range = periodFilter(period);
  const [receipts, releases, badPrints, surrenders] = await Promise.all([
    prisma.idStockReceipt.findMany({
      where: range ? { dateReceived: range } : undefined,
      include: { itemOption: true },
      orderBy: [{ dateReceived: "desc" }, { createdAt: "desc" }],
      take: 400,
    }),
    prisma.idReleaseEntry.findMany({
      where: range ? { transactionDate: range } : undefined,
      orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
      take: 400,
    }),
    prisma.idBadPrintEntry.findMany({
      where: range ? { datePrinted: range } : undefined,
      orderBy: [{ datePrinted: "desc" }, { createdAt: "desc" }],
      take: 400,
    }),
    prisma.idSurrenderEntry.findMany({
      where: range ? { surrenderDate: range } : undefined,
      orderBy: [{ surrenderDate: "desc" }, { createdAt: "desc" }],
      take: 400,
    }),
  ]);

  const events: Array<IdHistoryEvent & { sort: number }> = [
    ...receipts.map((receipt) => ({
      id: `receipt-${receipt.id}`,
      dateLabel: formatIdDate(receipt.dateReceived),
      kind: "RECEIPT" as const,
      title: `${receiptItemTitle(receipt)} received`,
      detail: `${receipt.packsReceived} × ${receipt.unitsPerPack} from ${receipt.receivedFrom}${
        formatDescriptionCode(receipt.descriptionCode)
          ? ` · ${formatDescriptionCode(receipt.descriptionCode)}`
          : ""
      }`,
      cards:
        (receipt.itemOption?.category ?? categoryForItemType(receipt.itemType)) === "ID_CARD"
          ? receipt.unitsAdded
          : 0,
      slings:
        (receipt.itemOption?.category ?? categoryForItemType(receipt.itemType)) === "SLING_STUDENT" ||
        (receipt.itemOption?.category ?? categoryForItemType(receipt.itemType)) === "SLING_EMPLOYEE"
          ? receipt.unitsAdded
          : 0,
      sort: receipt.dateReceived.getTime(),
    })),
    ...releases.map((release) => ({
      id: `release-${release.id}`,
      dateLabel: formatIdDate(release.transactionDate),
      kind: "RELEASE" as const,
      title: release.personName,
      detail: `${release.course} · ${release.idNumber} · ${release.reason} · printed by ${release.printedBy}${
        release.pvcCardName
          ? ` · PVC ${release.pvcCardName}${release.pvcCardEnded ? " ended" : ""}`
          : ""
      }${
        release.slingsUsed > 0
          ? ` · ${release.slingKind === "EMPLOYEE" ? "employee" : "student"} sling`
          : ""
      }`,
      cards: -release.idCardsUsed,
      slings: -release.slingsUsed,
      sort: release.transactionDate.getTime(),
    })),
    ...badPrints.map((record) => ({
      id: `bad-${record.id}`,
      dateLabel: formatIdDate(record.datePrinted),
      kind: "BAD_PRINT" as const,
      title: record.personName,
      detail: wastesCardStock(record.status)
        ? `${record.course} · ${record.idNumber} · ${record.reason}`
        : `${record.course} · ${record.idNumber} · ${record.reason} · cancelled, not deducted`,
      cards: wastesCardStock(record.status) ? -record.quantity : 0,
      slings: 0,
      sort: record.datePrinted.getTime(),
    })),
    ...surrenders.map((record) => ({
      id: `surrender-${record.id}`,
      dateLabel: formatIdDate(record.surrenderDate),
      kind: "SURRENDER" as const,
      title: record.personName,
      detail: `${record.course}${record.yearLevel ? ` · ${record.yearLevel}` : ""} · ${record.idNumber} · ${record.reason} · received by ${record.receivedBy}`,
      cards: 0,
      slings: 0,
      sort: record.surrenderDate.getTime(),
    })),
  ];

  return events
    .sort((a, b) => b.sort - a.sort)
    .map((event) => ({
      id: event.id,
      dateLabel: event.dateLabel,
      kind: event.kind,
      title: event.title,
      detail: event.detail,
      cards: event.cards,
      slings: event.slings,
    }));
}
