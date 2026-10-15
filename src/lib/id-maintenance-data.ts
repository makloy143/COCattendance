import { prisma } from "@/lib/db";
import { getManilaDayStart } from "@/lib/date-utils";
import {
  IdStockError,
  buildCardPackNote,
  buildSlingPackNote,
  calculateIdStock,
  formatIdDate,
  getIdPeriodRange,
  wastesCardStock,
  type IdBadPrintStatus,
  type IdHistoryEvent,
  type IdPeriod,
  type IdPeriodActivity,
  type IdReleaseStatus,
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
  const [settings, receipts, releaseAgg, wasteAgg] = await Promise.all([
    getIdMaintenanceSettings(),
    prisma.idStockReceipt.findMany({
      select: {
        itemType: true,
        packsReceived: true,
        unitsPerPack: true,
        unitsAdded: true,
      },
    }),
    prisma.idReleaseEntry.aggregate({
      _sum: { idCardsUsed: true, slingsUsed: true },
    }),
    prisma.idBadPrintEntry.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { quantity: true },
    }),
  ]);

  const cardReceipts = receipts.filter((row) => row.itemType === "ID_CARD_BOX");
  const slingReceipts = receipts.filter((row) => row.itemType === "SLING_BUNDLE");
  const cardsReceived = cardReceipts.reduce((sum, row) => sum + row.unitsAdded, 0);
  const slingsReceived = slingReceipts.reduce((sum, row) => sum + row.unitsAdded, 0);
  const cardsReleased = releaseAgg._sum.idCardsUsed ?? 0;
  const slingsUsed = releaseAgg._sum.slingsUsed ?? 0;
  const cardsWasted = wasteAgg._sum.quantity ?? 0;
  const { cardsRemaining, slingsRemaining } = calculateIdStock({
    cardsReceived,
    cardsReleased,
    cardsWasted,
    slingsReceived,
    slingsUsed,
  });

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
    cardPackNote: buildCardPackNote(cardReceipts, settings.cardsPerBox),
    slingPacks: slingReceipts.reduce((sum, row) => sum + row.packsReceived, 0),
    slingsReceived,
    slingsUsed,
    slingsRemaining,
    slingPackNote: buildSlingPackNote(slingReceipts, settings.slingsPerBundle),
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

export async function listIdReleases(period: IdPeriod) {
  const range = periodFilter(period);
  return prisma.idReleaseEntry.findMany({
    where: range ? { transactionDate: range } : undefined,
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

export async function listIdReceipts(itemType?: IdStockItemType) {
  return prisma.idStockReceipt.findMany({
    where: itemType ? { itemType } : undefined,
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

function assertSlingsAvailable(remaining: number, requested: number) {
  if (requested > remaining) {
    throw new IdStockError(
      `Not enough slings in stock. Remaining ${remaining}, requested ${requested}. Receive stock before recording this sling use.`
    );
  }
}

export async function createIdStockReceipt(input: {
  itemType: IdStockItemType;
  packsReceived: number;
  receivedFrom: string;
  dateReceived: string;
  notes?: string | null;
  recordedBy?: string | null;
}) {
  const settings = await getIdMaintenanceSettings();
  const unitsPerPack =
    input.itemType === "ID_CARD_BOX" ? settings.cardsPerBox : settings.slingsPerBundle;

  return prisma.idStockReceipt.create({
    data: {
      itemType: input.itemType,
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
  const receipt = await prisma.idStockReceipt.findUnique({ where: { id } });
  if (!receipt) {
    throw new IdStockError("Stock receipt was not found.");
  }

  const stock = await getIdStockView();
  if (receipt.itemType === "ID_CARD_BOX") {
    if (stock.cardsRemaining - receipt.unitsAdded < 0) {
      throw new IdStockError(
        "These cards have already been released or wasted, so this receipt cannot be removed."
      );
    }
  } else if (stock.slingsRemaining - receipt.unitsAdded < 0) {
    throw new IdStockError(
      "These slings have already been used, so this receipt cannot be removed."
    );
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
  notes?: string | null;
  studentId?: string | null;
}) {
  const stock = await getIdStockView();
  assertCardsAvailable(stock.cardsRemaining, input.idCardsUsed);
  assertSlingsAvailable(stock.slingsRemaining, input.slingsUsed);

  return prisma.idReleaseEntry.create({
    data: {
      personName: input.personName.trim(),
      course: input.course.trim(),
      idNumber: input.idNumber.trim(),
      transactionDate: getManilaDayStart(input.transactionDate),
      status: input.status,
      reason: input.reason.trim(),
      printedBy: input.printedBy.trim(),
      idCardsUsed: input.idCardsUsed,
      slingsUsed: input.slingsUsed,
      notes: input.notes?.trim() || null,
      studentId: await resolveStudentId(input.studentId),
    },
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

export async function listIdHistory(period: IdPeriod): Promise<IdHistoryEvent[]> {
  const range = periodFilter(period);
  const [receipts, releases, badPrints] = await Promise.all([
    prisma.idStockReceipt.findMany({
      where: range ? { dateReceived: range } : undefined,
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
  ]);

  const events: Array<IdHistoryEvent & { sort: number }> = [
    ...receipts.map((receipt) => ({
      id: `receipt-${receipt.id}`,
      dateLabel: formatIdDate(receipt.dateReceived),
      kind: "RECEIPT" as const,
      title:
        receipt.itemType === "ID_CARD_BOX" ? "ID card boxes received" : "Sling bundles received",
      detail: `${receipt.packsReceived} × ${receipt.unitsPerPack} from ${receipt.receivedFrom}`,
      cards: receipt.itemType === "ID_CARD_BOX" ? receipt.unitsAdded : 0,
      slings: receipt.itemType === "SLING_BUNDLE" ? receipt.unitsAdded : 0,
      sort: receipt.dateReceived.getTime(),
    })),
    ...releases.map((release) => ({
      id: `release-${release.id}`,
      dateLabel: formatIdDate(release.transactionDate),
      kind: "RELEASE" as const,
      title: release.personName,
      detail: `${release.course} · ${release.idNumber} · ${release.reason} · printed by ${release.printedBy}`,
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
